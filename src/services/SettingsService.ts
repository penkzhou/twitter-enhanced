import { Logger } from '../utils/logger';

export interface TwitterEnhancerSettings {
  remarkFeatureEnabled: boolean;
  videoDownloadFeatureEnabled: boolean;
}

export interface ISettingsService {
  getSettings(): Promise<TwitterEnhancerSettings>;
  updateSettings(settings: Partial<TwitterEnhancerSettings>): Promise<void>;
  isRemarkFeatureEnabled(): Promise<boolean>;
  isVideoDownloadFeatureEnabled(): Promise<boolean>;
  enableRemarkFeature(): Promise<void>;
  disableRemarkFeature(): Promise<void>;
  enableVideoDownloadFeature(): Promise<void>;
  disableVideoDownloadFeature(): Promise<void>;
  resetToDefaults(): Promise<void>;
}

export class SettingsService implements ISettingsService {
  private static readonly DEFAULT_SETTINGS: TwitterEnhancerSettings = {
    remarkFeatureEnabled: true,
    videoDownloadFeatureEnabled: true,
  };

  private cachedSettings: TwitterEnhancerSettings | null = null;

  async getSettings(): Promise<TwitterEnhancerSettings> {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['remarkFeatureEnabled', 'videoDownloadFeatureEnabled'],
        (result) => {
          const settings: TwitterEnhancerSettings = {
            remarkFeatureEnabled:
              (result.remarkFeatureEnabled as boolean | undefined) ??
              SettingsService.DEFAULT_SETTINGS.remarkFeatureEnabled,
            videoDownloadFeatureEnabled:
              (result.videoDownloadFeatureEnabled as boolean | undefined) ??
              SettingsService.DEFAULT_SETTINGS.videoDownloadFeatureEnabled,
          };

          this.cachedSettings = settings;
          resolve({ ...settings });
        }
      );
    });
  }

  async updateSettings(
    settings: Partial<TwitterEnhancerSettings>
  ): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    return new Promise((resolve) => {
      chrome.storage.sync.set(updatedSettings, () => {
        this.cachedSettings = updatedSettings;

        Logger.logEvent('settings_updated', {
          remark_feature_enabled: updatedSettings.remarkFeatureEnabled,
          video_download_feature_enabled:
            updatedSettings.videoDownloadFeatureEnabled,
          changed_fields: Object.keys(settings),
        });

        resolve();
      });
    });
  }

  async isRemarkFeatureEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.remarkFeatureEnabled;
  }

  async isVideoDownloadFeatureEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.videoDownloadFeatureEnabled;
  }

  async enableRemarkFeature(): Promise<void> {
    await this.updateSettings({ remarkFeatureEnabled: true });
    Logger.logEvent('remark_feature_enabled', {});
  }

  async disableRemarkFeature(): Promise<void> {
    await this.updateSettings({ remarkFeatureEnabled: false });
    Logger.logEvent('remark_feature_disabled', {});
  }

  async enableVideoDownloadFeature(): Promise<void> {
    await this.updateSettings({ videoDownloadFeatureEnabled: true });
    Logger.logEvent('video_download_feature_enabled', {});
  }

  async disableVideoDownloadFeature(): Promise<void> {
    await this.updateSettings({ videoDownloadFeatureEnabled: false });
    Logger.logEvent('video_download_feature_disabled', {});
  }

  async resetToDefaults(): Promise<void> {
    this.cachedSettings = null;
    await this.updateSettings(SettingsService.DEFAULT_SETTINGS);
    Logger.logEvent('settings_reset_to_defaults', {});
  }

  invalidateCache(): void {
    this.cachedSettings = null;
  }

  getDefaultSettings(): TwitterEnhancerSettings {
    return { ...SettingsService.DEFAULT_SETTINGS };
  }

  static getDefaultSettings(): TwitterEnhancerSettings {
    return { ...SettingsService.DEFAULT_SETTINGS };
  }
}
