import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TweetCard, { TweetCardProps } from '../TweetCard';
import { TweetData } from '../../types/tweet';

// Mock chrome i18n API
const mockChromeI18n = {
  getMessage: jest.fn((key: string) => {
    const messages: { [key: string]: string } = {
      screenshot: 'Screenshot',
      verified: 'Verified',
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

describe('TweetCard', () => {
  const mockTweetData: TweetData = {
    tweetId: '1234567890',
    displayName: 'John Doe',
    username: 'johndoe',
    avatarUrl: 'https://pbs.twimg.com/profile_images/123/avatar.jpg',
    content: 'Hello, this is a test tweet! #testing @mention',
    timestamp: 'Jan 15, 2024',
    datetime: '2024-01-15T12:00:00.000Z',
    isVerified: false,
    imageUrls: [],
    isRetweet: false,
    tweetUrl: 'https://twitter.com/johndoe/status/1234567890',
  };

  const defaultProps: TweetCardProps = {
    tweetData: mockTweetData,
    theme: 'light',
  };

  describe('Rendering', () => {
    it('should render user display name', () => {
      render(<TweetCard {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render username with @ prefix', () => {
      render(<TweetCard {...defaultProps} />);

      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should render tweet content', () => {
      render(<TweetCard {...defaultProps} />);

      expect(
        screen.getByText(/Hello, this is a test tweet!/)
      ).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<TweetCard {...defaultProps} />);

      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
    });

    it('should render avatar image', () => {
      render(<TweetCard {...defaultProps} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute(
        'src',
        'https://pbs.twimg.com/profile_images/123/avatar.jpg'
      );
    });
  });

  describe('Verification Badge', () => {
    it('should show verification badge for verified users', () => {
      const verifiedData = { ...mockTweetData, isVerified: true };
      render(<TweetCard {...defaultProps} tweetData={verifiedData} />);

      // Check for verification badge (aria-label or SVG)
      const badge = screen.getByLabelText('Verified');
      expect(badge).toBeInTheDocument();
    });

    it('should not show verification badge for non-verified users', () => {
      render(<TweetCard {...defaultProps} />);

      const badge = screen.queryByLabelText('Verified');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should apply light theme styles', () => {
      const { container } = render(
        <TweetCard {...defaultProps} theme="light" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
    });

    it('should apply dark theme styles', () => {
      const { container } = render(
        <TweetCard {...defaultProps} theme="dark" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ backgroundColor: 'rgb(21, 32, 43)' });
    });
  });

  describe('Watermark', () => {
    it('should render watermark when provided', () => {
      render(
        <TweetCard
          {...defaultProps}
          showWatermark={true}
          watermarkText="via MyApp"
        />
      );

      expect(screen.getByText('via MyApp')).toBeInTheDocument();
    });

    it('should not render watermark when showWatermark is false', () => {
      render(
        <TweetCard
          {...defaultProps}
          showWatermark={false}
          watermarkText="via MyApp"
        />
      );

      expect(screen.queryByText('via MyApp')).not.toBeInTheDocument();
    });

    it('should not render watermark when no watermarkText provided', () => {
      render(<TweetCard {...defaultProps} showWatermark={true} />);

      // Should not crash and should not show empty watermark
      const watermarkElements = screen.queryAllByTestId('watermark');
      expect(watermarkElements).toHaveLength(0);
    });
  });

  describe('Images', () => {
    it('should render single image', () => {
      const dataWithImage = {
        ...mockTweetData,
        imageUrls: ['https://pbs.twimg.com/media/image1.jpg'],
      };
      render(<TweetCard {...defaultProps} tweetData={dataWithImage} />);

      const images = screen.getAllByRole('img');
      // Avatar + 1 content image
      expect(images.length).toBeGreaterThanOrEqual(2);
    });

    it('should render multiple images in grid', () => {
      const dataWithImages = {
        ...mockTweetData,
        imageUrls: [
          'https://pbs.twimg.com/media/image1.jpg',
          'https://pbs.twimg.com/media/image2.jpg',
          'https://pbs.twimg.com/media/image3.jpg',
        ],
      };
      render(<TweetCard {...defaultProps} tweetData={dataWithImages} />);

      const images = screen.getAllByRole('img');
      // Avatar + 3 content images
      expect(images.length).toBeGreaterThanOrEqual(4);
    });

    it('should not render image section when no images', () => {
      render(<TweetCard {...defaultProps} />);

      const imageGrid = screen.queryByTestId('image-grid');
      expect(imageGrid).not.toBeInTheDocument();
    });
  });

  describe('Retweet Indicator', () => {
    it('should not show retweet indicator for original tweets', () => {
      render(<TweetCard {...defaultProps} />);

      const retweetIndicator = screen.queryByText(/Retweeted/);
      expect(retweetIndicator).not.toBeInTheDocument();
    });
  });

  describe('Card Styling', () => {
    it('should have proper border radius', () => {
      const { container } = render(<TweetCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ borderRadius: '16px' });
    });

    it('should have proper padding', () => {
      const { container } = render(<TweetCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveStyle({ padding: '16px' });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for avatar', () => {
      render(<TweetCard {...defaultProps} />);

      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
    });

    it('should have proper alt text for content images', () => {
      const dataWithImage = {
        ...mockTweetData,
        imageUrls: ['https://pbs.twimg.com/media/image1.jpg'],
      };
      render(<TweetCard {...defaultProps} tweetData={dataWithImage} />);

      const image = screen.getByAltText('Tweet image 1');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Long Content Handling', () => {
    it('should render long tweet content without truncation', () => {
      const longContent =
        'This is a very long tweet that contains a lot of text. '.repeat(10);
      const dataWithLongContent = {
        ...mockTweetData,
        content: longContent,
      };
      render(<TweetCard {...defaultProps} tweetData={dataWithLongContent} />);

      // Use a partial match since exact whitespace matching can be tricky
      expect(
        screen.getByText((content) =>
          content.includes('This is a very long tweet')
        )
      ).toBeInTheDocument();
    });
  });

  describe('Empty Content', () => {
    it('should render correctly with empty content', () => {
      const dataWithEmptyContent = {
        ...mockTweetData,
        content: '',
      };
      render(<TweetCard {...defaultProps} tweetData={dataWithEmptyContent} />);

      // Should still render user info
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
