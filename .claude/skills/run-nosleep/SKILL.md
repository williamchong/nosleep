---
name: run-nosleep
description: Build, run, screenshot and drive the NoSleep Nuxt app. Use when asked to run, start, launch, preview, screenshot, or smoke-test NoSleep, to verify a change works in the real browser (wake lock toggle, timer, dark mode, Picture-in-Picture floating window), or to test the PiP cross-window state sync end to end.
---

# Run NoSleep

NoSleep is a Nuxt 4 SPA that holds a Screen Wake Lock and mirrors its state into a
Document Picture-in-Picture floating window. It is driven programmatically by
`.claude/skills/run-nosleep/driver.mjs`, which starts the dev server, launches
Chrome via the repo's own `playwright-core`, and clicks through the real UI.

All paths below are relative to the repo root (`/Users/william/nosleep`).

## Prerequisites

Node >= 24 and Google Chrome at `/Applications/Google Chrome.app`. Nothing else —
the driver uses `channel: 'chrome'`, so no Playwright browser download is needed.

```bash
npm install
```

## Run (agent path)

The driver starts and stops its own dev server on port 3399. One command, no
cleanup:

```bash
node .claude/skills/run-nosleep/driver.mjs smoke
```

That runs the full user flow with assertions and prints `SMOKE PASSED` /
`SMOKE FAILED` (exit code 1 on failure). It covers: load + auto-acquire, toggle
off/on, start a 15-minute timer and watch it tick, cancel, open the PiP window,
toggle *inside* the PiP iframe and assert the parent mirrors it, close PiP and
assert the parent takes control back. Screenshots land in `.screenshots/`
(gitignored).

Other commands:

```bash
# screenshot one route (state snapshot printed as JSON)
node .claude/skills/run-nosleep/driver.mjs shot / --name home
node .claude/skills/run-nosleep/driver.mjs shot / --dark --name dark-home
node .claude/skills/run-nosleep/driver.mjs shot /pip --name pip-standalone

# open the floating window and screenshot both surfaces
node .claude/skills/run-nosleep/driver.mjs pip

# drive it by hand, one command per stdin line
node .claude/skills/run-nosleep/driver.mjs repl
```

Flags: `--url <url>` (use an already-running server instead of spawning one),
`--port <n>` (default 3399), `--headed` (real Chrome window), `--dark`,
`--locale <tag>` (default `en-US`), `--out <dir>` (default `.screenshots`),
`--name <n>` (for `shot`), `--no-warm` (skip the `/pip` route pre-warm; only
useful for reproducing the sync race below). `DRIVER_VERBOSE=1` echoes nuxt
stdout, the parent state before PiP opens, and the iframe's hydration latency.

### REPL

Every line prints `OK` or `ERR <message>`, so it is safe to pipe:

```bash
printf 'state\nclick button:has-text("Set Timer")\nclick button:has-text("4 Hours")\nclick button:has-text("Start Timer")\nwait 1500\nstate\nss repl-timer\npip\nstate\norb\nwait 1500\nstate\nquit\n' \
  | node .claude/skills/run-nosleep/driver.mjs repl
```

Commands: `goto <path>`, `click <selector>`, `orb` (the sun/moon toggle),
`text <selector>`, `eval <js>`, `state`, `ss <name>`, `pip`, `pipclose`,
`wait <ms>`, `quit`. After `pip`, `click`/`orb`/`state`/`eval` retarget to the
PiP iframe; `pipclose` switches back.

`state` returns the snapshot the assertions are built on:

```json
{ "heading": "NoSleep", "hero": "Device Awake",
  "orbLabel": "Device is awake - Click sun to allow sleep", "active": true,
  "timer": "3:59:59", "unsupported": false, "wakeLockApi": true, "pipApi": true }
```

### Against the production build

The static build is what actually ships; `smoke` passes against it too.

```bash
npm run generate
npx serve .output/public -l 4399 --no-clipboard &
node .claude/skills/run-nosleep/driver.mjs smoke --url http://localhost:4399 --out .screenshots/prod
```

## Run (human path)

```bash
npm run dev      # http://localhost:3000, or 3001+ if 3000 is taken
```

Prints the port it actually bound — don't assume 3000.

## Test

```bash
npx vitest run     # 2 files, 24 tests, ~2s
npm run lint
npm run typecheck  # nuxt typecheck; ~1 min, no output when clean
```

`npm test` (bare `vitest`) also exits cleanly here — vitest 4 only watches when
stdout is a TTY — but prefer `npx vitest run` so it can't hang in a terminal.

## Gotchas

- **Headless Chrome fully supports both APIs this app needs.** `navigator.wakeLock.request('screen')`
  resolves and `window.documentPictureInPicture` exists. No `xvfb`, no `--headed`,
  no display required. Don't assume otherwise and reach for a mock.
