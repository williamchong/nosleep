#!/usr/bin/env node
/**
 * NoSleep driver — launch the Nuxt app and drive it programmatically.
 *
 *   node .claude/skills/run-nosleep/driver.mjs smoke
 *   node .claude/skills/run-nosleep/driver.mjs shot /pip --out shots
 *   node .claude/skills/run-nosleep/driver.mjs repl        # stdin command loop
 *
 * Agent tooling, not product code. Uses the repo's own `playwright-core`
 * devDependency plus the system Google Chrome (`channel: 'chrome'`), so
 * nothing extra has to be downloaded.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(SKILL_DIR, '../../..')
const { chromium } = await import(resolve(ROOT, 'node_modules/playwright-core/index.mjs'))

// ---------------------------------------------------------------- args

// Options that consume the next argv entry. Without this set, a value like the
// `foo` in `shot --name foo` gets mistaken for a positional and used as the route.
const VALUE_OPTS = new Set(['port', 'url', 'out', 'locale', 'name'])

const positional = []
const opts = {}
const flags = new Set()
for (let i = 0; i < process.argv.length - 2; i++) {
  const a = process.argv[i + 2]
  if (!a.startsWith('--')) { positional.push(a); continue }
  const name = a.slice(2)
  if (VALUE_OPTS.has(name)) opts[name] = process.argv[i++ + 3]
  else flags.add(name)
}

const command = positional.shift() ?? 'smoke'
const flag = name => flags.has(name)
const opt = (name, fallback) => opts[name] ?? fallback

const PORT = Number(opt('port', 3399))
const URL_OPT = opt('url', null)
const BASE = URL_OPT ?? `http://localhost:${PORT}`
const SPAWN_SERVER = !URL_OPT
const OUT = resolve(ROOT, opt('out', '.screenshots'))
const LOCALE = opt('locale', 'en-US')
const HEADED = flag('headed')
const DARK = flag('dark')
const WARM_PIP = !flag('no-warm')
const VERBOSE = !!process.env.DRIVER_VERBOSE

const log = (...a) => console.log(...a)
const fail = msg => { console.error(`FAIL: ${msg}`); process.exitCode = 1 }

// ---------------------------------------------------------------- server

let serverPid = null

const ping = async url => {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) })
    return r.ok
  } catch { return false }
}

async function startServer() {
  if (!SPAWN_SERVER) {
    if (!(await ping(BASE))) throw new Error(`nothing answering at ${BASE}`)
    log(`> using running server at ${BASE}`)
    return
  }
  if (await ping(BASE)) {
    log(`> reusing server already on ${BASE}`)
    return
  }
  log(`> starting nuxt dev on port ${PORT}`)
  // detached so we can kill the whole process group — `nuxt dev` forks a child
  // that survives a plain SIGTERM to the npx wrapper and keeps the port bound.
  const proc = spawn('npx', ['nuxt', 'dev', '--port', String(PORT)], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  serverPid = proc.pid
  proc.stdout.on('data', d => VERBOSE && process.stdout.write(`[nuxt] ${d}`))
  proc.stderr.on('data', d => process.stderr.write(`[nuxt] ${d}`))

  // Elapsed wall time, not the iteration count — a failing ping burns up to 2s.
  const t0 = Date.now()
  for (let i = 0; i < 90; i++) {
    if (await ping(BASE)) { log(`> server up after ~${Math.round((Date.now() - t0) / 1000)}s`); return }
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error('dev server did not come up within 90s')
}

/** Synchronous best-effort kill, safe to call from a signal handler. */
function stopServer(signal = 'SIGTERM') {
  if (!serverPid) return
  try { process.kill(-serverPid, signal) } catch { /* already gone */ }
}

/**
 * `nuxt dev` forks a child that regularly outlives a SIGTERM to its group, which
 * leaves 3399 bound and makes the next run "reuse" a half-dead server. Escalate
 * to SIGKILL and only return once the port actually stops answering.
 */
