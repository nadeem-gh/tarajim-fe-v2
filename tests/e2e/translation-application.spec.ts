import { test, expect } from '@playwright/test';

test.describe('Translation Application Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as translator
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should submit translation application from book detail page', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Click Submit Application button
    await page.click('text=Submit Application');
    
    // Fill application form
    await page.fill('textarea[name="message"]', 'I am an experienced translator with 5+ years of experience in Arabic-English translation.');
    await page.fill('input[name="proposed_rate"]', '25');
    await page.fill('input[name="estimated_completion_time"]', '30');
    
    // Submit application
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });

  test('should view translation applications dashboard', async ({ page }) => {
    await page.goto('/translations/applications');
    
    // Verify applications list
    await expect(page.locator('h1')).toContainText('My Translation Applications');
    await expect(page.locator('[data-testid="application-card"]')).toHaveCount.greaterThan(0);
  });

  test('should view translation application details', async ({ page }) => {
    await page.goto('/translations/applications');
    await page.click('[data-testid="application-card"]:first-child');
    
    // Verify application details
    await expect(page.locator('[data-testid="application-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-completion-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="application-status"]')).toBeVisible();
  });

  test('should update translation application', async ({ page }) => {
    await page.goto('/translations/applications');
    await page.click('[data-testid="application-card"]:first-child');
    
    // Click edit button
    await page.click('text=Edit Application');
    
    // Update application
    await page.fill('textarea[name="message"]', 'Updated application with additional experience details.');
    await page.fill('input[name="proposed_rate"]', '30');
    
    // Save changes
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Application updated successfully')).toBeVisible();
  });

  test('should withdraw translation application', async ({ page }) => {
    await page.goto('/translations/applications');
    await page.click('[data-testid="application-card"]:first-child');
    
    // Click withdraw button
    await page.click('text=Withdraw Application');
    
    // Confirm withdrawal
    await page.click('text=Yes, Withdraw');
    
    // Verify withdrawal
    await expect(page.locator('text=Application withdrawn successfully')).toBeVisible();
  });

  test('should view available translation requests', async ({ page }) => {
    await page.goto('/translations/requests');
    
    // Verify requests list
    await expect(page.locator('h1')).toContainText('Available Translation Requests');
    await expect(page.locator('[data-testid="request-card"]')).toHaveCount.greaterThan(0);
  });

  test('should apply to translation request', async ({ page }) => {
    await page.goto('/translations/requests');
    await page.click('[data-testid="request-card"]:first-child');
    
    // Click apply button
    await page.click('text=Apply to Request');
    
    // Fill application form
    await page.fill('textarea[name="message"]', 'I am interested in this translation project.');
    await page.fill('input[name="proposed_rate"]', '25');
    await page.fill('input[name="estimated_completion_time"]', '30');
    
    // Submit application
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  });

  test('should view contract after application approval', async ({ page }) => {
    await page.goto('/translations/contracts');
    
    // Verify contracts list
    await expect(page.locator('h1')).toContainText('Translation Contracts');
    await expect(page.locator('[data-testid="contract-card"]')).toHaveCount.greaterThan(0);
  });

  test('should sign translation contract', async ({ page }) => {
    await page.goto('/translations/contracts');
    await page.click('[data-testid="contract-card"]:first-child');
    
    // Click sign contract button
    await page.click('text=Sign Contract');
    
    // Fill signature details
    await page.fill('input[name="signature"]', 'Ahmed Hassan');
    await page.check('input[name="terms_accepted"]');
    
    // Submit signature
    await page.click('button[type="submit"]');
    
    // Verify signature
    await expect(page.locator('text=Contract signed successfully')).toBeVisible();
  });
});
