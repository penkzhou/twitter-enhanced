// src/content.ts

interface UserRemark {
    username: string;
    remark: string;
}

class TwitterEnhancer {
    private static instance: TwitterEnhancer;
    private userRemarks: UserRemark[] = [];

    private constructor() {
        this.loadUserRemarks().then(() => this.init());
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

    private addOrUpdateRemarkSpan(element: Element, remark: string): void {
        let remarkSpan = element.querySelector('.user-remark') as HTMLSpanElement;
        if (!remarkSpan) {
            remarkSpan = document.createElement('span');
            remarkSpan.className = 'user-remark';
            element.appendChild(remarkSpan);
        }
        remarkSpan.textContent = ` (${remark})`;
    }

    private updateAllUserRemarks(): void {
        this.userRemarks.forEach(({ username, remark }) => {
            const userElements = document.querySelectorAll(`a[href="/${username}"]`);
            userElements.forEach((element) => {
                this.addOrUpdateRemarkSpan(element, remark);
            });
        });
    }

    private addRemarkButton(): void {
        const tweetHeaders = document.querySelectorAll('[data-testid="User-Name"]');
        tweetHeaders.forEach((header) => {
            if (!header.querySelector('.add-remark-btn')) {
                const usernameElement = header.querySelector('a[href^="/"] span');
                if (usernameElement) {
                    const username = usernameElement.textContent?.trim().slice(1); // Remove '@' symbol
                    if (username) {
                        const button = document.createElement('button');
                        button.className = 'add-remark-btn';
                        button.textContent = 'Add Remark';
                        button.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.handleAddRemark(username);
                        });
                        header.appendChild(button);
                    }
                }
            }
        });
    }

    private handleAddRemark(username: string): void {
        const existingRemark = this.userRemarks.find(r => r.username === username)?.remark;
        const remark = prompt(`Enter a remark for @${username}:`, existingRemark || '');
        if (remark !== null) {
            const existingRemarkIndex = this.userRemarks.findIndex(r => r.username === username);
            if (existingRemarkIndex !== -1) {
                this.userRemarks[existingRemarkIndex].remark = remark;
            } else {
                this.userRemarks.push({ username, remark });
            }
            chrome.storage.sync.set({ userRemarks: this.userRemarks }, () => {
                console.log('Remark saved');
                this.updateAllUserRemarks();
            });
        }
    }

    private init(): void {
        this.updateAllUserRemarks();
        this.addRemarkButton();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    this.updateAllUserRemarks();
                    this.addRemarkButton();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the enhancer
TwitterEnhancer.getInstance();