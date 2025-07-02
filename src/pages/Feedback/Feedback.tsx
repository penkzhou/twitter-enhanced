import React, { useState } from 'react';
import './Feedback.css';
import { Logger } from '../../utils/logger';

const Feedback = () => {
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim()) {
      Logger.logEvent('send_feedback', { feedbackContent: feedback });
      const emailSubject = encodeURIComponent(
        chrome.i18n.getMessage('feedbackEmailSubject')
      );
      const emailBody = encodeURIComponent(feedback);
      window.location.href = `mailto:penkstudio@gmail.com?subject=${emailSubject}&body=${emailBody}`;
    }
  };

  return (
    <div className="feedback-container">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">
        {chrome.i18n.getMessage('feedbackTitle')}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="feedbackInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {chrome.i18n.getMessage('feedbackLabel')}
          </label>
          <textarea
            id="feedbackInput"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            rows={5}
            placeholder={chrome.i18n.getMessage('feedbackPlaceholder')}
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {chrome.i18n.getMessage('submitFeedback')}
        </button>
      </form>
    </div>
  );
};

export default Feedback;
