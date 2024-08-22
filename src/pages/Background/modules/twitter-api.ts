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
      /// get cto from cookies
      const ct0Cookies = await chrome.cookies.get({ name: 'ct0', url: 'https://twitter.com/' });
      /// get auth_token from cookies
      const authTokenCookies = await chrome.cookies.get({ name: 'auth_token', url: 'https://twitter.com/' });
      TwitterAPI.instance.tweetApi = await api.getClientFromCookies({
        ct0: ct0Cookies?.value ?? '',
        auth_token: authTokenCookies?.value ?? '',
      });
    }

    return TwitterAPI.instance;
  }



  public async getVideoUrl(tweetId: string): Promise<string | null> {

    try {
      const response = await TwitterAPI.instance.tweetApi?.getTweetApi().getTweetDetail({ focalTweetId: tweetId }) ?? null;

      if (!response) {
        return null;
      }
      console.log('response', response);

      const videoInfoList = await (response.data.data[0].tweet.legacy?.entities?.media?.find((media: any) => media.type === 'video'))?.videoInfo?.variants ?? [];
      /// find the highest quality video in the list
      const highestQualityVideo = videoInfoList.filter((video: any) => (video.bitrate !== undefined) && (video.contentType === 'video/mp4')).reduce((highest: any, current: any) => {
        return highest.bitrate > current.bitrate ? highest : current;
      }, videoInfoList[0]);
      console.log('videoInfoList', videoInfoList);
      if (highestQualityVideo) {
        const videoUrl = highestQualityVideo.url;
        console.log('videoUrl', videoUrl);
        return videoUrl;
      }

    } catch (error) {
      console.error('Error fetching video URL:', error);
    }

    return null;
  }
}