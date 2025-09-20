/**
 * @file index.tsx
 * @description The entry point for the React application. This file is responsible for rendering the main App component into the DOM.
 * @description Der Einstiegspunkt für die React-Anwendung. Diese Datei ist dafür verantwortlich, die Haupt-App-Komponente in das DOM zu rendern.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
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
