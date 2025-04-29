import { expect, test } from '@playwright/test'

test.describe('Test User Filter Creation, Editing and Deletion', () => {

  test('Navigate to and create filter along with deletion', async ({ page }) => {
    await page.goto('/overview')

    // allow auth api to resolve
    await delay(1000)

    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    // navigate to create filter page
    await page.getByTestId('filter-navigation-button').click()
    await expect(page).toHaveURL('/filters')
    await page.getByTestId('create-filter-button-nav').click()
    await expect(page).toHaveURL('/filters/create')

    // input fields
    await page.getByTestId('search-radius-input').fill('5000')
    // this is a random zip code
    await page.getByTestId('zip-code-input').fill('55042');
    await page.getByTestId('search-value-input').fill('IPhone');
    await delay(1000)
    await page.getByTestId('filter-name-input').fill('IPhone filter');
    await delay(1000)
    await page.getByTestId('dropdown-input').selectOption("Kleinanzeigen");
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await delay(10000)
    await page.getByTestId('filter-create-filter-button').click();

    await expect(page).toHaveURL('/overview');

    // allow api to update filters before continueing
    await delay(2000)

    await page.goto('/filters')
    await page.getByTestId('open-filter-delete-menu').first().click()
    await page.getByTestId('confirm-delete-filter').waitFor()
    await page.getByTestId('confirm-delete-filter').click()
  })


})


function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

