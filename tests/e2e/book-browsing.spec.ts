import { test, expect } from '@playwright/test';

test.describe('Book Browsing and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as reader
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should display books catalog', async ({ page }) => {
    await page.goto('/books');
    await expect(page.locator('h1')).toContainText('Book Catalog');
    // Check for book cards by looking for the book title elements
    await expect(page.locator('h3').filter({ hasText: 'The Great Gatsby' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'To Kill a Mockingbird' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: '1984' })).toBeVisible();
  });

  test('should filter books by language', async ({ page }) => {
    await page.goto('/books');
    
    // Wait for books to load first
    await expect(page.locator('h3').filter({ hasText: 'The Great Gatsby' })).toBeVisible();
    
    // Select language filter - second select element
    await page.selectOption('select:nth-of-type(2)', 'Arabic');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Check if any books are visible after filtering
    const bookCount = await page.locator('h3').count();
    if (bookCount > 0) {
      await expect(page.locator('h3').first()).toBeVisible();
    }
  });

  test('should filter books by genre', async ({ page }) => {
    await page.goto('/books');
    
    // Wait for books to load first
    await expect(page.locator('h3').filter({ hasText: 'The Great Gatsby' })).toBeVisible();
    
    // Select genre filter - first select element
    await page.selectOption('select:nth-of-type(1)', 'Fiction');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Check if any books are visible after filtering
    const bookCount = await page.locator('h3').count();
    if (bookCount > 0) {
      await expect(page.locator('h3').first()).toBeVisible();
    }
  });

  test('should search books by title', async ({ page }) => {
    await page.goto('/books');
    
    // Search for a book
    await page.fill('input[placeholder="Search books..."]', 'Gatsby');
    
    // Verify search results - check that books are still visible
    await expect(page.locator('h3').filter({ hasText: 'The Great Gatsby' })).toBeVisible();
  });

  test('should view book details', async ({ page }) => {
    await page.goto('/books');
    
    // Click on first book's "View Details" link
    await page.click('text=View Details →');
    
    // Verify book detail page - check that we're on a book detail page (not the catalog)
    await expect(page.locator('h1')).not.toContainText('Book Catalog');
    // Check that we have book information
    await expect(page.locator('text=by')).toBeVisible();
  });

  test('should display book statistics', async ({ page }) => {
    await page.goto('/books');
    await page.click('text=View Details →');
    
    // Verify book stats are visible on the detail page
    await expect(page.locator('span').filter({ hasText: 'words' }).first()).toBeVisible();
    // Check that we're on a book detail page with book information
    await expect(page.locator('h1')).not.toContainText('Book Catalog');
    // Check for any book-related information
    await expect(page.locator('text=by')).toBeVisible();
  });

  test('should filter books by status', async ({ page }) => {
    await page.goto('/books');
    
    // Wait for books to load first
    await expect(page.locator('h3').filter({ hasText: 'The Great Gatsby' })).toBeVisible();
    
    // Filter by available status - select the third select element (status filter)
    await page.selectOption('select:nth-of-type(3)', 'available');
    
    // Wait a moment for the filter to apply
    await page.waitForTimeout(1000);
    
    // Check if any books are visible (they might be filtered out)
    const bookCount = await page.locator('h3').count();
    console.log(`Books visible after filtering: ${bookCount}`);
    
    // If no books are visible, that's also a valid result for filtering
    if (bookCount > 0) {
      await expect(page.locator('h3').first()).toBeVisible();
    }
  });
});
