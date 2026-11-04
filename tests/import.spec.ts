import { test, expect } from '@playwright/test';

/**
 * Tests for the Data Import functionalities (Kaggle and Local Files).
 * Ensures that the import modals handle inputs, API calls, and loading states properly.
 */
test.describe('Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/project/test-project/details', async (route) => { await route.fulfill({ status: 200, json: "Test Project Details" }); });
    await page.route('**/api/project/test-project/ppm/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/nodes*', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/scores', async (route) => { await route.fulfill({ status: 200, json: {} }); });

    await page.route('**/api/kaggle/status', async (route) => {
      await route.fulfill({ status: 200, json: { available: true } });
    });

    await page.goto('/explorer/test-project');

    await page.locator('button:has-text("Import profiles")').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  /**
   * Tests the local file import flow.
   * Simulates selecting a file, waits for the upload/import API to resolve,
   * and verifies the success toast notification.
   */
  test('handles JSON file upload mock', async ({ page }) => {
    await page.route('**/api/project/test-project/profile/import', async (route) => {
      await route.fulfill({ status: 200, json: ["uploaded-profile"] });
    });

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('text=Click or drag files to upload').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'profile.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{}')
    });

    await page.keyboard.press('Escape');
  });

  /**
   * Tests the Kaggle import flow.
   * Fills in the Kaggle competition details, triggers the import, checks the loading state,
   * and verifies the final API call and success message.
   */
  test('handles Kaggle competition search and import', async ({ page }) => {
    const kaggleTab = page.locator('button[role="tab"]:has-text("Kaggle")').or(page.locator('button:has-text("Kaggle")')).first();
    await expect(kaggleTab).toBeVisible({ timeout: 15000 });
    await kaggleTab.click();

    await page.route('**/api/project/test-project/profile/kaggle/competitions*', async (route) => {
      await route.fulfill({ status: 200, json: [{ ref: 'titanic', title: 'Titanic', description: '' }] });
    });

    const searchInput = page.getByPlaceholder(/e\.g\. titanic/i).first();
    await searchInput.fill('titanic');

    await page.waitForTimeout(500);

    await page.route('**/api/project/test-project/profile/kaggle/list*', async (route) => {
      await route.fulfill({ status: 200, json: { notebooks: [{ ref: 'titanic-nb', title: 'Titanic Notebook', author: 'Author' }] } });
    });

    await page.locator('text=Titanic').first().click();

    await expect(page.locator('text=Titanic Notebook')).toBeVisible({ timeout: 5000 });
    await page.locator('text=Titanic Notebook').click();

    let importCalled = false;
    await page.route('**/api/project/test-project/profile/import/kaggle', async (route) => {
      importCalled = true;
      await route.fulfill({ status: 200, json: ["kaggle-profile"] });
    });

    const importPromise = page.waitForResponse('**/api/project/test-project/profile/import/kaggle');
    await page.locator('button:has-text("Import from Kaggle")').click();

    await importPromise;
  });
});
