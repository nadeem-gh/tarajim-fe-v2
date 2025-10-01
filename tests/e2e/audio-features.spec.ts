import { test, expect } from '@playwright/test';

test.describe('Audio Generation and Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as reader
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'reader@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
  });

  test('should generate audio for book', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    
    // Click Generate Audio button
    await page.click('text=Generate Audio');
    
    // Select voice settings
    await page.selectOption('select[name="voice"]', 'en-US-Standard-A');
    await page.selectOption('select[name="speed"]', '1.0');
    await page.selectOption('select[name="pitch"]', '0');
    
    // Start audio generation
    await page.click('button[type="submit"]');
    
    // Verify generation started
    await expect(page.locator('text=Audio generation started')).toBeVisible();
    
    // Wait for completion
    await expect(page.locator('text=Audio generation completed')).toBeVisible({ timeout: 30000 });
  });

  test('should play generated audio', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Generate Audio');
    
    // Wait for audio to be ready
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 30000 });
    
    // Play audio
    await page.click('[data-testid="play-button"]');
    
    // Verify audio is playing
    await expect(page.locator('[data-testid="audio-player"]')).toHaveAttribute('data-playing', 'true');
  });

  test('should pause and resume audio', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Generate Audio');
    
    // Wait for audio to be ready
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 30000 });
    
    // Play audio
    await page.click('[data-testid="play-button"]');
    
    // Pause audio
    await page.click('[data-testid="pause-button"]');
    await expect(page.locator('[data-testid="audio-player"]')).toHaveAttribute('data-playing', 'false');
    
    // Resume audio
    await page.click('[data-testid="play-button"]');
    await expect(page.locator('[data-testid="audio-player"]')).toHaveAttribute('data-playing', 'true');
  });

  test('should control audio volume', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Generate Audio');
    
    // Wait for audio to be ready
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 30000 });
    
    // Adjust volume
    await page.fill('input[name="volume"]', '0.5');
    
    // Verify volume change
    await expect(page.locator('[data-testid="volume-display"]')).toContainText('50%');
  });

  test('should seek to specific position in audio', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Generate Audio');
    
    // Wait for audio to be ready
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 30000 });
    
    // Seek to 30 seconds
    await page.fill('input[name="seek"]', '30');
    await page.click('[data-testid="seek-button"]');
    
    // Verify seek position
    await expect(page.locator('[data-testid="current-time"]')).toContainText('00:30');
  });

  test('should download audio file', async ({ page }) => {
    await page.goto('/books');
    await page.click('[data-testid="book-card"]:first-child');
    await page.click('text=Generate Audio');
    
    // Wait for audio to be ready
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible({ timeout: 30000 });
    
    // Download audio
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.mp3$/);
  });

  test('should view audio generation history', async ({ page }) => {
    await page.goto('/audio/history');
    
    // Verify audio history
    await expect(page.locator('h1')).toContainText('Audio Generation History');
    await expect(page.locator('[data-testid="audio-record"]')).toHaveCount.greaterThan(0);
  });

  test('should delete generated audio', async ({ page }) => {
    await page.goto('/audio/history');
    await page.click('[data-testid="audio-record"]:first-child');
    
    // Click delete button
    await page.click('text=Delete Audio');
    
    // Confirm deletion
    await page.click('text=Yes, Delete');
    
    // Verify deletion
    await expect(page.locator('text=Audio deleted successfully')).toBeVisible();
  });

  test('should share audio link', async ({ page }) => {
    await page.goto('/audio/history');
    await page.click('[data-testid="audio-record"]:first-child');
    
    // Click share button
    await page.click('text=Share Audio');
    
    // Copy share link
    await page.click('[data-testid="copy-link-button"]');
    
    // Verify link copied
    await expect(page.locator('text=Link copied to clipboard')).toBeVisible();
  });
});
