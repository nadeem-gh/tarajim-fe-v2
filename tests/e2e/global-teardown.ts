import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Cleaning up test data...');
    
    // Clean up test data
    const cleanupResponse = await page.request.post('http://localhost:8000/api/test/cleanup-test-data/');
    if (!cleanupResponse.ok()) {
      console.warn(`Failed to cleanup test data: ${cleanupResponse.status()}`);
    } else {
      const cleanupData = await cleanupResponse.json();
      console.log('Test data cleanup completed:', cleanupData);
    }
  } catch (error) {
    console.error('Test data cleanup failed:', error);
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
