import html2canvas from 'html2canvas';
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
 * Generates a screenshot of a tweet as a data URL
 */
export async function generateScreenshot(
  tweetData: TweetData,
  options: ScreenshotOptions
): Promise<string> {
  // Determine theme
  const theme = options.theme === 'auto' ? detectTheme() : options.theme;

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
          tweetData,
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

    // Make container visible for html2canvas (but still off-screen)
    container.style.visibility = 'visible';

    // Generate canvas using html2canvas
    const canvas = await html2canvas(container.firstChild as HTMLElement, {
      scale: options.scale,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png');

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
