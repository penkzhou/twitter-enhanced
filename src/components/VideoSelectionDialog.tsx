import React, { useState, useCallback } from 'react';
import { VideoInfo } from '../lib/types';

export interface VideoSelectionDialogProps {
  videos: VideoInfo[];
  tweetId: string;
  onDownloadSelected: (selectedVideos: VideoInfo[]) => void;
  onDownloadAll: () => void;
  onCancel: () => void;
}

const VideoSelectionDialog: React.FC<VideoSelectionDialogProps> = ({
  videos,
  tweetId,
  onDownloadSelected,
  onDownloadAll,
  onCancel,
}) => {
  const [selectedVideos, setSelectedVideos] = useState<VideoInfo[]>([]);

  const handleCheckboxChange = useCallback((video: VideoInfo) => {
    setSelectedVideos((prev) =>
      prev.includes(video) ? prev.filter((v) => v !== video) : [...prev, video]
    );
  }, []);

  const handleDownloadSelected = useCallback(() => {
    onDownloadSelected(selectedVideos);
  }, [selectedVideos, onDownloadSelected]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xl w-full mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {chrome.i18n.getMessage('selectVideo')}
        </h2>
        <div
          className={`grid ${videos.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-4 mb-4`}
        >
          {videos.map((video, index) => (
            <div
              key={index}
              className={`flex flex-col p-2 rounded cursor-pointer transition-all duration-200 ease-in-out
                                ${
                                  selectedVideos.includes(video)
                                    ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
              onClick={() => handleCheckboxChange(video)}
            >
              <div className="aspect-w-1 aspect-h-1 mb-2 relative">
                <img
                  src={video.thumbnailUrl}
                  alt={`${chrome.i18n.getMessage('video')} ${index + 1}`}
                  className="object-cover rounded w-full h-full"
                />
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    id={`video-${index}`}
                    className="form-checkbox h-5 w-5 text-blue-600"
                    checked={selectedVideos.includes(video)}
                    onChange={() => handleCheckboxChange(video)}
                  />
                </div>
                {selectedVideos.includes(video) && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {chrome.i18n.getMessage('video')} {index + 1}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
          >
            {chrome.i18n.getMessage('cancel')}
          </button>
          <button
            onClick={handleDownloadSelected}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${selectedVideos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={selectedVideos.length === 0}
          >
            {chrome.i18n.getMessage('downloadSelected')} (
            {selectedVideos.length})
          </button>
          <button
            onClick={onDownloadAll}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors"
          >
            {chrome.i18n.getMessage('downloadAll')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSelectionDialog;
