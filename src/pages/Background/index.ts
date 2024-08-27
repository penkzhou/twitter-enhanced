import { TwitterAPI } from './modules/twitter-api';
import * as db from '../../utils/db';
import { Analytics } from '../../lib/ga';
import './analytics';

// Create a function to set up the event listeners
function setupEventListeners() {
    // Handle unhandled rejections
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        console.error('Unhandled rejection:', event.reason);
        Analytics.fireErrorEvent(event.reason);
    });

    chrome.runtime.onInstalled.addListener(() => {
        Analytics.fireEvent('install');
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('request', request);
        if (request.action === "downloadVideo") {
            const currentDomain = request.currentDomain;
            console.log('currentDomain', currentDomain);
            const isTwitter = currentDomain === 'twitter.com';
            handleVideoDownload(request.tweetId, isTwitter, sendResponse);
            return true; // Indicates that the response is sent asynchronously
        }
        if (request.action === "openDownloadRecords") {
            chrome.tabs.create({
                url: chrome.runtime.getURL('downloadRecords.html') + `?recordId=${request.recordId}`
            });
        }
    });
}

// Call the setup function
setupEventListeners();

async function handleVideoDownload(tweetId: string, isTwitter: boolean, sendResponse: (response: any) => void) {
    try {
        console.log('tweetId', tweetId);

        // Check if the tweet has already been downloaded
        const existingRecord = await db.getByTweetId(tweetId);
        if (existingRecord) {
            console.log('Tweet already downloaded:', existingRecord);
            sendResponse({
                success: true,
                alreadyDownloaded: true,
                message: chrome.i18n.getMessage('tweetAlreadyDownloaded'),
                recordId: existingRecord.id
            });
            return;
        }

        const api = await TwitterAPI.getInstance();
        const videoInfo = await api.getVideoInfo(tweetId, isTwitter);
        console.log('videoInfo', videoInfo);

        if (videoInfo) {
            chrome.storage.sync.get(['downloadDirectory'], (result) => {
                const downloadDirectory = result.downloadDirectory || 'TwitterVideos';

                chrome.downloads.download({
                    url: videoInfo.videoUrl,
                    filename: `${downloadDirectory}/twitter_video_${tweetId}.mp4`,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download failed:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        console.log('Download started with ID:', downloadId);
                        saveDownloadRecord(tweetId, `twitter_video_${tweetId}.mp4`, downloadId, videoInfo.tweetUrl, videoInfo.tweetText);
                        sendResponse({ success: true, downloadId: downloadId });
                    }
                });
            });
        } else {
            console.error('Video info not found');
            sendResponse({ success: false, error: 'Video info not found' });
        }
    } catch (error) {
        console.error('Error fetching video info:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}

function saveDownloadRecord(tweetId: string, filename: string, downloadId: number, tweetUrl: string, tweetText: string) {
    /// make sure the downloadDate is a string representation of the date from 1970-01-01 
    db.add({
        tweetId,
        filename,
        downloadDate: new Date().getTime().toString(),
        downloadId,
        tweetUrl,
        tweetText
    });
}

// If you need to export anything, do it like this:
export { handleVideoDownload };