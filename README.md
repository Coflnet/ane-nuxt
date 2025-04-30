# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install
```

Add a [firebase service account]('https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments')

Create a ``.env`` file with this content
```json
GOOGLE_APPLICATION_CREDENTIALS=YOUR-SERVICE-ACCOUNT
```
```
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev
```

## Production

Build the application for production:

```bash
# pnpm
npm build
```

Locally preview production build:

```bash
# pnpm
npm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
