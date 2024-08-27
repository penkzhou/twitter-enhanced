import { AnalyticsError } from "./types";

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';

const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
console.log(process.env.GA_MEASUREMENT_ID);
console.log(process.env.GA_API_SECRET);

// Duration of inactivity after which a new session is created
const SESSION_EXPIRATION_IN_MIN = 30;


export class Analytics {
    private static debug: boolean = false;

    constructor(debug = false) {
        Analytics.debug = debug;
    }

    // Returns the client id, or creates a new one if one doesn't exist.
    // Stores client id in local storage to keep the same client id as long as
    // the extension is installed.
    static async getOrCreateClientId() {
        let { clientId } = await chrome.storage.local.get('clientId');
        if (!clientId) {
            // Generate a unique client ID, the actual value is not relevant
            clientId = self.crypto.randomUUID();
            await chrome.storage.local.set({ clientId });
        }
        return clientId;
    }

    // Returns the current session id, or creates a new one if one doesn't exist or
    // the previous one has expired.
    static async getOrCreateSessionId() {
        // Use storage.session because it is only in memory
        let { sessionData } = await chrome.storage.session.get('sessionData');
        const currentTimeInMs = Date.now();
        // Check if session exists and is still valid
        if (sessionData && sessionData.timestamp) {
            // Calculate how long ago the session was last updated
            const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
            // Check if last update lays past the session expiration threshold
            if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
                // Clear old session id to start a new session
                sessionData = null;
            } else {
                // Update timestamp to keep session alive
                sessionData.timestamp = currentTimeInMs;
                await chrome.storage.session.set({ sessionData });
            }
        }
        if (!sessionData) {
            // Create and store a new session
            sessionData = {
                session_id: currentTimeInMs.toString(),
                timestamp: currentTimeInMs.toString()
            };
            await chrome.storage.session.set({ sessionData });
        }
        return sessionData.session_id;
    }

    // Fires an event with optional params. Event names must only include letters and underscores.
    static async fireEvent(name: string, params: Record<string, any> = {}) {
        console.log('MEASUREMENT_ID', process.env.GA_MEASUREMENT_ID);
        console.log('API_SECRET', process.env.GA_API_SECRET);
        // Configure session id and engagement time if not present, for more details see:
        // https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events?client_type=gtag#recommended_parameters_for_reports
        if (!params.session_id) {
            params.session_id = await this.getOrCreateSessionId();
        }
        if (!params.engagement_time_msec) {
            params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
        }

        try {
            const response = await fetch(
                `${Analytics.debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
                }?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        client_id: await this.getOrCreateClientId(),
                        events: [
                            {
                                name,
                                params
                            }
                        ]
                    })
                }
            );
            if (!Analytics.debug) {
                return;
            }
            console.log(await response.text());
        } catch (e) {
            console.error('Google Analytics request failed with an exception', e);
        }
    }

    // Fire a page view event.
    static async firePageViewEvent(pageTitle: string, pageLocation: string, additionalParams: Record<string, any> = {}) {
        return this.fireEvent('page_view', {
            page_title: pageTitle,
            page_location: pageLocation,
            ...additionalParams
        });
    }

    // Fire an error event.
    static async fireErrorEvent(error: AnalyticsError, additionalParams: Record<string, any> = {}) {
        return this.fireEvent('extension_error', {
            ...error,
            ...additionalParams
        });
    }
}

export default new Analytics();