import { Analytics } from '../../lib/ga';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fireAnalyticsEvent') {
        Analytics.fireEvent(request.eventName, request.params);
        sendResponse({ success: true });
    } else if (request.action === 'fireAnalyticsErrorEvent') {
        Analytics.fireErrorEvent(request.error);
        sendResponse({ success: true });
    }
    return true;  // Indicates that the response is sent asynchronously
});