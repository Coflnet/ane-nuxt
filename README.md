# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install
```

Add a [firebase service account](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments)

Create a ``.env`` file with this content
```json
GOOGLE_APPLICATION_CREDENTIALS=YOUR-SERVICE-ACCOUNT
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

## Glossary
| Term | German| Definition |
|---|---|
| custom searches | Suchauftrag | A single search order for x with y filters |
| Filter | Filter | Metadata for a custom search narrowing it, eg. the search term and location |
| Premium Search | Premium Suchanfrage | A single search request to a platform that restricts searches |
| Plan | Abo | The service tier the user is on |