# Twitter Enhanced: Elevate Your Twitter Experience

[![CI](https://github.com/penkzhou/twitter_enhanced/actions/workflows/test.yml/badge.svg)](https://github.com/penkzhou/twitter_enhanced/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/penkzhou/twitter_enhanced/branch/main/graph/badge.svg)](https://codecov.io/gh/penkzhou/twitter_enhanced)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

This extension is built using TypeScript. To set up the development environment:

1. Install Node.js and npm.
2. Run `npm install` to install dependencies.
3. Use `npm run build` to compile TypeScript files.
4. For continuous compilation during development, use `npm run watch`.

### Adding a New Language

To add support for a new language:

1. Create a new JSON file in the `_locales` directory, named after the language's locale code (e.g., `fr` for French).
2. Copy the contents of `_locales/en/messages.json` to your new file.
3. Translate all the message values to the new language.
4. Update the supported languages list in this README and in the extension's settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Privacy

This extension stores remarks and download records locally in your browser. No data is sent to external servers.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

---

We hope you enjoy using Twitter Enhanced!
