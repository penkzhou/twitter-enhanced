// Mock the Analytics module before importing the file under test
import { Analytics } from '../../../lib/ga';

jest.mock('../../../lib/ga', () => ({
  Analytics: {
    fireEvent: jest.fn(),
    fireErrorEvent: jest.fn(),
    firePageViewEvent: jest.fn(),
  },
}));

// Get typed mocks
const mockAnalytics = Analytics as jest.Mocked<typeof Analytics>;

// Mock chrome runtime
const mockAddListener = jest.fn();
const mockSendResponse = jest.fn();

// Create a reference to store the actual message listener
let messageListener:
  | ((request: any, sender: any, sendResponse: any) => boolean)
  | null = null;

Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      onMessage: {
        addListener: jest.fn((listener) => {
          messageListener = listener;
          mockAddListener(listener);
        }),
      },
    },
  },
  writable: true,
});

describe('Background Analytics Message Handler', () => {
  let mockSender: chrome.runtime.MessageSender;

  beforeAll(() => {
    // Import the analytics module to trigger the listener registration
    require('../analytics');
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Set up mock functions
    mockSendResponse.mockClear();
    mockSender = {
      tab: {
        id: 1,
        url: 'https://twitter.com',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        incognito: false,
        selected: true,
        discarded: false,
        autoDiscardable: true,
        frozen: false,
        groupId: -1,
      } as chrome.tabs.Tab,
      frameId: 0,
      id: 'test-extension-id',
    };
  });

  describe('fireAnalyticsEvent action', () => {
    it('should call Analytics.fireEvent with correct parameters', () => {
      const request = {
        action: 'fireAnalyticsEvent',
        eventName: 'button_click',
        params: { buttonName: 'download', position: 'header' },
      };

      const result = messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireEvent).toHaveBeenCalledWith('button_click', {
        buttonName: 'download',
        position: 'header',
      });
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(true);
    });

    it('should handle events with empty params', () => {
      const request = {
        action: 'fireAnalyticsEvent',
        eventName: 'simple_event',
        params: {},
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireEvent).toHaveBeenCalledWith('simple_event', {});
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle events with complex nested params', () => {
      const request = {
        action: 'fireAnalyticsEvent',
        eventName: 'complex_event',
        params: {
          user: { id: 123, name: 'test' },
          settings: { theme: 'dark', notifications: true },
          metadata: [1, 2, 3],
        },
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireEvent).toHaveBeenCalledWith(
        'complex_event',
        request.params
      );
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('fireAnalyticsErrorEvent action', () => {
    it('should call Analytics.fireErrorEvent with correct error message', () => {
      const request = {
        action: 'fireAnalyticsErrorEvent',
        error: 'Network request failed',
      };

      const result = messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireErrorEvent).toHaveBeenCalledWith(
        'Network request failed'
      );
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(true);
    });

    it('should handle empty error messages', () => {
      const request = {
        action: 'fireAnalyticsErrorEvent',
        error: '',
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireErrorEvent).toHaveBeenCalledWith('');
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle error messages with special characters', () => {
      const request = {
        action: 'fireAnalyticsErrorEvent',
        error: "Error: Cannot read property 'x' of undefined at line 42",
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireErrorEvent).toHaveBeenCalledWith(request.error);
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('fireAnalyticsPageLoadEvent action', () => {
    it('should call Analytics.firePageViewEvent with correct parameters', () => {
      const request = {
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Options Page',
        pageLocation: 'options',
        params: { section: 'general', userId: 'user123' },
      };

      const result = messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.firePageViewEvent).toHaveBeenCalledWith(
        'Options Page',
        'options',
        { section: 'general', userId: 'user123' }
      );
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
      expect(result).toBe(true);
    });

    it('should handle page views with empty params', () => {
      const request = {
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Empty Page',
        pageLocation: 'empty',
        params: {},
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.firePageViewEvent).toHaveBeenCalledWith(
        'Empty Page',
        'empty',
        {}
      );
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle page titles and locations with special characters', () => {
      const request = {
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Page with émojis 🎉 and symbols!',
        pageLocation: 'special-chars/中文',
        params: { feature: 'unicode-support' },
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.firePageViewEvent).toHaveBeenCalledWith(
        'Page with émojis 🎉 and symbols!',
        'special-chars/中文',
        { feature: 'unicode-support' }
      );
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('Unknown actions', () => {
    it('should not call any Analytics methods for unknown actions', () => {
      const request = {
        action: 'unknownAction',
        data: 'some data',
      };

      const result = messageListener!(request, mockSender, mockSendResponse);

      expect(mockAnalytics.fireEvent).not.toHaveBeenCalled();
      expect(mockAnalytics.fireErrorEvent).not.toHaveBeenCalled();
      expect(mockAnalytics.firePageViewEvent).not.toHaveBeenCalled();
      expect(mockSendResponse).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not call sendResponse for unhandled actions', () => {
      const request = {
        action: 'someOtherAction',
        value: 42,
      };

      messageListener!(request, mockSender, mockSendResponse);

      expect(mockSendResponse).not.toHaveBeenCalled();
    });
  });

  describe('Message listener registration', () => {
    it('should register a message listener on chrome.runtime.onMessage', () => {
      expect(messageListener).toBeTruthy();
      expect(typeof messageListener).toBe('function');
    });

    it('should return true to indicate asynchronous response', () => {
      const request = {
        action: 'fireAnalyticsEvent',
        eventName: 'test',
        params: {},
      };

      const result = messageListener!(request, mockSender, mockSendResponse);

      expect(result).toBe(true);
    });
  });

  describe('Message sender validation', () => {
    it('should work with different sender configurations', () => {
      const differentSenders = [
        { tab: { id: 1 }, frameId: 0 },
        { tab: { id: 2, url: 'https://x.com' }, frameId: 1 },
        { frameId: 0 }, // No tab info
        {}, // Minimal sender
      ];

      const request = {
        action: 'fireAnalyticsEvent',
        eventName: 'test',
        params: {},
      };

      differentSenders.forEach((sender, index) => {
        // Reset analytics mock before each test to prevent error propagation
        jest.clearAllMocks();
        mockAnalytics.fireEvent.mockClear();

        const mockResponse = jest.fn();

        messageListener!(request, sender, mockResponse);

        expect(mockResponse).toHaveBeenCalledWith({ success: true });
      });
    });
  });
});
