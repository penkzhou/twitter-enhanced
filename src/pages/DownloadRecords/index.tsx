import React from 'react';
import { createRoot } from 'react-dom/client';

import DownloadRecords from './DownloadRecords';
import './../../globals.css';

const container = document.getElementById('app-container');

if (container) {
    // Update styling to align content to the top
    container.className = 'flex justify-center items-start min-h-screen bg-gray-100 dark:bg-gray-900 p-4';

    const root = createRoot(container);
    root.render(<DownloadRecords />);
}