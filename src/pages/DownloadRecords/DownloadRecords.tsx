import React, { useState, useEffect, useRef } from 'react';
import * as db from '../../utils/db';
import { format, formatDistanceToNow } from 'date-fns';
import { Logger } from '../../utils/logger';

interface DownloadRecord {
  id: number;
  tweetId: string;
  filename: string;
  downloadDate: string;
  downloadId: number;
  tweetUrl: string;
  tweetText: string;
}

// Twitter brand color
const TWITTER_BLUE = '#1D9BF0';

/**
 * Detect system dark mode preference
 */
const detectDarkMode = (): boolean => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Get theme colors based on dark mode
 */
const getTheme = (isDark: boolean) => ({
  // Page background
  pageBg: isDark ? '#000000' : '#F7F9F9',
  // Card
  cardBg: isDark ? '#16181C' : '#FFFFFF',
  cardBorder: isDark ? '#2F3336' : '#EFF3F4',
  cardShadow: isDark
    ? '0 0 0 1px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.4)'
    : '0 0 0 1px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.08)',
  // Typography
  titleColor: isDark ? '#E7E9EA' : '#0F1419',
  textColor: isDark ? '#E7E9EA' : '#0F1419',
  subtitleColor: isDark ? '#71767B' : '#536471',
  // Input
  inputBg: isDark ? '#000000' : '#FFFFFF',
  inputBorder: isDark ? '#333639' : '#CFD9DE',
  inputBorderFocus: TWITTER_BLUE,
  inputText: isDark ? '#E7E9EA' : '#0F1419',
  inputPlaceholder: isDark ? '#71767B' : '#536471',
  // Table
  tableHeaderBg: isDark ? '#1D1F23' : '#F7F9F9',
  tableBorder: isDark ? '#2F3336' : '#EFF3F4',
  tableRowHover: isDark ? 'rgba(239, 243, 244, 0.03)' : 'rgba(0, 0, 0, 0.03)',
  tableRowHighlight: isDark
    ? 'rgba(29, 155, 240, 0.2)'
    : 'rgba(29, 155, 240, 0.1)',
  // Buttons
  primaryBg: TWITTER_BLUE,
  primaryText: '#FFFFFF',
  primaryHover: '#1A8CD8',
  outlineBorder: isDark ? '#536471' : '#CFD9DE',
  outlineText: isDark ? '#EFF3F4' : '#0F1419',
  outlineHover: isDark ? 'rgba(239, 243, 244, 0.1)' : 'rgba(15, 20, 25, 0.1)',
  destructiveBg: '#F4212E',
  destructiveHover: '#DC1D28',
  // Warning
  warningBg: isDark ? 'rgba(255, 212, 0, 0.1)' : 'rgba(255, 212, 0, 0.15)',
  warningBorder: '#FFD400',
  warningText: isDark ? '#FFD400' : '#946800',
});

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const DownloadRecords: React.FC = () => {
  const [records, setRecords] = useState<DownloadRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(
    null
  );
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [notFoundRecordId, setNotFoundRecordId] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(detectDarkMode);
  const [searchFocused, setSearchFocused] = useState(false);
  const recordsPerPage = 10;
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  const theme = getTheme(isDarkMode);

  useEffect(() => {
    Logger.logPageView('Download Records', 'download_records', {
      page: 'download_records',
    });

    const initializeRecords = async () => {
      try {
        const allRecords = await db.getAll();
        setRecords(allRecords);

        const urlParams = new URLSearchParams(window.location.search);
        const recordId = urlParams.get('recordId');
        if (recordId) {
          const id = parseInt(recordId, 10);
          findAndNavigateToRecord(allRecords, id);
        }
      } catch (error) {
        console.error('Failed to initialize download records:', error);
        setRecords([]);
        // Could show an error message to user here
      }
    };

    initializeRecords();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (highlightedRecordId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedRecordId, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadRecords = async () => {
    const allRecords = await db.getAll();
    setRecords(allRecords);
    return allRecords;
  };

  const findAndNavigateToRecord = (
    records: DownloadRecord[],
    recordId: number
  ) => {
    const recordIndex = records.findIndex((record) => record.id === recordId);
    if (recordIndex === -1) {
      setNotFoundRecordId(recordId);
      return;
    }

    const pageNumber = Math.floor(recordIndex / recordsPerPage) + 1;
    setCurrentPage(pageNumber);
    setHighlightedRecordId(recordId);
  };

  const filteredRecords = records.filter(
    (record) =>
      record.tweetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.tweetText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const dateMilliseconds = new Date(Number(dateString)).getTime();
    const date = new Date(dateMilliseconds);
    const formattedDate = format(date, 'PPP');
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const timeDiff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (timeDiff < 86400) {
      return timeAgo;
    }
    return formattedDate;
  };

  const changePage = (delta: number) => {
    setCurrentPage((prevPage) => {
      const newPage = prevPage + delta;
      return Math.max(1, Math.min(newPage, totalPages));
    });
  };

  const locateFile = (downloadId: number) => {
    Logger.logEvent('locate_file', { download_id: downloadId });
    chrome.downloads.show(downloadId);
  };

  const openDeleteDialog = (id: number) => {
    setRecordToDelete(id);
    Logger.logEvent('openDeleteDialog', { record_id: id });
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setRecordToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (recordToDelete !== null) {
      try {
        Logger.logEvent('confirmDelete', { record_id: recordToDelete });
        await db.remove(recordToDelete);
        const updatedRecords = await loadRecords();
        closeDeleteDialog();

        if (
          updatedRecords.length <= (currentPage - 1) * recordsPerPage &&
          currentPage > 1
        ) {
          setCurrentPage((prevPage) => prevPage - 1);
        }
      } catch (error) {
        console.error('Failed to delete record:', error);
        closeDeleteDialog();
        // Could show an error message to user here
      }
    }
  };

  const openClearAllDialog = () => {
    Logger.logEvent('openClearAllDialog', { record_id: recordToDelete });
    setClearAllDialogOpen(true);
  };

  const closeClearAllDialog = () => {
    setClearAllDialogOpen(false);
  };

  const confirmClearAll = async () => {
    try {
      Logger.logEvent('clearAllRecords', {});
      await db.clear();
      await loadRecords();
      closeClearAllDialog();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to clear all records:', error);
      closeClearAllDialog();
      // Could show an error message to user here
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / recordsPerPage)
  );

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Icon components
  const SearchIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={theme.subtitleColor}>
      <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
    </svg>
  );

  const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.36 5.64h-5.61v2h4.02L8.41 16l1.41 1.41 8.36-8.36v4.02h2V7.46a1.82 1.82 0 0 0-1.82-1.82zM4 4v16h16v-5h-2v3H6V6h3V4H4z" />
    </svg>
  );

  const FileSearchIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9a3 3 0 1 1-1.88 5.32l-1.55 1.55-1.41-1.41 1.55-1.55A3 3 0 0 1 13 11zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM13 4l5 5h-5V4z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
    </svg>
  );

  const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z" />
    </svg>
  );

  const WarningIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={theme.warningText}>
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );

  const CloseIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={theme.titleColor}>
      <path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z" />
    </svg>
  );

  // Dialog component
  const Dialog: React.FC<{
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    warning?: string;
    onConfirm: () => void;
    confirmText: string;
    confirmDestructive?: boolean;
  }> = ({
    open,
    onClose,
    title,
    description,
    warning,
    onConfirm,
    confirmText,
    confirmDestructive,
  }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (open) {
        requestAnimationFrame(() => setIsVisible(true));
      } else {
        setIsVisible(false);
      }
    }, [open]);

    if (!open) return null;

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: isDarkMode
            ? 'rgba(91, 112, 131, 0.4)'
            : 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.15s ease-out',
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: theme.cardShadow,
            transform: isVisible ? 'scale(1)' : 'scale(0.95)',
            opacity: isVisible ? 1 : 0,
            transition: 'transform 0.2s ease-out, opacity 0.15s ease-out',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: `1px solid ${theme.cardBorder}`,
            }}
          >
            <button
              onClick={onClose}
              aria-label={chrome.i18n.getMessage('cancel')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.outlineHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <CloseIcon />
            </button>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: theme.titleColor,
                margin: 0,
                marginLeft: '24px',
                fontFamily,
              }}
            >
              {title}
            </h2>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 16px' }}>
            <p
              style={{
                fontSize: '15px',
                color: theme.subtitleColor,
                margin: 0,
                lineHeight: 1.5,
                fontFamily,
              }}
            >
              {description}
            </p>

            {warning && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  marginTop: '16px',
                  backgroundColor: theme.warningBg,
                  borderRadius: '8px',
                  borderLeft: `4px solid ${theme.warningBorder}`,
                }}
              >
                <WarningIcon />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.warningText,
                    fontFamily,
                  }}
                >
                  {warning}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '12px 16px',
              borderTop: `1px solid ${theme.cardBorder}`,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: `1px solid ${theme.outlineBorder}`,
                backgroundColor: 'transparent',
                color: theme.outlineText,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.outlineHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {chrome.i18n.getMessage('cancel')}
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: confirmDestructive
                  ? theme.destructiveBg
                  : theme.primaryBg,
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = confirmDestructive
                  ? theme.destructiveHover
                  : theme.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = confirmDestructive
                  ? theme.destructiveBg
                  : theme.primaryBg;
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.pageBg,
        padding: '24px',
        fontFamily,
        transition: 'background-color 0.2s',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Card */}
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: '16px',
            boxShadow: theme.cardShadow,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.cardBorder}`,
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: theme.titleColor,
                margin: 0,
                textAlign: 'center',
                fontFamily,
              }}
            >
              {chrome.i18n.getMessage('downloadRecords')}
            </h1>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {/* Not Found Warning */}
            {notFoundRecordId && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  backgroundColor: theme.warningBg,
                  borderRadius: '8px',
                  borderLeft: `4px solid ${theme.warningBorder}`,
                }}
              >
                <WarningIcon />
                <span
                  style={{
                    fontSize: '14px',
                    color: theme.warningText,
                    fontFamily,
                  }}
                >
                  {chrome.i18n.getMessage('recordNotFound', [
                    notFoundRecordId.toString(),
                  ])}
                </span>
              </div>
            )}

            {/* Search */}
            <div
              style={{
                maxWidth: '400px',
                margin: '0 auto 24px',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    pointerEvents: 'none',
                  }}
                >
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder={chrome.i18n.getMessage('searchRecordsAndTweets')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    fontSize: '15px',
                    color: theme.inputText,
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${searchFocused ? theme.inputBorderFocus : theme.inputBorder}`,
                    borderRadius: '9999px',
                    outline: 'none',
                    fontFamily,
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxShadow: searchFocused
                      ? `0 0 0 1px ${theme.inputBorderFocus}`
                      : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div
              style={{
                overflowX: 'auto',
                borderRadius: '8px',
                border: `1px solid ${theme.tableBorder}`,
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: theme.tableHeaderBg }}>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.subtitleColor,
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        width: '20%',
                      }}
                    >
                      {chrome.i18n.getMessage('originTweet')}
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.subtitleColor,
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        width: '20%',
                      }}
                    >
                      {chrome.i18n.getMessage('downloadDate')}
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.subtitleColor,
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        width: '40%',
                      }}
                    >
                      {chrome.i18n.getMessage('tweetText')}
                    </th>
                    <th
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: theme.subtitleColor,
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        width: '20%',
                      }}
                    >
                      {chrome.i18n.getMessage('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record) => (
                    <tr
                      key={record.id}
                      ref={
                        record.id === highlightedRecordId
                          ? highlightedRowRef
                          : null
                      }
                      style={{
                        backgroundColor:
                          record.id === highlightedRecordId
                            ? theme.tableRowHighlight
                            : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (record.id !== highlightedRecordId) {
                          e.currentTarget.style.backgroundColor =
                            theme.tableRowHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (record.id !== highlightedRecordId) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <td
                        style={{
                          padding: '16px',
                          borderBottom: `1px solid ${theme.tableBorder}`,
                        }}
                      >
                        <a
                          href={record.tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            border: `1px solid ${theme.outlineBorder}`,
                            backgroundColor: 'transparent',
                            color: TWITTER_BLUE,
                            fontSize: '13px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontFamily,
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'rgba(29, 155, 240, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                          }}
                        >
                          <ExternalLinkIcon />
                          {chrome.i18n.getMessage('openOriginTweet')}
                        </a>
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          fontSize: '14px',
                          color: theme.textColor,
                          borderBottom: `1px solid ${theme.tableBorder}`,
                        }}
                      >
                        {formatDate(record.downloadDate)}
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          borderBottom: `1px solid ${theme.tableBorder}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            color: theme.textColor,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            maxWidth: '300px',
                            maxHeight: '80px',
                            overflow: 'auto',
                            lineHeight: 1.4,
                          }}
                        >
                          {record.tweetText}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px',
                          borderBottom: `1px solid ${theme.tableBorder}`,
                        }}
                      >
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => locateFile(record.downloadId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              border: `1px solid ${theme.outlineBorder}`,
                              backgroundColor: 'transparent',
                              color: theme.outlineText,
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              fontFamily,
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                theme.outlineHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                'transparent';
                            }}
                          >
                            <FileSearchIcon />
                            {chrome.i18n.getMessage('locateFile')}
                          </button>
                          <button
                            onClick={() => openDeleteDialog(record.id)}
                            aria-label={chrome.i18n.getMessage('delete')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: theme.destructiveBg,
                              cursor: 'pointer',
                              transition: 'background-color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                'rgba(244, 33, 46, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                'transparent';
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: '48px 16px',
                          textAlign: 'center',
                          color: theme.subtitleColor,
                          fontSize: '15px',
                        }}
                      >
                        {searchTerm
                          ? chrome.i18n.getMessage('noSearchResults') ||
                            'No results found'
                          : chrome.i18n.getMessage('noRecords') ||
                            'No download records'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '24px',
              }}
            >
              <button
                onClick={() => changePage(-1)}
                disabled={currentPage === 1}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: `1px solid ${theme.outlineBorder}`,
                  backgroundColor: 'transparent',
                  color:
                    currentPage === 1 ? theme.subtitleColor : theme.outlineText,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontFamily,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.backgroundColor = theme.outlineHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ChevronLeftIcon />
                {chrome.i18n.getMessage('previousPage')}
              </button>

              <span
                style={{
                  fontSize: '14px',
                  color: theme.subtitleColor,
                  fontFamily,
                }}
              >
                {chrome.i18n.getMessage('pageOf', [
                  currentPage.toString(),
                  totalPages.toString(),
                ])}
              </span>

              <button
                onClick={() => changePage(1)}
                disabled={currentPage === totalPages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: `1px solid ${theme.outlineBorder}`,
                  backgroundColor: 'transparent',
                  color:
                    currentPage === totalPages
                      ? theme.subtitleColor
                      : theme.outlineText,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor:
                    currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontFamily,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.backgroundColor = theme.outlineHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {chrome.i18n.getMessage('nextPage')}
                <ChevronRightIcon />
              </button>
            </div>

            {/* Clear All Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '24px',
              }}
            >
              <button
                onClick={openClearAllDialog}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: theme.destructiveBg,
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily,
                  transition: 'background-color 0.15s',
                  maxWidth: '400px',
                  width: '100%',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    theme.destructiveHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.destructiveBg;
                }}
              >
                <TrashIcon />
                {chrome.i18n.getMessage('clearAllRecords')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        title={chrome.i18n.getMessage('confirmDelete')}
        description={chrome.i18n.getMessage('deleteRecordConfirmation')}
        onConfirm={confirmDelete}
        confirmText={chrome.i18n.getMessage('delete')}
        confirmDestructive
      />

      {/* Clear All Dialog */}
      <Dialog
        open={clearAllDialogOpen}
        onClose={closeClearAllDialog}
        title={chrome.i18n.getMessage('confirmClearAll')}
        description={chrome.i18n.getMessage('clearAllRecordsConfirmation')}
        warning={chrome.i18n.getMessage('clearAllWarning')}
        onConfirm={confirmClearAll}
        confirmText={chrome.i18n.getMessage('clearAll')}
        confirmDestructive
      />
    </div>
  );
};

export default DownloadRecords;
