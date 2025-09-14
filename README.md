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

This web app uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) to prevent your device from going to sleep. For browsers that don't support the Wake Lock API, it provides a video-based fallback method that requires user interaction to activate.

### Core Functionality
- **Instant activation**: Click the main button to prevent sleep
- **Visual feedback**: Animated pulsing icon when device is kept awake  
- **Auto-sleep timer**: Set custom durations (1-480 minutes) for automatic sleep
- **Browser compatibility**: Fallback method available for unsupported browsers

### Key Benefits
- Prevent screen dimming/locking
- Keep your device active during long downloads, renders, or processes
- Avoid interrupting background tasks
- No need to change system power settings
- Set timers to automatically allow sleep after a specified duration

## Browser Compatibility

### Native Wake Lock API Support
- ✅ Chrome/Chromium 84+
- ✅ Edge 84+
- ✅ Safari 16.4+
- ✅ Firefox (with polyfill)

### Video Fallback Support (Universal)
- ✅ All modern browsers
- ✅ Older browser versions
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Firefox (all versions)

*The app detects browser capabilities and provides fallback options when native wake lock is unavailable.*

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

### Visual Indicators
- **Green button**: Device awake using native Wake Lock API
- **Amber button**: Device awake using video fallback method
- **Pulsing icon**: Animation shows when wake lock is active
- **Timer countdown**: Real-time display of remaining time

## Use Cases

### Immediate Wake Lock
- Presentations without screen timeout
- Live streaming or recording sessions
- Real-time monitoring dashboards
- Video calls and conferences

### Timed Wake Lock
- **File operations**: Set 30-60 min timers for large downloads/uploads
- **Rendering tasks**: Set 2-4 hour timers for video/audio processing
- **Development**: Set 15-30 min timers for code compilation
- **Vibe coding**: Long coding sessions with AI assistants like Claude Code
- **Data processing**: Set custom timers for analysis jobs
- **Study sessions**: Set focus timers without device interruption

## Technical Details

Built with modern web technologies:
- **Nuxt 3**: Full-stack framework for optimal performance
- **Screen Wake Lock API**: Native browser sleep prevention (primary method)
- **Video Fallback**: Invisible looping video for unsupported browsers
- **Real-time Timer**: JavaScript intervals with automatic cleanup
- **Animated UI**: CSS animations provide visual feedback
- **Progressive Web App**: Can be installed for easy access
- **Responsive Design**: Works on all device sizes

### Architecture
- **Composable-based**: Reusable `useWakeLock()` composable handles all functionality
- **Reactive state**: Vue 3 reactivity for real-time UI updates
- **Error handling**: Graceful fallbacks and user feedback
- **Memory management**: Automatic cleanup of timers and video elements

For more information:
- [Screen Wake Lock API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
