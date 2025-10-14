# Translation Workflow E2E Tests

## Overview
This directory contains comprehensive end-to-end tests for the Translation Platform workflow system, covering all API integrations, state management, permissions, and real-time features.

## Test Structure

### Test Files
- `translation-workflow-comprehensive.spec.ts` - Complete workflow tests (single and multiple translators)
- `api-integration.spec.ts` - API endpoint integration tests
- `workflow-state-management.spec.ts` - State machine and transition tests
- `websocket-integration.spec.ts` - Real-time WebSocket functionality tests
- `permission-based-access.spec.ts` - Role-based access control tests
- `test-config.ts` - Test configuration and utilities
- `run-tests.ts` - Comprehensive test runner

### Test Categories

#### 1. Workflow Tests
- **Single Translator Workflow**: Complete end-to-end workflow with one translator
- **Multiple Translators Parallel Workflow**: Parallel workflow with multiple translators
- **Sequential Milestone Enforcement**: Milestone completion order validation
- **State Transition Validation**: All state machine transitions

#### 2. API Integration Tests
- **Request Creation API**: POST `/books/{book_id}/create-request/`
- **Application Submission API**: POST `/books/{book_id}/submit-application/`
- **Contract Signing API**: POST `/books/{book_id}/contracts/{contract_id}/sign/`
- **Milestone Management API**: All milestone CRUD operations
- **Error Handling**: API error responses and validation

#### 3. State Management Tests
- **Request States**: draft → open → reviewing → contracted → in_progress → completed
- **Application States**: pending → accepted/rejected/withdrawn
- **Contract States**: draft → pending_requester → signed → in_progress → completed
- **Milestone States**: pending → assigned → in_progress → submitted → approved → paid

#### 4. WebSocket Tests
- **Connection Management**: WebSocket connection and disconnection
- **Real-time Updates**: Workflow state change notifications
- **Message Types**: workflow_update and notification message handling
- **Error Handling**: WebSocket error scenarios
- **Performance**: Message frequency and connection stability

#### 5. Permission Tests
- **Reader Role**: Can view books, cannot perform workflow actions
- **Requester Role**: Can create requests, accept applications, manage milestones
- **Translator Role**: Can apply to requests, work on milestones, cannot create requests
- **Cross-user Access**: Users cannot access other users' resources

## Test Configuration

### Prerequisites
1. **Backend Server**: Django server running on `http://localhost:8000`
2. **Frontend Server**: Next.js server running on `http://localhost:3001`
3. **Test Data**: Properly seeded test users and books
4. **WebSocket Support**: Redis or in-memory channel layer configured

### Test Users
```typescript
const testUsers = {
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
  }
};
```

### Test Data
```typescript
const testData = {
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
};
```

## Running Tests

### Prerequisites Setup
```bash
# Start backend server
cd /Users/nadeem/Documents/pythonapps/tarajim/tarajim-v2
source venv-3.12/bin/activate
python manage.py runserver

# Start frontend server
cd /Users/nadeem/Documents/pythonapps/tarajim/tarajim-fe-v2
npm run dev
```

### Test Commands

#### Run All Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug
```

#### Run Specific Test Suites
```bash
# Run workflow tests only
npx playwright test translation-workflow-comprehensive

# Run API integration tests
npx playwright test api-integration

# Run state management tests
npx playwright test workflow-state-management

# Run WebSocket tests
npx playwright test websocket-integration

# Run permission tests
npx playwright test permission-based-access
```

#### Run Individual Tests
```bash
# Run specific test
npx playwright test translation-workflow-comprehensive --grep "Complete Single Translator Workflow"

# Run tests for specific browser
npx playwright test --project=chromium

