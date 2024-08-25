import { TwitterOpenApi, TwitterOpenApiClient } from 'twitter-openapi-typescript';

export class TwitterAPI {
  private static instance: TwitterAPI;
  private tweetApi: TwitterOpenApiClient | null = null;

  private constructor() { }

  public static async getInstance(): Promise<TwitterAPI> {
    if (!TwitterAPI.instance) {
      TwitterOpenApi.twitter = 'https://x.com/home';
      TwitterAPI.instance = new TwitterAPI();
      const api = new TwitterOpenApi();
      const ct0Cookies = await chrome.cookies.get({ name: 'ct0', url: 'https://twitter.com/' });
      const authTokenCookies = await chrome.cookies.get({ name: 'auth_token', url: 'https://twitter.com/' });
      TwitterAPI.instance.tweetApi = await api.getClientFromCookies({
        ct0: ct0Cookies?.value ?? '',
        auth_token: authTokenCookies?.value ?? '',
      });
    }
    return TwitterAPI.instance;
  }

  public async getVideoInfo(tweetId: string): Promise<{ videoUrl: string, tweetUrl: string, tweetText: string } | null> {
    try {
      const response = await TwitterAPI.instance.tweetApi?.getTweetApi().getTweetDetail({ focalTweetId: tweetId }) ?? null;

      if (!response) {
        return null;
      }

      const tweet = response.data.data[0].tweet;
      const tweetText = tweet.legacy?.fullText ?? '';
      const tweetUserScreenName = tweet.core?.userResults?.result && 'legacy' in tweet.core.userResults.result
        ? tweet.core.userResults.result.legacy.screenName
        : '';
      const tweetUrl = `https://x.com/${tweetUserScreenName}/status/${tweetId}`;

      const videoInfoList = await (tweet.legacy?.entities?.media?.find((media: any) => media.type === 'video'))?.videoInfo?.variants ?? [];
      const highestQualityVideo = videoInfoList.filter((video: any) => (video.bitrate !== undefined) && (video.contentType === 'video/mp4')).reduce((highest: any, current: any) => {
        return highest.bitrate > current.bitrate ? highest : current;
      }, videoInfoList[0]);

      if (highestQualityVideo) {
        const videoUrl = highestQualityVideo.url;
        return { videoUrl, tweetUrl, tweetText };
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
    }

    return null;
  }
}