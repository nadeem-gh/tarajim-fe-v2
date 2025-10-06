import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Setting up test data...');
    
    // Wait for backend to be ready
    console.log('Waiting for backend to be ready...');
    await page.waitForTimeout(1000);
    
    // Create test users
    console.log('Creating test users...');
    const usersResponse = await page.request.post('http://localhost:8000/api/test/setup-users/');
    if (!usersResponse.ok()) {
      const errorText = await usersResponse.text();
      throw new Error(`Failed to create test users: ${usersResponse.status()} - ${errorText}`);
    }
    const usersData = await usersResponse.json();
    console.log('Test users created:', usersData);
    
    // Wait a bit for users to be fully created
    await page.waitForTimeout(500);
    
    // Create test books
    console.log('Creating test books...');
    const booksResponse = await page.request.post('http://localhost:8000/api/test/setup-books/');
    if (!booksResponse.ok()) {
      const errorText = await booksResponse.text();
      throw new Error(`Failed to create test books: ${booksResponse.status()} - ${errorText}`);
    }
    const booksData = await booksResponse.json();
    console.log('Test books created:', booksData);
    
    // Wait a bit for books to be fully created
    await page.waitForTimeout(500);
    
    // Create test data
    console.log('Creating additional test data...');
    const testDataResponse = await page.request.post('http://localhost:8000/api/test/setup-test-data/');
    if (!testDataResponse.ok()) {
      const errorText = await testDataResponse.text();
      throw new Error(`Failed to create test data: ${testDataResponse.status()} - ${errorText}`);
    }
    const testData = await testDataResponse.json();
    console.log('Test data created:', testData);
    
    // Verify test data is accessible
    console.log('Verifying test data accessibility...');
    const loginResponse = await page.request.post('http://localhost:8000/api/accounts/login/', {
      data: {
        email: 'reader@example.com',
        password: 'password123'
      }
    });
    if (!loginResponse.ok()) {
      const errorText = await loginResponse.text();
      throw new Error(`Failed to verify login: ${loginResponse.status()} - ${errorText}`);
    }
    const loginData = await loginResponse.json();
    console.log('Login verification successful for:', loginData.user.email);
    
    console.log('✅ Test data setup completed successfully');
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
