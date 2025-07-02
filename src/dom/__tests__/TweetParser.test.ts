import { TweetParser } from '../TweetParser';

describe('TweetParser', () => {
  let tweetParser: TweetParser;

  beforeEach(() => {
    tweetParser = new TweetParser();
    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('Tweet ID Extraction', () => {
    describe('getTweetId', () => {
      it('should extract tweet ID from tweet element', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <a href="/user/status/1234567890">Tweet link</a>
        `;

        const tweetId = tweetParser.getTweetId(tweetElement);
        expect(tweetId).toBe('1234567890');
      });

      it('should return null when no status link found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <a href="/user/profile">Profile link</a>
        `;

        const tweetId = tweetParser.getTweetId(tweetElement);
        expect(tweetId).toBeNull();
      });

      it('should return null when status link has invalid format', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <a href="/user/status/invalid">Invalid link</a>
        `;

        const tweetId = tweetParser.getTweetId(tweetElement);
        expect(tweetId).toBeNull();
      });

      it('should extract ID from complex tweet structure', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div>
            <div>
              <a href="/someuser/status/9876543210?s=20">
                <time>2 hours ago</time>
              </a>
            </div>
          </div>
        `;

        const tweetId = tweetParser.getTweetId(tweetElement);
        expect(tweetId).toBe('9876543210');
      });
    });
  });

  describe('Username Extraction', () => {
    describe('extractUsername', () => {
      it('should extract username from tweet header', () => {
        const tweetHeader = document.createElement('div');
        tweetHeader.innerHTML = `
          <a href="/testuser">
            <span>Display Name</span>
            <span>@testuser</span>
          </a>
        `;

        const username = tweetParser.extractUsername(tweetHeader);
        expect(username).toBe('testuser');
      });

      it('should return null when no username found', () => {
        const tweetHeader = document.createElement('div');
        tweetHeader.innerHTML = `
          <a href="/testuser">
            <span>Display Name</span>
          </a>
        `;

        const username = tweetParser.extractUsername(tweetHeader);
        expect(username).toBeNull();
      });

      it('should extract username from multiple span elements', () => {
        const tweetHeader = document.createElement('div');
        tweetHeader.innerHTML = `
          <div>
            <a href="/user1">
              <span>Name 1</span>
            </a>
            <a href="/user2">
              <span>@user2</span>
            </a>
          </div>
        `;

        const username = tweetParser.extractUsername(tweetHeader);
        expect(username).toBe('user2');
      });
    });

    describe('findUserElements', () => {
      beforeEach(() => {
        document.body.innerHTML = `
          <a href="/testuser">User Link 1</a>
          <a href="/testuser" data-testid="UserName-container">User Container</a>
          <a href="/testuser">User Link 2</a>
          <div class="container">
            <a href="/testuser">User Link 3</a>
          </div>
        `;
      });

      it('should find all user elements excluding UserName-container', () => {
        const elements = tweetParser.findUserElements('testuser');

        expect(elements).toHaveLength(3);
        expect(elements[0].textContent).toBe('User Link 1');
        expect(elements[1].textContent).toBe('User Link 2');
        expect(elements[2].textContent).toBe('User Link 3');
      });

      it('should find user elements within specific container', () => {
        const container = document.querySelector('.container') as Element;
        const elements = tweetParser.findUserElements('testuser', container);

        expect(elements).toHaveLength(1);
        expect(elements[0].textContent).toBe('User Link 3');
      });
    });
  });

  describe('Video Content Detection', () => {
    describe('hasVideoContent', () => {
      it('should return true for tweet with video component', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="videoComponent">Video</div>
        `;

        expect(tweetParser.hasVideoContent(tweetElement)).toBe(true);
      });

      it('should return true for tweet with video player', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="videoPlayer">Video Player</div>
        `;

        expect(tweetParser.hasVideoContent(tweetElement)).toBe(true);
      });

      it('should return true for tweet with GIF', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetPhoto">
            <img src="https://example.com/image.gif" />
          </div>
        `;

        expect(tweetParser.hasVideoContent(tweetElement)).toBe(true);
      });

      it('should return false for tweet without video content', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetPhoto">
            <img src="https://example.com/image.jpg" />
          </div>
        `;

        expect(tweetParser.hasVideoContent(tweetElement)).toBe(false);
      });
    });

    describe('hasGifContent', () => {
      it('should return true for tweet with GIF image', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetPhoto">
            <img src="https://example.com/animated.gif" />
          </div>
        `;

        expect(tweetParser.hasGifContent(tweetElement)).toBe(true);
      });

      it('should return false for tweet with regular image', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetPhoto">
            <img src="https://example.com/image.jpg" />
          </div>
        `;

        expect(tweetParser.hasGifContent(tweetElement)).toBe(false);
      });
    });

    describe('findVideoElements', () => {
      it('should find all video elements in tweet', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="videoComponent">Video 1</div>
          <div data-testid="videoPlayer">Video 2</div>
          <div data-testid="previewInterstitial">Video 3</div>
          <div data-testid="tweetPhoto">Photo</div>
        `;

        const videoElements = tweetParser.findVideoElements(tweetElement);

        expect(videoElements).toHaveLength(3);
        expect(videoElements[0].getAttribute('data-testid')).toBe(
          'videoComponent'
        );
        expect(videoElements[1].getAttribute('data-testid')).toBe(
          'videoPlayer'
        );
        expect(videoElements[2].getAttribute('data-testid')).toBe(
          'previewInterstitial'
        );
      });
    });
  });

  describe('Tweet Structure Navigation', () => {
    describe('getActionBar', () => {
      it('should find action bar in tweet', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div>
            <div role="group">Action Bar</div>
          </div>
        `;

        const actionBar = tweetParser.getActionBar(tweetElement);
        expect(actionBar).not.toBeNull();
        expect(actionBar?.textContent).toBe('Action Bar');
      });

      it('should return null when no action bar found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `<div>No action bar</div>`;

        const actionBar = tweetParser.getActionBar(tweetElement);
        expect(actionBar).toBeNull();
      });
    });

    describe('getVideoContainer', () => {
      it('should find video container in tweet', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="videoComponent">Video Container</div>
        `;

        const container = tweetParser.getVideoContainer(tweetElement);
        expect(container).not.toBeNull();
        expect(container?.textContent).toBe('Video Container');
      });

      it('should return null when no video container found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `<div>No video</div>`;

        const container = tweetParser.getVideoContainer(tweetElement);
        expect(container).toBeNull();
      });
    });
  });

  describe('Button State Checking', () => {
    describe('hasRemarkButton', () => {
      it('should return true when header has remark button class', () => {
        const header = document.createElement('div');
        header.classList.add('remark-button-added');

        expect(tweetParser.hasRemarkButton(header)).toBe(true);
      });

      it('should return false when header does not have remark button class', () => {
        const header = document.createElement('div');

        expect(tweetParser.hasRemarkButton(header)).toBe(false);
      });
    });

    describe('hasVideoDownloadButton', () => {
      it('should return true when action bar has video download button', () => {
        const actionBar = document.createElement('div');
        actionBar.innerHTML = `
          <button class="video-download-btn">Download</button>
        `;

        expect(tweetParser.hasVideoDownloadButton(actionBar)).toBe(true);
      });

      it('should return false when action bar has no video download button', () => {
        const actionBar = document.createElement('div');
        actionBar.innerHTML = `<button>Other button</button>`;

        expect(tweetParser.hasVideoDownloadButton(actionBar)).toBe(false);
      });
    });
  });

  describe('Element Validation', () => {
    describe('isValidTweetElement', () => {
      it('should return true for valid tweet element', () => {
        const element = document.createElement('article');
        element.setAttribute('data-testid', 'tweet');

        expect(tweetParser.isValidTweetElement(element)).toBe(true);
      });

      it('should return false for non-article element', () => {
        const element = document.createElement('div');
        element.setAttribute('data-testid', 'tweet');

        expect(tweetParser.isValidTweetElement(element)).toBe(false);
      });

      it('should return false for element without tweet testid', () => {
        const element = document.createElement('article');
        element.setAttribute('data-testid', 'other');

        expect(tweetParser.isValidTweetElement(element)).toBe(false);
      });
    });

    describe('isValidUserHeader', () => {
      it('should return true for valid user header', () => {
        const element = document.createElement('div');
        element.setAttribute('data-testid', 'User-Name');

        expect(tweetParser.isValidUserHeader(element)).toBe(true);
      });

      it('should return false for element without User-Name testid', () => {
        const element = document.createElement('div');
        element.setAttribute('data-testid', 'other');

        expect(tweetParser.isValidUserHeader(element)).toBe(false);
      });
    });
  });

  describe('Advanced Parsing Methods', () => {
    describe('getUserMentions', () => {
      it('should find user mention links', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <a href="/user1">@user1</a>
          <a href="/user2">@user2</a>
          <a href="/user1/status/123">Status link</a>
          <a href="https://external.com">External link</a>
        `;

        const mentions = tweetParser.getUserMentions(tweetElement);

        expect(mentions).toHaveLength(2);
        expect(mentions[0].getAttribute('href')).toBe('/user1');
        expect(mentions[1].getAttribute('href')).toBe('/user2');
      });
    });

    describe('getTweetText', () => {
      it('should extract tweet text content', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetText">This is a test tweet</div>
        `;

        const text = tweetParser.getTweetText(tweetElement);
        expect(text).toBe('This is a test tweet');
      });

      it('should return empty string when no tweet text found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `<div>No tweet text</div>`;

        const text = tweetParser.getTweetText(tweetElement);
        expect(text).toBe('');
      });
    });

    describe('getDisplayName', () => {
      it('should extract display name from header', () => {
        const header = document.createElement('div');
        header.innerHTML = `
          <a href="/testuser">
            <span>Display Name</span>
            <span>@testuser</span>
          </a>
        `;

        const displayName = tweetParser.getDisplayName(header);
        expect(displayName).toBe('Display Name');
      });

      it('should return null when no display name found', () => {
        const header = document.createElement('div');
        header.innerHTML = `
          <a href="/testuser">
            <span>@testuser</span>
          </a>
        `;

        const displayName = tweetParser.getDisplayName(header);
        expect(displayName).toBeNull();
      });
    });

    describe('Tweet Type Detection', () => {
      describe('isRetweet', () => {
        it('should return true for retweet', () => {
          const tweetElement = document.createElement('article');
          tweetElement.innerHTML = `
            <div data-testid="socialContext">Retweeted</div>
          `;

          expect(tweetParser.isRetweet(tweetElement)).toBe(true);
        });

        it('should return false for regular tweet', () => {
          const tweetElement = document.createElement('article');
          tweetElement.innerHTML = `<div>Regular tweet</div>`;

          expect(tweetParser.isRetweet(tweetElement)).toBe(false);
        });
      });

      describe('isReply', () => {
        it('should return true for reply tweet', () => {
          const tweetElement = document.createElement('article');
          tweetElement.innerHTML = `
            <div data-testid="reply">Reply</div>
          `;

          expect(tweetParser.isReply(tweetElement)).toBe(true);
        });

        it('should return false for regular tweet', () => {
          const tweetElement = document.createElement('article');
          tweetElement.innerHTML = `<div>Regular tweet</div>`;

          expect(tweetParser.isReply(tweetElement)).toBe(false);
        });
      });
    });

    describe('getTimestamp', () => {
      it('should find timestamp element', () => {
        const tweetElement = document.createElement('article');
        const timeElement = document.createElement('time');
        timeElement.textContent = '2 hours ago';
        tweetElement.appendChild(timeElement);

        const timestamp = tweetParser.getTimestamp(tweetElement);
        expect(timestamp).toBe(timeElement);
        expect(timestamp?.textContent).toBe('2 hours ago');
      });

      it('should return null when no timestamp found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `<div>No timestamp</div>`;

        const timestamp = tweetParser.getTimestamp(tweetElement);
        expect(timestamp).toBeNull();
      });
    });

    describe('getMediaElements', () => {
      it('should find all media elements', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `
          <div data-testid="tweetPhoto">Photo</div>
          <div data-testid="videoComponent">Video</div>
          <div data-testid="videoPlayer">Player</div>
          <div data-testid="previewInterstitial">Preview</div>
          <div data-testid="other">Other</div>
        `;

        const mediaElements = tweetParser.getMediaElements(tweetElement);

        expect(mediaElements).toHaveLength(4);
        expect(mediaElements[0].getAttribute('data-testid')).toBe('tweetPhoto');
        expect(mediaElements[1].getAttribute('data-testid')).toBe(
          'videoComponent'
        );
        expect(mediaElements[2].getAttribute('data-testid')).toBe(
          'videoPlayer'
        );
        expect(mediaElements[3].getAttribute('data-testid')).toBe(
          'previewInterstitial'
        );
      });

      it('should return empty array when no media found', () => {
        const tweetElement = document.createElement('article');
        tweetElement.innerHTML = `<div>No media</div>`;

        const mediaElements = tweetParser.getMediaElements(tweetElement);
        expect(mediaElements).toHaveLength(0);
      });
    });
  });
});
