import { test, expect } from '@playwright/test';

test.describe('Permission-Based Access Control Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Reader Role Permissions', async ({ page }) => {
    await test.step('1. Test reader can view books but not create requests', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'reader@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Reader should see book details
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Author')).toBeVisible();
      
      // Reader should NOT see workflow actions
      await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
      await expect(page.locator('text=Submit Application')).not.toBeVisible();
      await expect(page.locator('text=Translation Workflow')).not.toBeVisible();
    });

    await test.step('2. Test reader cannot access workflow endpoints', async () => {
      // Try to access workflow directly
      await page.goto('/books/1/workflow');
      
      // Should be redirected or show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    await test.step('3. Test reader cannot access translation management', async () => {
      // Try to access translations page
      await page.goto('/translations');
      
      // Should be redirected or show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });
  });

  test('Requester Role Permissions', async ({ page }) => {
    await test.step('1. Test requester can create translation requests', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Requester should see request creation
      await expect(page.locator('text=Create Translation Request')).toBeVisible();
      await expect(page.locator('text=Submit Application')).not.toBeVisible();
    });

    await test.step('2. Test requester can manage their requests', async () => {
      // Create request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Requester Permission Test Request');
      await page.fill('textarea[name="description"]', 'Testing requester permissions.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Requester should see their request
      await expect(page.locator('text=Open for Applications')).toBeVisible();
    });

    await test.step('3. Test requester can accept/reject applications', async () => {
      // Submit application from translator
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'Requester permission test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Login as requester and accept application
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Requester should see accept/reject buttons
      await expect(page.locator('text=Accept Application')).toBeVisible();
      await expect(page.locator('text=Reject Application')).toBeVisible();
      
      await page.click('text=Accept Application');
      await expect(page.locator('text=Application accepted successfully')).toBeVisible();
    });

    await test.step('4. Test requester can sign contracts', async () => {
      // Requester should see contract signing
      await expect(page.locator('text=Sign Contract')).toBeVisible();
      
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });

    await test.step('5. Test requester can create and manage milestones', async () => {
      // Sign contract as translator first
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();

      // Login as requester and create milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Requester should see milestone creation
      await expect(page.locator('text=Create Milestone')).toBeVisible();
      
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Requester Permission Test Milestone');
      await page.fill('textarea[name="description"]', 'Testing requester milestone permissions.');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
    });

    await test.step('6. Test requester can approve milestones', async () => {
      // Assign milestone to translator
      await page.click('text=Assign Milestone');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

      // Complete milestone as translator
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Start Milestone');
      await expect(page.locator('text=Milestone started successfully')).toBeVisible();
      
      await page.click('text=Submit Milestone');
      await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();

      // Login as requester and approve milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Requester should see approve button
      await expect(page.locator('text=Approve Milestone')).toBeVisible();
      
      await page.click('text=Approve Milestone');
      await expect(page.locator('text=Milestone approved successfully')).toBeVisible();
    });
  });

  test('Translator Role Permissions', async ({ page }) => {
    await test.step('1. Test translator can submit applications', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Translator should see application submission
      await expect(page.locator('text=Submit Application')).toBeVisible();
      await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
    });

    await test.step('2. Test translator can sign contracts', async () => {
      // Create request and application first
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Translator Permission Test Request');
      await page.fill('textarea[name="description"]', 'Testing translator permissions.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Submit application
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'Translator permission test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Accept application
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Accept Application');
      await expect(page.locator('text=Application accepted successfully')).toBeVisible();

      // Sign contract as requester
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();

      // Login as translator and sign contract
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Translator should see contract signing
      await expect(page.locator('text=Sign Contract')).toBeVisible();
      
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });

    await test.step('3. Test translator can work on assigned milestones', async () => {
      // Create milestone as requester
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Translator Permission Test Milestone');
      await page.fill('textarea[name="description"]', 'Testing translator milestone permissions.');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();

      // Assign milestone to translator
      await page.click('text=Assign Milestone');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

      // Login as translator and work on milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Translator should see milestone work actions
      await expect(page.locator('text=Start Milestone')).toBeVisible();
      
      await page.click('text=Start Milestone');
      await expect(page.locator('text=Milestone started successfully')).toBeVisible();
      
      await page.click('text=Submit Milestone');
      await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();
    });

    await test.step('4. Test translator cannot create requests', async () => {
      // Translator should not see request creation
      await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
    });

    await test.step('5. Test translator cannot approve milestones', async () => {
      // Translator should not see approve button
      await expect(page.locator('text=Approve Milestone')).not.toBeVisible();
    });
  });

  test('Cross-User Access Control', async ({ page }) => {
    await test.step('1. Test users cannot access other users\' resources', async () => {
      // Create request as requester
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Cross-User Access Test Request');
      await page.fill('textarea[name="description"]', 'Testing cross-user access control.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Login as different requester
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester2@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Different requester should not see the request
      await expect(page.locator('text=Create Translation Request')).toBeVisible();
      await expect(page.locator('text=Open for Applications')).not.toBeVisible();
    });

    await test.step('2. Test users cannot modify other users\' resources', async () => {
      // Try to access other user's request directly
      await page.goto('/books/1/requests/1');
      
      // Should be redirected or show access denied
      await expect(page.locator('text=Access Denied')).toBeVisible();
    });
  });

  test('Role-Based UI Elements', async ({ page }) => {
    await test.step('1. Test UI elements are hidden based on role', async () => {
      // Test reader UI
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'reader@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Reader should not see workflow elements
      await expect(page.locator('[data-testid="workflow-panel"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="request-actions"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="application-actions"]')).not.toBeVisible();
    });

    await test.step('2. Test UI elements are shown based on role', async () => {
      // Test requester UI
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Requester should see workflow elements
      await expect(page.locator('[data-testid="workflow-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="request-actions"]')).toBeVisible();
    });
  });
});
