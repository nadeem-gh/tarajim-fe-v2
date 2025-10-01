import { test, expect } from '@playwright/test';

test.describe('User Registration Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new reader user', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="username"]', 'johndoe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'reader');

    // Submit registration
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should register a new requester user', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'Jane');
    await page.fill('input[name="last_name"]', 'Smith');
    await page.fill('input[name="username"]', 'janesmith');
    await page.fill('input[name="email"]', 'jane.smith@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'SecurePass123!');
    await page.selectOption('select[name="role"]', 'requester');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Registration successful')).toBeVisible();
  });

  test('should register a new translator user', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'Ahmed');
    await page.fill('input[name="last_name"]', 'Hassan');
    await page.fill('input[name="username"]', 'ahmedhassan');
    await page.fill('input[name="email"]', 'ahmed.hassan@example.com');
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

    // Verify validation errors
    await expect(page.locator('text=This field is required')).toBeVisible();
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="username"]', 'johndoe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="password_confirm"]', 'DifferentPass123!');
    await page.selectOption('select[name="role"]', 'reader');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
