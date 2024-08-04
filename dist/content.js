"use strict";
// src/content.ts
class TwitterEnhancer {
    constructor() {
        this.init();
    }
    static getInstance() {
        if (!TwitterEnhancer.instance) {
            TwitterEnhancer.instance = new TwitterEnhancer();
        }
        return TwitterEnhancer.instance;
    }
    addCustomButton() {
        const tweetActions = document.querySelectorAll('[data-testid="tweet"] [role="group"]');
        tweetActions.forEach((actionGroup) => {
            if (!actionGroup.querySelector('.custom-action')) {
                const customButton = document.createElement('div');
                customButton.className = 'custom-action';
                customButton.innerHTML = `
            <button class="custom-button">
              <span>Click</span>
            </button>
          `;
                customButton.addEventListener('click', this.handleCustomAction);
                actionGroup.appendChild(customButton);
            }
        });
    }
    handleCustomAction(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log('Custom action triggered!');
        // Implement your custom action here
    }
    init() {
        this.addCustomButton();
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    this.addCustomButton();
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
