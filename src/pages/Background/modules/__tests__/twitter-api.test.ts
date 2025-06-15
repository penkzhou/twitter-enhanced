// Mock global fetch API
global.fetch = jest.fn();

// Mock chrome cookies API
const mockChromeCookies = {
  get: jest.fn(),
  getAll: jest.fn(),
};

Object.defineProperty(global, 'chrome', {
  value: {
    cookies: mockChromeCookies,
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
  },
  writable: true,
});

// Mock console for testing
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

import { TwitterAPI } from '../twitter-api';

describe('TwitterAPI', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    
    // Reset TwitterAPI instance
    (TwitterAPI as any).instance = undefined;
    
    // Default mock responses
    mockChromeCookies.get.mockImplementation((details, callback) => {
      const defaultCookie = { value: 'test-token' };
      if (callback) callback(defaultCookie);
    });
  });

  describe('Singleton Pattern', () => {
    it('should implement singleton pattern correctly', async () => {
      const instance1 = await TwitterAPI.getInstance();
      const instance2 = await TwitterAPI.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should initialize tokens from chrome cookies', async () => {
      mockChromeCookies.get.mockImplementation((details, callback) => {
        let mockCookie;
        if (details.name === 'ct0') {
          mockCookie = { value: 'csrf-token-123' };
        } else if (details.name === 'gt') {
          mockCookie = { value: 'guest-token-456' };
        }
        if (callback) callback(mockCookie);
      });

      const instance = await TwitterAPI.getInstance();
      
      // Should have called chrome.cookies.get for both domains and token types
      expect(mockChromeCookies.get).toHaveBeenCalledTimes(4);
      
      // Verify calls for ct0 and gt tokens on both domains (with trailing slash)
      // Just check that all 4 calls were made, order may vary
      const calls = mockChromeCookies.get.mock.calls;
      expect(calls.some(call => call[0].name === 'ct0' && call[0].url === 'https://twitter.com/')).toBe(true);
      expect(calls.some(call => call[0].name === 'gt' && call[0].url === 'https://twitter.com/')).toBe(true);
      expect(calls.some(call => call[0].name === 'ct0' && call[0].url === 'https://x.com/')).toBe(true);
      expect(calls.some(call => call[0].name === 'gt' && call[0].url === 'https://x.com/')).toBe(true);
    });
  });

  describe('Header Initialization', () => {
    it('should create correct headers with guest token', async () => {
      const instance = await TwitterAPI.getInstance();
      const tweetId = '1234567890';
      const bearerToken = 'test-bearer-token';
      const csrfToken = 'test-csrf-token';
      const guestToken = 'test-guest-token';
      
      const headers = instance.initHeaders(tweetId, bearerToken, csrfToken, guestToken);
      
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Authorization')).toBe(`Bearer ${bearerToken}`);
      expect(headers.get('User-Agent')).toBe(navigator.userAgent);
      expect(headers.get('Referer')).toBe(`https://x.com/i/web/status/${tweetId}`);
      expect(headers.get('x-twitter-active-user')).toBe('yes');
      expect(headers.get('x-csrf-token')).toBe(csrfToken);
      expect(headers.get('x-guest-token')).toBe(guestToken);
    });

    it('should create correct headers without guest token (OAuth2Session)', async () => {
      const instance = await TwitterAPI.getInstance();
      const tweetId = '1234567890';
      const bearerToken = 'test-bearer-token';
      const csrfToken = 'test-csrf-token';
      
      const headers = instance.initHeaders(tweetId, bearerToken, csrfToken);
      
      expect(headers.get('x-twitter-auth-type')).toBe('OAuth2Session');
      expect(headers.get('x-guest-token')).toBeNull();
    });
  });

  describe('API Endpoint Generation', () => {
    it('should generate correct API endpoint for Twitter domain', async () => {
      const instance = await TwitterAPI.getInstance();
      const tweetId = '1234567890';
      
      const endpoint = (instance as any).makeLatestEndpoint('twitter.com', tweetId);
      
      expect(endpoint).toContain('twitter.com');
      expect(endpoint).toContain(tweetId);
      expect(endpoint).toContain('TweetDetail');
    });

    it('should generate correct API endpoint for X domain', async () => {
      const instance = await TwitterAPI.getInstance();
      const tweetId = '1234567890';
      
      const endpoint = (instance as any).makeLatestEndpoint('x.com', tweetId);
      
      expect(endpoint).toContain('x.com');
      expect(endpoint).toContain(tweetId);
      expect(endpoint).toContain('TweetDetail');
    });
  });

  describe('Video Info Retrieval', () => {
    it('should successfully retrieve video info for Twitter domain', async () => {
      const mockTweetData = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [{
              entries: [{
                content: {
                  itemContent: {
                    tweet_results: {
                      result: {
                        legacy: {
                          full_text: 'Test tweet with video',
                          entities: {
                            media: [{
                              type: 'video',
                              video_info: {
                                variants: [{
                                  bitrate: 2176000,
                                  content_type: 'video/mp4',
                                  url: 'https://example.com/video.mp4'
                                }]
                              },
                              media_url_https: 'https://example.com/thumbnail.jpg',
                              id_str: '12345'
                            }]
                          }
                        },
                        core: {
                          user_results: {
                            result: {
                              legacy: {
                                screen_name: 'testuser'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }]
            }]
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTweetData,
      } as Response);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', true);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result![0]).toHaveProperty('videoUrl');
      expect(result![0]).toHaveProperty('thumbnailUrl');
      expect(result![0]).toHaveProperty('tweetUrl');
      expect(result![0]).toHaveProperty('tweetText');
    });

    it('should return null when API response is invalid', async () => {
      mockFetch.mockResolvedValueOnce(null as any);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', false);

      expect(result).toBeNull();
    });

    it('should handle tweet not found error', async () => {
      const mockEmptyData = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [{
              entries: [{
                content: {
                  itemContent: {
                    tweet_results: {
                      result: null
                    }
                  }
                }
              }]
            }]
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData,
      } as Response);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('invalid-id', true);
      
      // API catches errors and returns null instead of throwing
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', true);
      
      // API catches network errors and returns null
      expect(result).toBeNull();
    });
  });

  describe('Media Processing', () => {
    it('should process video media correctly', async () => {
      const mockTweetData = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [{
              entries: [{
                content: {
                  itemContent: {
                    tweet_results: {
                      result: {
                        legacy: {
                          full_text: 'Video tweet',
                          entities: {
                            media: [{
                              type: 'video',
                              video_info: {
                                variants: [
                                  {
                                    bitrate: 832000,
                                    content_type: 'video/mp4',
                                    url: 'https://example.com/video-low.mp4'
                                  },
                                  {
                                    bitrate: 2176000,
                                    content_type: 'video/mp4',
                                    url: 'https://example.com/video-high.mp4'
                                  }
                                ]
                              },
                              media_url_https: 'https://example.com/thumb.jpg',
                              id_str: '67890'
                            }]
                          }
                        },
                        core: {
                          user_results: {
                            result: {
                              legacy: { screen_name: 'testuser' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }]
            }]
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTweetData,
      } as Response);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', true);

      expect(result).toHaveLength(1); // Returns one media item with highest quality
      expect(result![0].videoUrl).toContain('video-high.mp4'); // Should pick highest bitrate
    });

    it('should handle GIF media correctly', async () => {
      const mockTweetData = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [{
              entries: [{
                content: {
                  itemContent: {
                    tweet_results: {
                      result: {
                        legacy: {
                          full_text: 'GIF tweet',
                          entities: {
                            media: [{
                              type: 'animated_gif',
                              video_info: {
                                variants: [{
                                  content_type: 'video/mp4',
                                  url: 'https://example.com/animated.mp4'
                                }]
                              },
                              media_url_https: 'https://example.com/gif-thumb.jpg',
                              id_str: '99999'
                            }]
                          }
                        },
                        core: {
                          user_results: {
                            result: {
                              legacy: { screen_name: 'testuser' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }]
            }]
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTweetData,
      } as Response);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', false);

      expect(result).toHaveLength(1);
      expect(result![0].videoUrl).toContain('animated.mp4');
    });

    it('should handle tweets with no media', async () => {
      const mockTweetData = {
        data: {
          threaded_conversation_with_injections_v2: {
            instructions: [{
              entries: [{
                content: {
                  itemContent: {
                    tweet_results: {
                      result: {
                        legacy: {
                          full_text: 'Text only tweet'
                        },
                        core: {
                          user_results: {
                            result: {
                              legacy: { screen_name: 'testuser' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }]
            }]
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTweetData,
      } as Response);

      const instance = await TwitterAPI.getInstance();
      const result = await instance.getVideoInfo('1234567890', true);

      expect(result).toBeNull(); // No media = null according to API logic
    });
  });

  describe('Domain-specific Behavior', () => {
    it('should use correct tokens for Twitter domain', async () => {
      const instance = await TwitterAPI.getInstance();
      
      // Mock fetch to capture the request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { threaded_conversation_with_injections_v2: { instructions: [{ entries: [] }] } } }),
      } as Response);

      const result = await instance.getVideoInfo('1234567890', true);
      expect(result).toBeNull(); // No entries means no result

      // Verify the correct domain-specific behavior
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com'),
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
        })
      );
    });

    it('should use correct tokens for X domain', async () => {
      const instance = await TwitterAPI.getInstance();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { threaded_conversation_with_injections_v2: { instructions: [{ entries: [] }] } } }),
      } as Response);

      const result = await instance.getVideoInfo('1234567890', false);
      expect(result).toBeNull(); // No entries means no result

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('x.com'),
        expect.objectContaining({
          method: 'GET',
          mode: 'cors',
        })
      );
    });
  });
});