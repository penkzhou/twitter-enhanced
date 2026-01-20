# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Builds the extension for production (generates build/ directory and zip package)
- **Development**: `npm run dev` - Starts development mode with hot reload for popup/options pages
- **Lint**: `npm run lint` - Runs ESLint on TypeScript files in src/
- **Format**: `npm run prettier` - Formats code using Prettier
- **Test Server**: `npm run start` - Starts development web server for testing
- **Test**: `npm test` - Runs all tests once
- **Test Watch**: `npm run test:watch` - Runs tests in watch mode for development
- **Test Coverage**: `npm run test:coverage` - Runs tests with coverage report
- **Test CI**: `npm run test:ci` - Runs tests in CI mode (no watch, with coverage)

## Extension Architecture

This is a Chrome Extension (Manifest V3) that enhances Twitter/X.com with user remarks and video download capabilities.

### Core Components

**Entry Points:**

- **Background Service Worker**: `src/pages/Background/index.ts` - Handles video downloads and Twitter API calls
- **Content Script**: `src/pages/Content/index.ts` - Injects UI elements into Twitter/X.com pages
- **Popup**: `src/pages/Popup/index.tsx` - Extension popup interface
- **Options**: `src/pages/Options/index.tsx` - Settings page
- **Download Records**: `src/pages/DownloadRecords/index.tsx` - Download history management

### Key Services

- **TwitterAPI**: Singleton service at `src/pages/Background/modules/twitter-api.ts` that handles Twitter's internal GraphQL API using hardcoded bearer tokens and cookies
- **Database**: IndexedDB wrapper at `src/utils/db.ts` for storing download records
- **Analytics**: Google Analytics 4 integration at `src/lib/ga.ts` for usage tracking

### Communication Pattern

Uses Chrome's message passing system:

- Content script sends `getVideoInfo` and `downloadVideo` actions to background script
- Background script responds with video data or download status
- Settings changes propagate through Chrome storage and message passing

### Data Storage

- **Chrome Storage Sync**: User settings, feature toggles, user remarks
- **IndexedDB**: Download records with `tweetId` and `downloadDate` indexes
- **Chrome Storage Local/Session**: Analytics data

### UI Framework

- **React 19** with functional components and hooks
- **Tailwind CSS 4** for styling with HSL color variables for dark mode
- **Radix UI** components for accessibility (@radix-ui/react-dialog, @radix-ui/react-slot)
- **Shadcn/ui** component library in `src/components/ui/`

### Build System

- **Webpack 5** with multiple entry points defined in `webpack.config.js`
- **TypeScript** compilation with strict type checking
- **React Fast Refresh** for development hot reloading (popup/options only)
- **PostCSS** processes Tailwind CSS
- **Production builds** include minification and ZIP packaging

### Domain Support

Supports both `twitter.com` and `x.com` domains with identical functionality.

### Internationalization

Supports 12 languages with locale files in `src/_locales/`. Uses Chrome extension i18n API with `__MSG_*__` message format.

### Testing Framework

- **Jest** with jsdom environment for unit and component testing
- **React Testing Library** for component interaction testing
- **Chrome Extension Mocks** for browser API testing (jest-webextension-mock)
- **FakeIndexedDB** for database testing
- Test files located in `__tests__/` directories or `.test.ts/.test.tsx` files
- Test utilities and helpers in `src/test/utils/testHelpers.ts`
- Run `npm test` before committing changes

### CI/CD Pipeline

GitHub Actions workflows provide automated testing and deployment:

- **Test Workflow** (`.github/workflows/test.yml`) - Runs on push/PR to main/develop
  - Tests on Node.js 18.x and 20.x
  - Runs lint, prettier, and test suite with coverage
  - Validates build process
  - Simplified and reliable execution

- **Release Workflow** (`.github/workflows/release.yml`) - Automated releases
  - Triggered on version tags (v\*)
  - Full test suite execution
  - Automated GitHub release creation
  - Extension ZIP artifact upload

All PRs require passing CI checks before merge. Use PR template for consistent reviews.

### Security Notes

- Uses Twitter's internal API with hardcoded bearer token (requires periodic updates)
- Requires `cookies` permission to access Twitter authentication
- Content Security Policy enforced for extension pages
- Host permissions limited to Twitter/X.com domains only

## Coding Guidelines

### Error Handling

- **Chrome Storage API**: Always check `chrome.runtime.lastError` in callbacks:

  ```typescript
  chrome.storage.sync.set({ key: value }, () => {
    if (chrome.runtime.lastError) {
      console.error('Storage error:', chrome.runtime.lastError);
      return;
    }
    // Success handling
  });
  ```

- **IndexedDB Operations**: Wrap all database operations in try-catch:

  ```typescript
  try {
    await db.remove(id);
  } catch (error) {
    console.error('Database operation failed:', error);
    // Handle error appropriately
  }
  ```

- **API Return Values**: Distinguish between "no data" and "error":
  - Return empty array `[]` when data is not found (not an error)
  - Return `null` when an error occurs
  - This allows callers to distinguish between the two cases

- **FileReader**: Always set `onerror` handler when using FileReader

### Accessibility

- All icon-only buttons must have `aria-label` for screen readers
- Use semantic HTML elements where possible
- Ensure interactive elements are keyboard accessible
- Use i18n messages for aria-labels to support localization

### Code Quality

- Remove unused props/variables rather than prefixing with `_`
- Keep comments synchronized with code implementation
- Prefer explicit return types for functions
- Comments should describe "why" not just "what"

### Avoid Redundant Code

- **Redundant ternary operators**: Don't use ternary when both branches return the same value:

  ```typescript
  // ❌ Bad - both branches return the same value
  backgroundColor: isDarkMode
    ? 'rgba(29, 155, 240, 0.1)'
    : 'rgba(29, 155, 240, 0.1)';

  // ✅ Good - just use the value directly
  backgroundColor: 'rgba(29, 155, 240, 0.1)';
  ```

- **DRY principle**: Extract repeated code patterns into shared utilities or hooks:
  - Theme utilities (`getTheme()`) should be in a shared module
  - Dark mode detection should use a custom hook (`useDarkMode`)
  - Common SVG icons should be extracted to `src/components/icons/`

### Testing Guidelines

- **Test all code paths**: Ensure conditional logic (especially dark/light mode) has test coverage
- **Test UI interactions**: Focus/blur states, hover effects, and animations should be tested
- **Test dynamic content**: Character counters, live updates, and conditional rendering
- **Mock browser APIs properly**: When mocking `getComputedStyle` or `matchMedia`, include all required properties:
  ```typescript
  // ✅ Complete mock for getComputedStyle
  window.getComputedStyle = jest.fn().mockReturnValue({
    backgroundColor: 'rgb(0, 0, 0)',
    getPropertyValue: jest.fn().mockReturnValue(''),
  });
  ```

### Best Practices Documentation

See `docs/best-practices/` for detailed guidelines:

- `error-handling.md` - Error handling patterns for Chrome APIs and IndexedDB
- `accessibility.md` - Accessibility requirements and examples
- `code-comments.md` - Comment standards and synchronization
- `code-quality.md` - DRY principle, avoiding redundancy, testing coverage
