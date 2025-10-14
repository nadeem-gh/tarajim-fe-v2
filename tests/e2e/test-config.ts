import { test, expect } from '@playwright/test';

// Test configuration and utilities
export const testConfig = {
  baseURL: 'http://localhost:3001',
  backendURL: 'http://localhost:8000',
  testUsers: {
    reader: {
      email: 'reader@example.com',
      password: 'password123',
      role: 'reader'
    },
    requester: {
      email: 'requester@example.com',
      password: 'password123',
      role: 'requester'
    },
    translator: {
      email: 'translator@example.com',
      password: 'password123',
      role: 'translator'
    },
    translator2: {
      email: 'translator2@example.com',
      password: 'password123',
      role: 'translator'
    },
    requester2: {
      email: 'requester2@example.com',
      password: 'password123',
      role: 'requester'
    }
  },
  testData: {
    book: {
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test book description',
      language: 'English',
      wordCount: 50000
    },
    translationRequest: {
      title: 'Test Translation Request',
      description: 'Test translation request description',
      sourceLanguage: 'English',
      targetLanguage: 'Arabic',
      wordCount: 50000,
      estimatedHours: 200,
      budget: 1000,
      deadline: '2024-12-31T23:59:59Z'
    },
    application: {
      coverLetter: 'Test application cover letter',
      proposedRate: 25.00,
      estimatedCompletionTime: 30,
      relevantExperience: '5 years translation experience'
    },
    milestone: {
      title: 'Test Milestone',
      description: 'Test milestone description',
      amount: 500.00,
      dueDate: '2024-02-01T00:00:00Z'
    }
  },
  selectors: {
    // Authentication
    signInButton: 'text=Sign In',
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    logoutButton: 'text=Logout',
    
    // Navigation
    booksLink: 'text=Books',
    translationsLink: 'text=Translations',
    dashboardLink: 'text=Dashboard',
    
    // Book related
    bookCard: '[data-testid="book-card"]',
    bookTitle: '[data-testid="book-title"]',
    bookAuthor: '[data-testid="book-author"]',
    bookDescription: '[data-testid="book-description"]',
    
    // Workflow related
    workflowPanel: '[data-testid="workflow-panel"]',
    createRequestButton: 'text=Create Translation Request',
    submitApplicationButton: 'text=Submit Application',
    acceptApplicationButton: 'text=Accept Application',
    rejectApplicationButton: 'text=Reject Application',
    signContractButton: 'text=Sign Contract',
    createMilestoneButton: 'text=Create Milestone',
    assignMilestoneButton: 'text=Assign Milestone',
    startMilestoneButton: 'text=Start Milestone',
    submitMilestoneButton: 'text=Submit Milestone',
    approveMilestoneButton: 'text=Approve Milestone',
    markPaidButton: 'text=Mark as Paid',
    
    // Form fields
    titleInput: 'input[name="title"]',
    descriptionTextarea: 'textarea[name="description"]',
    sourceLanguageSelect: 'select[name="source_language"]',
    targetLanguageSelect: 'select[name="target_language"]',
    wordCountInput: 'input[name="word_count"]',
    estimatedHoursInput: 'input[name="estimated_hours"]',
    budgetInput: 'input[name="budget"]',
    deadlineInput: 'input[name="deadline"]',
    coverLetterTextarea: 'textarea[name="cover_letter"]',
    proposedRateInput: 'input[name="proposed_rate"]',
    estimatedCompletionTimeInput: 'input[name="estimated_completion_time"]',
    amountInput: 'input[name="amount"]',
    dueDateInput: 'input[name="due_date"]',
    translatorSelect: 'select[name="translator_id"]',
    
    // Status indicators
    statusOpen: 'text=Open for Applications',
    statusReviewing: 'text=Reviewing Applications',
    statusContracted: 'text=Contracted',
    statusInProgress: 'text=In Progress',
    statusCompleted: 'text=Completed',
    statusPending: 'text=Pending',
    statusAccepted: 'text=Accepted',
    statusRejected: 'text=Rejected',
    statusAssigned: 'text=Assigned',
    statusSubmitted: 'text=Submitted for Review',
    statusApproved: 'text=Approved',
    statusPaid: 'text=Paid',
    
    // Notifications
    successNotification: '[data-testid="success-notification"]',
    errorNotification: '[data-testid="error-notification"]',
    websocketConnected: '[data-testid="websocket-connected"]',
    websocketDisconnected: '[data-testid="websocket-disconnected"]',
    
    // Cards and components
    requestCard: '[data-testid="request-card"]',
    applicationCard: '[data-testid="application-card"]',
    contractCard: '[data-testid="contract-card"]',
    milestoneCard: '[data-testid="milestone-card"]',
    
    // Workflow data
    workflowData: '[data-testid="workflow-data"]',
    requestActions: '[data-testid="request-actions"]',
    applicationActions: '[data-testid="application-actions"]',
    contractActions: '[data-testid="contract-actions"]',
    milestoneActions: '[data-testid="milestone-actions"]'
  },
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    veryLong: 60000
  }
};

