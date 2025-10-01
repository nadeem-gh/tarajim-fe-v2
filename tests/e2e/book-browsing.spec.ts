import { test, expect } from '@playwright/test';

test.describe('Book Browsing and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as reader
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display books catalog', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('h1')).toContainText('Books Catalog');
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount.greaterThan(0);
  });

  test('should filter books by language', async ({ page }) => {
    await page.goto('/books');
    
    // Select language filter
    await page.selectOption('select[name="language"]', 'Arabic');
    await page.click('button[type="submit"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Arabic')).toBeVisible();
  });

  test('should filter books by genre', async ({ page }) => {
    await page.goto('/books');
    
    // Select genre filter
    await page.selectOption('select[name="genre"]', 'Fiction');
    await page.click('button[type="submit"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Fiction')).toBeVisible();
  });

  test('should search books by title', async ({ page }) => {
    await page.goto('/books');
    
    // Search for a book
    await page.fill('input[name="search"]', 'Sample Book');
    await page.click('button[type="submit"]');
    
    // Verify search results
    await expect(page.locator('[data-testid="book-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('text=Sample Book')).toBeVisible();
  });

  test('should view book details', async ({ page }) => {
    await page.goto('/books');
    
    // Click on first book
    await page.click('[data-testid="book-card"]:first-child');
    
    // Verify book detail page
    await expect(page.locator('h1')).toContainText('Book Details');
    await expect(page.locator('[data-testid="book-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-author"]')).toBeVisible();
    await expect(page.locator('[data-testid="book-description"]')).toBeVisible();
  });

  test('should display book statistics', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Verify book stats
    await expect(page.locator('[data-testid="word-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="language-pair"]')).toBeVisible();
  });

  test('should sort books by different criteria', async ({ page }) => {
    await page.goto('/books');
    
    // Sort by newest
    await page.selectOption('select[name="sort"]', 'newest');
    await expect(page.locator('[data-testid="book-card"]:first-child')).toBeVisible();
    
    // Sort by oldest
    await page.selectOption('select[name="sort"]', 'oldest');
    await expect(page.locator('[data-testid="book-card"]:first-child')).toBeVisible();
    
    // Sort by title
    await page.selectOption('select[name="sort"]', 'title');
    await expect(page.locator('[data-testid="book-card"]:first-child')).toBeVisible();
  });
});
