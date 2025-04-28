# Test info

- Name: Test User Filter Creation, Editing and Deletion >> should allow a user to navigate to create filter page
- Location: /home/tentamens/Documents/coflnet/ane-nuxt/tests/e2e/create-filter.spec.ts:5:3

# Error details

```
Error: locator.waitFor: Test ended.
Call log:
  - waiting for getByTestId('filter-navigation-button') to be visible

    at /home/tentamens/Documents/coflnet/ane-nuxt/tests/e2e/create-filter.spec.ts:8:56
```

# Test source

```ts
   1 | import { expect, test } from '@playwright/test'
   2 |
   3 | test.describe('Test User Filter Creation, Editing and Deletion', () => {
   4 |
   5 |   test('should allow a user to navigate to create filter page', async ({ page }) => {
   6 |     await page.goto('/overview')
   7 |
>  8 |     await page.getByTestId('filter-navigation-button').waitFor({ state: 'visible' });
     |                                                        ^ Error: locator.waitFor: Test ended.
   9 |     await page.getByTestId('filter-navigation-button').click()
  10 |     await expect(page).toHaveURL('/filters')
  11 |     await page.click('text=Create Filter')
  12 |     await expect(page).toHaveURL('/filters/create')
  13 |   })
  14 |
  15 |   return;
  16 |   test('inputing fields and creating filter', async ({ page }) => {
  17 |     await page.getByPlaceholder('e.g., Photography Equipment').fill('IPhones')
  18 |     await page.getByPlaceholder('eg., Camera').fill('IPhones')
  19 |   })
  20 |
  21 | })
  22 |
  23 |
  24 |
```