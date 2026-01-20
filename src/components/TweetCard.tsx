import React from 'react';
import { TweetData } from '../types/tweet';

export interface TweetCardProps {
  tweetData: TweetData;
  theme: 'light' | 'dark';
  showWatermark?: boolean;
  watermarkText?: string;
}

interface ThemeColors {
  background: string;
  text: string;
  secondaryText: string;
  border: string;
}

const themes: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: 'rgb(255, 255, 255)',
    text: 'rgb(15, 20, 25)',
    secondaryText: 'rgb(83, 100, 113)',
    border: 'rgb(239, 243, 244)',
  },
  dark: {
    background: 'rgb(21, 32, 43)',
    text: 'rgb(247, 249, 249)',
    secondaryText: 'rgb(139, 152, 165)',
    border: 'rgb(56, 68, 77)',
  },
};

const VerifiedBadge: React.FC = () => (
  <svg
    viewBox="0 0 22 22"
    aria-label="Verified"
    role="img"
    style={{
      width: '18px',
      height: '18px',
      fill: 'rgb(29, 155, 240)',
      marginLeft: '4px',
    }}
  >
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const TweetCard: React.FC<TweetCardProps> = ({
  tweetData,
  theme,
  showWatermark = false,
  watermarkText,
}) => {
  const colors = themes[theme];

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background,
    borderRadius: '16px',
    padding: '16px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '598px',
    width: '100%',
    boxSizing: 'border-box',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
  };

  const avatarStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    marginRight: '12px',
    flexShrink: 0,
  };

  const userInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  };

  const nameRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const displayNameStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: '15px',
    color: colors.text,
    lineHeight: '20px',
  };

  const usernameStyle: React.CSSProperties = {
    fontSize: '15px',
    color: colors.secondaryText,
    lineHeight: '20px',
  };

  const contentStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '20px',
    color: colors.text,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginBottom: '12px',
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: '15px',
    color: colors.secondaryText,
    marginTop: '12px',
  };

  const imageGridStyle: React.CSSProperties = {
    display: 'grid',
    gap: '2px',
    borderRadius: '16px',
    overflow: 'hidden',
    marginTop: '12px',
  };

  const getImageGridColumns = (count: number): string => {
    if (count === 1) return '1fr';
    if (count === 2) return '1fr 1fr';
    if (count === 3) return '1fr 1fr';
    return '1fr 1fr';
  };

  const watermarkStyle: React.CSSProperties = {
    fontSize: '12px',
    color: colors.secondaryText,
    textAlign: 'right',
    marginTop: '12px',
    opacity: 0.7,
  };

  const renderImages = () => {
    if (tweetData.imageUrls.length === 0) return null;

    return (
      <div
        data-testid="image-grid"
        style={{
          ...imageGridStyle,
          gridTemplateColumns: getImageGridColumns(tweetData.imageUrls.length),
        }}
      >
        {tweetData.imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`Tweet image ${index + 1}`}
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <img
          src={tweetData.avatarUrl}
          alt={tweetData.displayName}
          style={avatarStyle}
        />
        <div style={userInfoStyle}>
          <div style={nameRowStyle}>
            <span style={displayNameStyle}>{tweetData.displayName}</span>
            {tweetData.isVerified && <VerifiedBadge />}
          </div>
          <span style={usernameStyle}>@{tweetData.username}</span>
        </div>
      </div>

      {tweetData.content && <div style={contentStyle}>{tweetData.content}</div>}

      {renderImages()}

      <div style={timestampStyle}>{tweetData.timestamp}</div>

      {showWatermark && watermarkText && (
        <div data-testid="watermark" style={watermarkStyle}>
          {watermarkText}
        </div>
      )}
    </div>
  );
};

export default TweetCard;
