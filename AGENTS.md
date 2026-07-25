# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoSleep is a Nuxt 4 web application that prevents computers and mobile devices from going to sleep using the browser's Screen Wake Lock API. It features a timer system, Picture-in-Picture support, and cross-window state synchronization.

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

**PiP page (`app/pages/pip.vue`)**: it declares `definePageMeta({ pip: true })`, and `useWakeLockState` reads `route.meta.pip` to enable PiP mode — route meta survives static prerender/hydration, whereas a URL query is dropped while a prerendered page hydrates. The initial theme is passed via `?colorMode=`.

### Timer System

Timer is managed entirely in the wake lock composable:
- `startTimer(minutes)`: Acquires wake lock + starts countdown interval
- Interval updates `remainingTime` every second, syncs to PiP
- Auto-releases wake lock when timer expires
- `stopTimer()`: Clears interval, resets state

## Browser API Requirements

The app **requires** the Screen Wake Lock API. Browsers without support see an error message prompting upgrade. Check for support: `'wakeLock' in navigator`

Optional Document PiP API enhances UX. If unsupported, the PiP button is hidden.

## Development Notes

- UI: [Nuxt UI](https://ui.nuxt.com) v4 (Tailwind CSS v4 + Reka UI). Components are auto-imported (`UButton`, `UAccordion`, `UAlert`, `UIcon`, `USlider`, etc.); `<UApp>` wraps the app in `app/app.vue`
- Styling: Tailwind CSS v4 via Nuxt UI — config is CSS-first in `app/assets/css/main.css` (`@import "tailwindcss"; @import "@nuxt/ui";`). No `tailwind.config`. Prefer Nuxt UI design tokens (`text-muted`, `text-highlighted`, `bg-default`, `border-default`, `text-primary`) over raw gray/blue utilities
- Theme: semantic colors mapped in `app/app.config.ts` (`primary: blue`, `neutral: gray`); use `color="primary|success|error|neutral"` on Nuxt UI components
- Icons: Lucide via `@nuxt/icon`, bundled locally (`@iconify-json/lucide`) so they render offline / inside the PiP iframe. Reference as `i-lucide-*`
- Dark mode: Class-based (`dark` class), via `@nuxtjs/color-mode` (auto-registered by Nuxt UI; configured under the `colorMode` key in `nuxt.config.ts`)
- Sentry integration for error tracking (client + server configs)
