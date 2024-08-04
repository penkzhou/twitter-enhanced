// src/popup.ts

class PopupManager {
    private featureToggle: HTMLInputElement;
    private saveButton: HTMLButtonElement;
  
    constructor() {
      this.featureToggle = document.getElementById('featureToggle') as HTMLInputElement;
      this.saveButton = document.getElementById('saveSettings') as HTMLButtonElement;
      this.init();
    }
  
    private init(): void {
      this.loadSettings();
      this.saveButton.addEventListener('click', () => this.saveSettings());
    }
  
    private loadSettings(): void {
      chrome.storage.sync.get(['featureEnabled'], (result) => {
        this.featureToggle.checked = result.featureEnabled || false;
      });
    }
  
    private saveSettings(): void {
      const featureEnabled = this.featureToggle.checked;
      chrome.storage.sync.set({ featureEnabled }, () => {
        console.log('Settings saved');
        this.updateContentScript(featureEnabled);
      });
    }
  
    private updateContentScript(featureEnabled: boolean): void {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings", featureEnabled });
        }
      });
    }
  }
  
  // Initialize the popup
  document.addEventListener('DOMContentLoaded', () => new PopupManager());