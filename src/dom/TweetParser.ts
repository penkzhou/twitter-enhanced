import { TweetData } from '../types/tweet';

export interface TimestampInfo {
  displayText: string | null;
  datetime: string | null;
}

export interface ITweetParser {
  // Tweet identification
  getTweetId(tweetElement: Element): string | null;

  // User information extraction
  extractUsername(tweetHeader: Element): string | null;
  findUserElements(username: string, container?: Element): Element[];

  // Video content detection
  hasVideoContent(tweetElement: Element): boolean;
  hasGifContent(tweetElement: Element): boolean;
  findVideoElements(tweetElement: Element): Element[];

  // Tweet structure navigation
  getActionBar(tweetElement: Element): Element | null;
  getVideoContainer(tweetElement: Element): Element | null;

  // Button state checking
  hasRemarkButton(tweetHeader: Element): boolean;
  hasVideoDownloadButton(actionBar: Element): boolean;
  hasScreenshotButton(actionBar: Element): boolean;

  // Element validation
  isValidTweetElement(element: Element): boolean;
  isValidUserHeader(element: Element): boolean;

  // Screenshot-related methods
  getAvatarUrl(tweetElement: Element): string | null;
  isVerified(tweetElement: Element): boolean;
  getImageUrls(tweetElement: Element): string[];
  getTweetUrl(tweetElement: Element): string | null;
  getTimestampInfo(tweetElement: Element): TimestampInfo;
  getFullTweetData(tweetElement: Element): TweetData | null;
}

export class TweetParser implements ITweetParser {
  getTweetId(tweetElement: Element): string | null {
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) {
      const href = tweetLink.getAttribute('href');
      const match = href?.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  extractUsername(tweetHeader: Element): string | null {
    const usernameElements = tweetHeader.querySelectorAll('a[href^="/"] span');
    const usernameElement = Array.from(usernameElements).find((el) =>
      el.textContent?.trim().startsWith('@')
    );

    if (usernameElement) {
      const username = usernameElement.textContent?.trim().slice(1); // Remove '@' symbol
      return username || null;
    }

    return null;
  }

  findUserElements(
    username: string,
    container: Element = document.body
  ): Element[] {
    const selector = `a[href="/${username}"]:not([data-testid="UserName-container"])`;
    return Array.from(container.querySelectorAll(selector));
  }

  hasVideoContent(tweetElement: Element): boolean {
    return (
      this.hasVideoPlayer(tweetElement) || this.hasGifContent(tweetElement)
    );
  }

  hasGifContent(tweetElement: Element): boolean {
    const gifContainer = tweetElement.querySelector(
      '[data-testid="tweetPhoto"] img[src*=".gif"]'
    );
    return !!gifContainer;
  }

  findVideoElements(tweetElement: Element): Element[] {
    const videoSelectors = [
      '[data-testid="videoComponent"]',
      '[data-testid="videoPlayer"]',
      '[data-testid="previewInterstitial"]',
    ];

    const elements: Element[] = [];
    videoSelectors.forEach((selector) => {
      const found = tweetElement.querySelectorAll(selector);
      elements.push(...Array.from(found));
    });

    return elements;
  }

  getActionBar(tweetElement: Element): Element | null {
    return tweetElement.querySelector('[role="group"]');
  }

  getVideoContainer(tweetElement: Element): Element | null {
    const videoElement = tweetElement.querySelector(
      '[data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
    );
    return videoElement;
  }

  hasRemarkButton(tweetHeader: Element): boolean {
    return tweetHeader.classList.contains('remark-button-added');
  }

  hasVideoDownloadButton(actionBar: Element): boolean {
    return !!actionBar.querySelector('.video-download-btn');
  }

  isValidTweetElement(element: Element): boolean {
    return (
      element.tagName === 'ARTICLE' &&
      element.getAttribute('data-testid') === 'tweet'
    );
  }

  isValidUserHeader(element: Element): boolean {
    return element.getAttribute('data-testid') === 'User-Name';
  }

  // Additional helper methods for advanced parsing

  /**
   * Checks if tweet element has video player (excluding GIFs)
   */
  private hasVideoPlayer(tweetElement: Element): boolean {
    const videoContainer = tweetElement.querySelector(
      '[data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="previewInterstitial"]'
    );
    return !!videoContainer;
  }

  /**
   * Gets all username mention elements in a tweet
   */
  getUserMentions(tweetElement: Element): Element[] {
    const mentionElements = tweetElement.querySelectorAll('a[href^="/"]');
    return Array.from(mentionElements).filter((element) => {
      const href = element.getAttribute('href');
      return href && href.match(/^\/[^/]+$/) && !href.includes('/status/');
    });
  }

  /**
   * Extracts tweet text content
   */
  getTweetText(tweetElement: Element): string {
    const tweetTextElement = tweetElement.querySelector(
      '[data-testid="tweetText"]'
    );
    return tweetTextElement?.textContent?.trim() || '';
  }

  /**
   * Gets the display name (not username) from a tweet header
   */
  getDisplayName(tweetHeader: Element): string | null {
    const displayNameElements =
      tweetHeader.querySelectorAll('a[href^="/"] span');
    const displayNameElement = Array.from(displayNameElements).find(
      (el) => !el.textContent?.trim().startsWith('@')
    );

    return displayNameElement?.textContent?.trim() || null;
  }

  /**
   * Checks if tweet is a retweet
   */
  isRetweet(tweetElement: Element): boolean {
    return !!tweetElement.querySelector('[data-testid="socialContext"]');
  }

  /**
   * Checks if tweet is a reply
   */
  isReply(tweetElement: Element): boolean {
    return !!tweetElement.querySelector('[data-testid="reply"]');
  }

  /**
   * Gets the timestamp element from a tweet
   */
  getTimestamp(tweetElement: Element): Element | null {
    return tweetElement.querySelector('time');
  }

  /**
   * Gets all media elements (images, videos, etc.) from a tweet
   */
  getMediaElements(tweetElement: Element): Element[] {
    const mediaSelectors = [
      '[data-testid="tweetPhoto"]',
      '[data-testid="videoComponent"]',
      '[data-testid="videoPlayer"]',
      '[data-testid="previewInterstitial"]',
    ];

    const elements: Element[] = [];
    mediaSelectors.forEach((selector) => {
      const found = tweetElement.querySelectorAll(selector);
      elements.push(...Array.from(found));
    });

    return elements;
  }

  // ============ Screenshot-related methods ============

  /**
   * Gets the avatar URL from a tweet element
   */
  getAvatarUrl(tweetElement: Element): string | null {
    const avatarContainer = tweetElement.querySelector(
      '[data-testid="Tweet-User-Avatar"]'
    );
    if (avatarContainer) {
      const img = avatarContainer.querySelector('img');
      if (img) {
        return img.getAttribute('src');
      }
    }
    return null;
  }

  /**
   * Checks if the tweet author is verified
   */
  isVerified(tweetElement: Element): boolean {
    const userNameContainer = tweetElement.querySelector(
      '[data-testid="User-Name"]'
    );
    if (!userNameContainer) {
      return false;
    }

    // Check for verification badge (blue checkmark)
    const verifiedIcon = userNameContainer.querySelector(
      '[data-testid="icon-verified"], [data-testid="verificationBadge"]'
    );
    return !!verifiedIcon;
  }

  /**
   * Gets all image URLs from tweet content (excluding avatar)
   */
  getImageUrls(tweetElement: Element): string[] {
    const imageUrls: string[] = [];

    // Get images from tweetPhoto containers only (excludes avatar)
    const photoContainers = tweetElement.querySelectorAll(
      '[data-testid="tweetPhoto"]'
    );
    photoContainers.forEach((container) => {
      const img = container.querySelector('img');
      if (img) {
        const src = img.getAttribute('src');
        if (src) {
          imageUrls.push(src);
        }
      }
    });

    return imageUrls;
  }

  /**
   * Gets the full tweet URL
   */
  getTweetUrl(tweetElement: Element): string | null {
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) {
      const href = tweetLink.getAttribute('href');
      if (href) {
        return `https://twitter.com${href}`;
      }
    }
    return null;
  }

