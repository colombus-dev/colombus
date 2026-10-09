import { test, expect } from '@playwright/test';

/**
 * Tests for the DSL (Domain Specific Language) Editor in the Explorer page.
 * These tests ensure that the Monaco editor loads correctly, allows user input,
 * and correctly handles parsing, execution, saving, and resetting of patterns.
 */
test.describe('DSL Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/project/test-project/details', async (route) => { await route.fulfill({ status: 200, json: "Test Project Details" }); });
    await page.route('**/api/project/test-project/ppm/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/nodes*', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/getAll', async (route) => { await route.fulfill({ status: 200, json: [] }); });
    await page.route('**/api/project/test-project/profile/scores', async (route) => { await route.fulfill({ status: 200, json: {} }); });

    await page.goto('/explorer/test-project');
  });

  /**
   * Main test flow for the DSL Editor:
   * 1. Waits for the Monaco editor to mount and injects a test pattern.
   * 2. Mocks backend responses for parsing and execution.
   * 3. Triggers pattern execution and verifies the API call.
   * 4. Mocks backend responses for saving and verifies the save action.
   * 5. Checks that the reset button appears.
   */
  test('executes, resets, and saves a pattern', async ({ page }) => {
    page.on('request', req => console.log('REQ:', req.method(), req.url()));
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Wait for the Monaco editor and type something valid
    // Use click and type for monaco editor
    const editorContainer = page.locator('.monaco-editor');
    await expect(editorContainer).toBeAttached({ timeout: 10000 });
    await page.evaluate(() => {
      // @ts-ignore
      if (window.monaco) {
        // @ts-ignore
        window.monaco.editor.getModels()[0].setValue('pattern Test = start -> [step="node-1"] -> end');
        // @ts-ignore
        window.monaco.editor.getModelMarkers = () => [];
      }
    });
    await page.waitForTimeout(1000); // Wait for monaco debounce

    // Wait for the buttons to be visible
    const runButton = page.locator('button:has-text("Execute pattern")');
    await expect(runButton).toBeVisible();

    // Mock the parse endpoint
    await page.route('**/api/project/test-project/ppm/parse', async (route) => {
      await route.fulfill({ status: 200, json: { name: 'test-pattern', groups: [['test-node']] } });
    });

    // Mock the execute endpoint
    let executed = false;
    await page.route('**/api/project/test-project/ppm/execute', async (route) => {
      executed = true;
      await route.fulfill({ status: 200, json: [{ profile_name: 'test-profile', results: [] }] });
    });

    // Click execute
    const executePromise = page.waitForResponse('**/api/project/test-project/ppm/execute');
    await runButton.click();

    // Wait for the response
    await executePromise;

    // Test save pattern
    const saveButton = page.locator('button:has-text("Save pattern")');
    await expect(saveButton).toBeVisible();

    let saved = false;
    await page.route('**/api/project/test-project/ppm/save', async (route) => {
      saved = true;
      await route.fulfill({ status: 200, json: "Pattern Saved" });
    });

    const savePromise = page.waitForResponse('**/api/project/test-project/ppm/save');
    await saveButton.click();
    await savePromise;

    // Test reset pattern
    const resetButton = page.locator('button:has-text("Reset pattern")');
    await expect(resetButton).toBeVisible();
  });
});
