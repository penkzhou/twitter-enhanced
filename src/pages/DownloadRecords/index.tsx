import React from 'react';
import { createRoot } from 'react-dom/client';

import DownloadRecords from './DownloadRecords';
import './index.css';

const container = document.getElementById('app-container');

if (container) {
    const root = createRoot(container);
    root.render(<DownloadRecords />);
}