  /**
   * Gets timestamp information from a tweet
   */
  getTimestampInfo(tweetElement: Element): TimestampInfo {
    const timeElement = tweetElement.querySelector('time');
    if (timeElement) {
      return {
        displayText: timeElement.textContent?.trim() || null,
        datetime: timeElement.getAttribute('datetime'),
      };
    }
    return {
      displayText: null,
      datetime: null,
    };
  }

  /**
   * Checks if action bar has screenshot button
   */
  hasScreenshotButton(actionBar: Element): boolean {
    return !!actionBar.querySelector('.screenshot-btn');
  }

  /**
   * Gets complete tweet data for screenshot generation
   */
  getFullTweetData(tweetElement: Element): TweetData | null {
    // Extract tweet ID
    const tweetId = this.getTweetId(tweetElement);
    if (!tweetId) {
      return null;
    }

    // Extract user header info
    const userHeader = tweetElement.querySelector('[data-testid="User-Name"]');
    if (!userHeader) {
      return null;
    }

    const username = this.extractUsername(userHeader);
    const displayName = this.getDisplayName(userHeader);
    const avatarUrl = this.getAvatarUrl(tweetElement);

    // Validate required fields
    if (!username || !displayName || !avatarUrl) {
      return null;
    }

    // Get tweet content
    const content = this.getTweetText(tweetElement);

    // Get timestamp info
    const timestampInfo = this.getTimestampInfo(tweetElement);

    // Get tweet URL
    const tweetUrl = this.getTweetUrl(tweetElement);
    if (!tweetUrl) {
      return null;
    }

    return {
      tweetId,
      displayName,
      username,
      avatarUrl,
      content,
      timestamp: timestampInfo.displayText || '',
      datetime: timestampInfo.datetime || undefined,
      isVerified: this.isVerified(tweetElement),
      imageUrls: this.getImageUrls(tweetElement),
      isRetweet: this.isRetweet(tweetElement),
      tweetUrl,
    };
  }
}
