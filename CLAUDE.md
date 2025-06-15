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

### Security Notes

- Uses Twitter's internal API with hardcoded bearer token (requires periodic updates)
- Requires `cookies` permission to access Twitter authentication
- Content Security Policy enforced for extension pages
- Host permissions limited to Twitter/X.com domains only