async function shutdownServer() {
  if (!serverPid) return
  stopServer('SIGTERM')
  for (let i = 0; i < 12; i++) {
    if (!(await ping(BASE))) { serverPid = null; return }
    await new Promise(r => setTimeout(r, 250))
  }
  try { process.kill(-serverPid, 'SIGKILL') } catch { /* already gone */ }
  for (let i = 0; i < 12; i++) {
    if (!(await ping(BASE))) break
    await new Promise(r => setTimeout(r, 250))
  }
  serverPid = null
}

// ---------------------------------------------------------------- browser

// Nuxt DevTools + the Vue tracer paint overlays into every dev-mode screenshot.
const HIDE_DEV_OVERLAYS = `
  #nuxt-devtools-container, #vue-tracer-overlay, nuxt-devtools-inspect-panel {
    display: none !important;
  }
`

let browser, context

async function startBrowser() {
  browser = await chromium.launch({ channel: 'chrome', headless: !HEADED })
  context = await browser.newContext({
    locale: LOCALE, // aria-labels and button text are i18n'd; pin the locale or selectors break
    colorScheme: DARK ? 'dark' : 'light',
    viewport: { width: 1280, height: 900 },
  })
  // Analytics fire on every load and would otherwise hit the network in CI.
  // Match on HOSTNAME only: in dev, Vite serves first-party chunks whose *paths*
  // contain "google-analytics" (@nuxt/scripts' registry modules). Blocking those
  // breaks the dynamic import of entry.js and the app never hydrates.
  //
  // Route by host glob, never '**/*': a catch-all makes every Vite dev module
  // request round-trip through CDP, which slows the PiP iframe's hydration past
  // the 500ms window index.vue waits before posting the initial state.
  for (const host of ['t.williamchong.cloud', 'www.googletagmanager.com', 'www.google-analytics.com']) {
    await context.route(`https://${host}/**`, r => r.abort())
  }
  await context.addInitScript(css => {
    const inject = () => {
      const s = document.createElement('style')
      s.textContent = css
      document.head?.appendChild(s)
    }
    if (document.head) inject()
    else document.addEventListener('DOMContentLoaded', inject)
  }, HIDE_DEV_OVERLAYS)
}

async function stopBrowser() {
  await browser?.close().catch(() => {})
  browser = null
  context = null
}

// ---------------------------------------------------------------- page helpers

/**
 * The real floating-window size, scraped from the app's TS rather than copied.
 * This file runs as plain node with no build step, so it can't import
 * app/utils/pip.ts — but reading the literals keeps one source of truth, and a
 * rename here fails loudly instead of silently screenshotting the wrong size.
 */
const PIP_SIZE = (() => {
  const src = readFileSync(resolve(ROOT, 'app/utils/pip.ts'), 'utf8')
  const read = name => {
    const m = src.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))
    if (!m) throw new Error(`${name} not found in app/utils/pip.ts — did it get renamed?`)
    return Number(m[1])
  }
  return { width: read('PIP_RESTORED_WIDTH'), height: read('PIP_RESTORED_HEIGHT') }
})()

const HERO = {
  awake: 'Device Awake',
  asleep: 'Click to Keep Awake',
  pip: 'Switch to Popup Window',
}
const HERO_TEXTS = Object.values(HERO)

const SEL = {
  hero: HERO_TEXTS.map(t => `button:has-text("${t}")`).join(', '),
  orb: '[role="button"][aria-label*="Device is"]', // the sun/moon; present on main page AND in the PiP iframe
  setTimer: 'button:has-text("Set Timer")',
  openPip: 'button:has-text("Open Floating Window")',
  timerDisplay: '.font-mono',
}

/**
 * The <h1> ships in the SSR HTML, so waiting on it proves nothing. The orb is
 * inside <ClientOnly> and only exists once Vue has hydrated — on a cold dev
 * server that can take 10s+ while Vite transforms the route.
 */
const HYDRATED = SEL.orb

async function openMain(path = '/') {
  const page = await context.newPage()
  page.on('pageerror', e => console.error('[pageerror]', e.message))
  page.on('console', m => m.type() === 'error' && console.error('[console.error]', m.text().slice(0, 200)))
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector(HYDRATED, { timeout: 60000 })
  // Hydrated. Only index.vue passes `auto-acquire`; /pip visited directly stays
  // asleep until something drives it, so don't wait on a state that never comes.
  if (!path.startsWith('/pip')) await until(page, x => x.active, 10000)
  return page
}

