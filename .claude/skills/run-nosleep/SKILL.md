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
toggle *inside* the PiP iframe and assert the parent mirrors it, flip the theme on
the parent and assert the PiP follows, minimize into the compact layout and restore
(asserting the persisted size preference both ways), close PiP and assert the parent
takes control back. Screenshots land in `.screenshots/` (gitignored).

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
`--name <n>` (for `shot`), `--no-warm` (skip the `/pip` route pre-warm, so the
iframe hydrates cold — the slowest case for the handoff handshake).
`DRIVER_VERBOSE=1` echoes nuxt stdout, the parent state before PiP opens, and the
iframe's hydration latency.

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
  "timer": "3:59:59", "unsupported": false, "dark": false, "compact": false,
  "wakeLockApi": true, "pipApi": true }
```

`dark` reads the `dark` class off `<html>` in whichever window you point it at, so
it works for asserting theme sync into the PiP iframe. `compact` is true when the
PiP restore button is present, i.e. the window is in the minimized layout.

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
npx vitest run     # 3 files, 36 tests, ~2s
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
  separate compact layout, which `smoke` step 8 exercises by setting the viewport —
  headless ignores the app's `resizeTo()`.)
- **Never intercept requests with `context.route('**/*')`.** Routing every request
  round-trips it through CDP and slows Vite dev to a crawl. Route only the specific
  analytics hosts.
- **The PiP state handoff is a handshake, not a timer.** The iframe posts
  `pip-ready` from `useWakeLockState`'s mount hook, ordered so the parent's reply
  cannot outrun its own listener; the parent hands the wake-lock state over, and only releases
  its own lock after the iframe syncs back the state it was given. Hydration latency
  no longer costs anything — measured at 794–828 ms with `--no-warm` and the handoff
  still lands. `openPipSynced()` keeps a reopen-and-retry as a regression net; if you
  see `WARN: PiP state handoff did not land`, **the handshake is broken — that is a
  real failure, not flake.** (Before commit `dedf8f9` this was a `promiseTimeout(500)`
  bet in `index.vue` that lost about 1 run in 4 on the dev server.)
- **Anything touching PiP must poll, not sleep.** State crosses windows by
  `postMessage`; the driver's `until(target, pred)` helper exists for this. A
  snapshot taken immediately after the PiP window opens reads the pre-sync state.
- **Blocking analytics by URL substring breaks the app.** `@nuxt/scripts` serves
  first-party dev chunks at paths containing `google-analytics`. Matching that
  substring aborts a module Vite needs, `entry.js` then fails to import, and Vue
  never hydrates — the page still renders (SSR HTML) but nothing responds. Match
  on **hostname**.
- **`<h1>` is in the SSR HTML, so waiting on it proves nothing.** Gate on
  `[aria-label*="Device is"]` — it lives inside `<ClientOnly>` and only exists after
  hydration, which on a cold dev server can take 10s+. Don't narrow that to
  `[role="button"]`: that matches `StatusAnimation`'s div but misses the real
  `<button>` the compact PiP layout swaps in.
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
- **`npm run lint` does cover `driver.mjs`.** ESLint 9's flat config only default-
  ignores `node_modules`/`.git`, not dot-directories, so `.claude/**/*.mjs` is
  linted like any other source file. Run it after editing the driver.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `dev server did not come up within 90s`, with `Error: write EPIPE ... IPC.send` from `@nuxt/cli` | Transient, seen right after killing a previous server. Wait a few seconds and re-run. |
| `Executable doesn't exist at .../chromium_headless_shell-1223` | Ignore — that's bundled Chromium. The driver uses `channel: 'chrome'` (system Google Chrome) precisely to avoid `npx playwright install`. |
| `page.click: Timeout ... waiting for locator('button:has-text("Device Awake")...')` | The app rendered but never hydrated. Look for `Failed to fetch dynamically imported module` in the console output above it. |
| Parent says awake, PiP window shows the moon | The `pip-ready` handoff did not complete. Check the PiP iframe console for errors — this is a real bug, not flake. |
| `WARN: PiP state handoff did not land` | A regression in the handshake. The driver reopens and continues, but investigate even if the run says `SMOKE PASSED`. |
| Page renders in Chinese or Japanese | Locale leaked from the OS. Pass `--locale en-US` (the default). |
| `[get-port] Unable to find an available port (tried 3000)` | Another Nuxt project is on 3000. Harmless — the driver uses 3399 anyway. |
