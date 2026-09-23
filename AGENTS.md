# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NoSleep is a Nuxt 4 web application that prevents computers and mobile devices from going to sleep using the browser's Screen Wake Lock API. It features a timer system, Picture-in-Picture support, and cross-window state synchronization.

## Architecture

### State Management Architecture

The app uses a **single composable with module-level state** (`app/composables/useWakeLockState.ts`) as the source of truth for all wake lock state, timer state, and PiP window management. Module-level `ref()`s provide singleton behavior — all components share the same state within a window. Each window (main vs PiP iframe) gets its own module scope, so state is automatically isolated per-window.

**Key Principle**: Call `useWakeLockState()` once per window — from the page (`index.vue`, `pip.vue`) — and pass the result down as a prop, as `WakeLockControl` does. The state is module-level, so a second call in the same window registers a second PiP handshake listener. It handles its own lifecycle hooks (`onMounted`/`onUnmounted`) when called within a component setup context.

### Wake Lock State Flow

The browser auto-releases the wake lock when the tab loses visibility; the composable syncs state accordingly.

### Picture-in-Picture (PiP) Architecture

The app uses the **Document Picture-in-Picture API** (`useDocumentPiP.ts`) for always-on-top floating windows. There is no fallback — if the API is unsupported, the PiP button is hidden.

**Cross-Window Communication** (all in `useWakeLockState.ts`; `useDocumentPiP.ts` only opens/closes the window):
- The PiP window hosts the app in an iframe (`isIframePip` flag). The window bus carries only the handshake: the iframe posts `pip-ready` to its parent (the PiP window), and the main window replies into the iframe with `pip-connect`, transferring `port2` of a new `MessageChannel`
- All steady-state traffic (`wake-lock-sync`, `color-mode-sync`) goes over that port. After the handoff only the iframe sends state (`syncWakeLockState()` is a no-op in the main window)
- No `pip-ready` within `PIP_CONNECT_TIMEOUT_MS` → the main window closes the PiP window (`failPipConnection`)

**State Synchronization Rules**:
- Handoff: the main window sends its state once, but keeps its wake lock until the iframe syncs back the same `isActive` (`completePipHandoff`); a mismatch or timeout leaves the main window's lock intact
- PiP iframe manages its own wake lock
- Parent UI becomes read-only (controlled by `isParentWithActivePip` computed)
- Closing PiP window triggers reacquisition of wake lock in parent

**Invariant**: the main window sends state to the iframe exactly once, at handoff — the iframe's side of `handleWakeLockSync` is an initializer with no branch for stopping a running timer. Sending state more than once means writing that branch.

**PiP page (`app/pages/pip.vue`)**: it declares `definePageMeta({ pip: true })`, and `useWakeLockState` reads `route.meta.pip` to enable PiP mode — route meta survives static prerender/hydration, whereas a URL query is dropped while a prerendered page hydrates. The initial theme is passed via `?colorMode=`.

## Browser API Requirements

The app **requires** the Screen Wake Lock API. Browsers without support see an error message prompting upgrade. Check for support: `'wakeLock' in navigator`

Optional Document PiP API enhances UX. If unsupported, the PiP button is hidden.

## Development Notes

- UI: [Nuxt UI](https://ui.nuxt.com) v4 (Tailwind CSS v4 + Reka UI). Components are auto-imported (`UButton`, `UAccordion`, `UAlert`, `UIcon`, `USlider`, etc.); `<UApp>` wraps the app in `app/app.vue`
- Styling: Tailwind CSS v4 via Nuxt UI — config is CSS-first in `app/assets/css/main.css` (`@import "tailwindcss"; @import "@nuxt/ui";`). No `tailwind.config`. Prefer Nuxt UI design tokens (`text-muted`, `text-highlighted`, `bg-default`, `border-default`, `text-primary`) over raw gray/blue utilities
- Theme: semantic colors mapped in `app/app.config.ts` (`primary: blue`, `neutral: gray`); use `color="primary|success|error|neutral"` on Nuxt UI components
- Icons: Lucide via `@nuxt/icon`, bundled locally (`@iconify-json/lucide`) so they render offline / inside the PiP iframe. Reference as `i-lucide-*`
- Dark mode: Class-based (`dark` class), via `@nuxtjs/color-mode` (auto-registered by Nuxt UI; configured under the `colorMode` key in `nuxt.config.ts`)