/** DOM snapshot of the wake-lock UI — works on the main page or a PiP frame. */
async function snapshot(target) {
  return target.evaluate(({ orbSel, timerSel, heroTexts }) => {
    const txt = s => document.querySelector(s)?.textContent?.trim() ?? null
    const orb = document.querySelector(orbSel)
    const hero = [...document.querySelectorAll('button')]
      .find(b => heroTexts.some(t => b.textContent.includes(t)))
    return {
      heading: txt('h1'),
      hero: hero?.textContent.trim() ?? null,
      orbLabel: orb?.getAttribute('aria-label') ?? null,
      active: /is awake/.test(orb?.getAttribute('aria-label') ?? ''),
      timer: txt(timerSel),
      // the "browser too old" UAlert, not the FAQ prose that also says "Wake Lock"
      unsupported: !!document.querySelector('[role="alert"], .text-error')?.textContent?.includes('Wake Lock'),
      wakeLockApi: 'wakeLock' in navigator,
      pipApi: 'documentPictureInPicture' in window,
    }
  }, { orbSel: SEL.orb, timerSel: SEL.timerDisplay, heroTexts: HERO_TEXTS })
}

/**
 * Force Vite to compile the /pip route's client chunks before we need them.
 * index.vue posts the initial state 500ms after the iframe's `load` event; on a
 * cold dev server the iframe hasn't hydrated a listener by then and the sync is
 * lost, so the PiP window comes up sleeping regardless of the parent's state.
 */
let pipWarmed = false

async function warmPipRoute() {
  if (pipWarmed) return // the route stays compiled and cached for the context's lifetime
  pipWarmed = true
  const warm = await context.newPage()
  await warm.goto(`${BASE}/pip`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {})
  await warm.waitForSelector(HYDRATED, { timeout: 60000 }).catch(() => {})
  await warm.close()
}

