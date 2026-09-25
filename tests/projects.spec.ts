import { test, expect } from '@playwright/test';

/**
 * Tests for Project Management features.
 * Validates the creation of new projects and the error handling for invalid projects.
 */
test.describe('Project Management', () => {
  /**
   * Simulates the creation of a new project by filling out the form and submitting.
   * Verifies that the API POST request is made and the user is redirected to the new project's explorer page.
   */
  test('creates a new project and displays it', async ({ page }) => {
    await page.route('**/api/project', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ json: [] });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({ json: "new-project-id" });
      }
    });

    await page.goto('/');

    await expect(page.locator('text=No projects found')).toBeVisible();

    const nameInput = page.locator('input[name="name"]').or(page.getByPlaceholder(/name/i));
    await nameInput.fill('My Awesome Project');

    await page.locator('button[type="submit"]').click();

    await page.route('**/api/project/new-project-id/details', async (route) => { await route.fulfill({ json: "My Awesome Project Details" }); });
    await page.route('**/api/project/new-project-id/patterns', async (route) => { await route.fulfill({ json: [] }); });
    await page.route('**/api/project/new-project-id/graph', async (route) => { await route.fulfill({ json: { nodes: [] } }); });
    await page.route('**/api/project/new-project-id/profiles', async (route) => { await route.fulfill({ json: [] }); });
    await page.route('**/api/project/new-project-id/scores', async (route) => { await route.fulfill({ json: {} }); });

    await expect(page).toHaveURL(/\/explorer\/new-project-id/);
  });

  /**
   * Tests the fallback behavior when a user tries to access a non-existent project URL.
   * It mocks a 404 API response and checks that the app redirects back to the default explorer listing.
   */
  test('handles invalid project access', async ({ page }) => {
    await page.route('**/api/project/invalid-id/details', async (route) => {
      await route.fulfill({ status: 404, json: { detail: "Project not found" } });
    });

    await page.goto('/explorer/invalid-id');

    // The app redirects back to /explorer on invalid project
    await expect(page).toHaveURL(/\/explorer$/);
  });
});
