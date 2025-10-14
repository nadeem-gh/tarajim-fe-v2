import { test, expect } from '@playwright/test';

test.describe('Workflow State Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Request State Transitions', async ({ page }) => {
    await test.step('1. Test draft → open transition', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request (starts in draft, auto-transitions to open)
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'State Transition Test Request');
      await page.fill('textarea[name="description"]', 'Testing request state transitions.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      
      // Verify state transition to open
      await expect(page.locator('text=Open for Applications')).toBeVisible();
    });

    await test.step('2. Test open → reviewing transition', async () => {
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
      await page.fill('textarea[name="cover_letter"]', 'State transition test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Accept application (should transition to reviewing)
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
      
      // Verify state transition to reviewing
      await expect(page.locator('text=Reviewing Applications')).toBeVisible();
    });

    await test.step('3. Test reviewing → contracted transition', async () => {
      // Verify contract creation triggers contracted state
      await expect(page.locator('text=Contract Created')).toBeVisible();
      await expect(page.locator('text=Contracted')).toBeVisible();
    });

    await test.step('4. Test contracted → in_progress transition', async () => {
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

      // Verify state transition to in_progress
      await expect(page.locator('text=In Progress')).toBeVisible();
    });
  });

  test('Application State Transitions', async ({ page }) => {
    await test.step('1. Test pending → accepted transition', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Application State Test Request');
      await page.fill('textarea[name="description"]', 'Testing application state transitions.');
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
      await page.fill('textarea[name="cover_letter"]', 'Application state test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Verify application is in pending state
      await expect(page.locator('text=Pending Review')).toBeVisible();

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
      
      // Verify application state transition to accepted
      await expect(page.locator('text=Accepted')).toBeVisible();
    });

    await test.step('2. Test pending → rejected transition', async () => {
      // Create new request for rejection test
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Rejection Test Request');
      await page.fill('textarea[name="description"]', 'Testing application rejection.');
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
      await page.fill('textarea[name="cover_letter"]', 'Rejection test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Reject application
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Reject Application');
      await page.fill('textarea[name="rejection_reason"]', 'Not suitable for this project');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application rejected successfully')).toBeVisible();
      
      // Verify application state transition to rejected
      await expect(page.locator('text=Rejected')).toBeVisible();
    });
  });

  test('Contract State Transitions', async ({ page }) => {
    await test.step('1. Test draft → pending_requester transition', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request and application
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Contract State Test Request');
      await page.fill('textarea[name="description"]', 'Testing contract state transitions.');
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
      await page.fill('textarea[name="cover_letter"]', 'Contract state test application');
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
      
      // Verify contract is created in draft state
      await expect(page.locator('text=Contract Created')).toBeVisible();
      await expect(page.locator('text=Draft')).toBeVisible();
    });

    await test.step('2. Test pending_requester → signed transition', async () => {
      // Sign contract as requester
      await page.click('text=Sign Contract');
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
      
      // Verify contract state transition
      await expect(page.locator('text=Pending Translator Signature')).toBeVisible();
    });

    await test.step('3. Test pending_translator → signed transition', async () => {
      // Sign contract as translator
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
      
      // Verify contract is fully signed
      await expect(page.locator('text=Contract Signed')).toBeVisible();
    });
  });

  test('Milestone State Transitions', async ({ page }) => {
    await test.step('1. Test pending → assigned transition', async () => {
      // Setup: Complete workflow up to contract signing
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Milestone State Test Request');
      await page.fill('textarea[name="description"]', 'Testing milestone state transitions.');
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
      await page.fill('textarea[name="cover_letter"]', 'Milestone state test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Accept application and sign contracts
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

      // Create milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'Milestone State Test');
      await page.fill('textarea[name="description"]', 'Testing milestone state transitions.');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
      
      // Verify milestone is in pending state
      await expect(page.locator('text=Pending')).toBeVisible();

      // Assign milestone
      await page.click('text=Assign Milestone');
      await page.selectOption('select[name="translator_id"]', 'translator@example.com');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();
      
      // Verify milestone state transition to assigned
      await expect(page.locator('text=Assigned')).toBeVisible();
    });

    await test.step('2. Test assigned → in_progress transition', async () => {
      // Login as translator and start milestone
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
      
      // Verify milestone state transition to in_progress
      await expect(page.locator('text=In Progress')).toBeVisible();
    });

    await test.step('3. Test in_progress → submitted transition', async () => {
      // Submit milestone
      await page.click('text=Submit Milestone');
      await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();
      
      // Verify milestone state transition to submitted
      await expect(page.locator('text=Submitted for Review')).toBeVisible();
    });

    await test.step('4. Test submitted → approved transition', async () => {
      // Login as requester and approve milestone
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Approve Milestone');
      await expect(page.locator('text=Milestone approved successfully')).toBeVisible();
      
      // Verify milestone state transition to approved
      await expect(page.locator('text=Approved')).toBeVisible();
    });

    await test.step('5. Test approved → paid transition', async () => {
      // Mark milestone as paid
      await page.click('text=Mark as Paid');
      await expect(page.locator('text=Milestone marked as paid successfully')).toBeVisible();
      
      // Verify milestone state transition to paid
      await expect(page.locator('text=Paid')).toBeVisible();
    });
  });

  test('State Transition Error Handling', async ({ page }) => {
    await test.step('1. Test invalid state transitions', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Try to accept application before creating request
      await page.click('text=Accept Application');
      await expect(page.locator('text=No applications to accept')).toBeVisible();
      
      // Try to sign contract before accepting application
      await page.click('text=Sign Contract');
      await expect(page.locator('text=No contracts to sign')).toBeVisible();
    });

    await test.step('2. Test sequential milestone enforcement', async () => {
      // Create request and complete workflow up to milestone creation
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Sequential Test Request');
      await page.fill('textarea[name="description"]', 'Testing sequential milestone enforcement.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Complete workflow to milestone creation
      // ... (setup code for milestone creation)
      
      // Try to start second milestone before completing first
      await page.click('[data-testid="milestone-card"]:nth-child(2) [data-testid="start-milestone"]');
      await expect(page.locator('text=Previous milestone must be completed')).toBeVisible();
    });
  });
});
