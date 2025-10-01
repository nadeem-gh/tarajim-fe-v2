import { test, expect } from '@playwright/test';

test.describe('Payment and Escrow Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as requester
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should create escrow account for translation project', async ({ page }) => {
    await page.goto('/payments/escrow');
    
    // Create new escrow account
    await page.click('text=Create Escrow Account');
    
    // Fill escrow form
    await page.fill('input[name="project_name"]', 'Sample Book Translation');
    await page.fill('input[name="amount"]', '500');
    await page.selectOption('select[name="currency"]', 'USD');
    await page.fill('textarea[name="description"]', 'Escrow for Arabic translation of Sample Book');
    
    // Submit escrow creation
    await page.click('button[type="submit"]');
    
    // Verify escrow creation
    await expect(page.locator('text=Escrow account created successfully')).toBeVisible();
  });

  test('should fund escrow account', async ({ page }) => {
    await page.goto('/payments/escrow');
    await page.click('[data-testid="escrow-card"]:first-child');
    
    // Click fund button
    await page.click('text=Fund Escrow');
    
    // Select payment method
    await page.selectOption('select[name="payment_method"]', 'credit_card');
    
    // Fill payment details
    await page.fill('input[name="card_number"]', '4242424242424242');
    await page.fill('input[name="expiry_date"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    await page.fill('input[name="cardholder_name"]', 'John Doe');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Verify funding
    await expect(page.locator('text=Escrow funded successfully')).toBeVisible();
  });

  test('should view escrow account details', async ({ page }) => {
    await page.goto('/payments/escrow');
    await page.click('[data-testid="escrow-card"]:first-child');
    
    // Verify escrow details
    await expect(page.locator('[data-testid="escrow-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="escrow-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="escrow-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="escrow-milestones"]')).toBeVisible();
  });

  test('should create payment milestones', async ({ page }) => {
    await page.goto('/payments/escrow');
    await page.click('[data-testid="escrow-card"]:first-child');
    
    // Click create milestone
    await page.click('text=Create Milestone');
    
    // Fill milestone form
    await page.fill('input[name="milestone_name"]', 'Translation Phase 1');
    await page.fill('input[name="amount"]', '150');
    await page.fill('textarea[name="description"]', 'Complete translation of first 3 chapters');
    await page.fill('input[name="due_date"]', '2024-12-15');
    
    // Submit milestone
    await page.click('button[type="submit"]');
    
    // Verify milestone creation
    await expect(page.locator('text=Milestone created successfully')).toBeVisible();
  });

  test('should release milestone payment', async ({ page }) => {
    await page.goto('/payments/escrow');
    await page.click('[data-testid="escrow-card"]:first-child');
    await page.click('[data-testid="milestone-card"]:first-child');
    
    // Click release payment
    await page.click('text=Release Payment');
    
    // Confirm release
    await page.click('text=Yes, Release Payment');
    
    // Verify release
    await expect(page.locator('text=Payment released successfully')).toBeVisible();
  });

  test('should view payment history', async ({ page }) => {
    await page.goto('/payments/history');
    
    // Verify payment history
    await expect(page.locator('h1')).toContainText('Payment History');
    await expect(page.locator('[data-testid="payment-record"]')).toHaveCount.greaterThan(0);
  });

  test('should process refund', async ({ page }) => {
    await page.goto('/payments/escrow');
    await page.click('[data-testid="escrow-card"]:first-child');
    
    // Click refund button
    await page.click('text=Process Refund');
    
    // Fill refund form
    await page.fill('input[name="refund_amount"]', '100');
    await page.fill('textarea[name="refund_reason"]', 'Project cancelled by translator');
    
    // Submit refund
    await page.click('button[type="submit"]');
    
    // Verify refund
    await expect(page.locator('text=Refund processed successfully')).toBeVisible();
  });

  test('should view sales records', async ({ page }) => {
    await page.goto('/marketplace/sales');
    
    // Verify sales records
    await expect(page.locator('h1')).toContainText('Sales Records');
    await expect(page.locator('[data-testid="sales-record"]')).toHaveCount.greaterThan(0);
  });

  test('should view sales analytics', async ({ page }) => {
    await page.goto('/marketplace/analytics');
    
    // Verify analytics dashboard
    await expect(page.locator('h1')).toContainText('Sales Analytics');
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
  });
});
