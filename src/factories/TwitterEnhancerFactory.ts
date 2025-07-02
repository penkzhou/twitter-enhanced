import { RemarkService, IRemarkService } from '../services/RemarkService';
import {
  VideoDownloadService,
  IVideoDownloadService,
} from '../services/VideoDownloadService';
import { SettingsService, ISettingsService } from '../services/SettingsService';
import { DOMManager, IDOMManager } from '../dom/DOMManager';
import { TweetParser, ITweetParser } from '../dom/TweetParser';

export interface TwitterEnhancerDependencies {
  remarkService: IRemarkService;
  videoDownloadService: IVideoDownloadService;
  settingsService: ISettingsService;
  domManager: IDOMManager;
  tweetParser: ITweetParser;
}

export class TwitterEnhancerFactory {
  /**
   * Creates a TwitterEnhancer instance with all production dependencies
   */
  static createDependencies(): TwitterEnhancerDependencies {
    const remarkService = new RemarkService();
    const videoDownloadService = new VideoDownloadService();
    const settingsService = new SettingsService();
    const domManager = new DOMManager((key, substitutions) =>
      chrome.i18n.getMessage(key, substitutions)
    );
    const tweetParser = new TweetParser();

    return {
      remarkService,
      videoDownloadService,
      settingsService,
      domManager,
      tweetParser,
    };
  }

  /**
   * Creates a TwitterEnhancer instance with custom dependencies for testing
   */
  static createTestDependencies(
    overrides?: Partial<TwitterEnhancerDependencies>
  ): TwitterEnhancerDependencies {
    const defaultDeps = {
      remarkService: {} as IRemarkService,
      videoDownloadService: {} as IVideoDownloadService,
      settingsService: {} as ISettingsService,
      domManager: {} as IDOMManager,
      tweetParser: {} as ITweetParser,
    };

    return {
      ...defaultDeps,
      ...overrides,
    };
  }
}