# Run tests in parallel
npx playwright test --workers=4
```

## Test Coverage

### API Endpoints Covered
- ✅ `POST /books/{book_id}/create-request/` - Request creation
- ✅ `POST /books/{book_id}/submit-application/` - Application submission
- ✅ `POST /books/{book_id}/applications/{application_id}/accept/` - Accept application
- ✅ `POST /books/{book_id}/applications/{application_id}/reject/` - Reject application
- ✅ `POST /books/{book_id}/applications/accept-multiple/` - Accept multiple applications
- ✅ `POST /books/{book_id}/contracts/{contract_id}/sign/` - Sign contract
- ✅ `POST /books/{book_id}/contracts/{contract_id}/milestones/` - Create milestone
- ✅ `POST /books/{book_id}/milestones/{milestone_id}/assign/` - Assign milestone
- ✅ `POST /books/{book_id}/milestones/{milestone_id}/start/` - Start milestone
- ✅ `POST /books/{book_id}/milestones/{milestone_id}/submit/` - Submit milestone
- ✅ `POST /books/{book_id}/milestones/{milestone_id}/approve/` - Approve milestone
- ✅ `POST /books/{book_id}/milestones/{milestone_id}/mark_paid/` - Mark milestone paid
- ✅ `GET /books/{book_id}/translation-workflow/` - Get workflow data

### Workflow Scenarios Covered
- ✅ **Single Translator Workflow**: Complete end-to-end workflow
- ✅ **Multiple Translators Parallel Workflow**: Parallel processing
- ✅ **Sequential Milestone Enforcement**: Order validation
- ✅ **State Transition Validation**: All state changes
- ✅ **Permission-Based Access Control**: Role-based restrictions
- ✅ **Error Handling**: Invalid operations and validation
- ✅ **WebSocket Integration**: Real-time updates
- ✅ **API Error Responses**: Error handling and recovery

### User Roles Tested
- ✅ **Reader**: View-only access, no workflow actions
- ✅ **Requester**: Full request management, milestone creation, approval
- ✅ **Translator**: Application submission, milestone work, contract signing
- ✅ **Cross-user Access**: Resource isolation and security

## Test Utilities

### Configuration
```typescript
import { testConfig, testUtils, testAssertions } from './test-config';

// Login as specific user
await testUtils.login(page, 'requester');

// Navigate to book
await testUtils.navigateToBook(page);

// Create translation request
await testUtils.createTranslationRequest(page);

// Submit application
await testUtils.submitApplication(page);

// Verify status
await testUtils.verifyStatus(page, 'Open for Applications');
```

### Assertions
```typescript
// Check user permissions
await testAssertions.assertUserCanCreateRequest(page);
await testAssertions.assertUserCannotSubmitApplication(page);

// Verify UI elements
await testUtils.verifyElementVisible(page, '[data-testid="workflow-panel"]');
await testUtils.verifyElementNotVisible(page, '[data-testid="request-actions"]');
```

### Test Data Generation
```typescript
import { testDataGenerators } from './test-config';

// Generate test data
const requestData = testDataGenerators.generateTranslationRequest({
  title: 'Custom Test Request',
  budget: 2000
});

const applicationData = testDataGenerators.generateApplication({
  coverLetter: 'Custom application letter'
});
```

## Best Practices

### Test Organization
- Each test file focuses on a specific aspect (workflow, API, state, etc.)
- Tests are independent and can run in any order
- Setup and teardown are handled automatically
- Tests use realistic data and scenarios

### Test Data Management
- Use consistent test data across all tests
- Clean up after each test run
- Avoid hardcoded values where possible
- Use data generators for dynamic content

### Assertions
- Use specific, meaningful assertions
- Test both positive and negative scenarios
- Verify state changes and transitions
- Check error handling and validation

### Performance
- Tests run efficiently with minimal setup
- Use parallel execution where possible
- Optimize test data and operations
- Monitor test execution time

## Troubleshooting

### Common Issues

#### WebSocket Connection Failures
```bash
# Check if Redis is running
redis-cli ping

# Check Django Channels configuration
python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
```

#### API Endpoint Errors
```bash
# Check backend server logs
tail -f /Users/nadeem/Documents/pythonapps/tarajim/tarajim-v2/logs/django.log

# Test API endpoints manually
curl -X POST http://localhost:8000/api/books/1/create-request/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Request"}'
```

#### Test Data Issues
```bash
# Reset test database
python manage.py flush --noinput

# Create test users
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.create_user('requester@example.com', 'password123', role='requester')
```

### Debug Mode
```bash
# Run tests in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test translation-workflow-comprehensive --debug

# Run with verbose output
npx playwright test --reporter=verbose
```

## Test Reports

### Generate Reports
```bash
# Generate HTML report
npx playwright test --reporter=html

# Generate JSON report
npx playwright test --reporter=json

# Generate JUnit report
npx playwright test --reporter=junit
```

### View Reports
```bash
# Open HTML report
npx playwright show-report

# View test results
npx playwright test --reporter=list
```

## Maintenance

### Adding New Tests
1. Follow existing test patterns
2. Use test utilities and configuration
3. Include proper setup and teardown
4. Test both positive and negative scenarios

### Updating Tests
1. Maintain backward compatibility
2. Update test data as needed
3. Ensure test isolation
4. Validate test coverage

### Test Debugging
1. Use debug mode for step-by-step execution
2. Check browser console for errors
3. Verify API responses
4. Test WebSocket connections manually