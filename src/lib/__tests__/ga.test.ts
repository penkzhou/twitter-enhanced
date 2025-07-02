import { Analytics } from '../ga';
import { AnalyticsError } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-12345'),
  },
  writable: true,
});

// Mock Chrome Storage APIs
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
  session: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

Object.defineProperty(global, 'chrome', {
  value: {
    storage: mockChromeStorage,
  },
  writable: true,
});

// Mock console.log and console.error
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
};

global.console = {
  ...console,
  log: mockConsole.log,
  error: mockConsole.error,
};

// Mock environment variables
const originalEnv = process.env;

describe('Analytics', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    // Reset environment variables
    process.env = {
      ...originalEnv,
      GA_MEASUREMENT_ID: 'G-TEST123',
      GA_API_SECRET: 'test-secret',
    };

    // Default mock responses
    mockChromeStorage.local.get.mockResolvedValue({});
    mockChromeStorage.local.set.mockResolvedValue(undefined);
    mockChromeStorage.session.get.mockResolvedValue({});
    mockChromeStorage.session.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Client ID Management', () => {
    it('should generate new client ID if none exists', async () => {
      mockChromeStorage.local.get.mockResolvedValue({});

      const clientId = await Analytics.getOrCreateClientId();

      expect(clientId).toBe('mock-uuid-12345');
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('clientId');
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        clientId: 'mock-uuid-12345',
      });
    });

    it('should reuse existing client ID', async () => {
      const existingClientId = 'existing-client-id';
      mockChromeStorage.local.get.mockResolvedValue({
        clientId: existingClientId,
      });

      const clientId = await Analytics.getOrCreateClientId();

      expect(clientId).toBe(existingClientId);
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('clientId');
      expect(mockChromeStorage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    const mockCurrentTime = 1640995200000; // 2022-01-01 00:00:00

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(mockCurrentTime);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create new session if none exists', async () => {
      mockChromeStorage.session.get.mockResolvedValue({});

      const sessionId = await Analytics.getOrCreateSessionId();

      expect(sessionId).toBe(mockCurrentTime.toString());
      expect(mockChromeStorage.session.get).toHaveBeenCalledWith('sessionData');
      expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
        sessionData: {
          session_id: mockCurrentTime.toString(),
          timestamp: mockCurrentTime.toString(),
        },
      });
    });

    it('should extend valid session', async () => {
      const existingSessionId = 'existing-session-123';
      const recentTimestamp = mockCurrentTime - 10 * 60 * 1000; // 10 minutes ago

      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: existingSessionId,
          timestamp: recentTimestamp,
        },
      });

      const sessionId = await Analytics.getOrCreateSessionId();

      expect(sessionId).toBe(existingSessionId);
      expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
        sessionData: {
          session_id: existingSessionId,
          timestamp: mockCurrentTime,
        },
      });
    });

    it('should create new session after expiration', async () => {
      const expiredTimestamp = mockCurrentTime - 35 * 60 * 1000; // 35 minutes ago (expired)

      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: 'old-session-id',
          timestamp: expiredTimestamp,
        },
      });

      const sessionId = await Analytics.getOrCreateSessionId();

      expect(sessionId).toBe(mockCurrentTime.toString());
      expect(mockChromeStorage.session.set).toHaveBeenCalledWith({
        sessionData: {
          session_id: mockCurrentTime.toString(),
          timestamp: mockCurrentTime.toString(),
        },
      });
    });

    it('should handle session data with string timestamp', async () => {
      const recentTimestamp = mockCurrentTime - 10 * 60 * 1000;
      const existingSessionId = 'existing-session-456';

      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: existingSessionId,
          timestamp: recentTimestamp.toString(), // String timestamp
        },
      });

      const sessionId = await Analytics.getOrCreateSessionId();

      expect(sessionId).toBe(existingSessionId);
    });
  });

  describe('Event Firing', () => {
    beforeEach(() => {
      // Mock successful fetch response
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Success',
      } as Response);

      // Mock storage methods for session/client ID
      mockChromeStorage.local.get.mockResolvedValue({
        clientId: 'test-client-id',
      });
      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: 'test-session-id',
          timestamp: Date.now(),
        },
      });
    });

    it('should fire events with correct payload', async () => {
      const eventName = 'test_event';
      const eventParams = { custom_param: 'test_value' };

      await Analytics.fireEvent(eventName, eventParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google-analytics.com/mp/collect'),
        {
          method: 'POST',
          body: JSON.stringify({
            client_id: 'test-client-id',
            events: [
              {
                name: eventName,
                params: {
                  ...eventParams,
                  session_id: 'test-session-id',
                  engagement_time_msec: 100,
                },
              },
            ],
          }),
        }
      );
    });

    it('should include measurement ID and API secret in URL', async () => {
      await Analytics.fireEvent('test_event');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=test-secret',
        expect.any(Object)
      );
    });

    it('should add default engagement time if not provided', async () => {
      await Analytics.fireEvent('test_event', {});

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].params.engagement_time_msec).toBe(100);
    });

    it('should not override provided engagement time', async () => {
      const customEngagementTime = 500;
      await Analytics.fireEvent('test_event', {
        engagement_time_msec: customEngagementTime,
      });

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].params.engagement_time_msec).toBe(
        customEngagementTime
      );
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network failed');
      mockFetch.mockRejectedValue(networkError);

      // Spy on console.error directly since setup.ts modifies it
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(Analytics.fireEvent('test_event')).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Google Analytics request failed with an exception',
        networkError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should use debug endpoint when debug mode is enabled', async () => {
      new Analytics(true); // Enable debug mode

      await Analytics.fireEvent('test_event');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://www.google-analytics.com/debug/mp/collect'
        ),
        expect.any(Object)
      );
    });

    it('should log response in debug mode', async () => {
      const debugResponse = 'Debug response';
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => debugResponse,
      } as Response);

      new Analytics(true); // Enable debug mode
      await Analytics.fireEvent('test_event');

      expect(mockConsole.log).toHaveBeenCalledWith(debugResponse);
    });

    it('should not log response in production mode', async () => {
      new Analytics(false); // Disable debug mode
      await Analytics.fireEvent('test_event');

      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });

  describe('Page View Events', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Success',
      } as Response);

      mockChromeStorage.local.get.mockResolvedValue({
        clientId: 'test-client-id',
      });
      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: 'test-session-id',
          timestamp: Date.now(),
        },
      });
    });

    it('should fire page view event with correct parameters', async () => {
      const pageTitle = 'Test Page';
      const pageLocation = 'https://example.com/test';
      const additionalParams = { custom_param: 'value' };

      await Analytics.firePageViewEvent(
        pageTitle,
        pageLocation,
        additionalParams
      );

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].name).toBe('page_view');
      expect(body.events[0].params.page_title).toBe(pageTitle);
      expect(body.events[0].params.page_location).toBe(pageLocation);
      expect(body.events[0].params.custom_param).toBe('value');
    });

    it('should fire page view event without additional parameters', async () => {
      const pageTitle = 'Test Page';
      const pageLocation = 'https://example.com/test';

      await Analytics.firePageViewEvent(pageTitle, pageLocation);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].name).toBe('page_view');
      expect(body.events[0].params.page_title).toBe(pageTitle);
      expect(body.events[0].params.page_location).toBe(pageLocation);
    });
  });

  describe('Error Events', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Success',
      } as Response);

      mockChromeStorage.local.get.mockResolvedValue({
        clientId: 'test-client-id',
      });
      mockChromeStorage.session.get.mockResolvedValue({
        sessionData: {
          session_id: 'test-session-id',
          timestamp: Date.now(),
        },
      });
    });

    it('should fire error event with correct parameters', async () => {
      const error: AnalyticsError = {
        message: 'Test error message',
        stack: 'Error stack trace',
      };
      const additionalParams = { error_code: '500' };

      await Analytics.fireErrorEvent(error, additionalParams);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].name).toBe('extension_error');
      expect(body.events[0].params.message).toBe(error.message);
      expect(body.events[0].params.stack).toBe(error.stack);
      expect(body.events[0].params.error_code).toBe('500');
    });

    it('should fire error event without additional parameters', async () => {
      const error: AnalyticsError = {
        message: 'Test error message',
      };

      await Analytics.fireErrorEvent(error);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].name).toBe('extension_error');
      expect(body.events[0].params.message).toBe(error.message);
    });

    it('should handle error with additional properties', async () => {
      const error: AnalyticsError = {
        message: 'Test error',
        customProperty: 'custom_value',
        errorCode: 404,
      };

      await Analytics.fireErrorEvent(error);

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);

      expect(body.events[0].params.message).toBe(error.message);
      expect(body.events[0].params.customProperty).toBe('custom_value');
      expect(body.events[0].params.errorCode).toBe(404);
    });
  });

  describe('Constructor and Instance', () => {
    it('should create instance with debug mode disabled by default', () => {
      const instance = new Analytics();
      expect(instance).toBeInstanceOf(Analytics);
    });

    it('should create instance with debug mode enabled', () => {
      const instance = new Analytics(true);
      expect(instance).toBeInstanceOf(Analytics);
    });

    it('should export default instance', async () => {
      const { default: analyticsInstance } = await import('../ga');
      expect(analyticsInstance).toBeInstanceOf(Analytics);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing environment variables', async () => {
      delete process.env.GA_MEASUREMENT_ID;
      delete process.env.GA_API_SECRET;

      // Ensure debug mode is off by creating a new instance
      new Analytics(false);

      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => 'Success',
      } as Response);

      await Analytics.fireEvent('test_event');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=undefined&api_secret=undefined',
        expect.any(Object)
      );
    });

    it('should handle Chrome storage errors', async () => {
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'));

      await expect(Analytics.getOrCreateClientId()).rejects.toThrow(
        'Storage error'
      );
    });

    it('should handle session storage errors', async () => {
      mockChromeStorage.session.get.mockRejectedValue(
        new Error('Session storage error')
      );

      await expect(Analytics.getOrCreateSessionId()).rejects.toThrow(
        'Session storage error'
      );
    });
  });
});
