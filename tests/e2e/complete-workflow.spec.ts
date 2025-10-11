import { test, expect } from '@playwright/test';

test.describe('Complete Translation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.goto('/');
  });

  test('Complete workflow: Single translator', async ({ page }) => {
    // 1. Setup: Login as requester
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // 2. Navigate to book and create translation request
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Verify workflow UI is below book details (not in sidebar)
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

    // 3. Verify request is in "Open for Applications" state
    await expect(page.locator('text=Open for Applications')).toBeVisible();
    await expect(page.locator('text=Create Translation Request')).not.toBeVisible();

    // 4. Login as translator and apply
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Submit application
    await page.click('text=Apply Now');
    await page.fill('textarea[name="cover_letter"]', 'I am an experienced translator with 5+ years of experience.');
    await page.fill('input[name="proposed_rate"]', '50');
    await page.fill('input[name="estimated_completion_time"]', '30');
    await page.fill('textarea[name="relevant_experience"]', 'Translated 100+ books in various genres.');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();

    // 5. Login as requester and accept application
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Verify application is visible and accept it
    await expect(page.locator('text=Applications')).toBeVisible();
    await expect(page.locator('text=Accept')).toBeVisible();
    await page.click('text=Accept');
    await expect(page.locator('text=Application accepted successfully')).toBeVisible();

    // 6. Verify contract is created and sign it
    await expect(page.locator('text=Contracts')).toBeVisible();
    await expect(page.locator('text=Sign Contract')).toBeVisible();
    await page.click('text=Sign Contract');
    await expect(page.locator('text=Contract signed successfully')).toBeVisible();

    // 7. Login as translator and sign contract
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Sign contract
    await page.click('text=Sign Contract');
    await expect(page.locator('text=Contract signed successfully')).toBeVisible();

    // 8. Login as requester and create milestones
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Create milestones
    await page.click('text=Create Milestones');
    await page.fill('input[name="milestones[0].title"]', 'Chapter 1 Translation');
    await page.fill('textarea[name="milestones[0].description"]', 'Translate first 5 chapters');
    await page.fill('input[name="milestones[0].amount"]', '300');
    await page.fill('input[name="milestones[0].due_date"]', '2024-11-30');
    
    await page.fill('input[name="milestones[1].title"]', 'Chapter 2 Translation');
    await page.fill('textarea[name="milestones[1].description"]', 'Translate remaining chapters');
    await page.fill('input[name="milestones[1].amount"]', '700');
    await page.fill('input[name="milestones[1].due_date"]', '2024-12-15');
    
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Milestones created successfully')).toBeVisible();

    // 9. Assign milestones to translator
    await page.click('text=Assign to Translator');
    await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

    // 10. Login as translator and complete milestones sequentially
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Complete first milestone
    await page.click('text=Start Work');
    await page.fill('textarea[name="work_notes"]', 'Completed first 5 chapters translation');
    await page.click('text=Submit Work');
    await expect(page.locator('text=Work submitted for review')).toBeVisible();

    // 11. Login as requester and approve milestone
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Approve first milestone
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();

    // 12. Login as translator and complete second milestone
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Complete second milestone
    await page.click('text=Start Work');
    await page.fill('textarea[name="work_notes"]', 'Completed remaining chapters translation');
    await page.click('text=Submit Work');
    await expect(page.locator('text=Work submitted for review')).toBeVisible();

    // 13. Login as requester and approve final milestone
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate back to book
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Approve final milestone
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();

    // 14. Verify project completion and Read/Audio buttons visibility
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Read Book')).toBeVisible();
    await expect(page.locator('text=Generate Audio')).toBeVisible();
  });

  test('Complete workflow: Multiple translators parallel', async ({ page }) => {
    // 1. Setup: Login as requester and create request
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Create Translation Request');
    
    await page.fill('input[name="title"]', 'Multi-Translator Test Request');
    await page.fill('textarea[name="description"]', 'Testing multiple translators workflow.');
    await page.selectOption('select[name="target_language"]', 'Arabic');
    await page.fill('input[name="budget"]', '2000');
    await page.fill('input[name="deadline"]', '2024-12-31');
    await page.click('button[type="submit"]');

    // 2. First translator applies
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator1@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Apply Now');
    await page.fill('textarea[name="cover_letter"]', 'Translator 1 application');
    await page.fill('input[name="proposed_rate"]', '50');
    await page.fill('input[name="estimated_completion_time"]', '30');
    await page.click('button[type="submit"]');

    // 3. Second translator applies
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator2@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Apply Now');
    await page.fill('textarea[name="cover_letter"]', 'Translator 2 application');
    await page.fill('input[name="proposed_rate"]', '60');
    await page.fill('input[name="estimated_completion_time"]', '25');
    await page.click('button[type="submit"]');

    // 4. Requester accepts both applications
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Accept first application
    await page.click('text=Accept');
    await expect(page.locator('text=Application accepted successfully')).toBeVisible();

    // Accept second application
    await page.click('text=Accept');
    await expect(page.locator('text=Application accepted successfully')).toBeVisible();

    // 5. Verify both contracts are created
    await expect(page.locator('text=Contracts')).toBeVisible();
    await expect(page.locator('text=Contract with translator1@example.com')).toBeVisible();
    await expect(page.locator('text=Contract with translator2@example.com')).toBeVisible();

    // 6. Sign both contracts
    await page.click('text=Sign Contract');
    await expect(page.locator('text=Contract signed successfully')).toBeVisible();

    // 7. Create milestones for both contracts
    await page.click('text=Create Milestones');
    await page.fill('input[name="milestones[0].title"]', 'Translator 1 - Part 1');
    await page.fill('input[name="milestones[0].amount"]', '500');
    await page.fill('input[name="milestones[1].title"]', 'Translator 1 - Part 2');
    await page.fill('input[name="milestones[1].amount"]', '500');
    await page.click('button[type="submit"]');

    await page.click('text=Create Milestones');
    await page.fill('input[name="milestones[0].title"]', 'Translator 2 - Part 1');
    await page.fill('input[name="milestones[0].amount"]', '500');
    await page.fill('input[name="milestones[1].title"]', 'Translator 2 - Part 2');
    await page.fill('input[name="milestones[1].amount"]', '500');
    await page.click('button[type="submit"]');

    // 8. Assign milestones to respective translators
    await page.click('text=Assign to Translator');
    await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();

    // 9. Both translators work in parallel
    // Translator 1 completes work
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator1@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Start Work');
    await page.fill('textarea[name="work_notes"]', 'Translator 1 completed work');
    await page.click('text=Submit Work');

    // Translator 2 completes work
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator2@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Start Work');
    await page.fill('textarea[name="work_notes"]', 'Translator 2 completed work');
    await page.click('text=Submit Work');

    // 10. Requester approves all milestones
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Approve all milestones
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();
    await page.click('text=Approve');
    await expect(page.locator('text=Milestone approved')).toBeVisible();

    // 11. Verify project completion
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Read Book')).toBeVisible();
    await expect(page.locator('text=Generate Audio')).toBeVisible();
  });

  test('Workflow state enforcement: Invalid transitions', async ({ page }) => {
    // Test that invalid transitions are blocked
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');

    // Try to accept application before creating request (should fail)
    await page.click('text=Accept');
    await expect(page.locator('text=No applications found')).toBeVisible();

    // Create request first
    await page.click('text=Create Translation Request');
    await page.fill('input[name="title"]', 'State Enforcement Test');
    await page.fill('textarea[name="description"]', 'Testing state enforcement.');
    await page.selectOption('select[name="target_language"]', 'Arabic');
    await page.fill('input[name="budget"]', '500');
    await page.fill('input[name="deadline"]', '2024-12-31');
    await page.click('button[type="submit"]');

    // Try to sign contract before accepting application (should fail)
    await page.click('text=Sign Contract');
    await expect(page.locator('text=No contracts found')).toBeVisible();

    // Try to create milestones before contract signed (should fail)
    await page.click('text=Create Milestones');
    await expect(page.locator('text=Contract must be signed first')).toBeVisible();
  });

  test('Permission enforcement: Role-based access', async ({ page }) => {
    // Test that users can only perform actions allowed by their role
    
    // Reader tries to create request (should fail)
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Reader should not see workflow panel
    await expect(page.locator('text=Translation Workflow')).not.toBeVisible();

    // Translator tries to create request (should fail)
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'translator@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Translator should not see create request button
    await expect(page.locator('text=Create Translation Request')).not.toBeVisible();
    await expect(page.locator('text=Apply Now')).toBeVisible();

    // Requester tries to apply (should fail)
    await page.click('text=Logout');
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'requester@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Requester should not see apply button
    await expect(page.locator('text=Apply Now')).not.toBeVisible();
  });

  test('WebSocket real-time updates', async ({ page, context }) => {
    // Test WebSocket notifications work correctly
    
    // Open two browser contexts to simulate two users
    const requesterPage = page;
    const translatorPage = await context.newPage();

    // Login as requester
    await requesterPage.click('text=Sign In');
    await requesterPage.fill('input[name="email"]', 'requester@example.com');
    await requesterPage.fill('input[name="password"]', 'password123');
    await requesterPage.click('button[type="submit"]');

    // Login as translator
    await translatorPage.goto('/');
    await translatorPage.click('text=Sign In');
    await translatorPage.fill('input[name="email"]', 'translator@example.com');
    await translatorPage.fill('input[name="password"]', 'password123');
    await translatorPage.click('button[type="submit"]');

    // Both navigate to same book
    await requesterPage.goto('/books');
    await requesterPage.click('[data-testid="book-card"]:first-child');
    
    await translatorPage.goto('/books');
    await translatorPage.click('[data-testid="book-card"]:first-child');

    // Requester creates request
    await requesterPage.click('text=Create Translation Request');
    await requesterPage.fill('input[name="title"]', 'WebSocket Test Request');
    await requesterPage.fill('textarea[name="description"]', 'Testing WebSocket notifications.');
    await requesterPage.selectOption('select[name="target_language"]', 'Arabic');
    await requesterPage.fill('input[name="budget"]', '500');
    await requesterPage.fill('input[name="deadline"]', '2024-12-31');
    await requesterPage.click('button[type="submit"]');

    // Verify translator sees the request appear in real-time
    await expect(translatorPage.locator('text=WebSocket Test Request')).toBeVisible();
    await expect(translatorPage.locator('text=Apply Now')).toBeVisible();

    // Translator applies
    await translatorPage.click('text=Apply Now');
    await translatorPage.fill('textarea[name="cover_letter"]', 'WebSocket test application');
    await translatorPage.fill('input[name="proposed_rate"]', '50');
    await translatorPage.fill('input[name="estimated_completion_time"]', '30');
    await translatorPage.click('button[type="submit"]');

    // Verify requester sees application appear in real-time
    await expect(requesterPage.locator('text=WebSocket test application')).toBeVisible();
    await expect(requesterPage.locator('text=Accept')).toBeVisible();
  });
});
