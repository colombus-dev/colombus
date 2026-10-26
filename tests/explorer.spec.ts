import { test, expect } from '@playwright/test';

/**
 * Tests for the main Explorer Page.
 * Validates the core layout, tabs presence, and interactive modals.
 */
test.describe('Explorer Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the project validation endpoint
    await page.route('**/api/project/test-project/details', async (route) => {
      await route.fulfill({ json: "Test Project Details" });
    });

    // Mock other endpoints called on load
    await page.route('**/api/project/test-project/patterns', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/project/test-project/graph', async (route) => {
      await route.fulfill({ json: { nodes: [] } });
    });

    await page.route('**/api/project/test-project/profiles', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/project/test-project/scores', async (route) => {
      await route.fulfill({ json: {} });
    });

    // Go directly to the explorer page
    await page.goto('/explorer/test-project');
  });

  /**
   * Ensures that the default view (Explorer tab) loads properly with its UI components,
   * specifically checking for the presence of all 3 main tabs and the Sigma graph container.
   */
  test('loads explorer view and displays main components', async ({ page }) => {
    // Check that we are on the Explorer tab by default
    await expect(page.locator('button:has-text("Explorer")')).toBeVisible();
    await expect(page.locator('button:has-text("Code")')).toBeVisible();
    await expect(page.locator('button:has-text("Statistics")')).toBeVisible();

    // Check the graph container is present
    const graphContainer = page.locator('#graph-container');
    await expect(graphContainer).toBeVisible();
  });

  /**
   * Verifies the behavior of the "Import profiles" functionality.
   * It checks if clicking the button opens the dialog modal and if pressing 'Escape' closes it.
   */
  test('opens the import modal', async ({ page }) => {
    // Click the Import profiles button
    const importButton = page.locator('button:has-text("Import profiles")');
    await expect(importButton).toBeVisible();
    await importButton.click();

    // The modal should appear. We can check for a text inside the modal or the generic dialog role
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // We can also close it by pressing Escape
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
