# Milhut Store — Mobile App

React Native (Expo SDK 54) staff app for Milhut Store. Works on **iOS** and **Android**.

## Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode for emulators
- Backend running at `http://192.168.29.22:3000/api` (same Wi‑Fi as the device)

## Setup

```bash
npm install
node scripts/create-placeholder-logo.js
```

Copy your real logo from `milhut-store-admin/assets/icons/newlogo.png` to `assets/icons/newlogo.png`.

## Run

```bash
npm start
```

Then press:

- `a` — Android emulator or connected device
- `i` — iOS simulator (macOS only)

Or scan the QR code with Expo Go on a physical device.

## API configuration

The API base URL is set in `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.29.22:3000/api
```

Change this if your machine IP changes. Physical devices must use your LAN IP (not `localhost`).

### Platform notes

| Platform | HTTP (dev) | Notes |
|----------|------------|-------|
| Android | Enabled via `usesCleartextTraffic` | Use LAN IP for physical device |
| iOS | Enabled via `NSAppTransportSecurity` | Simulator can use LAN IP |
| Expo Go | Same as above | Phone must be on same network as API |

## Project structure

```
app/           Expo Router screens
src/
  constants/   Theme and config
  context/     Auth session
  services/    API client (auth, inventory, sales)
  types/       Shared TypeScript types
assets/icons/  App logo and splash
```

## App flow

1. **Splash** — logo + loading, then routes based on session
2. **Login** — email/password → `POST /auth/login`
3. **Register** — staff signup with `role: 2` → `POST /auth/register`
4. **Home** — authenticated placeholder (QR scan next)
