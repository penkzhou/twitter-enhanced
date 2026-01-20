import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock Chrome extension APIs
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    session: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  downloads: {
    download: jest.fn(),
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
  cookies: {
    get: jest.fn(),
    getAll: jest.fn(),
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
  },
} as any;

// Mock window.gtag for Google Analytics
(global as any).gtag = jest.fn();

// Polyfill structuredClone for Node.js environments that don't have it
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Note: window.location is now configured via testEnvironmentOptions.url in jest.config.js
// This avoids issues with jsdom's non-configurable location property in Jest v30

// Mock DOM methods that might not be available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Console suppression for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Suppress known warnings that don't affect test results
    if (typeof args[0] === 'string') {
      if (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Error: Not implemented: navigation')
      ) {
        return;
      }
    }
    // Also handle Error objects
    if (
      args[0] instanceof Error &&
      args[0].message.includes('Not implemented: navigation')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
