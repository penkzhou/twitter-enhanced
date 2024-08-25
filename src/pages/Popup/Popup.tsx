import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
    const [remarkFeatureEnabled, setRemarkFeatureEnabled] = useState(true);
    const [videoDownloadFeatureEnabled, setVideoDownloadFeatureEnabled] = useState(true);
    const [downloadDirectory, setDownloadDirectory] = useState('TwitterVideos');
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = () => {
        chrome.storage.sync.get(['remarkFeatureEnabled', 'videoDownloadFeatureEnabled', 'downloadDirectory'], (result) => {
            setRemarkFeatureEnabled(result.remarkFeatureEnabled || true);
            setVideoDownloadFeatureEnabled(result.videoDownloadFeatureEnabled || true);
            setDownloadDirectory(result.downloadDirectory || 'TwitterVideos');
        });
    };

    const saveSettings = () => {
        chrome.storage.sync.set({
            remarkFeatureEnabled,
            videoDownloadFeatureEnabled,
            downloadDirectory
        }, () => {
            console.log('Settings saved');
            updateContentScript();
            setSaveMessage(chrome.i18n.getMessage('settingsSaved'));
            setTimeout(() => setSaveMessage(''), 3000); // Clear message after 3 seconds
        });
    };

    const updateContentScript = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateSettings",
                    remarkFeatureEnabled,
                    videoDownloadFeatureEnabled
                });
            }
        });
    };

    const openRemarksManager = () => {
        chrome.tabs.create({ url: 'options.html' });
    };

    const openDownloadRecords = () => {
        chrome.tabs.create({ url: 'downloadRecords.html' });
    };

    return (
        <div className="container">
            <h1>{chrome.i18n.getMessage('popupTitle')}</h1>
            <p>{chrome.i18n.getMessage('customizeExperience')}</p>

            <div className="feature-toggle">
                <input
                    type="checkbox"
                    id="remarkFeatureToggle"
                    checked={remarkFeatureEnabled}
                    onChange={(e) => setRemarkFeatureEnabled(e.target.checked)}
                />
                <label htmlFor="remarkFeatureToggle">{chrome.i18n.getMessage('enableUserRemarks')}</label>
            </div>
            <div className="feature-toggle">
                <input
                    type="checkbox"
                    id="videoDownloadFeatureToggle"
                    checked={videoDownloadFeatureEnabled}
                    onChange={(e) => setVideoDownloadFeatureEnabled(e.target.checked)}
                />
                <label htmlFor="videoDownloadFeatureToggle">{chrome.i18n.getMessage('enableVideoDownload')}</label>
            </div>
            <div className="feature-toggle">
                <label htmlFor="downloadDirectory">{chrome.i18n.getMessage('downloadDirectory')}</label>
                <input
                    type="text"
                    id="downloadDirectory"
                    value={downloadDirectory}
                    onChange={(e) => setDownloadDirectory(e.target.value)}
                />
            </div>
            <button onClick={saveSettings}>{chrome.i18n.getMessage('saveSettings')}</button>
            {saveMessage && <p className="save-message">{saveMessage}</p>}
            <button onClick={openRemarksManager} className="secondary-button">{chrome.i18n.getMessage('manageRemarks')}</button>
            <button onClick={openDownloadRecords} className="secondary-button">{chrome.i18n.getMessage('manageDownloads')}</button>
        </div>
    );
};

export default Popup;