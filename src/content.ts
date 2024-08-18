// src/content.ts

interface UserRemark {
    username: string;
    remark: string;
}

interface TwitterEnhancerSettings {
    userRemarks: UserRemark[];
    remarkFeatureEnabled: boolean;
}

class TwitterEnhancer {
    private static instance: TwitterEnhancer;
    private userRemarks: UserRemark[] = [];
    private observer: MutationObserver;
    private remarkFeatureEnabled: boolean = true;
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
            this.setupObserver();
            this.setupEventListeners();
            this.injectStyles();
        } catch (error) {
            console.error('Error initializing TwitterEnhancer:', error);
        }
    }

    private async loadSettings(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['userRemarks', 'remarkFeatureEnabled'], (result: { [key: string]: any }) => {
                const settings = result as TwitterEnhancerSettings;
                this.userRemarks = settings.userRemarks || [];
                this.remarkFeatureEnabled = settings.remarkFeatureEnabled ?? true;
                resolve();
            });
        });
    }

    private setupObserver(): void {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
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
            if (this.remarkFeatureEnabled) {
                this.updateUsernames();
                this.addRemarkButton();
            } else {
                this.removeAllRemarks();
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
                    }
                });
            }
        });
    }

    private handlePageChange(): void {
        setTimeout(() => {
            this.updateUsernames();
            this.addRemarkButton();
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
}

// Initialize the enhancer
TwitterEnhancer.getInstance();