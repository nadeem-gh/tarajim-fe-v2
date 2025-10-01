# End-to-End Testing Documentation

This directory contains comprehensive end-to-end tests for the Tarajim Translation Platform using Playwright.

## Test Structure

### Test Files
- `user-registration.spec.ts` - User registration workflows for all user types
- `user-login.spec.ts` - User authentication and login workflows
- `book-browsing.spec.ts` - Book catalog browsing, filtering, and search
- `translation-request.spec.ts` - Translation request creation and management
- `translation-application.spec.ts` - Translation application submission and management
- `payment-workflow.spec.ts` - Payment processing and escrow workflows
- `audio-features.spec.ts` - Audio generation and playback features
- `admin-workflows.spec.ts` - Administrative functions and user management

### Setup Files
- `global-setup.ts` - Initial test data setup
- `global-teardown.ts` - Test data cleanup

## Running Tests

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:3001`
3. Test data properly seeded

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Running Specific Test Suites

```bash
# Run only user registration tests
npx playwright test user-registration

# Run only payment workflow tests
npx playwright test payment-workflow

# Run tests for specific browser
npx playwright test --project=chromium
```

## Test Coverage

### User Workflows
- ✅ User registration (Reader, Requester, Translator)
- ✅ User login and authentication
- ✅ User profile management
- ✅ Role-based access control

### Book Management
- ✅ Book catalog browsing
- ✅ Book filtering by language, genre, author
- ✅ Book search functionality
- ✅ Book detail viewing
- ✅ Book statistics display

### Translation Workflows
- ✅ Translation request creation (Requesters)
- ✅ Translation application submission (Translators)
- ✅ Application approval/rejection
- ✅ Contract generation and signing
- ✅ Milestone management
- ✅ Progress tracking

### Payment & Escrow
- ✅ Escrow account creation
- ✅ Payment processing
- ✅ Milestone payment release
- ✅ Refund processing
- ✅ Sales analytics

### Audio Features
- ✅ Audio generation for books
- ✅ Audio playback controls
- ✅ Audio download
- ✅ Audio sharing

### Admin Functions
- ✅ User management
- ✅ Content moderation
- ✅ Payment oversight
- ✅ System analytics
- ✅ Settings management

## Test Data Requirements

The tests require the following test data to be available:

### Users
- Admin user: `admin@example.com` / `admin123`
- Reader user: `reader@example.com` / `password123`
- Requester user: `requester@example.com` / `password123`
- Translator user: `translator@example.com` / `password123`

### Books
- Sample books with different languages and genres
- EPUB files for testing
- Book metadata and statistics

### Translation Data
- Sample translation requests
- Translation applications
- Contracts and milestones

## Configuration

### Playwright Configuration
- **Base URL**: `http://localhost:3001`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Chrome Mobile, Safari Mobile
- **Parallel Execution**: Enabled
- **Retries**: 2 on CI, 0 locally
- **Trace Collection**: On first retry

### Test Environment
- **Frontend**: Next.js 14.0.4 on port 3001
- **Backend**: Django 5.0.8 on port 8000
- **Database**: SQLite (test database)
- **File Storage**: Local file system

## Best Practices

### Test Organization
- Each test file focuses on a specific workflow
- Tests are independent and can run in any order
- Setup and teardown are handled globally

### Test Data
- Use realistic test data
- Clean up after each test run
- Avoid hardcoded values where possible

### Assertions
- Use specific, meaningful assertions
- Test both positive and negative scenarios
- Verify UI state changes

### Performance
- Tests run in parallel by default
- Use appropriate timeouts for async operations
- Avoid unnecessary waits

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001 and 8000 are available
2. **Test data**: Verify test data is properly seeded
3. **Authentication**: Check user credentials in test files
4. **Timeouts**: Increase timeout for slow operations

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test user-registration --debug

# Run with browser visible
npx playwright test user-registration --headed
```

### Test Reports
- HTML reports are generated in `playwright-report/`
- Screenshots and videos are captured on failure
- Traces are available for debugging

## Continuous Integration

### GitHub Actions
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:e2e
```

### Test Results
- Test results are published as artifacts
- Screenshots and videos are uploaded on failure
- Coverage reports are generated

## Maintenance

### Regular Updates
- Update Playwright version regularly
- Review and update test selectors
- Add new tests for new features
- Remove obsolete tests

### Test Data Management
- Keep test data minimal and focused
- Use factories for test data generation
- Clean up test data after runs
- Version control test data changes
