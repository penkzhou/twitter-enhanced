"use strict";
// src/popup.ts
class PopupManager {
    constructor() {
        this.featureToggle = document.getElementById('featureToggle');
        this.saveButton = document.getElementById('saveSettings');
        this.init();
    }
    init() {
        this.loadSettings();
        this.saveButton.addEventListener('click', () => this.saveSettings());
    }
    loadSettings() {
        chrome.storage.sync.get(['featureEnabled'], (result) => {
            this.featureToggle.checked = result.featureEnabled || false;
        });
    }
    saveSettings() {
        const featureEnabled = this.featureToggle.checked;
        chrome.storage.sync.set({ featureEnabled }, () => {
            console.log('Settings saved');
            this.updateContentScript(featureEnabled);
        });
    }
    updateContentScript(featureEnabled) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "updateSettings", featureEnabled });
            }
        });
    }
}
// Initialize the popup
document.addEventListener('DOMContentLoaded', () => new PopupManager());
