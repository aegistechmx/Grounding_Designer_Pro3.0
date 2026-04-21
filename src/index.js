// Al inicio de index.js
import './initPdf';
import './utils/pdfFullPro';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { debugSuite } from './utils/debugUtils';

// Initialize debug suite
if (typeof window !== 'undefined') {
  console.log('Debug suite initialized');
  debugSuite;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);