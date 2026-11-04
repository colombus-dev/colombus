import { test, expect } from '@playwright/test';

/**
 * Tests for the Homepage (Project Listing).
 * Validates the fetching of projects, search filtering, and navigation to the explorer.
 */
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API response for projects
    await page.route('**/api/project', async (route) => {
      const json = [
        { id: '1', name: 'Alpha Project', description: 'Test Project A' },
        { id: '2', name: 'Beta Project', description: 'Test Project B' },
      ];
      await route.fulfill({ json });
    });

    // Go to the homepage
    await page.goto('/');
  });

  /**
   * Checks that the homepage loads the title and displays the mocked projects retrieved from the API.
   */
  test('loads and displays projects correctly', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toHaveText('Colombus');

    // Check that our mocked projects are displayed
    await expect(page.locator('text=Alpha Project')).toBeVisible();
    await expect(page.locator('text=Beta Project')).toBeVisible();
  });

  /**
   * Tests the client-side search functionality.
   * Verifies that typing in the search bar correctly filters the displayed projects.
   */
  test('filters projects using the search input', async ({ page }) => {
    // Get the search input (placeholder is 'Search...' or similar)
    // Looking at project-search-input.tsx, it's an input type text.
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator('input[type="text"]'));

    // Search for 'Alpha'
    await searchInput.fill('Alpha');

    // Alpha should be visible, Beta should be hidden
    await expect(page.locator('text=Alpha Project')).toBeVisible();
    await expect(page.locator('text=Beta Project')).toBeHidden();

    // Search for something that doesn't exist
    await searchInput.fill('GarbageXYZ');
    await expect(page.locator('text=No projects found')).toBeVisible();
  });

  /**
   * Tests the routing mechanism from the homepage to the explorer page.
   * Clicks on a specific project and asserts that the URL updates correctly.
   */
  test('navigates to explorer when a project is clicked', async ({ page }) => {
    // Mock the explorer project details API call
    await page.route('**/api/project/1/details', async (route) => {
      await route.fulfill({ json: "Alpha Project Details" }); // return anything to avoid 404
    });

    // Mock patterns list call
    await page.route('**/api/project/1/patterns', async (route) => {
      await route.fulfill({ json: [] });
    });

    // Mock the graph call
    await page.route('**/api/project/1/graph', async (route) => {
      await route.fulfill({ json: { nodes: [] } });
    });

    // Click on Alpha Project
    await page.locator('text=Alpha Project').click();

    // Verify URL changed to explorer
    await expect(page).toHaveURL(/\/explorer\/1/);
  });
});