// Utility functions for tests
export const testUtils = {
  async login(page: any, userType: keyof typeof testConfig.testUsers) {
    const user = testConfig.testUsers[userType];
    await page.click(testConfig.selectors.signInButton);
    await page.fill(testConfig.selectors.emailInput, user.email);
    await page.fill(testConfig.selectors.passwordInput, user.password);
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  },

  async logout(page: any) {
    await page.click(testConfig.selectors.logoutButton);
  },

  async navigateToBook(page: any, bookIndex: number = 0) {
    await page.goto('/books');
    await page.click(`${testConfig.selectors.bookCard}:nth-child(${bookIndex + 1})`);
  },

  async createTranslationRequest(page: any, requestData: any = testConfig.testData.translationRequest) {
    await page.click(testConfig.selectors.createRequestButton);
    await page.fill(testConfig.selectors.titleInput, requestData.title);
    await page.fill(testConfig.selectors.descriptionTextarea, requestData.description);
    await page.selectOption(testConfig.selectors.targetLanguageSelect, requestData.targetLanguage);
    await page.fill(testConfig.selectors.budgetInput, requestData.budget.toString());
    await page.fill(testConfig.selectors.deadlineInput, requestData.deadline);
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Translation request created successfully')).toBeVisible();
  },

  async submitApplication(page: any, applicationData: any = testConfig.testData.application) {
    await page.click(testConfig.selectors.submitApplicationButton);
    await page.fill(testConfig.selectors.coverLetterTextarea, applicationData.coverLetter);
    await page.fill(testConfig.selectors.proposedRateInput, applicationData.proposedRate.toString());
    await page.fill(testConfig.selectors.estimatedCompletionTimeInput, applicationData.estimatedCompletionTime.toString());
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Application submitted successfully')).toBeVisible();
  },

  async acceptApplication(page: any) {
    await page.click(testConfig.selectors.acceptApplicationButton);
    await expect(page.locator('text=Application accepted successfully')).toBeVisible();
  },

  async rejectApplication(page: any, reason: string = 'Not suitable for this project') {
    await page.click(testConfig.selectors.rejectApplicationButton);
    await page.fill('textarea[name="rejection_reason"]', reason);
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Application rejected successfully')).toBeVisible();
  },

  async signContract(page: any) {
    await page.click(testConfig.selectors.signContractButton);
    await expect(page.locator('text=Contract signed successfully')).toBeVisible();
  },

  async createMilestone(page: any, milestoneData: any = testConfig.testData.milestone) {
    await page.click(testConfig.selectors.createMilestoneButton);
    await page.fill(testConfig.selectors.titleInput, milestoneData.title);
    await page.fill(testConfig.selectors.descriptionTextarea, milestoneData.description);
    await page.fill(testConfig.selectors.amountInput, milestoneData.amount.toString());
    await page.fill(testConfig.selectors.dueDateInput, milestoneData.dueDate);
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Milestone created successfully')).toBeVisible();
  },

  async assignMilestone(page: any, translatorEmail: string = 'translator@example.com') {
    await page.click(testConfig.selectors.assignMilestoneButton);
    await page.selectOption(testConfig.selectors.translatorSelect, translatorEmail);
    await page.click(testConfig.selectors.submitButton);
    await expect(page.locator('text=Milestone assigned successfully')).toBeVisible();
  },

  async startMilestone(page: any) {
    await page.click(testConfig.selectors.startMilestoneButton);
    await expect(page.locator('text=Milestone started successfully')).toBeVisible();
  },

  async submitMilestone(page: any) {
    await page.click(testConfig.selectors.submitMilestoneButton);
    await expect(page.locator('text=Milestone submitted successfully')).toBeVisible();
  },

  async approveMilestone(page: any) {
    await page.click(testConfig.selectors.approveMilestoneButton);
    await expect(page.locator('text=Milestone approved successfully')).toBeVisible();
  },

  async markMilestonePaid(page: any) {
    await page.click(testConfig.selectors.markPaidButton);
    await expect(page.locator('text=Milestone marked as paid successfully')).toBeVisible();
  },

  async waitForWebSocketConnection(page: any) {
    await expect(page.locator(testConfig.selectors.websocketConnected)).toBeVisible();
  },

  async waitForNotification(page: any, message: string) {
    await expect(page.locator(`text=${message}`)).toBeVisible();
  },

  async verifyStatus(page: any, status: string) {
    await expect(page.locator(`text=${status}`)).toBeVisible();
  },

  async verifyElementVisible(page: any, selector: string) {
    await expect(page.locator(selector)).toBeVisible();
  },

  async verifyElementNotVisible(page: any, selector: string) {
    await expect(page.locator(selector)).not.toBeVisible();
  }
};

