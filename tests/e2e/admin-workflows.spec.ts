import { test, expect } from '@playwright/test';

test.describe('Admin Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as admin
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('should view admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    // Verify admin dashboard
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Verify users list
    await expect(page.locator('h1')).toContainText('User Management');
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount.greaterThan(0);
    
    // View user details
    await page.click('[data-testid="user-row"]:first-child');
    await expect(page.locator('[data-testid="user-details"]')).toBeVisible();
  });

  test('should approve user registration', async ({ page }) => {
    await page.goto('/admin/users');
    await page.click('[data-testid="user-row"]:first-child');
    
    // Click approve button
    await page.click('text=Approve User');
    
    // Verify approval
    await expect(page.locator('text=User approved successfully')).toBeVisible();
  });

  test('should suspend user account', async ({ page }) => {
    await page.goto('/admin/users');
    await page.click('[data-testid="user-row"]:first-child');
    
    // Click suspend button
    await page.click('text=Suspend User');
    
    // Fill suspension reason
    await page.fill('textarea[name="suspension_reason"]', 'Violation of terms of service');
    await page.click('button[type="submit"]');
    
    // Verify suspension
    await expect(page.locator('text=User suspended successfully')).toBeVisible();
  });

  test('should manage translation requests', async ({ page }) => {
    await page.goto('/admin/translation-requests');
    
    // Verify requests list
    await expect(page.locator('h1')).toContainText('Translation Requests Management');
    await expect(page.locator('[data-testid="request-row"]')).toHaveCount.greaterThan(0);
  });

  test('should approve translation request', async ({ page }) => {
    await page.goto('/admin/translation-requests');
    await page.click('[data-testid="request-row"]:first-child');
    
    // Click approve button
    await page.click('text=Approve Request');
    
    // Verify approval
    await expect(page.locator('text=Translation request approved successfully')).toBeVisible();
  });

  test('should reject translation request', async ({ page }) => {
    await page.goto('/admin/translation-requests');
    await page.click('[data-testid="request-row"]:first-child');
    
    // Click reject button
    await page.click('text=Reject Request');
    
    // Fill rejection reason
    await page.fill('textarea[name="rejection_reason"]', 'Request does not meet quality standards');
    await page.click('button[type="submit"]');
    
    // Verify rejection
    await expect(page.locator('text=Translation request rejected successfully')).toBeVisible();
  });

  test('should manage translation applications', async ({ page }) => {
    await page.goto('/admin/translation-applications');
    
    // Verify applications list
    await expect(page.locator('h1')).toContainText('Translation Applications Management');
    await expect(page.locator('[data-testid="application-row"]')).toHaveCount.greaterThan(0);
  });

  test('should approve translation application', async ({ page }) => {
    await page.goto('/admin/translation-applications');
    await page.click('[data-testid="application-row"]:first-child');
    
    // Click approve button
    await page.click('text=Approve Application');
    
    // Verify approval
    await expect(page.locator('text=Translation application approved successfully')).toBeVisible();
  });

  test('should manage contracts', async ({ page }) => {
    await page.goto('/admin/contracts');
    
    // Verify contracts list
    await expect(page.locator('h1')).toContainText('Contracts Management');
    await expect(page.locator('[data-testid="contract-row"]')).toHaveCount.greaterThan(0);
  });

  test('should view contract details', async ({ page }) => {
    await page.goto('/admin/contracts');
    await page.click('[data-testid="contract-row"]:first-child');
    
    // Verify contract details
    await expect(page.locator('[data-testid="contract-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="contract-parties"]')).toBeVisible();
    await expect(page.locator('[data-testid="contract-terms"]')).toBeVisible();
  });

  test('should manage payments', async ({ page }) => {
    await page.goto('/admin/payments');
    
    // Verify payments list
    await expect(page.locator('h1')).toContainText('Payments Management');
    await expect(page.locator('[data-testid="payment-row"]')).toHaveCount.greaterThan(0);
  });

  test('should view payment details', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.click('[data-testid="payment-row"]:first-child');
    
    // Verify payment details
    await expect(page.locator('[data-testid="payment-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
  });

  test('should process refund', async ({ page }) => {
    await page.goto('/admin/payments');
    await page.click('[data-testid="payment-row"]:first-child');
    
    // Click process refund
    await page.click('text=Process Refund');
    
    // Fill refund details
    await page.fill('input[name="refund_amount"]', '100');
    await page.fill('textarea[name="refund_reason"]', 'Customer requested refund');
    await page.click('button[type="submit"]');
    
    // Verify refund
    await expect(page.locator('text=Refund processed successfully')).toBeVisible();
  });

  test('should view system analytics', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Verify analytics dashboard
    await expect(page.locator('h1')).toContainText('System Analytics');
    await expect(page.locator('[data-testid="user-stats-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="translation-stats-chart"]')).toBeVisible();
  });

  test('should export system data', async ({ page }) => {
    await page.goto('/admin/analytics');
    
    // Click export button
    await page.click('text=Export Data');
    
    // Select export format
    await page.selectOption('select[name="export_format"]', 'csv');
    await page.selectOption('select[name="data_type"]', 'users');
    
    // Download export
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[type="submit"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should manage system settings', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // Verify settings page
    await expect(page.locator('h1')).toContainText('System Settings');
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
  });

  test('should update system settings', async ({ page }) => {
    await page.goto('/admin/settings');
    
    // Update settings
    await page.fill('input[name="site_name"]', 'Tarajim Platform');
    await page.fill('input[name="contact_email"]', 'admin@tarajim.com');
    await page.selectOption('select[name="default_language"]', 'en');
    
    // Save settings
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });
});
