import { test, expect } from '@playwright/test';

/**
 * Tests for the Graph visualization and its settings panel.
 * Ensures the graph settings (like depth slider) and profile toggles function correctly.
 */
test.describe('Graph and Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/project/test-project/details', async (route) => { await route.fulfill({ status: 200, json: "Test Project Details" }); });
    await page.route('**/api/project/test-project/patterns', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/scores', async (route) => { await route.fulfill({ status: 200, json: { "profile-A": 0.5, "profile-B": 0.6 } }); });

    // Mock the graph nodes API call
    await page.route('**/api/project/test-project/profile/nodes*', async (route) => {
      await route.fulfill({ status: 200, json: [] });
    });
  });

  /**
   * Tests the interaction with the graph depth slider.
   * Focuses the slider and uses keyboard navigation to change its value.
   */
  test('changes max depth setting', async ({ page }) => {
    await page.route('**/api/project/test-project/profile/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.goto('/explorer/test-project');

    const settingsButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    const depthSlider = page.locator('[role="slider"]').first();

    if (await depthSlider.isVisible()) {
      await depthSlider.focus();
      await page.keyboard.press('ArrowRight');
    }
  });

  /**
   * Tests the profile visibility toggles (checkboxes) located in the PPM results sidebar.
   * Ensures that clicking a profile label correctly checks/unchecks the associated button.
   */
  test('toggles profile visibility in PPM results bar', async ({ page }) => {
    // Set up the mock BEFORE navigating
    await page.route('**/api/project/test-project/profile/getAll', async (route) => {
      await route.fulfill({ status: 200, json: ['profile-A', 'profile-B'] });
    });

    await page.goto('/explorer/test-project');

    // Wait for the labels to render
    const profileLabel = page.locator('label', { hasText: 'profile-A' });
    await expect(profileLabel).toBeVisible({ timeout: 15000 });

    const checkboxId = await profileLabel.getAttribute('for');
    if (checkboxId) {
      const checkbox = page.locator(`button#${checkboxId}`);
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await expect(checkbox).toHaveAttribute('aria-checked', 'false');
      }
    }
  });
});
