import { printLine } from './modules/print';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");



interface UserRemark {
    username: string;
    remark: string;
}

interface TwitterEnhancerSettings {
    userRemarks: UserRemark[];
    remarkFeatureEnabled: boolean;
    videoDownloadFeatureEnabled: boolean;
}

class TwitterEnhancer {
    private static instance: TwitterEnhancer;
    private userRemarks: UserRemark[] = [];
    private observer: MutationObserver;
    private remarkFeatureEnabled: boolean = true;
    private videoDownloadFeatureEnabled: boolean = true;
    private dialog: HTMLElement | null = null;
    private dialogTitle: HTMLElement | null = null;
    private remarkInput: HTMLInputElement | null = null;
    private saveRemarkBtn: HTMLElement | null = null;
    private cancelRemarkBtn: HTMLElement | null = null;
    private currentUsername: string = '';

    private constructor() {
        this.observer = new MutationObserver(this.handleMutations.bind(this));
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
            this.setupObserver();
            this.setupEventListeners();
            this.injectStyles();
        } catch (error) {
            console.error('Error initializing TwitterEnhancer:', error);
        }
    }

    private async loadSettings(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['userRemarks', 'remarkFeatureEnabled', 'videoDownloadFeatureEnabled'], (result: { [key: string]: any }) => {
                const settings = result as TwitterEnhancerSettings;
                this.userRemarks = settings.userRemarks || [];
                this.remarkFeatureEnabled = settings.remarkFeatureEnabled ?? true;
                this.videoDownloadFeatureEnabled = settings.videoDownloadFeatureEnabled ?? true;
                resolve();
            });
        });
    }

    private setupObserver(): void {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
    }

    private setupEventListeners(): void {
        document.addEventListener('DOMContentLoaded', () => {
            window.addEventListener('pushstate-changed', this.handlePageChange.bind(this));
            window.addEventListener('popstate', this.handlePageChange.bind(this));
        });

        chrome.runtime.onMessage.addListener(this.handleSettingsUpdate.bind(this));
    }

    private handleSettingsUpdate(request: any, sender: any, sendResponse: any): void {
        if (request.action === "updateSettings") {
            this.remarkFeatureEnabled = request.remarkFeatureEnabled;
            this.videoDownloadFeatureEnabled = request.videoDownloadFeatureEnabled;
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
        }
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .remark-dialog {
                display: none;
                position: fixed;
                z-index: 9999;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            }

            .remark-dialog-content {
                background-color: #ffffff;
                margin: 15% auto;
                padding: 20px;
                border-radius: 10px;
                width: 90%;
                max-width: 400px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .remark-dialog h2 {
                color: #1da1f2;
                margin-bottom: 15px;
            }

            .remark-dialog input {
                width: 100%;
                padding: 10px;
                margin-bottom: 15px;
                border: 1px solid #ccd6dd;
                border-radius: 5px;
                font-size: 14px;
                box-sizing: border-box;
            }

            .remark-dialog-buttons {
                display: flex;
                justify-content: flex-end;
            }

            .remark-dialog button {
                padding: 8px 15px;
                margin-left: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            }

            #cancelRemarkBtn {
                background-color: #ccd6dd;
                color: #14171a;
            }

            #saveRemarkBtn {
                background-color: #1da1f2;
                color: #ffffff;
            }

            #cancelRemarkBtn:hover {
                background-color: #b1bbc3;
            }

            #saveRemarkBtn:hover {
                background-color: #1a91da;
            }

            .video-download-btn {
                color: rgb(83, 100, 113);
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 36px;
                min-height: 36px;
                cursor: pointer;
                transition: color 0.2s ease;
            }
            .video-download-btn:hover {
                color: rgb(29, 155, 240);
            }
            .video-download-btn > div {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .video-download-btn svg {
                width: 1.25em;
                height: 1.25em;
            }

            .video-download-btn .loading-icon {
                display: none;
            }
            .video-download-btn.loading .loading-icon {
                display: block;
            }
            .video-download-btn.loading .download-icon {
                display: none;
            }
            .video-download-btn .loading-icon svg {
                width: 24px;
                height: 24px;
            }
            .video-download-btn .loading-icon svg circle {
                stroke: currentColor;
                opacity: 0.125;
            }
            .video-download-btn .loading-icon svg circle:nth-child(1) { stroke: #ff0000; }
            .video-download-btn .loading-icon svg circle:nth-child(2) { stroke: #ff8000; }
            .video-download-btn .loading-icon svg circle:nth-child(3) { stroke: #ffff00; }
            .video-download-btn .loading-icon svg circle:nth-child(4) { stroke: #00ff00; }
            .video-download-btn .loading-icon svg circle:nth-child(5) { stroke: #0080ff; }
            .video-download-btn .loading-icon svg circle:nth-child(6) { stroke: #8000ff; }
            .video-download-btn .loading-icon svg circle:nth-child(7) { stroke: #ff00ff; }
            .video-download-btn .loading-icon svg circle:nth-child(8) { stroke: #ff0080; }
        `;
        document.head.appendChild(style);
    }

    private updateButtonText(username: string, hasRemark: boolean): void {
        const buttons = document.querySelectorAll('.add-remark-btn');
        buttons.forEach((button) => {
            const header = button.closest('[data-testid="User-Name"]');
            if (header) {
                const usernameElementAll = header.querySelectorAll('a[href^="/"] span');
                const usernameElement = Array.from(usernameElementAll).find((el) => el.textContent?.trim().startsWith('@'));
                if (usernameElement && usernameElement.textContent?.trim().slice(1) === username) {
                    button.textContent = hasRemark ? 'Edit Remark' : 'Add Remark';
                }
            }
        });
    }

    private async removeRemark(username: string): Promise<void> {
        this.userRemarks = this.userRemarks.filter(r => r.username !== username);
        await this.saveRemarks();
        console.log('Remark removed');
        this.updateUsernames();
        this.updateButtonText(username, false);
    }

    private async saveRemarks(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ userRemarks: this.userRemarks }, () => {
                resolve();
            });
        });
    }

    private replaceUsername(element: Element, username: string, remark: string | null): void {
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
            const userElements = container.querySelectorAll(`a[href="/${username}"]:not([data-testid="UserName-container"])`);
            userElements.forEach((element) => {
                if (!(element.textContent?.trim().startsWith('@'))) {
                    this.replaceUsername(element, username, remark);
                }
            });
        });
    }

    private addRemarkButton(): void {
        if (!this.remarkFeatureEnabled) return;

        const tweetHeaders = document.querySelectorAll('[data-testid="User-Name"]:not(.remark-button-added)');
        tweetHeaders.forEach((header) => {
            const usernameElementAll = header.querySelectorAll('a[href^="/"] span');
            const usernameElement = Array.from(usernameElementAll).find((el) => el.textContent?.trim().startsWith('@'));
            if (usernameElement) {
                const username = usernameElement.textContent?.trim().slice(1); // Remove '@' symbol
                if (username) {
                    const button = document.createElement('button');
                    button.className = 'add-remark-btn';
                    const existingRemark = this.userRemarks.find(r => r.username === username);
                    button.textContent = existingRemark ? 'Edit Remark' : 'Add Remark';
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

    private async handleSaveRemark(): Promise<void> {
        const remark = this.remarkInput?.value.trim();
        if (remark !== undefined) {
            if (remark !== '') {
                const existingRemarkIndex = this.userRemarks.findIndex(r => r.username === this.currentUsername);
                if (existingRemarkIndex !== -1) {
                    this.userRemarks[existingRemarkIndex].remark = remark;
                } else {
                    this.userRemarks.push({ username: this.currentUsername, remark });
                }
                await this.saveRemarks();
                console.log('Remark saved');
                this.updateUsernames();
                this.updateButtonText(this.currentUsername, true);
            } else {
                await this.removeRemark(this.currentUsername);
            }
        }
        this.closeDialog();
    }

    private handleAddOrEditRemark(username: string): void {
        this.openDialog(username);
    }

    private handleMutations(mutations: MutationRecord[]): void {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof Element) {
                        this.updateUsernames(node);
                        this.addRemarkButton();
                        this.addVideoDownloadButtons();
                    }
                });
            } else if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                const tweet = mutation.target.closest('article[data-testid="tweet"]');
                if (tweet && !tweet.classList.contains('video-download-added')) {
                    this.addVideoDownloadButtons();
                }
            }
        });
    }

    private handlePageChange(): void {
        setTimeout(() => {
            this.updateUsernames();
            this.addRemarkButton();
            this.addVideoDownloadButtons();
        }, 1000);
    }

    private removeAllRemarks(): void {
        document.querySelectorAll('.username-replaced').forEach((element) => {
            const usernameElement = element.querySelector('span');
            if (usernameElement && element.getAttribute('title')) {
                usernameElement.textContent = element.getAttribute('title')?.slice(1) ?? '';
                element.removeAttribute('title');
                element.classList.remove('username-replaced');
            }
        });
        document.querySelectorAll('.add-remark-btn').forEach((button) => button.remove());
        document.querySelectorAll('.remark-button-added').forEach((element) => element.classList.remove('remark-button-added'));
    }

    private createDialog(): void {
        const dialogHTML = `
            <div id="remarkDialog" class="remark-dialog">
              <div class="remark-dialog-content">
                <h2 id="remarkDialogTitle">Add Remark</h2>
                <input type="text" id="remarkInput" placeholder="Enter remark">
                <div class="remark-dialog-buttons">
                  <button id="cancelRemarkBtn">Cancel</button>
                  <button id="saveRemarkBtn">Save</button>
                </div>
              </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        this.dialog = document.getElementById('remarkDialog');
        this.dialogTitle = document.getElementById('remarkDialogTitle');
        this.remarkInput = document.getElementById('remarkInput') as HTMLInputElement;
        this.saveRemarkBtn = document.getElementById('saveRemarkBtn');
        this.cancelRemarkBtn = document.getElementById('cancelRemarkBtn');

        this.saveRemarkBtn?.addEventListener('click', this.handleSaveRemark.bind(this));
        this.cancelRemarkBtn?.addEventListener('click', this.closeDialog.bind(this));
    }

    private openDialog(username: string): void {
        if (!this.dialog) this.createDialog();

        const existingRemark = this.userRemarks.find(r => r.username === username)?.remark;
        this.currentUsername = username;

        if (this.dialogTitle) this.dialogTitle.textContent = existingRemark ? 'Edit Remark' : 'Add Remark';
        if (this.remarkInput) this.remarkInput.value = existingRemark || '';
        if (this.dialog) this.dialog.style.display = 'block';
    }

    private closeDialog(): void {
        if (this.dialog) this.dialog.style.display = 'none';
        this.currentUsername = '';
    }

    private addVideoDownloadButtons(): void {
        if (!this.videoDownloadFeatureEnabled) return;

        const tweets = document.querySelectorAll('article[data-testid="tweet"]:not(.video-download-added)');
        tweets.forEach((tweet) => {
            const videoContainer = tweet.querySelector('[data-testid="videoComponent"], [data-testid="videoPlayer"], [data-testid="previewInterstitial"], [data-testid="tweetPhoto"]');
            if (videoContainer) {
                console.log('Media container found:', videoContainer);
                const actionBar = tweet.querySelector('[role="group"]');
                if (actionBar && !actionBar.querySelector('.video-download-btn')) {
                    const downloadButton = document.createElement('div');
                    downloadButton.className = 'video-download-btn';
                    downloadButton.setAttribute('aria-label', 'Download media');
                    downloadButton.innerHTML = `
                        <div role="button" tabindex="0">
                            <div class="download-icon">
                                ${this.generateDownloadIconSVG()}
                            </div>
                            <div class="loading-icon">
                                <svg viewBox="0 0 24 24">
                                    ${this.generateLoadingIconSVG()}
                                </svg>
                            </div>
                        </div>
                    `;
                    downloadButton.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.handleVideoDownload(tweet, downloadButton);
                    });
                    actionBar.appendChild(downloadButton);
                    console.log('Download button added to tweet');
                }
                tweet.classList.add('video-download-added');
            }
        });
    }

    private async handleVideoDownload(tweetElement: Element, button: HTMLElement): Promise<void> {
        // Show loading state
        button.classList.add('loading');

        const tweetId = this.getTweetId(tweetElement);
        if (!tweetId) {
            console.error('Could not find tweet ID');
            alert('Sorry, unable to find the tweet ID for download.');
            button.classList.remove('loading');
            return;
        }

        chrome.runtime.sendMessage({ action: "downloadVideo", tweetId: tweetId }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Error sending message:', chrome.runtime.lastError);
                alert('An error occurred while trying to download the video.');
            } else if (response.success) {
                console.log('Download initiated:', response);
            } else {
                console.error('Download failed:', response.error);
                alert(`Sorry, unable to download the video: ${response.error}`);
            }
            button.classList.remove('loading');
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
        document.querySelectorAll('.video-download-btn').forEach((button) => button.remove());
        document.querySelectorAll('.video-download-added').forEach((element) => element.classList.remove('video-download-added'));
    }

    private generateDownloadIconSVG(): string {
        return `
            <svg viewBox="0 0 24 24">
                <path d="M4 14l8 7 8-7m-8-7v14" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
        `;
    }

    private generateLoadingIconSVG(): string {
        return Array.from({ length: 8 }, (_, i) => `
            <circle cx="12" cy="12" r="8" fill="none" stroke-width="2" stroke-dasharray="12.5 12.5"
                transform="rotate(${i * 45} 12 12)">
                <animateTransform attributeName="transform" type="rotate" 
                    values="${i * 45} 12 12;${i * 45 + 360} 12 12" dur="1.5s" 
                    repeatCount="indefinite" />
            </circle>
        `).join('');
    }
}

// Initialize the enhancer
TwitterEnhancer.getInstance();
