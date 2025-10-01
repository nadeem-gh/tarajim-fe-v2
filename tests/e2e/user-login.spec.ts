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

    // Verify successful login
    await expect(page.locator('text=Welcome, Reader')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should login as requester user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome, Requester')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should login as translator user', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Welcome, Translator')).toBeVisible();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Login failed')).toBeVisible({ timeout: 1000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('text=Logout');
    await expect(page.locator('text=Login')).toBeVisible({ timeout: 2000 });
  });
});
