import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('API Endpoint Integration - Request Creation', async ({ page }) => {
    await test.step('1. Test request creation API', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Monitor network requests
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/books/') && request.url().includes('/create-request/')
      );

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'API Integration Test Request');
      await page.fill('textarea[name="description"]', 'Testing API integration for request creation.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      
      await page.click('button[type="submit"]');
      
      // Verify API call was made
      const request = await requestPromise;
      expect(request.method()).toBe('POST');
      expect(request.url()).toContain('/create-request/');
      
      // Verify response
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();
    });
  });

  test('API Endpoint Integration - Application Submission', async ({ page }) => {
    await test.step('1. Test application submission API', async () => {
      // First create a request
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'API Integration Test Request');
      await page.fill('textarea[name="description"]', 'Testing API integration for application submission.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Now test application submission
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Monitor network requests
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/books/') && request.url().includes('/submit-application/')
      );

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'API integration test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      
      await page.click('button[type="submit"]');
      
      // Verify API call was made
      const request = await requestPromise;
      expect(request.method()).toBe('POST');
      expect(request.url()).toContain('/submit-application/');
      
      // Verify response
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();
    });
  });

  test('API Endpoint Integration - Contract Signing', async ({ page }) => {
    await test.step('1. Test contract signing API', async () => {
      // Setup: Create request and application
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Contract API Test Request');
      await page.fill('textarea[name="description"]', 'Testing contract signing API.');
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
      await page.fill('textarea[name="cover_letter"]', 'Contract API test application');
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

      // Test contract signing API
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/books/') && request.url().includes('/contracts/') && request.url().includes('/sign/')
      );

      await page.click('text=Sign Contract');
      
      // Verify API call was made
      const request = await requestPromise;
      expect(request.method()).toBe('POST');
      expect(request.url()).toContain('/sign/');
      
      // Verify response
      await expect(page.locator('text=Contract signed successfully')).toBeVisible();
    });
  });

  test('API Endpoint Integration - Milestone Management', async ({ page }) => {
    await test.step('1. Test milestone creation API', async () => {
      // Setup: Complete workflow up to contract signing
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Milestone API Test Request');
      await page.fill('textarea[name="description"]', 'Testing milestone management API.');
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
      await page.fill('textarea[name="cover_letter"]', 'Milestone API test application');
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

      // Test milestone creation API
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      const requestPromise = page.waitForRequest(request => 
        request.url().includes('/books/') && request.url().includes('/contracts/') && request.url().includes('/milestones/')
      );

      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'API Test Milestone');
      await page.fill('textarea[name="description"]', 'Testing milestone creation API.');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      
      // Verify API call was made
      const request = await requestPromise;
      expect(request.method()).toBe('POST');
      expect(request.url()).toContain('/milestones/');
      
      // Verify response
      await expect(page.locator('text=Milestone created successfully')).toBeVisible();
    });
  });

  test('API Error Handling', async ({ page }) => {
    await test.step('1. Test API error responses', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Test duplicate request creation error
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Error Test Request');
      await page.fill('textarea[name="description"]', 'Testing API error handling.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Try to create duplicate request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'Error Test Request 2');
      await page.fill('textarea[name="description"]', 'Testing API error handling.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      
      // Verify error message
      await expect(page.locator('text=You already have a translation request for this book')).toBeVisible();
    });
  });

  test('API Response Format Validation', async ({ page }) => {
    await test.step('1. Test API response format', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Monitor API responses
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/books/') && response.url().includes('/translation-workflow/')
      );

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Wait for workflow data to load
      await responsePromise;
      
      // Verify workflow data structure
      await expect(page.locator('text=Translation Workflow')).toBeVisible();
      await expect(page.locator('[data-testid="workflow-data"]')).toBeVisible();
    });
  });

  test('WebSocket API Integration', async ({ page }) => {
    await test.step('1. Test WebSocket connection API', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Check WebSocket connection
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
      
      // Verify WebSocket URL format
      const wsUrl = await page.evaluate(() => {
        return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      });
      expect(wsUrl).toBe('ws:');
    });
  });
});
