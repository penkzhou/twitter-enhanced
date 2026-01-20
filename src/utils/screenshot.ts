import domtoimage from 'dom-to-image-more';
import React from 'react';
import { createRoot } from 'react-dom/client';
import TweetCard from '../components/TweetCard';
import { TweetData, ScreenshotOptions } from '../types/tweet';

/**
 * Detects the current theme based on background color
 */
function detectTheme(): 'light' | 'dark' {
  try {
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? 'light' : 'dark';
    }
  } catch {
    // Fallback to system preference
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/**
 * Upgrades Twitter image URLs to higher resolution versions
 * Twitter image URL patterns:
 * - Avatar: https://pbs.twimg.com/profile_images/.../name_normal.jpg -> name_400x400.jpg
 * - Media: https://pbs.twimg.com/media/...?format=jpg&name=small -> name=large or name=4096x4096
 */
export function upgradeImageUrl(url: string): string {
  if (!url) return url;

  // Upgrade avatar images from _normal to _400x400
  if (url.includes('profile_images') && url.includes('_normal')) {
    return url.replace('_normal', '_400x400');
  }

  // Upgrade media images to large/4096x4096
  if (url.includes('pbs.twimg.com/media')) {
    // Replace name parameter with larger size
    if (url.includes('name=')) {
      return url.replace(/name=\w+/, 'name=large');
    }
    // Add name parameter if not present
    if (url.includes('?')) {
      return url + '&name=large';
    }
    return url + '?name=large';
  }

  return url;
}

/**
 * Upgrades all image URLs in tweet data to high resolution
 */
export function upgradeTweetImages(tweetData: TweetData): TweetData {
  return {
    ...tweetData,
    avatarUrl: upgradeImageUrl(tweetData.avatarUrl),
    imageUrls: tweetData.imageUrls.map(upgradeImageUrl),
  };
}

/**
 * Gets the optimal scale factor based on device and quality requirements
 */
function getOptimalScale(requestedScale: number): number {
  const devicePixelRatio = window.devicePixelRatio || 1;
  // Use at least 2x scale, or devicePixelRatio * requested scale for retina displays
  return Math.max(requestedScale, devicePixelRatio * 2);
}

/**
 * Generates a screenshot of a tweet as a data URL
 */
export async function generateScreenshot(
  tweetData: TweetData,
  options: ScreenshotOptions
): Promise<string> {
  // Determine theme
  const theme = options.theme === 'auto' ? detectTheme() : options.theme;

  // Upgrade images to high resolution
  const hdTweetData = upgradeTweetImages(tweetData);

  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.id = 'tweet-screenshot-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 598px;
    z-index: -1;
    visibility: hidden;
  `;
  document.body.appendChild(container);

  try {
    // Render TweetCard to the container
    const root = createRoot(container);

    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(TweetCard, {
          tweetData: hdTweetData,
          theme,
          showWatermark: options.showWatermark,
          watermarkText: options.watermarkText,
        })
      );
      // Wait for next frame to ensure render is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });

    // Wait for images to load
    const images = container.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Continue even if image fails
            }
          })
      )
    );

    // Make container visible for rendering (but still off-screen)
    container.style.visibility = 'visible';

    // Calculate optimal scale
    const scale = getOptimalScale(options.scale);

    // Get the element to capture
    const element = container.firstChild as HTMLElement;

    // Generate image using dom-to-image-more
    // This uses SVG foreignObject which leverages the browser's native rendering
    const dataUrl = await domtoimage.toPng(element, {
      width: element.offsetWidth * scale,
      height: element.offsetHeight * scale,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      },
    });

    // Cleanup
    root.unmount();
    document.body.removeChild(container);

    return dataUrl;
  } catch (error) {
    // Cleanup on error
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Converts a data URL to a Blob
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Downloads a screenshot image
 */
export async function downloadScreenshot(
  dataUrl: string,
  filename: string
): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  const url = URL.createObjectURL(blob);

  try {
    // Create a temporary anchor element for download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    // Cleanup the object URL
    URL.revokeObjectURL(url);
  }
}

/**
 * Copies a screenshot to the clipboard
 */
export async function copyScreenshotToClipboard(
  dataUrl: string
): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  const item = new ClipboardItem({ 'image/png': blob });
  await navigator.clipboard.write([item]);
}

/**
 * Generates a default filename for a tweet screenshot
 */
export function generateFilename(tweetId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `tweet_${tweetId}_${timestamp}.png`;
}
