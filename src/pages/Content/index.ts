import React from 'react';
import { createRoot, Root } from 'react-dom/client';

import './../../globals.css';
import RemarkDialog, { RemarkDialogProps } from '../../components/RemarkDialog';
import ScreenshotDialog, {
  ScreenshotDialogProps,
} from '../../components/ScreenshotDialog';
import { Logger } from '../../utils/logger';
import { VideoInfo } from '../../lib/types';
import { TweetData } from '../../types/tweet';
import { TweetParser } from '../../dom/TweetParser';
import VideoSelectionDialog, {
  VideoSelectionDialogProps,
} from '../../components/VideoSelectionDialog';

interface UserRemark {
  username: string;
  remark: string;
}

interface TwitterEnhancerSettings {
  userRemarks: UserRemark[];
  remarkFeatureEnabled: boolean;
  videoDownloadFeatureEnabled: boolean;
  screenshotFeatureEnabled: boolean;
}

class TwitterEnhancer {
  private static instance: TwitterEnhancer;
  private userRemarks: UserRemark[] = [];
  private observer: MutationObserver;
  private remarkFeatureEnabled: boolean = true;
  private videoDownloadFeatureEnabled: boolean = true;
  private screenshotFeatureEnabled: boolean = true;
  private remarkDialogRoot: HTMLElement;
  private remarkDialogOpen: boolean = false;
  private currentUsername: string = '';
  private currentRemark: string | undefined;
  private remarkDialogReactRoot: Root;

  // Screenshot dialog state
  private screenshotDialogRoot: HTMLElement;
  private screenshotDialogReactRoot: Root;
  private screenshotDialogOpen: boolean = false;
  private currentTweetData: TweetData | null = null;

  // Tweet parser instance
  private tweetParser: TweetParser;

  private constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.tweetParser = new TweetParser();

    this.remarkDialogRoot = document.createElement('div');
    document.body.appendChild(this.remarkDialogRoot);
    this.remarkDialogReactRoot = createRoot(this.remarkDialogRoot);

    this.screenshotDialogRoot = document.createElement('div');
    document.body.appendChild(this.screenshotDialogRoot);
    this.screenshotDialogReactRoot = createRoot(this.screenshotDialogRoot);

