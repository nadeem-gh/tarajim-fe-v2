import { test, expect } from '@playwright/test';

test.describe('Translation Workflow - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Complete Single Translator Workflow', async ({ page }) => {
    // Test 1: Request Creation and Publishing
    await test.step('1. Login as requester and create translation request', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Verify workflow UI is below book details
      await expect(page.locator('text=Translation Workflow')).toBeVisible();
      const workflowSection = page.locator('text=Translation Workflow').locator('..');
      const bookDetails = page.locator('text=Description').locator('..');
      await expect(workflowSection).toBeBelow(bookDetails);

      // Click Create Translation Request button
      await page.click('text=Create Translation Request');
      
      // Fill translation request form
      await page.fill('input[name="title"]', 'Complete Workflow Test Request');
      await page.fill('textarea[name="description"]', 'Testing complete translation workflow with FSM transitions.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      
      // Submit request
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();
    });

    await test.step('2. Verify request is in "Open for Applications" state', async () => {
      await expect(page.locator('text=Open for Applications')).toBeVisible();
      await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
    });

    await test.step('3. Login as translator and submit application', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Click Submit Application button
      await page.click('text=Submit Application');
      
      // Fill application form
      await page.fill('textarea[name="cover_letter"]', 'I am an experienced translator with 5+ years of experience.');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      
      // Submit application
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();
    });

    await test.step('4. Login as requester and accept application', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Verify application appears
      await expect(page.locator('text=Pending Review')).toBeVisible();
      
      // Accept application
      await page.click('text=Accept Application');
      await expect(page.locator('text=Application accepted successfully')).toBeVisible();
    });

    await test.step('5. Verify request transitions to "Reviewing Applications" state', async () => {
      await expect(page.locator('text=Reviewing Applications')).toBeVisible();
      await expect(page.locator('text=Contract Created')).toBeVisible();
    });

    await test.step('6. Sign contract as requester', async () => {
      // Click Sign Contract button
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });

    await test.step('7. Login as translator and sign contract', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Sign contract
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });

    await test.step('8. Verify contract is fully signed and request transitions to "Contracted"', async () => {
      await expect(page.locator('text=Contracted')).toBeVisible();
      await expect(page.locator('text=Contract Signed')).toBeVisible();
    });

    await test.step('9. Create milestone as requester', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create milestone
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Chapter 1 Translation');
      await page.fill('textarea[name="description"]', 'Translate first chapter');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
    });

    await test.step('10. Assign milestone to translator', async () => {
      // Assign milestone
      await page.click('text=Assign Milestone');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();
    });

    await test.step('11. Login as translator and start milestone work', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Start milestone
      await page.click('text=Start Milestone');
      await expect(page.locator('text=Milestone started successfully')).toBeVisible();
    });

    await test.step('12. Submit milestone work', async () => {
      // Submit milestone
      await page.click('text=Submit Milestone');
      await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();
    });

    await test.step('13. Login as requester and approve milestone', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Approve milestone
      await page.click('text=Approve Milestone');
      await expect(page.locator('text=Milestone approved successfully')).toBeVisible();
    });

    await test.step('14. Mark milestone as paid', async () => {
      // Mark as paid
      await page.click('text=Mark as Paid');
      await expect(page.locator('text=Milestone marked as paid successfully')).toBeVisible();
    });

    await test.step('15. Complete the project', async () => {
      // Complete project
      await page.click('text=Complete Project');
      await expect(page.locator('text=Project completed successfully')).toBeVisible();
    });

    await test.step('16. Verify final state', async () => {
      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=All milestones completed')).toBeVisible();
    });
  });

  test('Multiple Translators Parallel Workflow', async ({ page }) => {
    await test.step('1. Create translation request as requester', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Parallel Workflow Test Request');
      await page.fill('textarea[name="description"]', 'Testing parallel translation workflow.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '2000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();
    });

    await test.step('2. Submit applications from multiple translators', async () => {
      // First translator
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'Translator 1 application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Second translator
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator2@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'Translator 2 application');
      await page.fill('input[name="proposed_rate"]', '30');
      await page.fill('input[name="estimated_completion_time"]', '25');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();
    });

    await test.step('3. Accept multiple applications as requester', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Accept multiple applications
      await page.click('text=Accept Multiple Applications');
      await page.check('input[type="checkbox"][value="translator1"]');
      await page.check('input[type="checkbox"][value="translator2"]');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Applications accepted successfully')).toBeVisible();
    });

    await test.step('4. Verify multiple contracts created', async () => {
      await expect(page.locator('text=2 contracts created')).toBeVisible();
      await expect(page.locator('[data-testid="contract-card"]')).toHaveCount(2);
    });

    await test.step('5. Sign contracts in parallel', async () => {
      // Sign first contract
      await page.click('[data-testid="contract-card"]:first-child [data-testid="sign-contract"]');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();

      // Sign second contract
      await page.click('[data-testid="contract-card"]:nth-child(2) [data-testid="sign-contract"]');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });

    await test.step('6. Create milestones for both contracts', async () => {
      // Create milestone for first contract
      await page.click('[data-testid="contract-card"]:first-child [data-testid="create-milestone"]');
      await page.fill('input[name="title"]', 'Milestone 1');
      await page.fill('textarea[name="description"]', 'First milestone');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();

      // Create milestone for second contract
      await page.click('[data-testid="contract-card"]:nth-child(2) [data-testid="create-milestone"]');
      await page.fill('input[name="title"]', 'Milestone 2');
      await page.fill('textarea[name="description"]', 'Second milestone');
      await page.fill('input[name="amount"]', '600');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
    });

    await test.step('7. Complete milestones in parallel', async () => {
      // Complete first milestone
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="assign-milestone"]');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

      // Complete second milestone
      await page.click('[data-testid="milestone-card"]:nth-child(2) [data-testid="assign-milestone"]');
      await page.selectOption('select[name="translator_id"]', 'translator2@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();
    });
  });

  test('Sequential Milestone Enforcement', async ({ page }) => {
    await test.step('1. Setup: Create request and contract', async () => {
      // Login as requester
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Sequential Test Request');
      await page.fill('textarea[name="description"]', 'Testing sequential milestone enforcement.');
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
      await page.fill('textarea[name="cover_letter"]', 'Sequential test application');
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

      // Sign contracts
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();

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
    });

    await test.step('2. Create multiple milestones', async () => {
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create first milestone
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Milestone 1');
      await page.fill('textarea[name="description"]', 'First milestone');
      await page.fill('input[name="amount"]', '300');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();

      // Create second milestone
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Milestone 2');
      await page.fill('textarea[name="description"]', 'Second milestone');
      await page.fill('input[name="amount"]', '400');
      await page.fill('input[name="due_date"]', '2024-02-15');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();

      // Create third milestone
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Milestone 3');
      await page.fill('textarea[name="description"]', 'Third milestone');
      await page.fill('input[name="amount"]', '300');
      await page.fill('input[name="due_date"]', '2024-03-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
    });

    await test.step('3. Assign and complete first milestone', async () => {
      // Assign first milestone
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="assign-milestone"]');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

      // Login as translator and complete first milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Start first milestone
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="start-milestone"]');
      await expect(page.locator('text=Milestone started successfully')).toBeVisible();

      // Submit first milestone
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="submit-milestone"]');
      await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();

      // Login as requester and approve first milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Approve first milestone
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="approve-milestone"]');
      await expect(page.locator('text=Milestone approved successfully')).toBeVisible();

      // Mark first milestone as paid
      await page.click('[data-testid="milestone-card"]:first-child [data-testid="mark-paid"]');
      await expect(page.locator('text=Milestone marked as paid successfully')).toBeVisible();
    });

    await test.step('4. Verify second milestone can now be started', async () => {
      // Login as translator
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Assign second milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('[data-testid="milestone-card"]:nth-child(2) [data-testid="assign-milestone"]');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

      // Login as translator and start second milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Start second milestone (should work now)
      await page.click('[data-testid="milestone-card"]:nth-child(2) [data-testid="start-milestone"]');
      await expect(page.locator('text=Milestone started successfully')).toBeVisible();
    });

    await test.step('5. Verify third milestone cannot be started yet', async () => {
      // Try to start third milestone (should fail)
      await page.click('[data-testid="milestone-card"]:nth-child(3) [data-testid="start-milestone"]');
      await expect(page.locator('text=Previous milestone must be completed')).toBeVisible();
    });
  });

  test('Permission-Based Access Control', async ({ page }) => {
    await test.step('1. Test reader permissions', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'reader@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Reader should not see workflow actions
      await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
      await expect(page.locator('text=Submit Application')).not.toBeVisible();
      await expect(page.locator('text=Translation Workflow')).not.toBeVisible();
    });

    await test.step('2. Test requester permissions', async () => {
      await page.click('text=Logout');
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

    await test.step('3. Test translator permissions', async () => {
      await page.click('text=Logout');
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
  });

  test('Error Handling and Validation', async ({ page }) => {
    await test.step('1. Test duplicate request creation', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create first request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Duplicate Test Request');
      await page.fill('textarea[name="description"]', 'Testing duplicate request prevention.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Try to create second request (should fail)
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Duplicate Test Request 2');
      await page.fill('textarea[name="description"]', 'Testing duplicate request prevention.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=You already have a translation request for this book')).toBeVisible();
    });

    await test.step('2. Test invalid state transitions', async () => {
      // Try to accept a non-existent application
      await page.click('text=Accept Application');
      await expect(page.locator('text=No applications to accept')).toBeVisible();
    });

    await test.step('3. Test form validation', async () => {
      // Try to submit empty form
      await page.click('text=Create Translation Request');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Title is required')).toBeVisible();
      await expect(page.locator('text=Description is required')).toBeVisible();
      await expect(page.locator('text=Budget is required')).toBeVisible();
    });
  });

  test('WebSocket Real-time Updates', async ({ page, context }) => {
    await test.step('1. Test WebSocket connection', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Check WebSocket connection indicator
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
    });

    await test.step('2. Test real-time notifications', async () => {
      // Create request and verify notification
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'WebSocket Test Request');
      await page.fill('textarea[name="description"]', 'Testing WebSocket notifications.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      
      // Check for real-time notification
      await expect(page.locator('text=New translation request created')).toBeVisible();
    });
  });
});
