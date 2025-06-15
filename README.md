# Twitter Enhanced: Elevate Your Twitter Experience

[![Build](https://github.com/penkzhou/twitter-enhanced/actions/workflows/test.yml/badge.svg)](https://github.com/penkzhou/twitter-enhanced/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg)](https://reactjs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-48.29%25-brightgreen.svg)](https://codecov.io/gh/penkzhou/twitter-enhanced)

## Overview

Enhance your Twitter browsing with four powerful features:

1. User Remarks:
   Add personal notes to Twitter profiles. Never forget why you followed someone or what they're known for. Easily manage, edit, and organize your remarks for a more personalized Twitter experience.

2. Video Downloads:
   Seamlessly download Twitter videos with just a click. Save your favorite content directly to your chosen directory for offline viewing or sharing.

3. Multiple Video Select Download:
   When a tweet contains multiple videos, you can select and download multiple videos at once. This feature allows you to choose specific videos from a tweet and download them in one go.

4. Download Records Management:
   Keep track of all your downloaded videos with an easy-to-use management interface. View download history, search records, and manage your downloads efficiently.

This extension puts you in control, allowing you to customize your Twitter interface and interact with content in new ways. Streamline your social media experience with Twitter Enhanced - your personal Twitter assistant.

## Features

- Add custom remarks to Twitter usernames
- Edit existing remarks
- Remove remarks to restore original usernames
- Download Twitter videos directly from tweets
- Select and download multiple videos from a single tweet
- Manage download records with a user-friendly interface
- Search and filter your download history
- Locate downloaded files on your computer
- Clear individual or all download records
- Remarks and download records persist across sessions and page reloads
- Seamless integration with Twitter's interface
- Multi-language support (English, Spanish, French, German, Japanese, Russian, Portuguese, and Chinese)

## Installation

### From Source

1. Clone this repository or download the source code.
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

### From Chrome Web Store

(Note: Include this section once the extension is published on the Chrome Web Store)

1. Visit the [Twitter Enhanced Extension](https://chrome.google.com/webstore/detail/cdcjmkiabmominbckhhcbjleidhddjfc) page on the Chrome Web Store.
2. Click "Add to Chrome" to install the extension.

## Usage

### User Remarks

1. Navigate to Twitter.com.
2. Next to each username, you'll see an "Add Remark" button.
3. Click this button to add a custom remark for the user.
4. Enter your desired remark in the prompt and click OK.
5. The username will now display your custom remark.
6. To edit a remark, click the "Edit Remark" button and enter a new remark.
7. To remove a remark, click "Edit Remark" and leave the input empty.

### Video Downloads

1. When viewing a tweet with a video, you'll see a "Download Video" button.
2. Click the button to download the video to your default downloads folder.
3. The extension will notify you when the download is complete.

### Multiple Video Select Download

1. When viewing a tweet with multiple videos, you'll see a "Download Video" button.
2. Click the button to open the video selection dialog.
3. Select the videos you want to download by clicking on them.
4. Click "Download Selected" to download the selected videos to your default downloads folder.
5. The extension will notify you when the downloads are complete.

### Download Records Management

1. Click on the extension icon in your browser toolbar.
2. Select "Manage Download Records" from the popup menu.
3. You'll see a list of all your downloaded videos, including tweet text and download date.
4. Use the search bar to filter records by tweet ID or filename.
5. Click "Locate File" to open the folder containing the downloaded video.
6. Use the "Delete" button to remove individual records.
7. The "Clear All Records" button at the bottom allows you to delete all download history.

### Language Settings

1. Click on the extension icon in your browser toolbar.
2. Select "Settings" from the popup menu.
3. Choose your preferred language from the dropdown menu.
4. The extension interface will update to reflect your chosen language.

## Supported Languages

- English (default)
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Japanese (日本語)
- Chinese (中文)

## Development

This extension is built using modern web technologies with a comprehensive test suite and CI/CD pipeline.

### 🛠️ Tech Stack

- **Language**: TypeScript 5.0+
- **Frontend**: React 19 with React DOM
- **Styling**: Tailwind CSS 4.0
- **Testing**: Jest with React Testing Library
- **Bundling**: Webpack 5
- **Linting**: ESLint with TypeScript support
- **CI/CD**: GitHub Actions with automated testing and coverage reporting

### 🚀 Quick Start

1. **Prerequisites**: Node.js (v16+) and npm
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Development build**:
   ```bash
   npm run dev
   ```
4. **Production build**:
   ```bash
   npm run build
   ```

### 🧪 Testing & Quality Assurance

This project follows Test-Driven Development (TDD) practices with comprehensive test coverage:

#### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI (with coverage)
npm run test:ci
```

#### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run prettier
```

#### Test Coverage

Current test coverage: **48.29%** (135 tests across 9 test suites)

- ✅ **RemarkDialog**: 100% coverage
- ✅ **TwitterAPI**: 94.66% coverage  
- ✅ **Logger**: 100% coverage
- ✅ **Analytics**: 100% coverage
- ✅ **Database**: 78.33% coverage
- ✅ **VideoSelectionDialog**: 95.23% coverage

#### Development Workflow

Follow this workflow for code changes:

```bash
# 1. Make your changes
# 2. Run tests
npm test

# 3. Check code quality
npm run lint

# 4. Build to verify TypeScript compilation
npm run build

# 5. Check coverage
npm run test:coverage
```

### 📁 Project Structure

```
src/
├── components/           # React components
│   ├── __tests__/       # Component tests
│   ├── RemarkDialog.tsx
│   └── VideoSelectionDialog.tsx
├── pages/               # Extension pages
│   ├── Content/         # Content script (main business logic)
│   ├── Background/      # Background script & API
│   ├── Popup/           # Extension popup
│   └── Options/         # Settings page
├── utils/               # Utility functions
│   ├── __tests__/       # Utility tests
│   ├── db.ts           # IndexedDB operations
│   └── logger.ts       # Analytics logging
├── lib/                 # Core libraries
└── test/               # Test configuration
```

### 🔧 Chrome Extension Development

To load the extension in Chrome:

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `build/` directory

### 🔄 Continuous Integration

The project uses GitHub Actions for:

- **Automated Testing**: Runs on every push and PR
- **Code Coverage**: Reports to Codecov
- **Build Verification**: Ensures TypeScript compilation
- **Multi-Node Testing**: Tests on Node.js 18.x, 20.x, 22.x

### 🌐 Adding a New Language

To add support for a new language:

1. Create a new JSON file in the `src/_locales` directory, named after the language's locale code (e.g., `fr` for French).
2. Copy the contents of `src/_locales/en/messages.json` to your new file.
3. Translate all the message values to the new language.
4. Update the supported languages list in this README and in the extension's settings.

### 🔍 Debugging

- **Source Maps**: Available in development builds for easier debugging
- **Console Logging**: Use the Logger utility for consistent logging
- **React DevTools**: Supported for component debugging
- **Chrome Extension DevTools**: Use Chrome's extension debugging tools

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Process

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a new branch for your feature/fix
4. **Install** dependencies: `npm install`
5. **Write tests** for your changes (TDD approach)
6. **Implement** your feature/fix
7. **Run the test suite**: `npm test`
8. **Check code quality**: `npm run lint`
9. **Build** to verify: `npm run build`
10. **Submit** a Pull Request

### Pull Request Requirements

- ✅ All tests must pass
- ✅ Code coverage should not decrease significantly
- ✅ ESLint checks must pass
- ✅ TypeScript compilation must succeed
- ✅ Include tests for new functionality
- ✅ Update documentation if needed

### Code Standards

- Follow existing TypeScript/React patterns
- Use descriptive variable and function names
- Write comprehensive tests for new features
- Maintain consistent code style (use Prettier)
- Document complex business logic

## 📊 Project Statistics

- **Total Tests**: 135 across 9 test suites
- **Test Coverage**: 48.29% statements, 44.44% branches
- **Languages Supported**: 12 international languages
- **TypeScript Files**: 100% typed codebase
- **Active CI/CD**: Automated testing and deployment

## 📜 License

[MIT License](LICENSE) - feel free to use this project for personal or commercial purposes.

## 🔒 Privacy & Security

- **Local Storage Only**: All data (remarks, download records) stored locally in your browser
- **No External Servers**: No data transmitted to external services
- **Chrome Permissions**: Only requests necessary permissions for functionality
- **Open Source**: Full source code available for security auditing

## 🆘 Support & Issues

- **Bug Reports**: [GitHub Issues](https://github.com/penkzhou/twitter-enhanced/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/penkzhou/twitter-enhanced/discussions)
- **Security Issues**: Please report via email or private GitHub issue
- **Documentation**: Check our [Wiki](https://github.com/penkzhou/twitter-enhanced/wiki) for detailed guides

## 🎯 Roadmap

- [ ] Enhanced video format support
- [ ] Bulk operations for remarks
- [ ] Advanced search and filtering
- [ ] Import/export functionality
- [ ] Performance optimizations
- [ ] Additional social media platform support

---

## 🙏 Acknowledgments

Thanks to all contributors who help make Twitter Enhanced better! Special thanks to:

- The React and TypeScript communities
- Chrome Extension API maintainers  
- Testing library contributors
- All users who provide feedback and bug reports

**Enjoy using Twitter Enhanced!** 🚀