/** Click "Open Floating Window" and return { pipPage, pipFrame }. */
async function openPip(page) {
  if (WARM_PIP) await warmPipRoute()
  // Opening the warm tab backgrounds this one, which auto-releases the wake
  // lock; wait for the re-acquire to settle or the PiP inherits a stale state.
  await page.bringToFront()
  await page.waitForTimeout(1500)
  if (VERBOSE) log('  parent before PiP:', JSON.stringify(await snapshot(page)))
  await page.waitForSelector(SEL.openPip, { timeout: 15000 })
  const [pipPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 15000 }),
    page.click(SEL.openPip),
  ])
  pipPage.on('pageerror', e => console.error('[pip pageerror]', e.message))
  pipPage.on('console', m => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[pip ${m.type()}]`, m.text().slice(0, 200))
  })
  // The PiP document is about:blank; the app appends an <iframe src="/pip">.
  // frames() is a local array read, so polling it often is free.
  let pipFrame = null
  const frameDeadline = Date.now() + 15000
  while (!pipFrame && Date.now() < frameDeadline) {
    pipFrame = pipPage.frames().find(f => f.url().includes('/pip'))
    if (!pipFrame) await pipPage.waitForTimeout(100)
  }
  if (!pipFrame) throw new Error('PiP iframe (/pip) never appeared')
  const t0 = Date.now()
  await pipFrame.waitForSelector(HYDRATED, { timeout: 30000 })
  if (VERBOSE) log(`  pip iframe hydrated ${Date.now() - t0}ms after it was found`)
  // Headless hands the PiP page the parent's viewport and innerWidth reports
  // that, not the size requestWindow() asked for — so resize explicitly.
  await pipPage.setViewportSize(PIP_SIZE)
  await pipPage.waitForTimeout(800)
  return { pipPage, pipFrame }
}

/**
 * Poll `snapshot(target)` until `pred` holds. Cross-window state arrives by
 * postMessage, so anything touching the PiP window needs polling, not sleeping.
 */
async function until(target, pred, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs
  let last
  do {
    last = await snapshot(target)
    if (pred(last)) return { ok: true, state: last }
    await new Promise(r => setTimeout(r, 100))
  } while (Date.now() < deadline)
  return { ok: false, state: last }
}

/**
 * Open the PiP window and confirm it inherited `expected`. index.vue posts the
 * initial state 500ms after the iframe's `load` event; if the iframe hydrates
 * slower than that the message lands on a page with no listener and is silently
 * dropped, leaving the PiP window asleep while the parent shows awake. There is
 * no re-sync trigger, so the only recovery is to reopen — the second attempt is
 * warm and lands. Returns `retried` so callers can report the race honestly.
 */
async function openPipSynced(page, expected) {
  let handles = await openPip(page)
  // The message is posted at load+500ms and openPip already awaited hydration
  // plus a settle, so it has landed or been dropped — waiting 8s here just
  // stalls the retry. The post-reopen check keeps the generous default.
  let r = await until(handles.pipFrame, x => x.active === expected, 2500)
  if (r.ok) return { ...handles, retried: false, synced: true, state: r.state }

  console.error("WARN: initial PiP state sync was dropped (index.vue's iframe load handler) — reopening")
  await handles.pipPage.close()
  await until(page, x => x.hero !== HERO.pip)
  handles = await openPip(page)
  r = await until(handles.pipFrame, x => x.active === expected)
  return { ...handles, retried: true, synced: r.ok, state: r.state }
}

const shot = async (target, name) => {
  mkdirSync(OUT, { recursive: true })
  const path = resolve(OUT, `${name}.png`)
  await target.screenshot({ path })
  log(`  shot -> ${path}`)
  return path
}

// ---------------------------------------------------------------- commands

async function cmdShot() {
  const path = positional[0] ?? '/'
  const page = await openMain(path)
  await shot(page, opt('name', path.replace(/\W+/g, '_') || 'index'))
  log(JSON.stringify(await snapshot(page), null, 2))
}

async function cmdPip() {
  const page = await openMain('/')
  const wasActive = (await snapshot(page)).active
  const { pipPage, pipFrame } = await openPipSynced(page, wasActive)
  await shot(page, 'pip-parent')
  await shot(pipPage, 'pip-window')
  log('parent:', JSON.stringify(await snapshot(page)))
  log('pip:   ', JSON.stringify(await snapshot(pipFrame)))
}

async function cmdSmoke() {
  const check = (label, cond, got) => {
    if (cond) log(`  ok   ${label}`)
    else fail(`${label} (got: ${JSON.stringify(got)})`)
  }

  const page = await openMain('/')
  let s = await snapshot(page)

  log('1. page loads with wake lock support')
  check('Wake Lock API present', s.wakeLockApi, s.wakeLockApi)
  check('Document PiP API present', s.pipApi, s.pipApi)
  check('heading renders', s.heading === 'NoSleep', s.heading)
  check('auto-acquired on mount', s.hero === HERO.awake, s.hero)
  await shot(page, 'smoke-1-loaded')

  log('2. toggle wake lock off, then on')
  await page.click(SEL.hero)
  let r = await until(page, x => x.hero === HERO.asleep && !x.active)
  check('released', r.ok, r.state)
  await shot(page, 'smoke-2-released')

  await page.click(SEL.hero)
  r = await until(page, x => x.hero === HERO.awake && x.active)
  check('re-acquired', r.ok, r.state)

  log('3. start a 15 minute timer and watch it tick')
  await page.click(SEL.setTimer)
  await page.click('button:has-text("15 min")')
  await page.click('button:has-text("Start Timer")')
  await page.waitForSelector(SEL.timerDisplay, { timeout: 10000 })
  const first = (await snapshot(page)).timer
  // h:mm:ss for the 4-hour preset, m:ss below an hour — see formatTime in app/utils/time.ts
  check('timer shows a countdown', /^(\d+:)?\d+:\d{2}$/.test(first ?? ''), first)
  r = await until(page, x => x.timer !== first, 6000)
  check('countdown decrements', r.ok, { first, second: r.state.timer })
  await shot(page, 'smoke-3-timer')

  log('4. cancel the timer')
  await page.click('button:has-text("Cancel")')
  r = await until(page, x => x.timer === null)
  check('timer cleared', r.ok, r.state.timer)
  check('cancelling the timer keeps the lock', r.state.active, r.state)

  log('5. open the floating (PiP) window')
  const before = r.state.active
  const { pipPage, pipFrame, retried, synced, state } = await openPipSynced(page, before)
  r = await until(page, x => x.hero === HERO.pip)
  check('parent hands control to PiP', r.ok, r.state.hero)
  check('PiP inherits the parent wake lock state', synced, state)
  if (retried) log('  note: needed a second open — see the PiP sync gotcha in SKILL.md')
  await shot(pipPage, 'smoke-4-pip')

  log('6. toggling inside PiP syncs back to the parent')
  await pipFrame.click(SEL.orb)
  r = await until(pipFrame, x => x.active === !before)
  check('PiP toggled', r.ok, r.state)
  r = await until(page, x => x.active === !before)
  check('parent mirrors PiP state', r.ok, r.state)
  await shot(page, 'smoke-5-synced')

  log('7. closing the PiP window returns control to the parent')
  await pipPage.close()
  r = await until(page, x => x.hero !== HERO.pip)
  check('parent takes back the hero button', r.ok, r.state.hero)

  log(process.exitCode ? '\nSMOKE FAILED' : '\nSMOKE PASSED')
}

async function cmdRepl() {
  let page = await openMain('/')
  let pipPage = null
  let pipFrame = null
  const rl = createInterface({ input: process.stdin, terminal: false })
  const target = () => (pipFrame ? pipFrame : page)

  log('repl ready. commands: goto <path> | click <sel> | orb | text <sel> | eval <js> | state | ss <name> | pip | pipclose | wait <ms> | quit')
  log('READY')

  for await (const line of rl) {
    const [cmd, ...rest] = line.trim().split(' ')
    const arg = rest.join(' ')
    try {
      switch (cmd) {
        case '': break
        case 'goto': {
          const previous = page // else every goto leaks a live app with a 1s timer
          page = await openMain(arg || '/')
          pipFrame = null
          await previous.close().catch(() => {})
          break
        }
        case 'click': await target().click(arg, { timeout: 10000 }); break
        case 'orb': await target().click(SEL.orb); break
        case 'text': log(await target().locator(arg).first().innerText()); break
        case 'eval': log(JSON.stringify(await target().evaluate(`(async()=>(${arg}))()`))); break
        case 'state': log(JSON.stringify(await snapshot(target()), null, 2)); break
        case 'ss': await shot(pipPage && pipFrame ? pipPage : page, arg || 'repl'); break
        case 'pip': {
          const was = (await snapshot(page)).active
          ;({ pipPage, pipFrame } = await openPipSynced(page, was))
          log('pip open, target switched to the PiP frame')
          break
        }
        case 'pipclose': await pipPage?.close(); pipPage = null; pipFrame = null; break
        case 'wait': await page.waitForTimeout(Number(arg || 1000)); break
        case 'quit': rl.close(); return
        default: log(`unknown command: ${cmd}`)
      }
      log('OK')
    } catch (e) {
      log(`ERR ${e.message.split('\n')[0]}`)
    }
  }
}

// ---------------------------------------------------------------- main

const COMMANDS = { smoke: cmdSmoke, shot: cmdShot, pip: cmdPip, repl: cmdRepl }

const run = COMMANDS[command]
if (!run) {
  console.error(`unknown command "${command}". one of: ${Object.keys(COMMANDS).join(', ')}`)
  process.exit(2)
}

process.on('SIGINT', () => { stopServer('SIGKILL'); process.exit(130) })
process.on('SIGTERM', () => { stopServer('SIGKILL'); process.exit(143) })

try {
  // Independent — overlapping them hides the Chrome launch behind a cold server
  // start. allSettled, not all: a server failure must not leave a launched
  // browser unreferenced and unclosed.
  const [serverUp, browserUp] = await Promise.allSettled([startServer(), startBrowser()])
  for (const outcome of [serverUp, browserUp]) {
    if (outcome.status === 'rejected') throw outcome.reason
  }
  await run()
} catch (e) {
  console.error(`FAIL: ${e.message}`)
  process.exitCode = 1
} finally {
  await Promise.all([stopBrowser(), shutdownServer()])
}
