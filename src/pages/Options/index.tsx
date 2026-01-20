import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../globals.css';
import Options from './Options';

const container = document.getElementById('app-container');

if (container) {
  // Remove any existing classes - the component handles its own styling
  container.className = '';
  container.style.margin = '0';
  container.style.padding = '0';

  const root = createRoot(container);
  root.render(<Options />);
}
