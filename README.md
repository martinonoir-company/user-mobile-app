# Martinonoir Mobile

Expo React Native app (iOS + Android) for the Martinonoir storefront. Consumes the same NestJS API as the user-frontend web app.

## Quick start

```bash
npm install
npm run start       # Expo dev menu
npm run android     # Android emulator
npm run ios         # iOS simulator (macOS only)
```

## API URL

The API base URL is read from `app.json > expo.extra.apiUrl`. Defaults to `http://10.0.2.2:3001/api/v1` so the Android emulator hits the host machine's localhost. For iOS simulator this also works through LAN; override per-environment if needed.

## Structure

```
app/                 expo-router routes
  (tabs)/            bottom-tab screens (Home, Shop, Cart, Wishlist, Account)
  (auth)/            login, register, forgot/reset password, verify email
  product/[slug].tsx product detail
  category/[slug].tsx category listing
  checkout.tsx
  order-confirmation.tsx
src/
  lib/               api client, contexts, helpers
  theme/             design tokens that mirror the web app
  components/        reusable UI primitives
```

## Design parity

Colors, spacing, and typography mirror `user-frontend/src/app/globals.css` and `tailwind.config.ts`. Price formatting mirrors `user-frontend/src/lib/price.ts`.
