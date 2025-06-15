import { SettingsService } from '../SettingsService';
import { Logger } from '../../utils/logger';

jest.mock('../../utils/logger');

const mockChromeStorage = {
  sync: {
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

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockLoggerLogEvent: jest.MockedFunction<typeof Logger.logEvent>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoggerLogEvent = Logger.logEvent as jest.MockedFunction<typeof Logger.logEvent>;
    
    mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
      callback({});
    });
    mockChromeStorage.sync.set.mockImplementation((data, callback) => {
      if (callback) callback();
    });
    
    settingsService = new SettingsService();
  });

  describe('getSettings', () => {
    it('should return default settings when no settings exist in storage', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({});
      });

      const settings = await settingsService.getSettings();

      expect(settings).toEqual({
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
      expect(mockChromeStorage.sync.get).toHaveBeenCalledWith(
        ['remarkFeatureEnabled', 'videoDownloadFeatureEnabled'],
        expect.any(Function)
      );
    });

    it('should return existing settings from storage', async () => {
      const existingSettings = {
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: true,
      };

      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(existingSettings);
      });

      const settings = await settingsService.getSettings();

      expect(settings).toEqual(existingSettings);
    });

    it('should use cached settings on subsequent calls', async () => {
      const existingSettings = {
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: true,
      };

      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback(existingSettings);
      });

      await settingsService.getSettings();
      const settings = await settingsService.getSettings();

      expect(settings).toEqual(existingSettings);
      expect(mockChromeStorage.sync.get).toHaveBeenCalledTimes(1);
    });

    it('should handle partial settings in storage', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ remarkFeatureEnabled: false });
      });

      const settings = await settingsService.getSettings();

      expect(settings).toEqual({
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: true, // default value
      });
    });
  });

  describe('updateSettings', () => {
    it('should update single setting', async () => {
      const updatedSettings = { remarkFeatureEnabled: false };

      await settingsService.updateSettings(updatedSettings);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        {
          remarkFeatureEnabled: false,
          videoDownloadFeatureEnabled: true,
        },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenCalledWith('settings_updated', {
        remark_feature_enabled: false,
        video_download_feature_enabled: true,
        changed_fields: ['remarkFeatureEnabled'],
      });
    });

    it('should update multiple settings', async () => {
      const updatedSettings = {
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: false,
      };

      await settingsService.updateSettings(updatedSettings);

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        updatedSettings,
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenCalledWith('settings_updated', {
        remark_feature_enabled: false,
        video_download_feature_enabled: false,
        changed_fields: ['remarkFeatureEnabled', 'videoDownloadFeatureEnabled'],
      });
    });

    it('should update cache after updating settings', async () => {
      await settingsService.updateSettings({ remarkFeatureEnabled: false });
      
      // This should use cached settings
      const settings = await settingsService.getSettings();

      expect(settings.remarkFeatureEnabled).toBe(false);
      expect(mockChromeStorage.sync.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('feature-specific methods', () => {
    it('should check if remark feature is enabled', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ remarkFeatureEnabled: false });
      });

      const isEnabled = await settingsService.isRemarkFeatureEnabled();

      expect(isEnabled).toBe(false);
    });

    it('should check if video download feature is enabled', async () => {
      mockChromeStorage.sync.get.mockImplementation((keys, callback) => {
        callback({ videoDownloadFeatureEnabled: true });
      });

      const isEnabled = await settingsService.isVideoDownloadFeatureEnabled();

      expect(isEnabled).toBe(true);
    });

    it('should enable remark feature', async () => {
      await settingsService.enableRemarkFeature();

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ remarkFeatureEnabled: true }),
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('remark_feature_enabled', {});
    });

    it('should disable remark feature', async () => {
      await settingsService.disableRemarkFeature();

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ remarkFeatureEnabled: false }),
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('remark_feature_disabled', {});
    });

    it('should enable video download feature', async () => {
      await settingsService.enableVideoDownloadFeature();

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ videoDownloadFeatureEnabled: true }),
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('video_download_feature_enabled', {});
    });

    it('should disable video download feature', async () => {
      await settingsService.disableVideoDownloadFeature();

      expect(mockChromeStorage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ videoDownloadFeatureEnabled: false }),
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('video_download_feature_disabled', {});
    });
  });

  describe('resetToDefaults', () => {
    it('should reset settings to default values', async () => {
      // First change some settings
      await settingsService.updateSettings({
        remarkFeatureEnabled: false,
        videoDownloadFeatureEnabled: false,
      });

      // Then reset to defaults
      await settingsService.resetToDefaults();

      expect(mockChromeStorage.sync.set).toHaveBeenLastCalledWith(
        {
          remarkFeatureEnabled: true,
          videoDownloadFeatureEnabled: true,
        },
        expect.any(Function)
      );
      expect(mockLoggerLogEvent).toHaveBeenLastCalledWith('settings_reset_to_defaults', {});
    });

    it('should invalidate cache when resetting to defaults', async () => {
      await settingsService.updateSettings({ remarkFeatureEnabled: false });
      await settingsService.resetToDefaults();
      
      // This should fetch from storage again
      await settingsService.getSettings();

      expect(mockChromeStorage.sync.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache manually', async () => {
      await settingsService.getSettings();
      settingsService.invalidateCache();
      await settingsService.getSettings();

      expect(mockChromeStorage.sync.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('default settings', () => {
    it('should return default settings from instance method', () => {
      const defaults = settingsService.getDefaultSettings();

      expect(defaults).toEqual({
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
    });

    it('should return default settings from static method', () => {
      const defaults = SettingsService.getDefaultSettings();

      expect(defaults).toEqual({
        remarkFeatureEnabled: true,
        videoDownloadFeatureEnabled: true,
      });
    });

    it('should return a copy of default settings', () => {
      const defaults1 = settingsService.getDefaultSettings();
      const defaults2 = SettingsService.getDefaultSettings();

      defaults1.remarkFeatureEnabled = false;

      expect(defaults2.remarkFeatureEnabled).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle chrome storage get errors', async () => {
      mockChromeStorage.sync.get.mockImplementation(() => {
        throw new Error('Storage get error');
      });

      await expect(settingsService.getSettings()).rejects.toThrow('Storage get error');
    });

    it('should handle chrome storage set errors', async () => {
      mockChromeStorage.sync.set.mockImplementation(() => {
        throw new Error('Storage set error');
      });

      await expect(settingsService.updateSettings({ remarkFeatureEnabled: false }))
        .rejects.toThrow('Storage set error');
    });
  });
});