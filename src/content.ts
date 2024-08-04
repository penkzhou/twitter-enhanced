// src/content.ts

interface UserRemark {
    username: string;
    remark: string;
}

class TwitterEnhancer {
    private static instance: TwitterEnhancer;
    private userRemarks: UserRemark[] = [];
    private observer: MutationObserver;

    private constructor() {
        this.loadUserRemarks().then(() => this.init());
        this.observer = new MutationObserver(this.handleMutations.bind(this));
    }

    public static getInstance(): TwitterEnhancer {
        if (!TwitterEnhancer.instance) {
            TwitterEnhancer.instance = new TwitterEnhancer();
        }
        return TwitterEnhancer.instance;
    }

    private async loadUserRemarks(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['userRemarks'], (result) => {
                this.userRemarks = result.userRemarks || [];
                resolve();
            });
        });
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

    private removeRemark(username: string): void {
        this.userRemarks = this.userRemarks.filter(r => r.username !== username);
        this.saveRemarks(() => {
            console.log('Remark removed');
            this.updateUsernames();
            this.updateButtonText(username, false);
        });
    }

    private saveRemarks(callback: () => void): void {
        chrome.storage.sync.set({ userRemarks: this.userRemarks }, callback);
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
        const tweetHeaders = document.querySelectorAll('[data-testid="User-Name"]:not(.remark-button-added)');
        tweetHeaders.forEach((header) => {
            const usernameElementAll = header.querySelectorAll('a[href^="/"] span');
            const usernameElement = Array.from(usernameElementAll).find((el) => el.textContent?.trim().startsWith('@'));
            if (usernameElement) {
                const username = usernameElement.textContent?.trim().slice(1); // Remove '@' symbol
                if (username) {
                    const button = document.createElement('button');
                    button.className = 'add-remark-btn';
                    // if user already has a remark, change the button text to 'Edit Remark'
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

    private handleAddOrEditRemark(username: string): void {
        const existingRemark = this.userRemarks.find(r => r.username === username)?.remark;
        const remark = prompt(`Enter a remark name for @${username}:`, existingRemark || '');
        if (remark !== null) {
            if (remark.trim() !== '') {
                const existingRemarkIndex = this.userRemarks.findIndex(r => r.username === username);
                if (existingRemarkIndex !== -1) {
                    this.userRemarks[existingRemarkIndex].remark = remark;
                } else {
                    this.userRemarks.push({ username, remark });
                }
                this.saveRemarks(() => {
                    console.log('Remark saved');
                    this.updateUsernames();
                    this.updateButtonText(username, true);
                });
            } else {
                this.removeRemark(username);
            }
        }
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

    private init(): void {
        // Initial update
        this.updateUsernames();
        this.addRemarkButton();

        // Set up the observer
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Listen for Twitter's custom navigation event
        document.addEventListener('DOMContentLoaded', () => {
            window.addEventListener('pushstate-changed', this.handlePageChange.bind(this));
            window.addEventListener('popstate', this.handlePageChange.bind(this));
        });
    }

    private handlePageChange(): void {
        // Wait for the page content to update
        setTimeout(() => {
            this.updateUsernames();
            this.addRemarkButton();
        }, 1000); // Adjust this delay if needed
    }
}

// Initialize the enhancer
TwitterEnhancer.getInstance();