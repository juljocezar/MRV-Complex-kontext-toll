/**
 * @file index.tsx
 * @description The main entry point for the React application.
 * This file is responsible for finding the root DOM element and rendering the main `App` component into it.
 * It also wraps the `App` component in `React.StrictMode` to highlight potential problems in the application.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Corrected import path for App component. This will now work as App.tsx is a valid module.
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);