# NoSleep Web App

A web application that prevents computers and mobile devices from going to sleep, allowing long-running processes to continue uninterrupted without changing device power settings.

## Features

- 🚫 Prevents device sleep/screen dimming
- ⏰ **Auto-sleep timer** with customizable duration
- 🎯 **Visual feedback** with animated icons when active
- 🔄 **Video fallback** for unsupported browsers
- 📱 Cross-platform support (desktop & mobile)  
- 🌐 Web-based solution (no installation required)
- 🔧 Simple one-click activation
- 📊 Built with Nuxt 3 for optimal performance

## How It Works

This web app uses your browser's built-in [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) when available to keep your screen awake. For older browsers, it provides a backup method that needs you to click first. You can also open a dedicated popup window that syncs with the main page and stays on top to avoid accidentally hiding the tab.

### Core Functionality
- **Instant activation**: Click the main button to keep your screen awake
- **Visual feedback**: Animated pulsing icon shows when it's working
- **Sleep timers**: Set custom durations (1-480 minutes) to automatically allow sleep again
- **Dedicated popup**: Open a separate window that syncs and stays on top
- **Smart sync**: Popup window controls sync back to the main page

### Key Benefits
- Keep your screen on without changing system settings
- Perfect for downloads, work sessions, presentations, or study time
- Set timers to automatically return to normal sleep behavior
- Use popup window to avoid accidentally losing focus
- Synced controls work in both main page and popup window

## Browser Compatibility

### Best Experience (Built-in Support)
- ✅ Chrome/Chromium 84+ (Computer & Phone)
- ✅ Microsoft Edge 84+
- ✅ Safari 16.4+ (Mac & iPhone/iPad)
- ✅ Firefox (with additional setup)

### Basic Support (Backup Method)
- ✅ Any modern browser
- ✅ Older browser versions
- ✅ All mobile browsers

*The app automatically detects your browser and adapts. Use the popup window for the most reliable experience across all browsers.*

## Setup

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Preview the production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Testing

Run unit tests:

```bash
# npm
npm run test

# pnpm
pnpm test

# yarn
yarn test

# bun
bun run test
```

## Usage

### Basic Usage
1. Visit the website
2. Click the main button to prevent device sleep
3. Notice the animated icon indicating your device is staying awake
4. Click again to allow device sleep

### Timer Usage
1. Click the "Timer" option below the main button
2. Set your desired duration using:
   - Direct input (1-480 minutes)
   - Quick increment buttons (+1, +5, +10, +30 minutes)
3. Click "Start" to begin the countdown
4. Your device will automatically sleep when the timer expires
5. Cancel the timer anytime by clicking "Cancel"

### 📋 Best Practices
- **Keep tab visible**: Keep this browser tab active and in the foreground
- **Use dedicated popup**: Click "Open Dedicated Window" for a separate window that stays on top
- **Amber button**: Click the amber/yellow button first if you see one (older browsers)
- **Popup sync**: Controls in the popup window automatically sync with the main page
- **Auto-release**: Screen wake stops if you switch tabs, minimize, or close the window

### 🎯 Visual Indicators
- **🟢 Green button**: Screen awake using built-in browser support (best experience)
- **🟡 Amber/Yellow button**: Screen awake using backup method (click first to activate)
- **🔵 Blue button**: "Switch to Popup Window" (when popup is open)
- **✨ Pulsing icon**: Animation shows when actively keeping screen awake
- **⏰ Timer countdown**: Real-time display of remaining time

## Use Cases

### 🚀 Instant Screen Wake
- **Presentations**: Keep screen on during talks and demos
- **Live streaming**: Prevent sleep during broadcasts or recording
- **Monitoring**: Keep dashboards and real-time tools visible
- **Video calls**: Stay visible during meetings and conferences

### ⏰ Timed Screen Wake  
- **Downloads/Uploads**: Set 30-60 min timers for large file transfers
- **Rendering & Processing**: Set 2-4 hour timers for video/audio work
- **Development**: Set 15-30 min timers for code compilation
- **Study Sessions**: Set focus timers for learning without interruption
- **Work Sessions**: Long coding sessions with AI assistants like Claude Code
- **Background Tasks**: Custom timers for any long-running processes

### 🪟 Dedicated Popup Window
- **Multi-tasking**: Keep wake controls in a separate window while working
- **Background operation**: Popup stays on top and syncs with main page
- **Accident prevention**: Less likely to accidentally close or hide the controls

## Technical Details

Built with modern web technologies:
- **Nuxt 3**: Full-stack framework for optimal performance and SEO
- **Screen Wake Lock API**: Native browser sleep prevention (best method)
- **Video Fallback**: Backup method for older browsers
- **Cross-Window Sync**: Real-time synchronization between main page and popup
- **Smart Timer System**: JavaScript intervals with automatic cleanup
- **Animated Feedback**: CSS animations show when actively working
- **Progressive Web App**: Can be installed for easy access
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🏗️ Architecture
- **Composable-based**: Reusable `useWakeLock()` composable handles all functionality
- **Reactive state**: Vue 3 reactivity for real-time UI updates across windows
- **Cross-window messaging**: `postMessage` API for secure popup ↔ main page sync
- **Smart state management**: Parent window becomes read-only when popup is active
- **Error handling**: Graceful fallbacks and user feedback
- **Memory management**: Automatic cleanup of timers, video elements, and event listeners

For more information:
- [Screen Wake Lock API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
