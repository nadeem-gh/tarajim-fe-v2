import { test, expect } from '@playwright/test';

test.describe('Basic Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Check if body content exists
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should have some content on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Just check that the page has some content
    const content = await page.textContent('body');
    expect(content.length).toBeGreaterThan(0);
  });
});
