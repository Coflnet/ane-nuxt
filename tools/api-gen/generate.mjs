// Regenerates ../../src/api-client from the deployed OpenAPI spec (override with ANE_OPENAPI_INPUT).
import { createClient } from '@hey-api/openapi-ts'
import { fileURLToPath } from 'node:url'

await createClient({
  input: process.env.ANE_OPENAPI_INPUT ?? 'https://ane.coflnet.com/api/openapi/v1/openapi.json',
  output: { path: fileURLToPath(new URL('../../src/api-client', import.meta.url)), format: false, lint: false },
  plugins: [{ name: '@hey-api/client-nuxt', baseUrl: 'https://ane.coflnet.com' }, '@hey-api/typescript', '@hey-api/sdk'],
})
