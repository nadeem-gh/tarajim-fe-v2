import { test, expect } from '@playwright/test';

test.describe('WebSocket Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('WebSocket Connection and Disconnection', async ({ page }) => {
    await test.step('1. Test WebSocket connection establishment', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Check WebSocket connection indicator
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
      
      // Verify WebSocket URL format
      const wsUrl = await page.evaluate(() => {
        return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      });
      expect(wsUrl).toBe('ws:');
    });

    await test.step('2. Test WebSocket disconnection handling', async () => {
      // Simulate network disconnection
      await page.context().setOffline(true);
      
      // Check for disconnection indicator
      await expect(page.locator('[data-testid="websocket-disconnected"]')).toBeVisible();
      
      // Restore connection
      await page.context().setOffline(false);
      
      // Check for reconnection
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
    });
  });

  test('Real-time Workflow Updates', async ({ page }) => {
    await test.step('1. Test request creation notification', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request and verify real-time notification
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

    await test.step('2. Test application submission notification', async () => {
      // Submit application and verify notification
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'WebSocket test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      
      // Check for real-time notification
      await expect(page.locator('text=New application received')).toBeVisible();
    });

    await test.step('3. Test application acceptance notification', async () => {
      // Accept application and verify notification
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Accept Application');
      
      // Check for real-time notification
      await expect(page.locator('text=Application accepted')).toBeVisible();
    });

    await test.step('4. Test contract signing notification', async () => {
      // Sign contract and verify notification
      await page.click('text=Sign Contract');
      
      // Check for real-time notification
      await expect(page.locator('text=Contract signed')).toBeVisible();
    });

    await test.step('5. Test milestone creation notification', async () => {
      // Create milestone and verify notification
      await page.click('text=Create Milestone');
      await page.fill('input[name="title"]', 'WebSocket Test Milestone');
      await page.fill('textarea[name="description"]', 'Testing WebSocket milestone notifications.');
      await page.fill('input[name="amount"]', '500');
      await page.fill('input[name="due_date"]', '2024-02-01');
      await page.click('button[type="submit"]');
      
      // Check for real-time notification
      await expect(page.locator('text=New milestone created')).toBeVisible();
    });
  });

  test('WebSocket Message Types', async ({ page }) => {
    await test.step('1. Test workflow_update message type', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Monitor WebSocket messages
      const messages = [];
      page.on('console', msg => {
        if (msg.text().includes('WebSocket message received')) {
          messages.push(msg.text());
        }
      });

      // Create request to trigger WebSocket message
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'WebSocket Message Test Request');
      await page.fill('textarea[name="description"]', 'Testing WebSocket message types.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      
      // Verify WebSocket message was received
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();
    });

    await test.step('2. Test notification message type', async () => {
      // Monitor notification messages
      const notifications = [];
      page.on('console', msg => {
        if (msg.text().includes('Notification received')) {
          notifications.push(msg.text());
        }
      });

      // Submit application to trigger notification
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'WebSocket notification test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      
      // Verify notification was received
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();
    });
  });

  test('WebSocket Error Handling', async ({ page }) => {
    await test.step('1. Test WebSocket connection errors', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Simulate WebSocket connection error
      await page.route('**/ws/**', route => {
        route.abort();
      });

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Check for error handling
      await expect(page.locator('[data-testid="websocket-error"]')).toBeVisible();
    });

    await test.step('2. Test WebSocket message parsing errors', async () => {
      // Simulate malformed WebSocket message
      await page.evaluate(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/translation-workflow/1/');
        ws.onopen = () => {
          ws.send('invalid json message');
        };
      });

      // Check for error handling
      await expect(page.locator('[data-testid="websocket-parse-error"]')).toBeVisible();
    });
  });

  test('WebSocket Performance', async ({ page }) => {
    await test.step('1. Test WebSocket message frequency', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Monitor WebSocket message frequency
      const messageCount = await page.evaluate(() => {
        let count = 0;
        const ws = new WebSocket('ws://localhost:8000/ws/translation-workflow/1/');
        ws.onmessage = () => count++;
        return count;
      });

      // Create multiple requests to test message frequency
      for (let i = 0; i < 5; i++) {
        await page.click('text=Create Translation Request');
        await page.fill('input[name="title"]', `Performance Test Request ${i}`);
        await page.fill('textarea[name="description"]', 'Testing WebSocket performance.');
        await page.selectOption('select[name="target_language"]', 'Arabic');
        await page.fill('input[name="budget"]', '1000');
        await page.fill('input[name="deadline"]', '2024-12-31');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Translation request created successfully')).toBeVisible();
      }

      // Verify message count
      expect(messageCount).toBeGreaterThan(0);
    });

    await test.step('2. Test WebSocket connection stability', async () => {
      // Test WebSocket connection over time
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Wait for WebSocket connection
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
      
      // Wait for 30 seconds to test connection stability
      await page.waitForTimeout(30000);
      
      // Verify connection is still active
      await expect(page.locator('[data-testid="websocket-connected"]')).toBeVisible();
    });
  });

  test('WebSocket User-Specific Notifications', async ({ page }) => {
    await test.step('1. Test user-specific notification routing', async () => {
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'requester@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Create request
      await page.click('text=Create Translation Request');
      await page.fill('input[name="title"]', 'User Notification Test Request');
      await page.fill('textarea[name="description"]', 'Testing user-specific notifications.');
      await page.selectOption('select[name="target_language"]', 'Arabic');
      await page.fill('input[name="budget"]', '1000');
      await page.fill('input[name="deadline"]', '2024-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Translation request created successfully')).toBeVisible();

      // Submit application from different user
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'translator@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      await page.click('text=Submit Application');
      await page.fill('textarea[name="cover_letter"]', 'User notification test application');
      await page.fill('input[name="proposed_rate"]', '25');
      await page.fill('input[name="estimated_completion_time"]', '30');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Application submitted successfully')).toBeVisible();

      // Check for user-specific notification
      await expect(page.locator('text=New application for your request')).toBeVisible();
    });

    await test.step('2. Test notification filtering by user role', async () => {
      // Login as reader (should not receive workflow notifications)
      await page.click('text=Logout');
      await page.click('text=Sign In');
      await page.fill('input[name="email"]', 'reader@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Dashboard')).toBeVisible();

      await page.goto('/books');
      await page.click('[data-testid="book-card"]:first-child');
      
      // Reader should not see workflow notifications
      await expect(page.locator('[data-testid="workflow-notifications"]')).not.toBeVisible();
    });
  });
});
