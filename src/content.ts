// src/content.ts

class TwitterEnhancer {
    private static instance: TwitterEnhancer;
  
    private constructor() {
      this.init();
    }
  
    public static getInstance(): TwitterEnhancer {
      if (!TwitterEnhancer.instance) {
        TwitterEnhancer.instance = new TwitterEnhancer();
      }
      return TwitterEnhancer.instance;
    }
  
    private addCustomButton(): void {
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
  
    private handleCustomAction(event: Event): void {
      event.preventDefault();
      event.stopPropagation();
      console.log('Custom action triggered!');
      // Implement your custom action here
    }
  
    private init(): void {
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