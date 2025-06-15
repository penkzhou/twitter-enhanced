# Testing Guide

This guide covers testing practices and patterns for the Twitter Enhanced Chrome extension.

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── utils/
│   │   └── testHelpers.ts    # Test utilities and helpers
│   └── __mocks__/
│       └── fileMock.js       # Static asset mocks
├── utils/__tests__/          # Unit tests for utilities
├── lib/__tests__/            # Unit tests for library functions
├── components/__tests__/     # Component tests
└── pages/__tests__/          # Page component tests
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

## Test Types

### 1. Unit Tests
Test individual functions and utilities in isolation.

**Example**: `src/lib/__tests__/utils.test.ts`
```typescript
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });
});
```

### 2. Component Tests
Test React components with user interactions.

**Example**: `src/components/__tests__/RemarkDialog.test.tsx`
```typescript
import { render, screen, fireEvent } from '../../test/utils/testHelpers';
import { RemarkDialog } from '../RemarkDialog';

describe('RemarkDialog', () => {
  it('should save remark when save button is clicked', async () => {
    const onSave = jest.fn();
    render(<RemarkDialog onSave={onSave} username="test" isOpen />);
    
    fireEvent.change(screen.getByRole('textbox'), { 
      target: { value: 'New remark' } 
    });
    fireEvent.click(screen.getByText('Save'));
    
    expect(onSave).toHaveBeenCalledWith('test', 'New remark');
  });
});
```

### 3. Integration Tests
Test interaction between Chrome extension APIs and application logic.

**Example**: `src/pages/Background/__tests__/twitter-api.test.ts`
```typescript
describe('TwitterAPI', () => {
  it('should fetch video info successfully', async () => {
    const api = TwitterAPI.getInstance();
    const result = await api.getVideoInfo('123456789');
    
    expect(result.success).toBe(true);
    expect(result.videos).toBeDefined();
  });
});
```

## Testing Chrome Extension APIs

### Mock Chrome APIs
Chrome extension APIs are automatically mocked in `src/test/setup.ts`:

```typescript
// Example usage in tests
describe('Storage operations', () => {
  beforeEach(() => {
    setupChromeStorageMock({
      sync: { userRemarks: [] }
    });
  });

  it('should save user remark', async () => {
    // Test code that uses chrome.storage.sync
  });
});
```

### Mock Runtime Messages
```typescript
import { simulateRuntimeMessage } from '../test/utils/testHelpers';

describe('Message handling', () => {
  it('should handle getVideoInfo message', () => {
    const response = simulateRuntimeMessage({
      action: 'getVideoInfo',
      tweetId: '123456789'
    });
    
    expect(response).toBeDefined();
  });
});
```

## Testing Patterns

### 1. Database Testing
IndexedDB operations are tested using `fake-indexeddb`:

```typescript
import { openDB } from '../db';
import { createMockDownloadRecord } from '../../test/utils/testHelpers';

describe('Database operations', () => {
  let db;
  
  beforeEach(async () => {
    db = await openDB();
  });
  
  afterEach(async () => {
    if (db) db.close();
    // Clear database between tests
  });
  
  it('should add download record', async () => {
    const record = createMockDownloadRecord();
    await db.add('records', record);
    
    const retrieved = await db.get('records', record.id);
    expect(retrieved).toEqual(record);
  });
});
```

### 2. DOM Manipulation Testing
For content script DOM manipulation:

```typescript
import { createMockTweetElement } from '../test/utils/testHelpers';

describe('Content script', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should inject remark button', () => {
    const tweetElement = createMockTweetElement({ username: 'testuser' });
    document.body.appendChild(tweetElement);
    
    // Test DOM manipulation logic
    const button = document.querySelector('[data-testid="remark-button"]');
    expect(button).toBeInTheDocument();
  });
});
```

### 3. Async Testing
Handle asynchronous operations:

```typescript
describe('Async operations', () => {
  it('should handle promise resolution', async () => {
    const result = await someAsyncFunction();
    expect(result).toBeDefined();
  });
  
  it('should handle promise rejection', async () => {
    await expect(someFailingFunction()).rejects.toThrow('Error message');
  });
  
  it('should wait for condition', async () => {
    await waitForCondition(() => someCondition === true);
    expect(someCondition).toBe(true);
  });
});
```

## Test Utilities

### Custom Render Function
Use the custom render function for React components:

```typescript
import { render, screen } from '../test/utils/testHelpers';

// This render function includes providers and common setup
render(<YourComponent />);
```

### Mock Helpers
Available mock helpers:

- `setupChromeStorageMock(data)` - Mock Chrome storage APIs
- `createMockTweetElement(options)` - Create mock Twitter DOM elements
- `createMockDownloadRecord(overrides)` - Create mock download records
- `simulateRuntimeMessage(message)` - Simulate Chrome runtime messages

## Coverage Goals

The project aims for:
- **70%** overall code coverage
- **70%** function coverage
- **70%** line coverage
- **70%** branch coverage

Focus on testing:
1. Business logic and utilities (highest priority)
2. User interaction flows
3. Chrome extension API integrations
4. Error handling scenarios

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Use Descriptive Test Names**: Test names should clearly describe the scenario
3. **Keep Tests Isolated**: Each test should be independent and not rely on others
4. **Mock External Dependencies**: Mock Chrome APIs, network requests, and other external systems
5. **Test Error Scenarios**: Include tests for error conditions and edge cases
6. **Use Factory Functions**: Create test data using factory functions for consistency
7. **Clean Up After Tests**: Properly clean up resources, mocks, and DOM elements

## Debugging Tests

```bash
# Run specific test file
npm test -- RemarkDialog.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should save remark"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Enable verbose output
npm test -- --verbose
```