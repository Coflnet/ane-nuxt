import { setup } from '@nuxt/test-utils';

export default async function globalSetup() {
  console.log('Setting up Nuxt environment with @nuxt/test-utils...');
  await setup({
    browser: true, // Keep this if your tests require a browser environment 
  });
  console.log('Nuxt environment setup complete.');
}
