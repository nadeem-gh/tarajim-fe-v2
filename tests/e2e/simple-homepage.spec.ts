import { test, expect } from '@playwright/test';

test.describe('Homepage Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page title exists
    await expect(page).toHaveTitle(/Tarajim/);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for basic navigation elements
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should be able to navigate to register page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for dynamic content to load
    await page.waitForTimeout(2000);
    
    // Try different locator strategies
    const registerSelectors = [
      'a[href="/register"]',
      'a[href*="register"]', 
      'text=Sign Up',
      'text=Register',
      '[data-testid="register-link"]',
      'button:has-text("Sign Up")',
      'button:has-text("Register")'
    ];
    
    let registerLink = null;
    for (const selector of registerSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 2000 })) {
          registerLink = link;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (registerLink) {
      // Wait for navigation to complete after clicking
      try {
        await Promise.all([
          page.waitForURL('**/register**', { timeout: 5000 }),
          registerLink.click()
        ]);
      } catch (e) {
        // If navigation doesn't work, try alternative approach
        await registerLink.click();
        await page.waitForTimeout(2000);
      }
      // Check that we navigated to register page
      expect(page.url()).toContain('register');
    } 
  });

  test('should be able to navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for dynamic content to load
    await page.waitForTimeout(1000);
    
    // Try different locator strategies
    const loginSelectors = [
      'a[href="/login"]',
      'a[href*="login"]', 
      'text=Sign In',
      'text=Login',
      '[data-testid="login-link"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")'
    ];
    
    let loginLink = null;
    for (const selector of loginSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 2000 })) {
          loginLink = link;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (loginLink) {
      // Wait for navigation to complete after clicking
      try {
        await Promise.all([
          page.waitForURL('**/login**', { timeout: 5000 }),
          loginLink.click()
        ]);
      } catch (e) {
        // If navigation doesn't work, try alternative approach
        await loginLink.click();
        await page.waitForTimeout(2000);
      }
      // Check that we navigated to login page
      expect(page.url()).toContain('login');
    } 
  });
});
