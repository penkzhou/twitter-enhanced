import { TwitterAPI } from './modules/twitter-api';

import * as db from '../../utils/db';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('request', request);
    if (request.action === "downloadVideo") {
        handleVideoDownload(request.tweetId, sendResponse);
        return true; // Indicates that the response is sent asynchronously
    }
});

async function handleVideoDownload(tweetId: string, sendResponse: (response: any) => void) {
    try {
        console.log('tweetId', tweetId);
        const api = await TwitterAPI.getInstance();
        const videoUrl = await api.getVideoUrl(tweetId);
        console.log('videoUrl', videoUrl);

        if (videoUrl) {
            chrome.storage.sync.get(['downloadDirectory'], (result) => {
                const downloadDirectory = result.downloadDirectory || 'TwitterVideos';

                chrome.downloads.download({
                    url: videoUrl,
                    filename: `${downloadDirectory}/twitter_video_${tweetId}.mp4`,
                    saveAs: false
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download failed:', chrome.runtime.lastError);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        console.log('Download started with ID:', downloadId);
                        saveDownloadRecord(tweetId, `twitter_video_${tweetId}.mp4`, downloadId);
                        sendResponse({ success: true, downloadId: downloadId });
                    }
                });
            });
        } else {
            console.error('Video URL not found');
            sendResponse({ success: false, error: 'Video URL not found' });
        }
    } catch (error) {
        console.error('Error fetching video URL:', error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : String(error) });
    }
}

function saveDownloadRecord(tweetId: string, filename: string, downloadId: number) {
    db.add({
        tweetId,
        filename,
        downloadDate: new Date().toLocaleString(),
        downloadId,
    });
}