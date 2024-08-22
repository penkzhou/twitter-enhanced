// src/popup.ts

class PopupManager {
    private featureToggle: HTMLInputElement;
    private remarkFeatureToggle: HTMLInputElement;
    private saveButton: HTMLButtonElement;
    private manageRemarksButton: HTMLButtonElement;

    constructor() {
        this.featureToggle = document.getElementById('featureToggle') as HTMLInputElement;
        this.remarkFeatureToggle = document.getElementById('remarkFeatureToggle') as HTMLInputElement;
        this.saveButton = document.getElementById('saveSettings') as HTMLButtonElement;
        this.manageRemarksButton = document.getElementById('manageRemarks') as HTMLButtonElement;
        this.init();
    }

    private init(): void {
        this.loadSettings();
        this.saveButton.addEventListener('click', () => this.saveSettings());
        this.manageRemarksButton.addEventListener('click', () => this.openRemarksManager());
    }

    private loadSettings(): void {
        chrome.storage.sync.get(['featureEnabled', 'remarkFeatureEnabled'], (result) => {
            this.featureToggle.checked = result.featureEnabled || false;
            this.remarkFeatureToggle.checked = result.remarkFeatureEnabled || true;
        });
    }

    private saveSettings(): void {
        const featureEnabled = this.featureToggle.checked;
        const remarkFeatureEnabled = this.remarkFeatureToggle.checked;
        chrome.storage.sync.set({ featureEnabled, remarkFeatureEnabled }, () => {
            console.log('Settings saved');
            this.updateContentScript(featureEnabled, remarkFeatureEnabled);
        });
    }

    private updateContentScript(featureEnabled: boolean, remarkFeatureEnabled: boolean): void {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateSettings",
                    featureEnabled,
                    remarkFeatureEnabled
                });
            }
        });
    }

    private openRemarksManager(): void {
        chrome.tabs.create({ url: 'remarks-manager.html' });
    }
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => new PopupManager());
