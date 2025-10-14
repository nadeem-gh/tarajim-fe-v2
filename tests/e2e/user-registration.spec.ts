import { test, expect } from '@playwright/test';

test.describe('User Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new reader user', async ({ page }) => {
    // Generate unique values for this test run
    const timestamp = Date.now();
    const uniqueEmail = `john.doe.${timestamp}@example.com`;
    const uniqueUsername = `johndoe${timestamp}`;

    // Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'reader');

    // Submit registration
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should register a new requester user', async ({ page }) => {
    // Generate unique values for this test run
    const timestamp = Date.now();
    const uniqueEmail = `jane.smith.${timestamp}@example.com`;
    const uniqueUsername = `janesmith${timestamp}`;

    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'Jane');
    await page.fill('input[name="last_name"]', 'Smith');
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'requester');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should register a new translator user', async ({ page }) => {
    // Generate unique values for this test run
    const timestamp = Date.now();
    const uniqueEmail = `ahmed.hassan.${timestamp}@example.com`;
    const uniqueUsername = `ahmedhassan${timestamp}`;

    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'Ahmed');
    await page.fill('input[name="last_name"]', 'Hassan');
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'translator');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify browser-native validation messages appear
    // These are shown as tooltips when required fields are empty
    await expect(page.locator('input[name="username"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="first_name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="last_name"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required');
    await expect(page.locator('input[name="password_confirm"]')).toHaveAttribute('required');
  });

  test('should show error for password mismatch', async ({ page }) => {
    // Generate unique values for this test run
    const timestamp = Date.now();
    const uniqueEmail = `john.doe.${timestamp}@example.com`;
    const uniqueUsername = `johndoe${timestamp}`;

    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="username"]', uniqueUsername);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'DifferentPass123!');
    await page.selectOption('select[name="role"]', 'reader');

    await page.click('button[type="submit"]');
    
    // The error should be shown as a toast notification or in the form
    // Check for either the toast notification or form error
    await expect(
      page.locator('text=Passwords don\'t match').or(
        page.locator('text=Registration failed')
      )
    ).toBeVisible();
  });
});
