# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoSleep is a Nuxt 4 web application that prevents computers and mobile devices from going to sleep using the browser's Screen Wake Lock API. It features a timer system, Picture-in-Picture support, and cross-window state synchronization.

## Common Commands

### Development
```bash
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Build for production
npm run preview          # Preview production build
npm install              # Install dependencies
npm run postinstall      # Run Nuxt prepare (auto-runs after install)
```

### Code Quality
```bash
npm run lint             # Run ESLint on all files
npm run typecheck        # Run TypeScript type checking
npm run test             # Run Vitest tests
```

## Architecture

### State Management Architecture

The app uses a **single composable with module-level state** (`app/composables/useWakeLockState.ts`) as the source of truth for all wake lock state, timer state, and PiP window management. Module-level `ref()`s provide singleton behavior — all components share the same state within a window. Each window (main vs PiP iframe) gets its own module scope, so state is automatically isolated per-window.

**Key Principle**: All components should use `useWakeLockState()`. This composable handles lifecycle hooks (`onMounted`/`onUnmounted`) automatically when called within a component setup context.

### Wake Lock State Flow

1. **Native Wake Lock**: Uses browser's `navigator.wakeLock.request('screen')` API via `@vueuse/core`'s `useWakeLock()`
2. **Composable manages**: `isActive`, wake lock sentinel, timer state, PiP window refs
3. **Auto-release handling**: Wake lock automatically releases when tab loses visibility; composable syncs state accordingly

### Picture-in-Picture (PiP) Architecture

The app uses the **Document Picture-in-Picture API** (`useDocumentPiP.ts`) for always-on-top floating windows. There is no fallback — if the API is unsupported, the PiP button is hidden.

**Cross-Window Communication**:
- Parent window ↔ PiP window communicate via `postMessage` API
- PiP window runs as iframe with special handling (`isIframePip` flag)
- Message relay system in `useDocumentPiP.ts` forwards messages between main window ↔ PiP window ↔ iframe
- `syncWakeLockState()` broadcasts state changes to connected windows

**State Synchronization Rules**:
- When PiP window is active, parent's wake lock is released
- PiP iframe manages its own wake lock
- Parent UI becomes read-only (controlled by `isParentWithActivePip` computed)
- Closing PiP window triggers reacquisition of wake lock in parent

### Timer System

Timer is managed entirely in the wake lock composable:
- `startTimer(minutes)`: Acquires wake lock + starts countdown interval
- Interval updates `remainingTime` every second, syncs to PiP
- Auto-releases wake lock when timer expires
- `stopTimer()`: Clears interval, resets state

### Analytics Integration

`useAnalytics.ts` composable tracks events to Google Analytics (via `nuxt-gtag`).

Events tracked include: wake lock acquire/release, timer actions, PiP window operations.

## Key Files

### Composables
- `app/composables/useWakeLockState.ts`: **Central state management** — all wake lock, timer, and PiP state + lifecycle hooks
- `app/composables/useDocumentPiP.ts`: Document PiP API management + message relay
- `app/composables/useAnalytics.ts`: Analytics tracking (GA via nuxt-gtag)
- `app/composables/useWakeLockUI.ts`: UI-specific logic (toggle/timer handlers, button state and styling)

### Components
- `WakeLockControl.vue`: Main toggle button component
- `TimerControl.vue`: Timer input and countdown display
- `StatusAnimation.vue`: Lottie sun/moon animations
- `FloatingWindowCTA.vue`: PiP window launch button
- `DarkModeToggle.vue`: Theme switcher

### Pages
- `app/pages/index.vue`: Main application page
- `app/pages/pip.vue`: PiP iframe content page (loaded inside Document PiP window with `?pip=1`)

## Browser API Requirements

The app **requires** the Screen Wake Lock API. Browsers without support see an error message prompting upgrade. Check for support: `'wakeLock' in navigator`

Optional Document PiP API enhances UX. If unsupported, the PiP button is hidden.

## Internationalization (i18n)

Configured in `nuxt.config.ts`:
- Default locale: `en` (English)
- Supported: `en-US`, `zh-HK`, `ja-JP`
- Translation files: `i18n/locales/*.json`
- Strategy: `prefix_and_default` (e.g., `/en/`, `/zh/`, default `/`)

## Testing

Tests use Vitest with `@nuxt/test-utils`. Configuration in `vitest.config.ts`.

## Development Notes

- Node.js version: >=24.0.0 (specified in `package.json` engines)
- Nuxt auto-imports composables, components, and utilities
- UI: [Nuxt UI](https://ui.nuxt.com) v4 (Tailwind CSS v4 + Reka UI). Components are auto-imported (`UButton`, `UAccordion`, `UAlert`, `UIcon`, `USlider`, etc.); `<UApp>` wraps the app in `app/app.vue`
- Styling: Tailwind CSS v4 via Nuxt UI — config is CSS-first in `app/assets/css/main.css` (`@import "tailwindcss"; @import "@nuxt/ui";`). No `tailwind.config`. Prefer Nuxt UI design tokens (`text-muted`, `text-highlighted`, `bg-default`, `border-default`, `text-primary`) over raw gray/blue utilities
- Theme: semantic colors mapped in `app/app.config.ts` (`primary: blue`, `neutral: gray`); use `color="primary|success|error|neutral"` on Nuxt UI components
- Icons: Lucide via `@nuxt/icon`, bundled locally (`@iconify-json/lucide`) so they render offline / inside the PiP iframe. Reference as `i-lucide-*`
- Dark mode: Class-based (`dark` class), via `@nuxtjs/color-mode` (auto-registered by Nuxt UI; configured under the `colorMode` key in `nuxt.config.ts`)
- Sentry integration for error tracking (client + server configs)
