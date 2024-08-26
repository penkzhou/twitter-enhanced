export interface AnalyticsError {
    message: string;
    stack?: string;
    [key: string]: any;
}