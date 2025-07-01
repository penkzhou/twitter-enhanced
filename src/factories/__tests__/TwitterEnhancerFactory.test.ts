import { TwitterEnhancerFactory } from '../TwitterEnhancerFactory';
import { RemarkService } from '../../services/RemarkService';
import { VideoDownloadService } from '../../services/VideoDownloadService';
import { SettingsService } from '../../services/SettingsService';
import { DOMManager } from '../../dom/DOMManager';
import { TweetParser } from '../../dom/TweetParser';

jest.mock('../../services/RemarkService');
jest.mock('../../services/VideoDownloadService');
jest.mock('../../services/SettingsService');
jest.mock('../../dom/DOMManager');
jest.mock('../../dom/TweetParser');

describe('TwitterEnhancerFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDependencies', () => {
    it('should create all required dependencies', () => {
      const dependencies = TwitterEnhancerFactory.createDependencies();

      expect(dependencies).toBeDefined();
      expect(dependencies.remarkService).toBeInstanceOf(RemarkService);
      expect(dependencies.videoDownloadService).toBeInstanceOf(VideoDownloadService);
      expect(dependencies.settingsService).toBeInstanceOf(SettingsService);
      expect(dependencies.domManager).toBeInstanceOf(DOMManager);
      expect(dependencies.tweetParser).toBeInstanceOf(TweetParser);
    });

    it('should create DOMManager with chrome.i18n.getMessage function', () => {
      TwitterEnhancerFactory.createDependencies();

      expect(DOMManager).toHaveBeenCalledWith(expect.any(Function));
      
      const mockGetMessage = (DOMManager as jest.MockedClass<typeof DOMManager>).mock.calls[0][0];
      const mockChromeI18n = {
        getMessage: jest.fn().mockReturnValue('translated text')
      };
      (global as any).chrome = { i18n: mockChromeI18n };

      const result = mockGetMessage('test_key', ['sub1', 'sub2']);

      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('test_key', ['sub1', 'sub2']);
      expect(result).toBe('translated text');
    });

    it('should return an object with all required dependency properties', () => {
      const dependencies = TwitterEnhancerFactory.createDependencies();

      expect(Object.keys(dependencies).sort()).toEqual([
        'domManager',
        'remarkService',
        'settingsService',
        'tweetParser',
        'videoDownloadService'
      ].sort());
    });

    it('should create new instances for each call', () => {
      const dependencies1 = TwitterEnhancerFactory.createDependencies();
      const dependencies2 = TwitterEnhancerFactory.createDependencies();

      expect(dependencies1).not.toBe(dependencies2);
      expect(dependencies1.remarkService).not.toBe(dependencies2.remarkService);
      expect(dependencies1.videoDownloadService).not.toBe(dependencies2.videoDownloadService);
      expect(dependencies1.settingsService).not.toBe(dependencies2.settingsService);
      expect(dependencies1.domManager).not.toBe(dependencies2.domManager);
      expect(dependencies1.tweetParser).not.toBe(dependencies2.tweetParser);
    });
  });

  describe('createTestDependencies', () => {
    it('should create default mock dependencies when no overrides provided', () => {
      const dependencies = TwitterEnhancerFactory.createTestDependencies();

      expect(dependencies).toBeDefined();
      expect(dependencies.remarkService).toBeDefined();
      expect(dependencies.videoDownloadService).toBeDefined();
      expect(dependencies.settingsService).toBeDefined();
      expect(dependencies.domManager).toBeDefined();
      expect(dependencies.tweetParser).toBeDefined();
    });

    it('should override specific dependencies when provided', () => {
      const mockRemarkService = {
        getRemark: jest.fn(),
        setRemark: jest.fn(),
        deleteRemark: jest.fn()
      };
      const mockVideoDownloadService = {
        downloadVideo: jest.fn()
      };

      const dependencies = TwitterEnhancerFactory.createTestDependencies({
        remarkService: mockRemarkService as any,
        videoDownloadService: mockVideoDownloadService as any
      });

      expect(dependencies.remarkService).toBe(mockRemarkService);
      expect(dependencies.videoDownloadService).toBe(mockVideoDownloadService);
      expect(dependencies.settingsService).toBeDefined();
      expect(dependencies.domManager).toBeDefined();
      expect(dependencies.tweetParser).toBeDefined();
    });

    it('should preserve default dependencies not overridden', () => {
      const mockDomManager = {
        createButton: jest.fn(),
        createRemarkElement: jest.fn()
      };

      const dependencies = TwitterEnhancerFactory.createTestDependencies({
        domManager: mockDomManager as any
      });

      expect(dependencies.domManager).toBe(mockDomManager);
      expect(dependencies.remarkService).toEqual({});
      expect(dependencies.videoDownloadService).toEqual({});
      expect(dependencies.settingsService).toEqual({});
      expect(dependencies.tweetParser).toEqual({});
    });

    it('should allow overriding all dependencies', () => {
      const mockDeps = {
        remarkService: { mock: 'remarkService' },
        videoDownloadService: { mock: 'videoDownloadService' },
        settingsService: { mock: 'settingsService' },
        domManager: { mock: 'domManager' },
        tweetParser: { mock: 'tweetParser' }
      };

      const dependencies = TwitterEnhancerFactory.createTestDependencies(mockDeps as any);

      expect(dependencies).toEqual(mockDeps);
    });

    it('should return an object with all required dependency properties', () => {
      const dependencies = TwitterEnhancerFactory.createTestDependencies();

      expect(Object.keys(dependencies).sort()).toEqual([
        'domManager',
        'remarkService',
        'settingsService',
        'tweetParser',
        'videoDownloadService'
      ].sort());
    });
  });
});