- **The PiP window is a separate Playwright `Page` whose URL is `about:blank`.**
  `useDocumentPiP` opens a blank PiP document and appends an `<iframe src="/pip">`.
  The drivable handle is `pipPage.frames().find(f => f.url().includes('/pip'))` —
  the page itself has no app in it. Headless gives that page the parent's 1280x900
  viewport and `innerWidth` reports *that*, not the size `requestWindow()` asked
  for — so you must resize it explicitly or the screenshot looks nothing like what
  ships. The driver scrapes `PIP_RESTORED_WIDTH`/`HEIGHT` (240x280) out of
  `app/utils/pip.ts` as text, since a plain `.mjs` can't import the app's TS.
  (Minimized is 240x52, and a height <= 100 switches `WakeLockControl.vue` into a
  separate compact layout the driver does not currently exercise.)
- **Never intercept requests with `context.route('**/*')`.** Routing every request
  round-trips it through CDP and slows Vite dev enough to break the PiP handoff
  (see next bullet). Route only the specific analytics hosts.
- **The initial PiP state sync is a 500 ms bet, and it loses maybe 1 run in 4.**
  `app/pages/index.vue`'s iframe `load` handler waits `promiseTimeout(500)`, then
  posts the wake-lock state. If the iframe hasn't hydrated a `message`
  listener by then, the message is dropped — silently, no error anywhere — and the
  PiP window sits asleep while the parent shows awake. Measured against a cold dev
  server: iframe hydration ~35 ms ⇒ sync lands; ~215 ms ⇒ sync dropped. There is no
  re-sync trigger in the app, so the only recovery is to close and reopen the PiP
  window; the second attempt is warm and lands. `openPipSynced()` in the driver
  does exactly that and prints `WARN: initial PiP state sync was dropped` when it
  fires — **that warning means the race hit, not that the driver is broken.** It
  never reproduced against the production build (`npm run generate`), only against
  the dev server.
- **Anything touching PiP must poll, not sleep.** State crosses windows by
  `postMessage`; the driver's `until(target, pred)` helper exists for this. A
  snapshot taken immediately after the PiP window opens reads the pre-sync state.
- **Blocking analytics by URL substring breaks the app.** `@nuxt/scripts` serves
  first-party dev chunks at paths containing `google-analytics`. Matching that
  substring aborts a module Vite needs, `entry.js` then fails to import, and Vue
  never hydrates — the page still renders (SSR HTML) but nothing responds. Match
  on **hostname**.
- **`<h1>` is in the SSR HTML, so waiting on it proves nothing.** Gate on
  `[role="button"][aria-label*="Device is"]` — it lives inside `<ClientOnly>` and
  only exists after hydration, which on a cold dev server can take 10s+.
- **Every string is translated, including `aria-label`.** Chrome inherits the OS
  locale (zh-HK on this machine), so a fresh context renders the app in Chinese
  and every English selector misses. The driver pins `locale: 'en-US'`.
- **The app auto-acquires the wake lock on mount**, so a freshly loaded page reads
  "Device Awake", not "Click to Keep Awake". Cancelling a timer does *not* release
  the lock.
- **Nuxt DevTools and the Vue tracer paint over dev-mode screenshots.** The driver
  hides `#nuxt-devtools-container`, `#vue-tracer-overlay` and
  `nuxt-devtools-inspect-panel` via an init script.
- **`nuxt dev` regularly survives SIGTERM.** Killing the `npx` wrapper isn't
  enough, and even a SIGTERM to the process group often leaves 3399 bound — the
  next run then "reuses" a half-dead server. The driver spawns it `detached`,
  SIGTERMs the group, waits for the port to stop answering and escalates to
  SIGKILL. If a run dies hard anyway: `lsof -ti:3399 | xargs kill -9`.
- **ESLint ignores dotfile directories**, so `driver.mjs` under `.claude/` is not
  covered by `npm run lint`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `dev server did not come up within 90s`, with `Error: write EPIPE ... IPC.send` from `@nuxt/cli` | Transient, seen right after killing a previous server. Wait a few seconds and re-run. |
| `Executable doesn't exist at .../chromium_headless_shell-1223` | Ignore — that's bundled Chromium. The driver uses `channel: 'chrome'` (system Google Chrome) precisely to avoid `npx playwright install`. |
| `page.click: Timeout ... waiting for locator('button:has-text("Device Awake")...')` | The app rendered but never hydrated. Look for `Failed to fetch dynamically imported module` in the console output above it. |
| Parent says awake, PiP window shows the moon | The 500 ms state-transfer race above, not a wake-lock failure. Close and reopen the PiP window — `smoke` and `pip` do this automatically. |
| `WARN: initial PiP state sync was dropped` | Expected, ~1 run in 4 against the dev server. The driver reopened the window and continued; if the run still says `SMOKE PASSED`, nothing is wrong. |
| Page renders in Chinese or Japanese | Locale leaked from the OS. Pass `--locale en-US` (the default). |
| `[get-port] Unable to find an available port (tried 3000)` | Another Nuxt project is on 3000. Harmless — the driver uses 3399 anyway. |
