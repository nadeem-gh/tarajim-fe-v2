import { test, expect } from '@playwright/test';

test.describe('Translation Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as requester
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should create translation request from book detail page', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Click Send Request button
    await page.click('text=Send Request');
    
    // Fill translation request form
    await page.fill('input[name="title"]', 'Translation Request for Sample Book');
    await page.fill('textarea[name="description"]', 'I need this book translated to Arabic with high quality standards.');
    await page.selectOption('select[name="target_language"]', 'Arabic');
    await page.fill('input[name="budget"]', '500');
    await page.fill('input[name="deadline"]', '2024-12-31');
    
    // Submit request
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Translation request created successfully')).toBeVisible();
  });

  test('should view translation requests dashboard', async ({ page }) => {
    await page.goto('/translations/requests');
    
    // Verify requests list
    await expect(page.locator('h1')).toContainText('Translation Requests');
    await expect(page.locator('[data-testid="request-card"]')).toHaveCount.greaterThan(0);
  });

  test('should view translation request details', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    
    // Verify request details
    await expect(page.locator('[data-testid="request-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-budget"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-deadline"]')).toBeVisible();
    await expect(page.locator('[data-testid="request-status"]')).toBeVisible();
  });

  test('should update translation request', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    
    // Click edit button
    await page.click('text=Edit Request');
    
    // Update request
    await page.fill('input[name="title"]', 'Updated Translation Request');
    await page.fill('textarea[name="description"]', 'Updated description with more details.');
    await page.fill('input[name="budget"]', '750');
    
    // Save changes
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Request updated successfully')).toBeVisible();
  });

  test('should cancel translation request', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    
    // Click cancel button
    await page.click('text=Cancel Request');
    
    // Confirm cancellation
    await page.click('text=Yes, Cancel');
    
    // Verify cancellation
    await expect(page.locator('text=Request cancelled successfully')).toBeVisible();
  });

  test('should view applications for translation request', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    
    // Navigate to applications
    await page.click('text=View Applications');
    
    // Verify applications list
    await expect(page.locator('h2')).toContainText('Translation Applications');
    await expect(page.locator('[data-testid="application-card"]')).toHaveCount.greaterThan(0);
  });

  test('should approve translation application', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    await page.click('text=View Applications');
    await page.click('[data-testid="application-card"]:first-child');
    
    // Approve application
    await page.click('text=Approve Application');
    
    // Verify approval
    await expect(page.locator('text=Application approved successfully')).toBeVisible();
  });

  test('should reject translation application', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    await page.click('text=View Applications');
    await page.click('[data-testid="application-card"]:first-child');
    
    // Reject application
    await page.click('text=Reject Application');
    
    // Fill rejection reason
    await page.fill('textarea[name="rejection_reason"]', 'Application does not meet requirements.');
    await page.click('button[type="submit"]');
    
    // Verify rejection
    await expect(page.locator('text=Application rejected successfully')).toBeVisible();
  });
});
