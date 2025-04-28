import { expect, test } from '@playwright/test'

test.describe('Test User Filter Creation, Editing and Deletion', () => {

  test('should allow a user to navigate to create filter page', async ({ page }) => {
    await page.goto('/overview')

    await page.getByTestId('filter-navigation-button').waitFor({ state: 'visible' });
    await page.getByTestId('filter-navigation-button').click()
    await expect(page).toHaveURL('/filters')
    await page.click('text=Create Filter')
    await expect(page).toHaveURL('/filters/create')
  })

  return;
  test('inputing fields and creating filter', async ({ page }) => {
    await page.getByPlaceholder('e.g., Photography Equipment').fill('IPhones')
    await page.getByPlaceholder('eg., Camera').fill('IPhones')
  })

})


