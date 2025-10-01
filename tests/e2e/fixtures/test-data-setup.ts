import { test as setup, expect } from '@playwright/test';

setup('setup test data', async ({ page }) => {
  // Navigate to the backend admin to create test data
  await page.goto('http://localhost:8000/admin/');
  
  // Login as admin (you'll need to create this user first)
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('input[type="submit"]');
  
  // Create test users
  await page.goto('http://localhost:8001/admin/accounts/user/add/');
  
  // Create reader user
  await page.fill('input[name="username"]', 'reader');
  await page.fill('input[name="email"]', 'reader@example.com');
  await page.fill('input[name="first_name"]', 'Reader');
  await page.fill('input[name="last_name"]', 'User');
  await page.selectOption('select[name="role"]', 'reader');
  await page.fill('input[name="password1"]', 'password123');
  await page.fill('input[name="password2"]', 'password123');
  await page.click('input[name="_save"]');
  
  // Create requester user
  await page.goto('http://localhost:8001/admin/accounts/user/add/');
  await page.fill('input[name="username"]', 'requester');
  await page.fill('input[name="email"]', 'requester@example.com');
  await page.fill('input[name="first_name"]', 'Requester');
  await page.fill('input[name="last_name"]', 'User');
  await page.selectOption('select[name="role"]', 'requester');
  await page.fill('input[name="password1"]', 'password123');
  await page.fill('input[name="password2"]', 'password123');
  await page.click('input[name="_save"]');
  
  // Create translator user
  await page.goto('http://localhost:8001/admin/accounts/user/add/');
  await page.fill('input[name="username"]', 'translator');
  await page.fill('input[name="email"]', 'translator@example.com');
  await page.fill('input[name="first_name"]', 'Translator');
  await page.fill('input[name="last_name"]', 'User');
  await page.selectOption('select[name="role"]', 'translator');
  await page.fill('input[name="password1"]', 'password123');
  await page.fill('input[name="password2"]', 'password123');
  await page.click('input[name="_save"]');
  
  // Create admin user
  await page.goto('http://localhost:8001/admin/accounts/user/add/');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="first_name"]', 'Admin');
  await page.fill('input[name="last_name"]', 'User');
  await page.selectOption('select[name="role"]', 'reader'); // Admin role
  await page.fill('input[name="password1"]', 'admin123');
  await page.fill('input[name="password2"]', 'admin123');
  await page.check('input[name="is_staff"]');
  await page.check('input[name="is_superuser"]');
  await page.click('input[name="_save"]');
});
