import { test, expect } from '@playwright/test';

test.describe('Test Setup Verification', () => {
  test('should be able to login with test users', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    
    // Try to login with reader user
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and check if login was successful
    await page.waitForURL('/');
    
    // Check if user is logged in (look for logout button or user info)
    const logoutButton = page.locator('text=Logout');
    await expect(logoutButton).toBeVisible({ timeout: 10000 });
  });

  test('should be able to access books page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Go to books page
    await page.goto('/books');
    
    // Check if books are loaded
    const bookCards = page.locator('[data-testid="book-card"]');
    await expect(bookCards).toHaveCount.greaterThan(0, { timeout: 10000 });
  });

  test('should be able to create translation request as requester', async ({ page }) => {
    // Login as requester
    await page.goto('/login');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Go to books page
    await page.goto('/books');
    
    // Click on first book
    const firstBook = page.locator('[data-testid="book-card"]').first();
    await firstBook.click();
    
    // Check if "Send Request" button is visible (for requester)
    const sendRequestButton = page.locator('text=Send Request');
    await expect(sendRequestButton).toBeVisible({ timeout: 10000 });
  });
});