    this.init();
  }

  public static getInstance(): TwitterEnhancer {
    if (!TwitterEnhancer.instance) {
      TwitterEnhancer.instance = new TwitterEnhancer();
    }
    return TwitterEnhancer.instance;
  }

  private async init(): Promise<void> {
    try {
      await this.loadSettings();
      this.updateUsernames();
      this.addRemarkButton();
      this.addVideoDownloadButtons();
      this.addScreenshotButtons();
      this.setupObserver();
      this.setupEventListeners();
      this.injectStyles();
    } catch (error) {
      console.error('Error initializing TwitterEnhancer:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          'userRemarks',
          'remarkFeatureEnabled',
          'videoDownloadFeatureEnabled',
          'screenshotFeatureEnabled',
        ],
        (result: { [key: string]: any }) => {
          const settings = result as TwitterEnhancerSettings;
          this.userRemarks = settings.userRemarks || [];
          this.remarkFeatureEnabled = settings.remarkFeatureEnabled ?? true;
          this.videoDownloadFeatureEnabled =
            settings.videoDownloadFeatureEnabled ?? true;
          this.screenshotFeatureEnabled =
            settings.screenshotFeatureEnabled ?? true;
          resolve();
        }
      );
    });
  }

  private setupObserver(): void {
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('DOMContentLoaded', () => {
      window.addEventListener(
        'pushstate-changed',
        this.handlePageChange.bind(this)
      );
      window.addEventListener('popstate', this.handlePageChange.bind(this));
    });

    chrome.runtime.onMessage.addListener(this.handleSettingsUpdate.bind(this));
  }

  private handleSettingsUpdate(
    request: any,
    sender: any,
    sendResponse: any
  ): void {
    if (request.action === 'updateSettings') {
      this.remarkFeatureEnabled = request.remarkFeatureEnabled;
      this.videoDownloadFeatureEnabled = request.videoDownloadFeatureEnabled;
      this.screenshotFeatureEnabled = request.screenshotFeatureEnabled ?? true;
      if (this.remarkFeatureEnabled) {
        this.updateUsernames();
        this.addRemarkButton();
      } else {
        this.removeAllRemarks();
      }
      if (this.videoDownloadFeatureEnabled) {
        this.addVideoDownloadButtons();
      } else {
        this.removeAllVideoDownloadButtons();
      }
      if (this.screenshotFeatureEnabled) {
        this.addScreenshotButtons();
      } else {
        this.removeAllScreenshotButtons();
      }
    }
  }

  private injectStyles(): void {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('content.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  private updateButtonText(username: string, hasRemark: boolean): void {
    const buttons = document.querySelectorAll('.add-remark-btn');
    buttons.forEach((button) => {
      const header = button.closest('[data-testid="User-Name"]');
      if (header) {
        const usernameElementAll = header.querySelectorAll('a[href^="/"] span');
        const usernameElement = Array.from(usernameElementAll).find((el) =>
          el.textContent?.trim().startsWith('@')
        );
        if (
          usernameElement &&
          usernameElement.textContent?.trim().slice(1) === username
        ) {
          button.textContent = hasRemark
            ? this.getI18nMessage('editRemark')
            : this.getI18nMessage('addRemark');
        }
      }
    });
  }

  private async removeRemark(username: string): Promise<void> {
    this.userRemarks = this.userRemarks.filter((r) => r.username !== username);
    await this.saveRemarks();
    this.updateUsernames();
    this.restoreRemarkToUsername(username);
    this.updateButtonText(username, false);
  }

  private restoreRemarkToUsername(username: string): void {
    const userElements = document.body.querySelectorAll(
      `a[href="/${username}"]:not([data-testid="UserName-container"])`
    );
    userElements.forEach((element) => {
      if (!element.textContent?.trim().startsWith('@')) {
        this.replaceUsername(element, username, null);
      }
    });
  }

  private async saveRemarks(): Promise<void> {
    /// add analytics event
    Logger.logEvent('remarks_updated', {
      username: this.currentUsername,
      remark: this.currentRemark,
      remarks: this.userRemarks,
    });
    return new Promise((resolve) => {
      chrome.storage.sync.set({ userRemarks: this.userRemarks }, () => {
        resolve();
      });
    });
  }

  private replaceUsername(
    element: Element,
    username: string,
    remark: string | null
  ): void {
    const displayNameElement = element.querySelector('span');
    if (displayNameElement) {
      if (remark) {
        displayNameElement.textContent = remark;
        element.setAttribute('title', `@${username}`);
        element.classList.add('username-replaced');
      } else {
        displayNameElement.textContent = username;
        element.removeAttribute('title');
        element.classList.remove('username-replaced');
      }
    }
  }

  private updateUsernames(container: Element = document.body): void {
    if (!this.remarkFeatureEnabled) return;

    this.userRemarks.forEach(({ username, remark }) => {
      const userElements = container.querySelectorAll(
        `a[href="/${username}"]:not([data-testid="UserName-container"])`
      );
      userElements.forEach((element) => {
        if (!element.textContent?.trim().startsWith('@')) {
          this.replaceUsername(element, username, remark);
        }
      });
    });
  }

  private addRemarkButton(): void {
    if (!this.remarkFeatureEnabled) return;

    const tweetHeaders = document.querySelectorAll(
      '[data-testid="User-Name"]:not(.remark-button-added)'
    );
    tweetHeaders.forEach((header) => {
      const usernameElementAll = header.querySelectorAll('a[href^="/"] span');
      const usernameElement = Array.from(usernameElementAll).find((el) =>
        el.textContent?.trim().startsWith('@')
      );
      if (usernameElement) {
        const username = usernameElement.textContent?.trim().slice(1); // Remove '@' symbol
        if (username) {
          const button = document.createElement('button');
          button.className = 'add-remark-btn';
          const existingRemark = this.userRemarks.find(
            (r) => r.username === username
          );
          button.textContent = existingRemark
            ? this.getI18nMessage('editRemark')
            : this.getI18nMessage('addRemark');
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleAddOrEditRemark(username);
          });
          header.appendChild(button);
          header.classList.add('remark-button-added');
        }
      }
    });
  }

  private handleAddOrEditRemark(username: string): void {
    const existingRemark = this.userRemarks.find(
      (r) => r.username === username
    )?.remark;
    this.currentUsername = username;
    this.currentRemark = existingRemark;
    this.remarkDialogOpen = true;

    Logger.logEvent('click_remark_button', {
      username: this.currentUsername,
      remark: this.currentRemark,
    });
    this.renderRemarkDialog();
  }

  private async handleSaveRemark(
    username: string,
    remark: string
  ): Promise<void> {
    Logger.logEvent('save_remark_on_dialog', {
      username: this.currentUsername,
      remark: this.currentRemark,
    });
    if (remark !== '') {
      const existingRemarkIndex = this.userRemarks.findIndex(
        (r) => r.username === username
      );
      if (existingRemarkIndex !== -1) {
        this.userRemarks[existingRemarkIndex].remark = remark;
      } else {
        this.userRemarks.push({ username, remark });
      }
      await this.saveRemarks();
      this.updateUsernames();
      this.updateButtonText(username, true);
    } else {
      await this.removeRemark(username);
    }
    this.closeRemarkDialog();
  }

  private closeRemarkDialog(): void {
    this.remarkDialogOpen = false;
    this.currentUsername = '';
    this.currentRemark = undefined;
    this.renderRemarkDialog();
  }

  private renderRemarkDialog(): void {
    this.remarkDialogReactRoot.render(
      React.createElement<RemarkDialogProps>(RemarkDialog, {
        onSave: this.handleSaveRemark.bind(this),
        onCancel: this.closeRemarkDialog.bind(this),
        username: this.currentUsername,
        existingRemark: this.currentRemark,
        isOpen: this.remarkDialogOpen,
      })
    );
  }

  private handleMutations(mutations: MutationRecord[]): void {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            this.updateUsernames(node);
            this.addRemarkButton();
            this.addVideoDownloadButtons();
            this.addScreenshotButtons();
          }
        });
      } else if (
        mutation.type === 'attributes' &&
        mutation.target instanceof Element
      ) {
        const tweet = mutation.target.closest('article[data-testid="tweet"]');
        if (tweet && !tweet.classList.contains('video-download-added')) {
          this.addVideoDownloadButtons();
        }
        if (tweet && !tweet.classList.contains('screenshot-added')) {
          this.addScreenshotButtons();
        }
      }
    });
  }

  private handlePageChange(): void {
    setTimeout(() => {
      this.updateUsernames();
      this.addRemarkButton();
      this.addVideoDownloadButtons();
      this.addScreenshotButtons();
    }, 1000);
  }

  private removeAllRemarks(): void {
    document.querySelectorAll('.username-replaced').forEach((element) => {
      const usernameElement = element.querySelector('span');
      if (usernameElement && element.getAttribute('title')) {
        usernameElement.textContent =
          element.getAttribute('title')?.slice(1) ?? '';
        element.removeAttribute('title');
        element.classList.remove('username-replaced');
      }
    });
    document
      .querySelectorAll('.add-remark-btn')
      .forEach((button) => button.remove());
    document
      .querySelectorAll('.remark-button-added')
      .forEach((element) => element.classList.remove('remark-button-added'));
  }

  private addVideoDownloadButtons(): void {
    if (!this.videoDownloadFeatureEnabled) return;

    const tweets = document.querySelectorAll(
      'article[data-testid="tweet"]:not(.video-download-added)'
    );
    tweets.forEach((tweet) => {
      const videoContainer = tweet.querySelector(
        '[data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
      );
      const gifContainer = tweet.querySelector(
        '[data-testid="tweetPhoto"] img[src*=".gif"]'
      );

      if (videoContainer || gifContainer) {
        const actionBar = tweet.querySelector('[role="group"]');
        if (actionBar && !actionBar.querySelector('.video-download-btn')) {
          const downloadButton = document.createElement('div');
          downloadButton.className = 'video-download-btn';
          downloadButton.setAttribute(
            'aria-label',
            this.getI18nMessage('downloadMedia')
          );
          downloadButton.innerHTML = `
                        <div role="button" tabindex="0">
                            <div class="download-icon">
                                ${this.generateDownloadIconSVG()}
                            </div>
                            <div class="loading-icon">
                                ${this.generateLoadingIconSVG()}
                            </div>
                        </div>
                    `;
          downloadButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleVideoDownload(tweet, downloadButton);
          });
          actionBar.appendChild(downloadButton);
        }
        tweet.classList.add('video-download-added');
      }
    });
  }

  private logVideoDownloadClick(tweetId: string): void {
    Logger.logEvent('video_download_click', {
      tweet_id: tweetId,
      domain: window.location.hostname,
    });
  }

  private logVideoDownloadFailure(error: string, tweetId: string): void {
    Logger.logError(error, {
      tweet_id: tweetId,
      domain: window.location.hostname,
      error_type: 'download_failure',
    });
  }

  private async handleVideoDownload(
    tweetElement: Element,
    button: HTMLElement
  ): Promise<void> {
    button.classList.add('loading');

    const tweetId = this.getTweetId(tweetElement);
    if (!tweetId) {
      console.error('Could not find tweet ID');
      this.showAlert(this.getI18nMessage('tweetIdError'));
      button.classList.remove('loading');
      return;
    }

    this.logVideoDownloadClick(tweetId);

    const currentDomain = window.location.hostname;
    chrome.runtime.sendMessage(
      {
        action: 'getVideoInfo',
        tweetId: tweetId,
        currentDomain: currentDomain,
      },
      (response) => {
        button.classList.remove('loading');

        if (chrome.runtime.lastError) {
          console.error('Error sending message:', chrome.runtime.lastError);
          this.showAlert(this.getI18nMessage('downloadError'));
          Logger.logError(chrome.runtime.lastError.message ?? 'Unknown error', {
            tweet_id: tweetId,
            domain: window.location.hostname,
            error_type: 'download_error',
          });
        } else if (response.success) {
          if (response.alreadyDownloaded) {
            this.handleAlreadyDownloaded(response, tweetId);
          } else if (
            Array.isArray(response.videoInfo) &&
            response.videoInfo.length > 1
          ) {
            this.showVideoSelectionDialog(response.videoInfo, tweetId);
          } else if (response.videoInfo.length === 1) {
            this.initiateDownload(response.videoInfo[0], tweetId);
          } else {
            this.showAlert(this.getI18nMessage('noVideoFound'));
          }
        } else {
          console.error('Download failed:', response.error);
          this.showAlert(
            this.getI18nMessage('unableToDownload', [response.error])
          );
          this.logVideoDownloadFailure(response.error, tweetId);
        }
      }
    );
  }

  private handleAlreadyDownloaded(response: any, tweetId: string): void {
    this.showConfirmDialog(
      this.getI18nMessage('tweetAlreadyDownloaded'),
      () => {
        chrome.runtime.sendMessage({
          action: 'openDownloadRecords',
          recordId: response.recordId,
        });
      }
    );
    Logger.logEvent('video_already_downloaded', {
      tweet_id: tweetId,
      record_id: response.recordId,
    });
  }

  private showVideoSelectionDialog(videos: VideoInfo[], tweetId: string): void {
    Logger.logEvent('video_selection_dialog_open', {
      tweet_id: tweetId,
      video_count: videos.length,
    });

    const dialogRoot = document.createElement('div');
    document.body.appendChild(dialogRoot);

    const handleDownloadSelected = (selectedVideos: VideoInfo[]) => {
      Logger.logEvent('video_selection_dialog_download_selected', {
        tweet_id: tweetId,
        video_count: selectedVideos.length,
      });
      this.initiateMultipleDownloads(selectedVideos, tweetId);
      document.body.removeChild(dialogRoot);
    };

    const handleDownloadAll = () => {
      Logger.logEvent('video_selection_dialog_download_all', {
        tweet_id: tweetId,
        video_count: videos.length,
      });
      this.initiateMultipleDownloads(videos, tweetId);
      document.body.removeChild(dialogRoot);
    };

    const handleCancel = () => {
      document.body.removeChild(dialogRoot);
    };
    const root = createRoot(dialogRoot);
    root.render(
      React.createElement<VideoSelectionDialogProps>(VideoSelectionDialog, {
        videos: videos,
        tweetId: tweetId,
        onDownloadSelected: handleDownloadSelected,
        onDownloadAll: handleDownloadAll,
        onCancel: handleCancel,
      })
    );
  }

  private initiateDownload(videoInfo: VideoInfo, tweetId: string): void {
    chrome.runtime.sendMessage(
      {
        action: 'downloadVideo',
        videoInfo: videoInfo,
        tweetId: tweetId,
      },
      (response) => {
        if (response.success) {
          Logger.logEvent('video_download_initiated', { tweet_id: tweetId });
        } else {
          console.error('Download failed:', response.error);
          this.showAlert(
            this.getI18nMessage('unableToDownload', [response.error])
          );
          this.logVideoDownloadFailure(response.error, tweetId);
        }
      }
    );
  }

  private initiateMultipleDownloads(
    videos: VideoInfo[],
    tweetId: string
  ): void {
    videos.forEach((video) => {
      this.initiateDownload(video, tweetId);
    });
  }

  private showAlert(message: string): void {
    // Create and show a custom alert dialog using Tailwind CSS classes
    const alertDialog = document.createElement('div');
    alertDialog.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    alertDialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-auto">
                <p class="text-gray-800 mb-4">${message}</p>
                <button class="custom-alert-ok w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                    ${this.getI18nMessage('ok')}
                </button>
            </div>
        `;
    document.body.appendChild(alertDialog);

    const okButton = alertDialog.querySelector('.custom-alert-ok');
    okButton?.addEventListener('click', () => {
      document.body.removeChild(alertDialog);
    });
  }

  private showConfirmDialog(message: string, onConfirm: () => void): void {
    // Create and show a custom confirmation dialog using Tailwind CSS classes
    const confirmDialog = document.createElement('div');
    confirmDialog.className =
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    confirmDialog.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-auto">
                <p class="text-gray-800 mb-4">${message}</p>
                <div class="flex justify-end space-x-2">
                    <button class="custom-confirm-no bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                        ${this.getI18nMessage('no')}
                    </button>
                    <button class="custom-confirm-yes bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                        ${this.getI18nMessage('yes')}
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(confirmDialog);

    const yesButton = confirmDialog.querySelector('.custom-confirm-yes');
    const noButton = confirmDialog.querySelector('.custom-confirm-no');

    yesButton?.addEventListener('click', () => {
      onConfirm();
      document.body.removeChild(confirmDialog);
    });

    noButton?.addEventListener('click', () => {
      document.body.removeChild(confirmDialog);
    });
  }

  private getTweetId(tweetElement: Element): string | null {
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) {
      const href = tweetLink.getAttribute('href');
      const match = href?.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  private removeAllVideoDownloadButtons(): void {
    document
      .querySelectorAll('.video-download-btn')
      .forEach((button) => button.remove());
    document
      .querySelectorAll('.video-download-added')
      .forEach((element) => element.classList.remove('video-download-added'));
  }

  private generateDownloadIconSVG(): string {
    return `
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" style="opacity: unset !important;" xml:space="preserve" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi"><g><path d="M12,16l-5.7-5.7l1.4-1.4l3.3,3.3V2.6h2v9.6l3.3-3.3l1.4,1.4L12,16z M21,15l0,3.5c0,1.4-1.1,2.5-2.5,2.5h-13 C4.1,21,3,19.9,3,18.5V15h2v3.5C5,18.8,5.2,19,5.5,19h13c0.3,0,0.5-0.2,0.5-0.5l0-3.5H21z"></path><path></path><path></path></g></svg>
        `;
  }

  private generateLoadingIconSVG(): string {
    return `
            <svg height='100%' viewBox='0 0 32 32' width='100%' 
                xmlns='http://www.w3.org/2000/svg'>
                <style>
                    @keyframes circle__svg {
                        0% {
                        transform: rotate(0deg);
                        }
                        100% {
                        transform: rotate(360deg);
                        }
                    }

                    .circle__svg-circle {
                        transform-origin: center;
                        animation-name: circle__svg;
                        animation-duration: 1s;
                        animation-timing-function: linear;
                        animation-iteration-count: infinite;
                        height: 1px;
                    }
                </style>
                <g>
                    <circle cx='16' cy='16' fill='none' r='14' stroke-width='4' style='stroke: rgb(29, 161, 242); opacity: 0.2;'></circle>
                </g>
                <g class='circle__svg-circle'>
                    <circle cx='16' cy='16' fill='none' r='14' stroke-width='4' style='stroke: rgb(29, 161, 242); stroke-dasharray: 80px; stroke-dashoffset: 60px;'></circle>
                </g>
            </svg>
        `;
  }

  private getI18nMessage(
    messageName: string,
    substitutions?: string | string[]
  ): string {
    return chrome.i18n.getMessage(messageName, substitutions);
  }

  // ============ Screenshot Feature Methods ============

  private addScreenshotButtons(): void {
    if (!this.screenshotFeatureEnabled) return;

    const tweets = document.querySelectorAll(
      'article[data-testid="tweet"]:not(.screenshot-added)'
    );

    tweets.forEach((tweet) => {
      const actionBar = this.tweetParser.getActionBar(tweet);
      if (actionBar && !this.tweetParser.hasScreenshotButton(actionBar)) {
        const screenshotButton = document.createElement('div');
        screenshotButton.className = 'screenshot-btn';
        screenshotButton.setAttribute(
          'aria-label',
          this.getI18nMessage('screenshotTweet') || 'Screenshot Tweet'
        );
        screenshotButton.innerHTML = `
          <div role="button" tabindex="0">
            <div class="screenshot-icon">
              ${this.generateScreenshotIconSVG()}
            </div>
          </div>
        `;
        screenshotButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.handleScreenshot(tweet);
        });
        actionBar.appendChild(screenshotButton);
      }
      tweet.classList.add('screenshot-added');
    });
  }

  private handleScreenshot(tweetElement: Element): void {
    const tweetData = this.tweetParser.getFullTweetData(tweetElement);
    if (!tweetData) {
      console.error('Could not extract tweet data for screenshot');
      this.showAlert(
        this.getI18nMessage('screenshotError') || 'Failed to capture tweet data'
      );
      return;
    }

    Logger.logEvent('screenshot_button_click', {
      tweet_id: tweetData.tweetId,
      domain: window.location.hostname,
    });

    this.currentTweetData = tweetData;
    this.screenshotDialogOpen = true;
    this.renderScreenshotDialog();
  }

  private closeScreenshotDialog(): void {
    this.screenshotDialogOpen = false;
    this.currentTweetData = null;
    this.renderScreenshotDialog();
  }

  private renderScreenshotDialog(): void {
    if (!this.currentTweetData) {
      this.screenshotDialogReactRoot.render(null);
      return;
    }

    this.screenshotDialogReactRoot.render(
      React.createElement<ScreenshotDialogProps>(ScreenshotDialog, {
        tweetData: this.currentTweetData,
        isOpen: this.screenshotDialogOpen,
        onClose: this.closeScreenshotDialog.bind(this),
      })
    );
  }

  private removeAllScreenshotButtons(): void {
    document
      .querySelectorAll('.screenshot-btn')
      .forEach((button) => button.remove());
    document
      .querySelectorAll('.screenshot-added')
      .forEach((element) => element.classList.remove('screenshot-added'));
  }

  private generateScreenshotIconSVG(): string {
    return `
      <svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1xvli5t r-1hdv0qi" style="width: 18.75px; height: 18.75px;">
        <g>
          <path d="M3 5.5C3 4.119 4.12 3 5.5 3h13C19.88 3 21 4.119 21 5.5v13c0 1.381-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v13c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-13c0-.276-.224-.5-.5-.5h-13z"></path>
          <path d="M9.018 11.768l-2.5 3.5c-.203.284-.183.668.05.928.233.26.615.32.916.146l3.577-2.069 2.55 2.044c.2.16.473.198.71.098.236-.1.4-.317.424-.567l.3-3.098 2.907-1.57c.262-.142.42-.412.413-.705-.008-.293-.178-.556-.446-.687L14 8l-1.024-2.928c-.1-.286-.358-.49-.66-.523-.302-.032-.594.113-.749.373l-2.01 3.376-3.211.708c-.287.063-.517.277-.6.558-.083.28-.002.583.212.79l2.06 1.994z"></path>
        </g>
      </svg>
    `;
  }
}

// Initialize the enhancer
TwitterEnhancer.getInstance();
