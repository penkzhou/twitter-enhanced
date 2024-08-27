export class Logger {
    static logPageView(pageTitle: string, pageLocation: string, params: Record<string, any>) {
        chrome.runtime.sendMessage({
            action: "fireAnalyticsPageLoadEvent",
            pageTitle: pageTitle,
            pageLocation: pageLocation,
            params: params
        });
    }

    static logEvent(eventName: string, params: Record<string, any>) {
        chrome.runtime.sendMessage({
            action: "fireAnalyticsEvent",
            eventName: eventName,
            params: params
        });
    }

    static logError(error: string, params: Record<string, any>) {
        chrome.runtime.sendMessage({
            action: "fireAnalyticsErrorEvent",
            error: error,
            params: params
        });
    }
}