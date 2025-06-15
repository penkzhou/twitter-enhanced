import { DOMManager } from '../DOMManager';

// Mock Chrome APIs
const mockChromeRuntime = {
  getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`)
};

Object.defineProperty(global, 'chrome', {
  value: {
    runtime: mockChromeRuntime,
  },
  writable: true,
});

describe('DOMManager', () => {
  let domManager: DOMManager;
  let mockI18nGetter: jest.MockedFunction<(key: string, substitutions?: string | string[]) => string>;

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    
    // Setup mock i18n getter
    mockI18nGetter = jest.fn((key: string) => {
      const translations: Record<string, string> = {
        'ok': 'OK',
        'yes': 'Yes',
        'no': 'No',
        'addRemark': 'Add Remark',
        'editRemark': 'Edit Remark',
        'downloadMedia': 'Download Media'
      };
      return translations[key] || key;
    });

    domManager = new DOMManager(mockI18nGetter);
  });

  afterEach(() => {
    // Cleanup any remaining dialogs
    domManager.cleanup();
  });

  describe('Dialog Operations', () => {
    describe('showAlert', () => {
      it('should create and show alert dialog', async () => {
        const message = 'Test alert message';
        const alertPromise = domManager.showAlert(message);
        
        // Check that dialog was created
        const dialog = document.querySelector('.fixed.inset-0') as HTMLElement;
        expect(dialog).not.toBeNull();
        expect(dialog.innerHTML).toContain(message);
        expect(dialog.innerHTML).toContain('OK');

        // Click OK button
        const okButton = dialog.querySelector('.custom-alert-ok') as HTMLElement;
        okButton.click();

        // Wait for promise to resolve
        await alertPromise;

        // Check that dialog was removed
        expect(document.querySelector('.fixed.inset-0')).toBeNull();
      });

      it('should use i18n for OK button text', async () => {
        const alertPromise = domManager.showAlert('Test');
        
        const dialog = document.querySelector('.fixed.inset-0') as HTMLElement;
        const okButton = dialog.querySelector('.custom-alert-ok') as HTMLElement;
        
        expect(mockI18nGetter).toHaveBeenCalledWith('ok');
        expect(okButton.textContent?.trim()).toBe('OK');

        okButton.click();
        await alertPromise;
      });
    });

    describe('showConfirmDialog', () => {
      it('should create and show confirm dialog', async () => {
        const message = 'Test confirm message';
        const confirmPromise = domManager.showConfirmDialog(message);
        
        // Check that dialog was created
        const dialog = document.querySelector('.fixed.inset-0') as HTMLElement;
        expect(dialog).not.toBeNull();
        expect(dialog.innerHTML).toContain(message);
        expect(dialog.innerHTML).toContain('Yes');
        expect(dialog.innerHTML).toContain('No');

        // Click Yes button
        const yesButton = dialog.querySelector('.custom-confirm-yes') as HTMLElement;
        yesButton.click();

        // Wait for promise to resolve
        const result = await confirmPromise;
        expect(result).toBe(true);

        // Check that dialog was removed
        expect(document.querySelector('.fixed.inset-0')).toBeNull();
      });

      it('should return false when No is clicked', async () => {
        const confirmPromise = domManager.showConfirmDialog('Test');
        
        const dialog = document.querySelector('.fixed.inset-0') as HTMLElement;
        const noButton = dialog.querySelector('.custom-confirm-no') as HTMLElement;
        noButton.click();

        const result = await confirmPromise;
        expect(result).toBe(false);
      });

      it('should use i18n for button texts', async () => {
        const confirmPromise = domManager.showConfirmDialog('Test');
        
        expect(mockI18nGetter).toHaveBeenCalledWith('yes');
        expect(mockI18nGetter).toHaveBeenCalledWith('no');

        const dialog = document.querySelector('.fixed.inset-0') as HTMLElement;
        const noButton = dialog.querySelector('.custom-confirm-no') as HTMLElement;
        noButton.click();
        
        await confirmPromise;
      });
    });
  });

  describe('Button Creation', () => {
    describe('createRemarkButton', () => {
      it('should create remark button for new user', () => {
        const username = 'testuser';
        const hasRemark = false;
        const onClick = jest.fn();

        const button = domManager.createRemarkButton(username, hasRemark, onClick);

        expect(button.className).toBe('add-remark-btn');
        expect(button.textContent).toBe('Add Remark');
        expect(mockI18nGetter).toHaveBeenCalledWith('addRemark');

        // Test click handler
        button.click();
        expect(onClick).toHaveBeenCalled();
      });

      it('should create remark button for existing user', () => {
        const username = 'testuser';
        const hasRemark = true;
        const onClick = jest.fn();

        const button = domManager.createRemarkButton(username, hasRemark, onClick);

        expect(button.textContent).toBe('Edit Remark');
        expect(mockI18nGetter).toHaveBeenCalledWith('editRemark');
      });

      it('should prevent event propagation on click', () => {
        const onClick = jest.fn();
        const button = domManager.createRemarkButton('user', false, onClick);

        const event = new MouseEvent('click', { bubbles: true });
        const preventDefault = jest.spyOn(event, 'preventDefault');
        const stopPropagation = jest.spyOn(event, 'stopPropagation');

        button.dispatchEvent(event);

        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
      });
    });

    describe('createVideoDownloadButton', () => {
      it('should create video download button', () => {
        const onClick = jest.fn();
        const button = domManager.createVideoDownloadButton(onClick);

        expect(button.className).toBe('video-download-btn');
        expect(button.getAttribute('aria-label')).toBe('Download Media');
        expect(mockI18nGetter).toHaveBeenCalledWith('downloadMedia');

        // Check for download and loading icons
        expect(button.querySelector('.download-icon')).not.toBeNull();
        expect(button.querySelector('.loading-icon')).not.toBeNull();

        // Test click handler
        button.click();
        expect(onClick).toHaveBeenCalledWith(button);
      });

      it('should prevent event propagation on click', () => {
        const onClick = jest.fn();
        const button = domManager.createVideoDownloadButton(onClick);

        const event = new MouseEvent('click', { bubbles: true });
        const preventDefault = jest.spyOn(event, 'preventDefault');
        const stopPropagation = jest.spyOn(event, 'stopPropagation');

        button.dispatchEvent(event);

        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
      });
    });
  });

  describe('Element Finding', () => {
    beforeEach(() => {
      // Setup test DOM structure
      document.body.innerHTML = `
        <div data-testid="User-Name" class="user-header">
          <a href="/testuser">
            <span>@testuser</span>
          </a>
        </div>
        <div data-testid="User-Name" class="remark-button-added">
          <a href="/anotheruser">
            <span>@anotheruser</span>
          </a>
        </div>
        <article data-testid="tweet" class="tweet-element">
          <div data-testid="videoComponent"></div>
        </article>
        <article data-testid="tweet" class="video-download-added">
          <div data-testid="videoPlayer"></div>
        </article>
      `;
    });

    describe('findTweetHeaders', () => {
      it('should find tweet headers without remark button', () => {
        const headers = domManager.findTweetHeaders();
        
        expect(headers).toHaveLength(1);
        expect(headers[0].getAttribute('data-testid')).toBe('User-Name');
        expect(headers[0].classList.contains('remark-button-added')).toBe(false);
      });
    });

    describe('findVideoTweets', () => {
      it('should find video tweets without download button', () => {
        const tweets = domManager.findVideoTweets();
        
        expect(tweets).toHaveLength(1);
        expect(tweets[0].getAttribute('data-testid')).toBe('tweet');
        expect(tweets[0].classList.contains('video-download-added')).toBe(false);
      });
    });

    describe('findUsernameElements', () => {
      it('should find username elements starting with @', () => {
        const container = document.querySelector('.user-header') as Element;
        const usernameElements = domManager.findUsernameElements(container);
        
        expect(usernameElements).toHaveLength(1);
        expect(usernameElements[0].textContent).toBe('@testuser');
      });
    });
  });

  describe('Button Management', () => {
    beforeEach(() => {
      // Setup test DOM with buttons
      document.body.innerHTML = `
        <div data-testid="User-Name">
          <a href="/testuser">
            <span>@testuser</span>
          </a>
          <button class="add-remark-btn">Add Remark</button>
        </div>
        <div class="remark-button-added"></div>
        <div class="video-download-btn"></div>
        <div class="video-download-added"></div>
        <a href="/testuser" class="username-replaced" title="@testuser">
          <span>Custom Name</span>
        </a>
      `;
    });

    describe('updateRemarkButtonText', () => {
      it('should update button text for user with remark', () => {
        domManager.updateRemarkButtonText('testuser', true);
        
        const button = document.querySelector('.add-remark-btn') as HTMLElement;
        expect(button.textContent).toBe('Edit Remark');
      });

      it('should update button text for user without remark', () => {
        domManager.updateRemarkButtonText('testuser', false);
        
        const button = document.querySelector('.add-remark-btn') as HTMLElement;
        expect(button.textContent).toBe('Add Remark');
      });
    });

    describe('removeAllRemarkButtons', () => {
      it('should remove all remark-related elements', () => {
        domManager.removeAllRemarkButtons();
        
        expect(document.querySelector('.add-remark-btn')).toBeNull();
        expect(document.querySelector('.remark-button-added')).toBeNull();
        
        // Check username restoration
        const usernameElement = document.querySelector('.username-replaced') as HTMLElement;
        expect(usernameElement).toBeNull();
      });

      it('should restore original usernames', () => {
        domManager.removeAllRemarkButtons();
        
        const linkElement = document.querySelector('a[href="/testuser"]') as HTMLElement;
        const spanElement = linkElement.querySelector('span') as HTMLElement;
        
        expect(spanElement.textContent).toBe('@testuser');
        expect(linkElement.getAttribute('title')).toBeNull();
        expect(linkElement.classList.contains('username-replaced')).toBe(false);
      });
    });

    describe('removeAllVideoDownloadButtons', () => {
      it('should remove all video download related elements', () => {
        domManager.removeAllVideoDownloadButtons();
        
        expect(document.querySelector('.video-download-btn')).toBeNull();
        expect(document.querySelector('.video-download-added')).toBeNull();
      });
    });
  });

  describe('Username Replacement', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <a href="/testuser">
          <span>testuser</span>
        </a>
      `;
    });

    describe('replaceUsernameInElement', () => {
      it('should replace username with remark', () => {
        const element = document.querySelector('a[href="/testuser"]') as Element;
        domManager.replaceUsernameInElement(element, 'testuser', 'Custom Remark');
        
        const span = element.querySelector('span') as HTMLElement;
        expect(span.textContent).toBe('Custom Remark');
        expect(element.getAttribute('title')).toBe('@testuser');
        expect(element.classList.contains('username-replaced')).toBe(true);
      });

      it('should restore original username when remark is null', () => {
        const element = document.querySelector('a[href="/testuser"]') as Element;
        element.setAttribute('title', '@testuser');
        element.classList.add('username-replaced');
        
        domManager.replaceUsernameInElement(element, 'testuser', null);
        
        const span = element.querySelector('span') as HTMLElement;
        expect(span.textContent).toBe('testuser');
        expect(element.getAttribute('title')).toBeNull();
        expect(element.classList.contains('username-replaced')).toBe(false);
      });
    });

    describe('restoreUsernameInElement', () => {
      it('should restore original username', () => {
        const element = document.querySelector('a[href="/testuser"]') as Element;
        element.setAttribute('title', '@testuser');
        element.classList.add('username-replaced');
        
        domManager.restoreUsernameInElement(element, 'testuser');
        
        const span = element.querySelector('span') as HTMLElement;
        expect(span.textContent).toBe('testuser');
        expect(element.getAttribute('title')).toBeNull();
        expect(element.classList.contains('username-replaced')).toBe(false);
      });
    });
  });

  describe('Styling', () => {
    describe('injectStyles', () => {
      it('should inject CSS link into document head', () => {
        domManager.injectStyles();
        
        const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;
        expect(link).not.toBeNull();
        expect(link.href).toBe('chrome-extension://test-id/content.css');
        expect(link.type).toBe('text/css');
        expect(mockChromeRuntime.getURL).toHaveBeenCalledWith('content.css');
      });
    });
  });

  describe('Cleanup', () => {
    it('should remove all buttons and elements', () => {
      // Create some buttons and elements
      document.body.innerHTML = `
        <button class="add-remark-btn">Test</button>
        <div class="video-download-btn">Test</div>
        <div class="remark-button-added">Test</div>
        <div class="video-download-added">Test</div>
        <a href="/user" class="username-replaced" title="@user">
          <span>Custom Name</span>
        </a>
      `;
      
      // Cleanup
      domManager.cleanup();
      
      // Verify everything is removed/restored
      expect(document.querySelector('.add-remark-btn')).toBeNull();
      expect(document.querySelector('.video-download-btn')).toBeNull();
      expect(document.querySelector('.remark-button-added')).toBeNull();
      expect(document.querySelector('.video-download-added')).toBeNull();
      expect(document.querySelector('.username-replaced')).toBeNull();
    });

    it('should handle cleanup when no elements exist', () => {
      // Cleanup should not throw when no elements exist
      expect(() => domManager.cleanup()).not.toThrow();
    });

    it('should remove active dialogs when they exist', async () => {
      // Create a dialog by calling showAlert and immediately accessing the DOM
      domManager.showAlert('Test Alert');
      
      // The dialog should be in DOM now
      const dialogs = document.querySelectorAll('.fixed.inset-0');
      expect(dialogs).toHaveLength(1);
      
      // Cleanup should remove dialogs
      domManager.cleanup();
      
      // Verify dialog was removed
      expect(document.querySelector('.fixed.inset-0')).toBeNull();
    });
  });
});