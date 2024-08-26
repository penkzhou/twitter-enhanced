

export class TwitterAPI {
  private static instance: TwitterAPI;

  private constructor() { }

  private bearerToken: string = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
  private csrfTokenOfTwitter: string = '';
  private guestTokenOfTwitter: string = '';
  private csrfTokenOfX: string = '';
  private guestTokenOfX: string = '';

  initHeaders = (
    tweetId: string,
    bearerToken: string,
    csrfToken: string,
    guestToken?: string
  ) =>
    new Headers([
      ['Content-Type', 'application/json'],
      ['Authorization', 'Bearer ' + bearerToken],
      ['User-Agent', navigator.userAgent],
      ['Referer', `https://x.com/i/web/status/${tweetId}`],
      ['x-twitter-active-user', 'yes'],
      ['x-csrf-token', csrfToken],
      guestToken ? ['x-guest-token', guestToken] : ['x-twitter-auth-type', 'OAuth2Session'],
    ])

  public static async getInstance(): Promise<TwitterAPI> {
    if (!TwitterAPI.instance) {
      TwitterAPI.instance = new TwitterAPI();
      const ct0TwitterCookies = await chrome.cookies.get({ name: 'ct0', url: 'https://twitter.com/' });
      const gtTwitterCookies = await chrome.cookies.get({ name: 'gt', url: 'https://twitter.com/' });

      const ct0XCookies = await chrome.cookies.get({ name: 'ct0', url: 'https://x.com/' });
      const gtXCookies = await chrome.cookies.get({ name: 'gt', url: 'https://x.com/' });

      TwitterAPI.instance.csrfTokenOfTwitter = ct0TwitterCookies?.value ?? '';
      TwitterAPI.instance.guestTokenOfTwitter = gtTwitterCookies?.value ?? '';
      TwitterAPI.instance.csrfTokenOfX = ct0XCookies?.value ?? '';
      TwitterAPI.instance.guestTokenOfX = gtXCookies?.value ?? '';
    }
    return TwitterAPI.instance;
  }

  public async getVideoInfo(tweetId: string, isTwitter: boolean): Promise<{ videoUrl: string, tweetUrl: string, tweetText: string } | null> {
    try {
      const domain = isTwitter ? 'twitter.com' : 'x.com';
      const csrfToken = isTwitter ? this.csrfTokenOfTwitter : this.csrfTokenOfX;
      const guestToken = isTwitter ? this.guestTokenOfTwitter : this.guestTokenOfX;
      const resp = await fetch(this.makeLatestEndpoint(domain, tweetId), {
        method: 'GET',
        headers:
          this.initHeaders(tweetId, this.bearerToken, csrfToken, guestToken),
        mode: 'cors',
      })

      if (!resp) {
        return null;
      }
      const data = await resp.json();
      console.log('data', data);
      const tweet = data?.data?.threaded_conversation_with_injections_v2?.instructions[0]?.entries[0]?.content?.itemContent?.tweet_results?.result ?? null;
      if (!tweet) {
        throw new Error('Tweet not found with id: ' + tweetId);
      }


      const tweetText = tweet.legacy?.full_text ?? '';
      const tweetUserScreenName = tweet.core?.user_results?.result && 'legacy' in tweet.core?.user_results?.result
        ? tweet.core?.user_results?.result.legacy.screen_name
        : '';
      const tweetUrl = isTwitter ? `https://twitter.com/${tweetUserScreenName}/status/${tweetId}` : `https://x.com/${tweetUserScreenName}/status/${tweetId}`;

      const videoInfoList = await (tweet.legacy?.entities?.media?.find((media: any) => media.type === 'video'))?.video_info?.variants ?? [];
      const highestQualityVideo = videoInfoList.filter((video: any) => (video.bitrate !== undefined) && (video.content_type === 'video/mp4')).reduce((highest: any, current: any) => {
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

  makeLatestEndpoint = (domain: string, tweetId: string): string => {
    const endpoint = new URL(
      `https://${domain}/i/api/graphql/zJvfJs3gSbrVhC0MKjt_OQ/TweetDetail`
    )
    endpoint.searchParams.append('variables', JSON.stringify(this.makeGraphQlVars(tweetId)))
    endpoint.searchParams.append(
      'features',
      JSON.stringify({
        rweb_tipjar_consumption_enabled: false,
        responsive_web_graphql_exclude_directive_enabled: false,
        verified_phone_label_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: false,
        responsive_web_graphql_timeline_navigation_enabled: false,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
        communities_web_enable_tweet_community_results_fetch: false,
        c9s_tweet_anatomy_moderator_badge_enabled: false,
        articles_preview_enabled: true,
        tweetypie_unmention_optimization_enabled: false,
        responsive_web_edit_tweet_api_enabled: false,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: false,
        view_counts_everywhere_api_enabled: false,
        longform_notetweets_consumption_enabled: false,
        responsive_web_twitter_article_tweet_consumption_enabled: false,
        tweet_awards_web_tipping_enabled: false,
        creator_subscriptions_quote_tweet_preview_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: false,
        standardized_nudges_misinfo: false,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
        tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: false,
        rweb_video_timestamps_enabled: false,
        longform_notetweets_rich_text_read_enabled: false,
        longform_notetweets_inline_media_enabled: false,
        responsive_web_enhance_cards_enabled: false,
      })
    )
    endpoint.searchParams.append(
      'fieldToggles',
      JSON.stringify({
        withArticleRichContentState: false,
        withAuxiliaryUserLabels: false,
      })
    )
    return endpoint.href
  }

  makeGraphQlVars = (tweetId: string) => ({
    focalTweetId: tweetId,
    with_rux_injections: false,
    includePromotedContent: false,
    withCommunity: false,
    withQuickPromoteEligibilityTweetFields: false,
    withBirdwatchNotes: false,
    withVoice: false,
    withV2Timeline: true,
  })
}