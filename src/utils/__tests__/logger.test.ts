import { Logger } from '../logger';

// Mock chrome.runtime.sendMessage
const mockSendMessage = jest.fn();
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: mockSendMessage,
    },
  },
  writable: true,
});

describe('Logger', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  describe('logPageView', () => {
    it('should send correct message for page view logging', () => {
      const pageTitle = 'Test Page';
      const pageLocation = 'test-location';
      const params = { userId: '123', feature: 'remarks' };

      Logger.logPageView(pageTitle, pageLocation, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Test Page',
        pageLocation: 'test-location',
        params: { userId: '123', feature: 'remarks' },
      });
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle empty params object', () => {
      Logger.logPageView('Empty Test', 'empty-location', {});

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Empty Test',
        pageLocation: 'empty-location',
        params: {},
      });
    });

    it('should handle complex params object', () => {
      const complexParams = {
        nested: { data: { value: 42 } },
        array: [1, 2, 3],
        boolean: true,
        null: null,
        undefined: undefined,
      };

      Logger.logPageView('Complex Test', 'complex-location', complexParams);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsPageLoadEvent',
        pageTitle: 'Complex Test',
        pageLocation: 'complex-location',
        params: complexParams,
      });
    });
  });

  describe('logEvent', () => {
    it('should send correct message for event logging', () => {
      const eventName = 'button_click';
      const params = { buttonName: 'download', position: 'top' };

      Logger.logEvent(eventName, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsEvent',
        eventName: 'button_click',
        params: { buttonName: 'download', position: 'top' },
      });
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle event without params', () => {
      Logger.logEvent('simple_event', {});

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsEvent',
        eventName: 'simple_event',
        params: {},
      });
    });

    it('should handle special characters in event name', () => {
      const specialEventName = 'event-with_special.chars:test';
      const params = { data: 'value' };

      Logger.logEvent(specialEventName, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsEvent',
        eventName: 'event-with_special.chars:test',
        params: { data: 'value' },
      });
    });

    it('should handle numeric and boolean values in params', () => {
      const params = {
        count: 42,
        enabled: true,
        disabled: false,
        score: 3.14,
        timestamp: Date.now(),
      };

      Logger.logEvent('numeric_test', params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsEvent',
        eventName: 'numeric_test',
        params: params,
      });
    });
  });

  describe('logError', () => {
    it('should send correct message for error logging', () => {
      const error = 'Network connection failed';
      const params = { endpoint: '/api/data', retry: 3 };

      Logger.logError(error, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsErrorEvent',
        error: 'Network connection failed',
        params: { endpoint: '/api/data', retry: 3 },
      });
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle empty error message', () => {
      Logger.logError('', { context: 'test' });

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsErrorEvent',
        error: '',
        params: { context: 'test' },
      });
    });

    it('should handle error with stack trace information', () => {
      const errorMessage = 'TypeError: Cannot read property of undefined';
      const params = {
        stack: 'Error at line 42 in file.js',
        function: 'handleUserClick',
        component: 'RemarkDialog',
      };

      Logger.logError(errorMessage, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsErrorEvent',
        error: errorMessage,
        params: params,
      });
    });

    it('should handle long error messages', () => {
      const longError = 'A'.repeat(1000);
      const params = { severity: 'high' };

      Logger.logError(longError, params);

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'fireAnalyticsErrorEvent',
        error: longError,
        params: params,
      });
    });
  });

  describe('Static method behavior', () => {
    it('should be accessible as static methods', () => {
      expect(typeof Logger.logPageView).toBe('function');
      expect(typeof Logger.logEvent).toBe('function');
      expect(typeof Logger.logError).toBe('function');
    });

    it('should not require instantiation', () => {
      // This test ensures we can call methods without creating an instance
      expect(() => {
        Logger.logEvent('test', {});
      }).not.toThrow();
    });
  });

  describe('Chrome runtime integration', () => {
    it('should handle chrome.runtime.sendMessage being undefined', () => {
      // Temporarily remove chrome.runtime.sendMessage
      const originalChrome = global.chrome;
      delete (global as any).chrome;

      expect(() => {
        Logger.logEvent('test', {});
      }).toThrow();

      // Restore chrome object
      global.chrome = originalChrome;
    });

    it('should call chrome.runtime.sendMessage for all log methods', () => {
      Logger.logPageView('test', 'test', {});
      Logger.logEvent('test', {});
      Logger.logError('test', {});

      expect(mockSendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Parameter validation', () => {
    it('should accept any type of params object', () => {
      const testCases = [
        {},
        { key: 'value' },
        { nested: { deep: { value: true } } },
        { array: [1, 2, 3] },
        { mixed: { string: 'test', number: 42, boolean: true } },
      ];

      testCases.forEach((params, index) => {
        expect(() => {
          Logger.logEvent(`test_${index}`, params);
        }).not.toThrow();
      });

      expect(mockSendMessage).toHaveBeenCalledTimes(testCases.length);
    });

    it('should preserve param data types', () => {
      const params = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        object: { nested: 'value' },
        array: [1, 'two', true],
      };

      Logger.logEvent('type_test', params);

      const calledWith = mockSendMessage.mock.calls[0][0];
      expect(calledWith.params).toEqual(params);
    });
  });
});