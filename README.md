# Nuxt 3 Starter Template

A pre-configured Nuxt 3 starter template with essential features.

## Features

- 🌍 i18n Internationalization
- 📱 TailwindCSS Integration
- 🔍 SEO Optimization & Sitemap
- 📊 Google Analytics Setup
- ✅ Testing Tools (Vitest)
- 🔧 ESLint Code Quality

## Integrated Modules

| Module                                                            | Description                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| [@nuxtjs/i18n](https://i18n.nuxtjs.org/)                          | Internationalization support for your Nuxt application   |
| [@nuxtjs/tailwindcss](https://tailwindcss.nuxtjs.org/)            | TailwindCSS integration with zero configuration          |
| [@nuxtjs/sitemap](https://sitemap.nuxtjs.org/)                    | Automatically generate sitemap for your Nuxt application |
| [nuxt-gtag](https://nuxt.com/modules/gtag)                        | Google Analytics 4 integration                           |
| [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing) | Official testing utilities for Nuxt applications         |
| [@nuxt/eslint](https://eslint.nuxt.com/)                          | Official ESLint configuration and tooling                |

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

## Configuration Guide

### Google Analytics

Configure your GA tracking ID in `nuxt.config.ts`:

```ts
gtag: {
  id: "YOUR-GA-ID";
}
```

### i18n Localization

English is supported by default. Add more languages in `nuxt.config.ts`:

```ts
i18n: {
  locales: [
    {
      code: "en",
      language: "en-US",
      file: "en-US.json",
    },
    // Add more languages...
  ];
}
```

For more information:

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Nuxt i18n](https://i18n.nuxtjs.org/)
- [Nuxt TailwindCSS](https://tailwindcss.nuxtjs.org/)