// Test data generators
export const testDataGenerators = {
  generateTranslationRequest(overrides: any = {}) {
    return {
      ...testConfig.testData.translationRequest,
      ...overrides
    };
  },

  generateApplication(overrides: any = {}) {
    return {
      ...testConfig.testData.application,
      ...overrides
    };
  },

  generateMilestone(overrides: any = {}) {
    return {
      ...testConfig.testData.milestone,
      ...overrides
    };
  }
};

// Test assertions
export const testAssertions = {
  async assertUserCanCreateRequest(page: any) {
    await testUtils.verifyElementVisible(page, testConfig.selectors.createRequestButton);
  },

  async assertUserCannotCreateRequest(page: any) {
    await testUtils.verifyElementNotVisible(page, testConfig.selectors.createRequestButton);
  },

  async assertUserCanSubmitApplication(page: any) {
    await testUtils.verifyElementVisible(page, testConfig.selectors.submitApplicationButton);
  },

  async assertUserCannotSubmitApplication(page: any) {
    await testUtils.verifyElementNotVisible(page, testConfig.selectors.submitApplicationButton);
  },

  async assertUserCanSignContract(page: any) {
    await testUtils.verifyElementVisible(page, testConfig.selectors.signContractButton);
  },

  async assertUserCannotSignContract(page: any) {
    await testUtils.verifyElementNotVisible(page, testConfig.selectors.signContractButton);
  },

  async assertUserCanCreateMilestone(page: any) {
    await testUtils.verifyElementVisible(page, testConfig.selectors.createMilestoneButton);
  },

  async assertUserCannotCreateMilestone(page: any) {
    await testUtils.verifyElementNotVisible(page, testConfig.selectors.createMilestoneButton);
  },

  async assertUserCanApproveMilestone(page: any) {
    await testUtils.verifyElementVisible(page, testConfig.selectors.approveMilestoneButton);
  },

  async assertUserCannotApproveMilestone(page: any) {
    await testUtils.verifyElementNotVisible(page, testConfig.selectors.approveMilestoneButton);
  }
};

export default testConfig;
