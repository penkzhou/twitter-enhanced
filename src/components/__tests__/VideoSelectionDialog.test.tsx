import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import VideoSelectionDialog, { VideoSelectionDialogProps } from '../VideoSelectionDialog';
import { VideoInfo } from '../../lib/types';

// Mock chrome i18n API
const mockChromeI18n = {
  getMessage: jest.fn((key: string) => {
    const messages: { [key: string]: string } = {
      selectVideo: 'Select Videos to Download',
      video: 'Video',
      cancel: 'Cancel',
      downloadSelected: 'Download Selected',
      downloadAll: 'Download All',
    };
    return messages[key] || key;
  }),
};

Object.defineProperty(global, 'chrome', {
  value: {
    i18n: mockChromeI18n,
  },
  writable: true,
});

describe('VideoSelectionDialog', () => {
  const mockVideos: VideoInfo[] = [
    {
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      tweetUrl: 'https://twitter.com/user/status/123',
      tweetText: 'Test tweet 1',
      mediaId: '1',
    },
    {
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      tweetUrl: 'https://twitter.com/user/status/124',
      tweetText: 'Test tweet 2',
      mediaId: '2',
    },
    {
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: 'https://example.com/thumb3.jpg',
      tweetUrl: 'https://twitter.com/user/status/125',
      tweetText: 'Test tweet 3',
      mediaId: '3',
    },
  ];

  const defaultProps: VideoSelectionDialogProps = {
    videos: mockVideos,
    tweetId: '123456789',
    onDownloadSelected: jest.fn(),
    onDownloadAll: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog with title', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      expect(screen.getByText('Select Videos to Download')).toBeInTheDocument();
    });

    it('should render all videos', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      expect(screen.getByText('Video 1')).toBeInTheDocument();
      expect(screen.getByText('Video 2')).toBeInTheDocument();
      expect(screen.getByText('Video 3')).toBeInTheDocument();
    });

    it('should render video thumbnails', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const thumbnails = screen.getAllByRole('img');
      expect(thumbnails).toHaveLength(3);
      expect(thumbnails[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
      expect(thumbnails[1]).toHaveAttribute('src', 'https://example.com/thumb2.jpg');
      expect(thumbnails[2]).toHaveAttribute('src', 'https://example.com/thumb3.jpg');
    });

    it('should render checkboxes for each video', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      expect(checkboxes[0]).toHaveAttribute('id', 'video-0');
      expect(checkboxes[1]).toHaveAttribute('id', 'video-1');
      expect(checkboxes[2]).toHaveAttribute('id', 'video-2');
    });

    it('should render all action buttons', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Download Selected (0)')).toBeInTheDocument();
      expect(screen.getByText('Download All')).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('should use 2-column grid for 4 or fewer videos', () => {
      const fourVideos = mockVideos.slice(0, 2);
      render(<VideoSelectionDialog {...defaultProps} videos={fourVideos} />);
      
      const grid = document.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('should use 3-column grid for more than 4 videos', () => {
      const fiveVideos = [...mockVideos, ...mockVideos.slice(0, 2)];
      render(<VideoSelectionDialog {...defaultProps} videos={fiveVideos} />);
      
      const grid = document.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Video Selection', () => {
    it('should select video when clicked', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      await user.click(firstVideoDiv!);
      
      const checkbox = document.querySelector('#video-0') as HTMLInputElement;
      expect(checkbox).toBeChecked();
      expect(screen.getByText('Download Selected (1)')).toBeInTheDocument();
    });

    it('should deselect video when clicked again', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      
      // Select first
      await user.click(firstVideoDiv!);
      expect(document.querySelector('#video-0')).toBeChecked();
      
      // Deselect
      await user.click(firstVideoDiv!);
      expect(document.querySelector('#video-0')).not.toBeChecked();
      expect(screen.getByText('Download Selected (0)')).toBeInTheDocument();
    });

    it('should select video when checkbox area is clicked', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      // Click on the checkbox container area
      const checkboxContainer = document.querySelector('.absolute.top-2.left-2');
      await user.click(checkboxContainer!);
      
      const checkbox = document.querySelector('#video-0') as HTMLInputElement;
      expect(checkbox).toBeChecked();
      expect(screen.getByText('Download Selected (1)')).toBeInTheDocument();
    });

    it('should select multiple videos', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      const secondVideoDiv = screen.getByText('Video 2').closest('div');
      
      await user.click(firstVideoDiv!);
      await user.click(secondVideoDiv!);
      
      expect(document.querySelector('#video-0')).toBeChecked();
      expect(document.querySelector('#video-1')).toBeChecked();
      expect(screen.getByText('Download Selected (2)')).toBeInTheDocument();
    });

    it('should show visual selection indicator', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      await user.click(firstVideoDiv!);
      
      // Check for visual selection indicators
      expect(firstVideoDiv).toHaveClass('bg-blue-100');
      expect(firstVideoDiv).toHaveClass('ring-2');
      expect(firstVideoDiv).toHaveClass('ring-blue-500');
      
      // Check for checkmark icon
      const checkmarkIcon = firstVideoDiv!.querySelector('svg');
      expect(checkmarkIcon).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const onCancel = jest.fn();
      render(<VideoSelectionDialog {...defaultProps} onCancel={onCancel} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onDownloadAll when Download All button is clicked', () => {
      const onDownloadAll = jest.fn();
      render(<VideoSelectionDialog {...defaultProps} onDownloadAll={onDownloadAll} />);
      
      const downloadAllButton = screen.getByText('Download All');
      fireEvent.click(downloadAllButton);
      
      expect(onDownloadAll).toHaveBeenCalledTimes(1);
    });

    it('should call onDownloadSelected with selected videos', async () => {
      const onDownloadSelected = jest.fn();
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} onDownloadSelected={onDownloadSelected} />);
      
      // Select first and third videos
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      const thirdVideoDiv = screen.getByText('Video 3').closest('div');
      await user.click(firstVideoDiv!);
      await user.click(thirdVideoDiv!);
      
      const downloadSelectedButton = screen.getByText('Download Selected (2)');
      fireEvent.click(downloadSelectedButton);
      
      expect(onDownloadSelected).toHaveBeenCalledWith([mockVideos[0], mockVideos[2]]);
    });

    it('should disable Download Selected button when no videos selected', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const downloadSelectedButton = screen.getByText('Download Selected (0)');
      expect(downloadSelectedButton).toBeDisabled();
      expect(downloadSelectedButton).toHaveClass('opacity-50');
      expect(downloadSelectedButton).toHaveClass('cursor-not-allowed');
    });

    it('should enable Download Selected button when videos are selected', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const firstVideoDiv = screen.getByText('Video 1').closest('div');
      await user.click(firstVideoDiv!);
      
      const downloadSelectedButton = screen.getByText('Download Selected (1)');
      expect(downloadSelectedButton).not.toBeDisabled();
      expect(downloadSelectedButton).not.toHaveClass('opacity-50');
    });
  });

  describe('Chrome i18n Integration', () => {
    it('should use chrome.i18n.getMessage for all text', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('selectVideo');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('video');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('cancel');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('downloadSelected');
      expect(mockChromeI18n.getMessage).toHaveBeenCalledWith('downloadAll');
    });

    it('should use correct alt text for images', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const thumbnails = screen.getAllByRole('img');
      expect(thumbnails[0]).toHaveAttribute('alt', 'Video 1');
      expect(thumbnails[1]).toHaveAttribute('alt', 'Video 2');
      expect(thumbnails[2]).toHaveAttribute('alt', 'Video 3');
    });
  });

  describe('Empty Videos Array', () => {
    it('should handle empty videos array', () => {
      render(<VideoSelectionDialog {...defaultProps} videos={[]} />);
      
      expect(screen.getByText('Select Videos to Download')).toBeInTheDocument();
      expect(screen.queryByText('Video 1')).not.toBeInTheDocument();
      expect(screen.getByText('Download Selected (0)')).toBeInTheDocument();
    });
  });

  describe('Single Video', () => {
    it('should handle single video correctly', () => {
      const singleVideo = [mockVideos[0]];
      render(<VideoSelectionDialog {...defaultProps} videos={singleVideo} />);
      
      expect(screen.getByText('Video 1')).toBeInTheDocument();
      expect(screen.queryByText('Video 2')).not.toBeInTheDocument();
      
      // Should still use 2-column grid (≤4 videos)
      const grid = document.querySelector('.grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper checkbox IDs and structure', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toHaveAttribute('id', 'video-0');
      expect(checkboxes[1]).toHaveAttribute('id', 'video-1');
      expect(checkboxes[2]).toHaveAttribute('id', 'video-2');
    });

    it('should have accessible button focus styles', () => {
      render(<VideoSelectionDialog {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none');
        expect(button).toHaveClass('focus:ring-2');
      });
    });
  });

  describe('State Persistence', () => {
    it('should maintain selection state across multiple interactions', async () => {
      const user = userEvent.setup();
      render(<VideoSelectionDialog {...defaultProps} />);
      
      // Select videos 1 and 3
      await user.click(screen.getByText('Video 1').closest('div')!);
      await user.click(screen.getByText('Video 3').closest('div')!);
      
      // Deselect video 1
      await user.click(screen.getByText('Video 1').closest('div')!);
      
      // Only video 3 should be selected
      expect(document.querySelector('#video-0')).not.toBeChecked();
      expect(document.querySelector('#video-1')).not.toBeChecked();
      expect(document.querySelector('#video-2')).toBeChecked();
      expect(screen.getByText('Download Selected (1)')).toBeInTheDocument();
    });
  });
});