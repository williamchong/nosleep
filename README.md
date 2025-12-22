# NoSleep: Prevent Screen Sleep with Custom Timers

A free web tool that keeps your screen awake during downloads, work sessions, presentations, and long-running processes. No installation needed - works directly in your browser with custom timer settings from 1-480 minutes.

## ✨ Key Features

- 🚫 **Prevent Screen Sleep** - Keep your device awake with one click
- ⏰ **Smart Timer System** - Set auto-sleep timers from 1 to 480 minutes (up to 8 hours)
- 🪟 **Floating Window Mode** - Always-on-top popup window that stays visible
- 🎨 **Visual Feedback** - Animated sun/moon icons show active status
- 📱 **Cross-Platform** - Works on desktop computers, tablets, and mobile phones
- 🌐 **No Installation** - Web-based tool, works directly in your browser
- 🔒 **100% Safe & Private** - No data collection, no permissions needed
- 🌓 **Dark Mode** - Easy on the eyes during extended use

## 🎯 Perfect For

- **Downloads & Uploads**: Set 30-60 min timers to prevent interruption during large file transfers
- **Work & Study Sessions**: 15-30 min focus timers to stay productive without screen dimming
- **Presentations & Meetings**: Keep screen active during demos and video calls
- **Long Processes**: 2-4 hour timers for video rendering, builds, or data processing
- **Live Streaming**: Prevent sleep during broadcasts and recording sessions
- **AI-Assisted Coding**: Extended sessions with tools like Claude Code or GitHub Copilot
- **Dashboard Monitoring**: Keep real-time tools and dashboards visible

## 🚀 How It Works

NoSleep uses your browser's built-in [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) - a safe, standard web technology that prevents your screen from sleeping. It's like moving your mouse occasionally, but automatic and hands-free.

### Simple 3-Step Process
1. **Click the button** to activate wake lock
2. **Set a timer** (optional) - choose 1-480 minutes or run until you manually stop
3. **Keep the tab active** or use the floating window feature

### Smart Features
- **Instant Activation**: One click starts keeping your screen awake
- **Animated Status Icons**: Sun animation when active, moon when sleeping
- **Flexible Timers**: Quick buttons (+1, +5, +10, +30 min) or custom input
- **Floating Window**: Dedicated popup that stays on top and syncs with main page
- **Auto-Release**: Automatically allows sleep when timer expires
- **Cross-Window Sync**: Controls in floating window update the main page in real-time

## 📱 Browser Compatibility

### ✅ Supported Browsers (Wake Lock API Required)
- **Chrome/Chromium 84+** (Windows, Mac, Linux, Android)
- **Microsoft Edge 84+** (Windows, Mac)
- **Safari 16.4+** (Mac, iPhone, iPad)
- **Firefox** (with additional configuration)

### ❌ Unsupported Browsers
Browsers without Screen Wake Lock API will see a clear error message with upgrade instructions.

**Note**: The app automatically detects your browser's capabilities. For the best experience, use the floating window feature on supported browsers.

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

## 📖 How to Use

### Quick Start (No Timer)
1. **Visit** the website at [nosleep.williamchong.cloud](https://nosleep.williamchong.cloud)
2. **Click** the main button - it will turn from green to red
3. **Notice** the sun animation - your screen is now staying awake
4. **Click again** when done to allow normal sleep

### Using the Timer Feature
1. **Click "Set Timer"** below the main button
2. **Choose your duration**:
   - Type any number (1-480 minutes)
   - Or use quick buttons: +1, +5, +10, +30 minutes
3. **Click "Start Timer"** to begin
4. **Relax** - your screen stays awake until the timer expires
5. **Cancel anytime** if you finish early

### 🪟 Using the Floating Window (Recommended)
1. **Click "Open Floating Window"** button
2. **A small window appears** that stays on top of other windows
3. **Control from either window** - they stay in sync
4. **Switch tabs freely** - the floating window keeps working
5. **Close the floating window** when done - main page takes over

### 💡 Tips for Best Results
- **Use the floating window** to avoid accidentally closing the tab
- **Set realistic timers** to save battery (30-60 min for downloads)
- **The tab must stay open** but doesn't need to be visible if using floating window
- **Battery impact**: Keeping screen awake uses more power - use timers wisely

### 🎨 What the Icons Mean
- **☀️ Sun with rays**: Your screen is staying awake
- **🌙 Moon**: Your screen can sleep normally
- **Timer countdown**: Shows remaining time (e.g., "23:45 remaining")

## 🔒 Privacy & Safety

**100% Safe to Use**
- ✅ No installation or downloads required
- ✅ No access to your files, camera, or microphone
- ✅ No data collection or tracking (beyond anonymous analytics)
- ✅ No account creation needed
- ✅ Uses only standard web browser APIs
- ✅ Open source - you can review the code

**How It's Safe**: This tool only uses your browser's built-in Screen Wake Lock API - the same technology that video players use to keep your screen on during playback. It's as safe as watching a YouTube video.

## ⚡ Technical Details

### Built With Modern Web Technologies
- **Nuxt 3**: Fast, modern web framework for optimal performance
- **Screen Wake Lock API**: Standard browser API for preventing screen sleep
- **Document Picture-in-Picture**: Advanced floating window support (when available)
- **Pinia State Management**: Centralized state for cross-window synchronization
- **Lottie Animations**: Beautiful, lightweight sun/moon animations
- **Tailwind CSS**: Responsive design that works on any screen size
- **i18n Support**: Multi-language support (English, Chinese, Japanese)

### Key Technical Features
- **Cross-Window Sync**: Floating window and main page stay perfectly synchronized
- **Smart State Management**: Automatic handling of window focus and visibility
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode**: Automatic theme switching based on system preferences
- **SEO Optimized**: Structured data and meta tags for search engines
- **Progressive Web App**: Can be installed on your device for quick access

### Browser APIs Used
- [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) - Prevents screen sleep
- [Document Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API) - Floating window support
- [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) - Secure cross-window communication

## 🌐 Live Demo

**Try it now**: [https://nosleep.williamchong.cloud](https://nosleep.williamchong.cloud)

Works on all modern browsers with Wake Lock API support. No signup, no download, completely free.

## ❓ FAQ

**Q: Will this drain my battery?**
A: Keeping your screen awake uses more power than letting it sleep. Use timers to minimize battery impact - set them only as long as you need.

**Q: What happens if I close the tab?**
A: The wake lock stops immediately. Use the floating window feature to prevent accidentally closing it.

**Q: Can I use this on my phone?**
A: Yes! It works on iPhone (Safari 16.4+) and Android (Chrome 84+). The floating window may not be available on all mobile browsers.

**Q: Is this better than changing my system settings?**
A: Yes! It's temporary and automatic. No need to remember to change settings back. When you close the tab or timer expires, everything returns to normal.

**Q: Does this work offline?**
A: No, you need an internet connection to load the page initially. Once loaded, it works without continuous internet connection.

## 🛠️ For Developers

Want to contribute or run locally? See the development sections above for setup instructions.

**Tech Stack**: Nuxt 3, Vue 3, TypeScript, Pinia, Tailwind CSS, Vitest

**Contributing**: Issues and pull requests welcome! Check out the code on GitHub.

## 📝 License

[View License](LICENSE)

## 👨‍💻 Author

Built by [William Chong](https://blog.williamchong.cloud)

**More Projects**: Visit my blog for more useful web tools and technical articles.

---

**Keywords**: prevent screen sleep, keep screen awake, download helper, no sleep timer, wake lock, screen timeout, presentation mode, prevent display sleep, keep computer awake, anti-sleep tool
