# NoSleep Web App

A web application that prevents computers and mobile devices from going to sleep, allowing long-running processes to continue uninterrupted without changing device power settings.

## Features

- 🚫 Prevents device sleep/screen dimming
- 📱 Cross-platform support (desktop & mobile)
- 🌐 Web-based solution (no installation required)
- 🔧 Simple one-click activation
- 📊 Built with Nuxt 3 for optimal performance

## How It Works

This web app uses the [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) to prevent your device from going to sleep. Simply visit the website and click the "Keep Awake" button to:

- Prevent screen dimming/locking
- Keep your device active during long downloads, renders, or processes
- Avoid interrupting background tasks
- No need to change system power settings

## Browser Compatibility

- ✅ Chrome/Chromium 84+
- ✅ Edge 84+
- ✅ Safari 16.4+
- ✅ Firefox (via polyfill)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

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

1. Start the development server (see instructions above)
2. Open your browser to `http://localhost:3000`
3. Click the "Keep Awake" button to prevent sleep
4. Your device will stay active until you click "Release" or close the tab

## Use Cases

- Long file downloads or uploads
- Video/audio rendering processes
- Code compilation and builds
- Data processing and analysis
- Streaming or recording sessions
- Presentations without timeout

## Technical Details

Built with modern web technologies:
- **Nuxt 3**: Full-stack framework for optimal performance
- **Screen Wake Lock API**: Native browser sleep prevention
- **Progressive Web App**: Can be installed for easy access
- **Responsive Design**: Works on all device sizes

For more information:
- [Screen Wake Lock API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
