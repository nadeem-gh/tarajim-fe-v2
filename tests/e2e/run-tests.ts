import { test, expect } from '@playwright/test';
import { testConfig, testUtils, testAssertions } from './test-config';

// Test runner for comprehensive workflow testing
export class WorkflowTestRunner {
  private page: any;
  private context: any;

  constructor(page: any, context: any) {
    this.page = page;
    this.context = context;
  }

  // Complete single translator workflow
  async runSingleTranslatorWorkflow() {
    console.log('🚀 Starting Single Translator Workflow Test');
    
    // 1. Setup: Login as requester and create request
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createTranslationRequest(this.page);
    await testUtils.verifyStatus(this.page, 'Open for Applications');
    
    // 2. Submit application as translator
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.submitApplication(this.page);
    await testUtils.verifyStatus(this.page, 'Pending Review');
    
    // 3. Accept application as requester
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.acceptApplication(this.page);
    await testUtils.verifyStatus(this.page, 'Reviewing Applications');
    
    // 4. Sign contracts
    await testUtils.signContract(this.page);
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.signContract(this.page);
    await testUtils.verifyStatus(this.page, 'Contracted');
    
    // 5. Create and manage milestones
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createMilestone(this.page);
    await testUtils.assignMilestone(this.page);
    
    // 6. Complete milestone work
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.startMilestone(this.page);
    await testUtils.submitMilestone(this.page);
    
    // 7. Approve and pay milestone
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.approveMilestone(this.page);
    await testUtils.markMilestonePaid(this.page);
    
    console.log('✅ Single Translator Workflow Test Completed');
  }

  // Multiple translators parallel workflow
  async runMultipleTranslatorsWorkflow() {
    console.log('🚀 Starting Multiple Translators Workflow Test');
    
    // 1. Create request
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createTranslationRequest(this.page);
    
    // 2. Submit applications from multiple translators
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.submitApplication(this.page);
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator2');
    await testUtils.navigateToBook(this.page);
    await testUtils.submitApplication(this.page);
    
    // 3. Accept multiple applications
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.acceptApplication(this.page);
    
    // 4. Sign contracts in parallel
    await testUtils.signContract(this.page);
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.signContract(this.page);
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator2');
    await testUtils.navigateToBook(this.page);
    await testUtils.signContract(this.page);
    
    // 5. Create milestones for both contracts
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createMilestone(this.page);
    await testUtils.createMilestone(this.page);
    
    console.log('✅ Multiple Translators Workflow Test Completed');
  }

  // Sequential milestone enforcement
  async runSequentialMilestoneWorkflow() {
    console.log('🚀 Starting Sequential Milestone Workflow Test');
    
    // 1. Setup complete workflow
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createTranslationRequest(this.page);
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.submitApplication(this.page);
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.acceptApplication(this.page);
    
    await testUtils.signContract(this.page);
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.signContract(this.page);
    
    // 2. Create multiple milestones
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.createMilestone(this.page);
    await testUtils.createMilestone(this.page);
    await testUtils.createMilestone(this.page);
    
    // 3. Complete first milestone
    await testUtils.assignMilestone(this.page);
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.startMilestone(this.page);
    await testUtils.submitMilestone(this.page);
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.approveMilestone(this.page);
    await testUtils.markMilestonePaid(this.page);
    
    // 4. Verify second milestone can now be started
    await testUtils.assignMilestone(this.page);
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.startMilestone(this.page);
    
    console.log('✅ Sequential Milestone Workflow Test Completed');
  }

  // Permission-based access control
  async runPermissionTests() {
    console.log('🚀 Starting Permission Tests');
    
    // Test reader permissions
    await testUtils.login(this.page, 'reader');
    await testUtils.navigateToBook(this.page);
    await testAssertions.assertUserCannotCreateRequest(this.page);
    await testAssertions.assertUserCannotSubmitApplication(this.page);
    
    // Test requester permissions
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testAssertions.assertUserCanCreateRequest(this.page);
    await testAssertions.assertUserCannotSubmitApplication(this.page);
    
    // Test translator permissions
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testAssertions.assertUserCannotCreateRequest(this.page);
    await testAssertions.assertUserCanSubmitApplication(this.page);
    
    console.log('✅ Permission Tests Completed');
  }

  // WebSocket integration
  async runWebSocketTests() {
    console.log('🚀 Starting WebSocket Tests');
    
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    await testUtils.waitForWebSocketConnection(this.page);
    
    // Test real-time notifications
    await testUtils.createTranslationRequest(this.page);
    await testUtils.waitForNotification(this.page, 'New translation request created');
    
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await testUtils.submitApplication(this.page);
    await testUtils.waitForNotification(this.page, 'New application received');
    
    console.log('✅ WebSocket Tests Completed');
  }

  // Error handling and validation
  async runErrorHandlingTests() {
    console.log('🚀 Starting Error Handling Tests');
    
    await testUtils.login(this.page, 'requester');
    await testUtils.navigateToBook(this.page);
    
    // Test duplicate request creation
    await testUtils.createTranslationRequest(this.page);
    await testUtils.createTranslationRequest(this.page);
    await testUtils.waitForNotification(this.page, 'You already have a translation request for this book');
    
    // Test invalid form submission
    await testUtils.logout(this.page);
    await testUtils.login(this.page, 'translator');
    await testUtils.navigateToBook(this.page);
    await this.page.click(testConfig.selectors.submitApplicationButton);
    await this.page.click(testConfig.selectors.submitButton);
    await testUtils.waitForNotification(this.page, 'Title is required');
    
    console.log('✅ Error Handling Tests Completed');
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Comprehensive Workflow Tests');
    
    try {
      await this.runSingleTranslatorWorkflow();
      await this.runMultipleTranslatorsWorkflow();
      await this.runSequentialMilestoneWorkflow();
      await this.runPermissionTests();
      await this.runWebSocketTests();
      await this.runErrorHandlingTests();
      
      console.log('🎉 All Tests Completed Successfully!');
    } catch (error) {
      console.error('❌ Test Failed:', error);
      throw error;
    }
  }
}

// Export test runner for use in other test files
export default WorkflowTestRunner;
