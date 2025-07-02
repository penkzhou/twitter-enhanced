import React from 'react';
import { createRoot } from 'react-dom/client';
import Feedback from './Feedback';
import './../../globals.css';

const container = document.getElementById('app-container');
const root = createRoot(container!);
root.render(<Feedback />);
