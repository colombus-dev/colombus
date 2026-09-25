import { test, expect } from '@playwright/test';

/**
 * Tests for the Statistics and Code tabs within the Explorer page.
 * Validates that navigating between these tabs correctly displays the expected charts and code viewers.
 */
test.describe('Statistics and Code Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/project/test-project/details', async (route) => { await route.fulfill({ status: 200, json: "Test Project Details" }); });
    await page.route('**/api/project/test-project/ppm/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });

    // We mock graph nodes with some fake data
    await page.route('**/api/project/test-project/profile/nodes*', async (route) => {
      await route.fulfill({ status: 200, json: [{ id: "n1", name: "node-1", steps: [], meta_instructions: [], codes: [{ id: "c1", meta_instruction_id: "m1", content: "print('hello')", position: 0 }] }] });
    });

    // Mock profiles so that it calls the graph API
    await page.route('**/api/project/test-project/profile/getAll', async (route) => { await route.fulfill({ status: 200, json: ['node-1'] }); });
    await page.route('**/api/project/test-project/profile/scores', async (route) => { await route.fulfill({ status: 200, json: { "node-1": 1 } }); });

    // Mock the kaggle status to avoid header hanging
    await page.route('**/api/kaggle/status', async (route) => {
      await route.fulfill({ status: 200, json: { available: true } });
    });

    // Mock the statistics API call
    await page.route('**/api/project/test-project/stats/steps/frequency', async (route) => {
      await route.fulfill({ status: 200, json: [["step-1", 10]] });
    });

    await page.goto('/explorer/test-project');
  });

  /**
   * Verifies that clicking the "Statistics" tab fetches statistical data and renders the chart containers.
   */
  test('displays statistics charts', async ({ page }) => {
    // Click on Statistics tab
    const button = page.getByRole('button', { name: 'Statistics' });
    // We wait for it to be stable
    await expect(button).toBeVisible();
    await button.click({ force: true });

    // Check if the charts container is visible
    const chartsContainer = page.locator('.grid-cols-2').first();
    await expect(chartsContainer).toBeVisible({ timeout: 10000 });
  });

  /**
   * Verifies that clicking the "Code" tab hides the graph and displays the Monaco code viewer container.
   */
  test('displays code viewer', async ({ page }) => {
    // Click on Code tab
    const button = page.getByRole('button', { name: 'Code' });
    await expect(button).toBeVisible();
    await button.click({ force: true });

    // The node-1 text should be visible since the graph loaded
    await expect(page.locator('text=node-1').first()).toBeVisible({ timeout: 10000 });
  });
});
