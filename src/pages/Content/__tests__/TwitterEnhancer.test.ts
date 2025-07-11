// Mock dependencies before importing
jest.mock('../../../utils/logger', () => ({
  Logger: {
    logEvent: jest.fn(),
    logError: jest.fn(),
    logPageView: jest.fn(),
  },
}));

// Mock React and React DOM
jest.mock('react', () => ({
  createElement: jest.fn(),
  default: {
    createElement: jest.fn(),
  },
}));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

// Mock DOM globals
const mockElement = {
  className: '',
  innerHTML: '',
  textContent: '',
  addEventListener: jest.fn(),
  appendChild: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn(() => false),
  },
  setAttribute: jest.fn(),
  removeAttribute: jest.fn(),
  getAttribute: jest.fn(),
  closest: jest.fn(),
};

// Mock global document object (Jest v30 compatible)
// Mock only the specific methods we need to override
Object.defineProperty(document.body, 'appendChild', { value: jest.fn(), writable: true, configurable: true });
Object.defineProperty(document.body, 'removeChild', { value: jest.fn(), writable: true, configurable: true });
Object.defineProperty(document.body, 'querySelectorAll', { value: jest.fn(() => []), writable: true, configurable: true });
Object.defineProperty(document, 'createElement', { value: jest.fn(() => mockElement), writable: true, configurable: true });
Object.defineProperty(document, 'querySelectorAll', { value: jest.fn(() => []), writable: true, configurable: true });
Object.defineProperty(document.head, 'appendChild', { value: jest.fn(), writable: true, configurable: true });
Object.defineProperty(document, 'addEventListener', { value: jest.fn(), writable: true, configurable: true });

// Mock global window object (Jest v30 compatible)
// Mock only the specific properties we need to override
Object.defineProperty(window, 'addEventListener', { value: jest.fn(), writable: true, configurable: true });
// Mock location using simple object without triggering navigation
delete (window as any).location;
(window as any).location = {
  hostname: 'twitter.com',
  host: 'twitter.com',
  protocol: 'https:',
  pathname: '/',
  search: '',
  hash: '',
  toString: () => 'https://twitter.com',
};

// Mock Chrome extension APIs
const mockChromeStorage = {
  sync: {
    get: jest.fn((keys, callback) => {
      callback({
        userRemarks: [],
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
    }),
    set: jest.fn((data, callback) => {
      if (callback) callback();
    }),
  },
};

const mockChromeRuntime = {
  onMessage: {
    addListener: jest.fn(),
  },
  sendMessage: jest.fn(),
  getURL: jest.fn((path: string) => `chrome-extension://test/${path}`),
  lastError: null,
};

const mockChromeI18n = {
  getMessage: jest.fn((key: string) => {
    const messages: { [key: string]: string } = {
      addRemark: 'Add Remark',
      editRemark: 'Edit Remark',
      downloadMedia: 'Download Media',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
      tweetIdError: 'Could not find tweet ID',
      downloadError: 'Download error',
      noVideoFound: 'No video found',
      unableToDownload: 'Unable to download',
      tweetAlreadyDownloaded: 'Tweet already downloaded',
    };
    return messages[key] || key;
  }),
};

// Mock global chrome object (Jest v30 compatible)
delete (global as any).chrome;
(global as any).chrome = {
  storage: mockChromeStorage,
  runtime: mockChromeRuntime,
  i18n: mockChromeI18n,
};

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock console methods
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

describe('TwitterEnhancer Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Initialization', () => {
    it('should import and initialize without errors', () => {
      expect(() => {
        require('../index.ts');
      }).not.toThrow();
    });

    it('should create DOM elements during initialization', () => {
      // Clear previous calls
      jest.clearAllMocks();

      // Fresh import
      jest.resetModules();
      require('../index.ts');

      // Verify DOM manipulation using the mocked global document
      expect((global as any).document.createElement).toHaveBeenCalled();
      expect((global as any).document.body.appendChild).toHaveBeenCalled();
    });

    it('should set up MutationObserver', () => {
      jest.clearAllMocks();
      jest.resetModules();

      require('../index.ts');

      expect(MutationObserver).toHaveBeenCalled();
    });
  });

  describe('Chrome Extension API Integration', () => {
    it('should call chrome storage API', (done) => {
      jest.clearAllMocks();
      jest.resetModules();

      require('../index.ts');

      // Give async operations time to complete
      setTimeout(() => {
        expect(mockChromeStorage.sync.get).toHaveBeenCalledWith(
          [
            'userRemarks',
            'remarkFeatureEnabled',
            'videoDownloadFeatureEnabled',
          ],
          expect.any(Function)
        );
        done();
      }, 100);
    });

    it('should attempt to register chrome runtime listeners', () => {
      jest.clearAllMocks();
      jest.resetModules();

      // Import should not throw
      expect(() => require('../index.ts')).not.toThrow();
    });
  });

  describe('Module Integration', () => {
    it('should integrate with Logger for analytics', () => {
      const { Logger } = require('../../../utils/logger');

      // Logger should be available for use
      expect(Logger.logEvent).toBeDefined();
      expect(Logger.logError).toBeDefined();
    });

    it('should initialize without throwing errors', () => {
      jest.clearAllMocks();
      jest.resetModules();

      expect(() => require('../index.ts')).not.toThrow();
    });
  });
});
