# Opa Harry's Herinneringen - Frontend

A heartfelt, interactive web application to celebrate the life and memories of Opa Harry through a beautiful photo mosaic.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

### 1. Install Dependencies

```sh
npm install
```

### 2. Firebase Configuration

This project requires a Firebase project with Firestore and Storage enabled.

**📖 See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for detailed step-by-step instructions with screenshots!**

**Quick Setup:**

1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   # or on Windows: Copy-Item .env.example .env
   ```

2. Get your Firebase credentials from [Firebase Console](https://console.firebase.google.com/):
   - Project Settings → Your apps → Web app → SDK setup and configuration
   - Copy all the config values

3. Fill in your `.env` file with your Firebase credentials

4. Enable Firestore Database (test mode) and Firebase Storage in Firebase Console

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
