export interface IDOMManager {
  // Dialog operations
  showAlert(message: string): Promise<void>;
  showConfirmDialog(message: string): Promise<boolean>;
  
  // Button creation and management
  createRemarkButton(username: string, hasRemark: boolean, onClick: () => void): HTMLElement;
  createVideoDownloadButton(onClick: (button: HTMLElement) => void): HTMLElement;
  
  // Element finding and manipulation
  findTweetHeaders(): Element[];
  findVideoTweets(): Element[];
  findUsernameElements(container: Element): Element[];
  
  // Button state management
  updateRemarkButtonText(username: string, hasRemark: boolean): void;
  removeAllRemarkButtons(): void;
  removeAllVideoDownloadButtons(): void;
  
  // CSS and styling
  injectStyles(): void;
  
  // Username replacement
  replaceUsernameInElement(element: Element, username: string, remark: string | null): void;
  restoreUsernameInElement(element: Element, username: string): void;
  
  // Cleanup
  cleanup(): void;
}

export class DOMManager implements IDOMManager {
  private readonly i18nGetter: (key: string, substitutions?: string | string[]) => string;
  private activeDialogs: Set<HTMLElement> = new Set();

  constructor(i18nGetter: (key: string, substitutions?: string | string[]) => string) {
    this.i18nGetter = i18nGetter;
  }

  async showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      const alertDialog = document.createElement('div');
      alertDialog.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      alertDialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-auto">
          <p class="text-gray-800 mb-4">${message}</p>
          <button class="custom-alert-ok w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            ${this.i18nGetter('ok')}
          </button>
        </div>
      `;
      
      document.body.appendChild(alertDialog);
      this.activeDialogs.add(alertDialog);

      const okButton = alertDialog.querySelector('.custom-alert-ok');
      okButton?.addEventListener('click', () => {
        this.removeDialog(alertDialog);
        resolve();
      });
    });
  }

  async showConfirmDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmDialog = document.createElement('div');
      confirmDialog.className =
        'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      confirmDialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-auto">
          <p class="text-gray-800 mb-4">${message}</p>
          <div class="flex justify-end space-x-2">
            <button class="custom-confirm-no bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              ${this.i18nGetter('no')}
            </button>
            <button class="custom-confirm-yes bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
              ${this.i18nGetter('yes')}
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmDialog);
      this.activeDialogs.add(confirmDialog);

      const yesButton = confirmDialog.querySelector('.custom-confirm-yes');
      const noButton = confirmDialog.querySelector('.custom-confirm-no');

      yesButton?.addEventListener('click', () => {
        this.removeDialog(confirmDialog);
        resolve(true);
      });

      noButton?.addEventListener('click', () => {
        this.removeDialog(confirmDialog);
        resolve(false);
      });
    });
  }

  createRemarkButton(username: string, hasRemark: boolean, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = 'add-remark-btn';
    button.textContent = hasRemark
      ? this.i18nGetter('editRemark')
      : this.i18nGetter('addRemark');
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    return button;
  }

  createVideoDownloadButton(onClick: (button: HTMLElement) => void): HTMLElement {
    const downloadButton = document.createElement('div');
    downloadButton.className = 'video-download-btn';
    downloadButton.setAttribute(
      'aria-label',
      this.i18nGetter('downloadMedia')
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
      onClick(downloadButton);
    });

    return downloadButton;
  }

  findTweetHeaders(): Element[] {
    return Array.from(document.querySelectorAll(
      '[data-testid="User-Name"]:not(.remark-button-added)'
    ));
  }

  findVideoTweets(): Element[] {
    return Array.from(document.querySelectorAll(
      'article[data-testid="tweet"]:not(.video-download-added)'
    ));
  }

  findUsernameElements(container: Element): Element[] {
    return Array.from(container.querySelectorAll('a[href^="/"] span'))
      .filter((el) => el.textContent?.trim().startsWith('@'));
  }

  updateRemarkButtonText(username: string, hasRemark: boolean): void {
    const buttons = document.querySelectorAll('.add-remark-btn');
    buttons.forEach((button) => {
      const header = button.closest('[data-testid="User-Name"]');
      if (header) {
        const usernameElements = this.findUsernameElements(header);
        const usernameElement = usernameElements.find((el) =>
          el.textContent?.trim().slice(1) === username
        );
        if (usernameElement) {
          button.textContent = hasRemark
            ? this.i18nGetter('editRemark')
            : this.i18nGetter('addRemark');
        }
      }
    });
  }

  removeAllRemarkButtons(): void {
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

  removeAllVideoDownloadButtons(): void {
    document
      .querySelectorAll('.video-download-btn')
      .forEach((button) => button.remove());
    
    document
      .querySelectorAll('.video-download-added')
      .forEach((element) => element.classList.remove('video-download-added'));
  }

  injectStyles(): void {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('content.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  replaceUsernameInElement(element: Element, username: string, remark: string | null): void {
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

  restoreUsernameInElement(element: Element, username: string): void {
    this.replaceUsernameInElement(element, username, null);
  }

  cleanup(): void {
    // Remove all active dialogs
    this.activeDialogs.forEach(dialog => {
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    });
    this.activeDialogs.clear();

    // Remove all buttons and modified elements
    this.removeAllRemarkButtons();
    this.removeAllVideoDownloadButtons();
  }

  // Helper methods for icon generation
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

  private removeDialog(dialog: HTMLElement): void {
    if (dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
    this.activeDialogs.delete(dialog);
  }
}