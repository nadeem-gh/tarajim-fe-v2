import { test, expect } from '@playwright/test';

test.describe('User Login Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should login as reader user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and dashboard to load
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    
    // Wait for any loading states to complete
    await page.waitForTimeout(500);
    
    // Verify successful login
    await expect(page.locator('text=Welcome, Reader')).toBeVisible({ timeout: 3000 });
  });

  test('should login as requester user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and dashboard to load
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    
    // Wait for any loading states to complete
    await page.waitForTimeout(500);
    
    // Verify successful login
    await expect(page.locator('text=Welcome, Requester')).toBeVisible({ timeout: 3000 });
  });

  test('should login as translator user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and dashboard to load
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    
    // Wait for any loading states to complete
    await page.waitForTimeout(500);
    
    // Verify successful login
    await expect(page.locator('text=Welcome, Translator')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message to appear
    await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 3000 });
    
    // Ensure we're still on the login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);
    
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for login to complete and dashboard to load
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
    
    // Wait for any success messages or loading states to disappear
    await page.waitForTimeout(1000);
    
    // Wait for logout link to be visible and clickable
    await expect(page.locator('text=Logout')).toBeVisible({ timeout: 3000 });
    
    // Click logout
    await page.click('text=Logout');
    
    // Wait for logout to complete and redirect to home page
    await expect(page).toHaveURL('/', { timeout: 5000 });
    
    // Verify login link is visible (user is logged out)
    await expect(page.locator('text=Logged out successfully')).toBeVisible({ timeout: 3000 });
  });
});
