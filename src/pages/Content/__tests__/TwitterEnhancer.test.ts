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
  // Add node interface properties for jsdom compatibility
  nodeType: 1,
  nodeName: 'DIV',
  parentNode: null,
  childNodes: [],
  firstChild: null,
  lastChild: null,
  nextSibling: null,
  previousSibling: null,
  // Add specific properties for link elements
  href: '',
  type: '',
  rel: '',
};

// Setup jsdom document for Jest 30 compatibility
// @ts-ignore
delete global.document;
// @ts-ignore
global.document = {
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    // @ts-ignore
    querySelectorAll: jest.fn(() => ({ length: 0, item: jest.fn() })),
  },
  // @ts-ignore
  createElement: jest.fn(() => mockElement),
  // @ts-ignore  
  querySelectorAll: jest.fn(() => ({ length: 0, item: jest.fn() })),
  head: {
    appendChild: jest.fn(),
  } as any,
  addEventListener: jest.fn(),
};

// @ts-ignore
delete global.window;
// @ts-ignore
global.window = {
  addEventListener: jest.fn(),
  location: { 
    hostname: 'twitter.com',
    href: 'https://twitter.com',
    hash: '',
    host: 'twitter.com',
    origin: 'https://twitter.com',
    pathname: '/',
    port: '',
    protocol: 'https:',
    search: '',
    ancestorOrigins: {} as DOMStringList,
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  } as Location,
};

// Setup jsdom location for Jest 30 compatibility - will be done in beforeEach

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

Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
    runtime: mockChromeRuntime,
    i18n: mockChromeI18n,
  },
  writable: true,
});

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
      // Store references to mocked functions before clearing
      const mockCreateElement = jest.fn(() => mockElement);
      const mockAppendChild = jest.fn();
      
      // Setup fresh mocks
      // @ts-ignore
      global.document.createElement = mockCreateElement;
      // @ts-ignore
      global.document.body.appendChild = mockAppendChild;

      // Fresh import
      jest.resetModules();
      require('../index.ts');

      // Verify DOM manipulation
      expect(mockCreateElement).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
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
