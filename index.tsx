
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Globaler Error Handler für nicht abgefangene Fehler (z.B. während Module-Loading)
window.addEventListener('error', (event) => {
    console.error("Global uncaught error:", event.error);
    const root = document.getElementById('root');
    if (root && root.childElementCount === 0) {
        // Wenn React nichts gerendert hat (schwarzer Bildschirm), zeige Notfall-UI
        renderEmergencyUI(event.message || 'Unbekannter Systemfehler');
    }
});

// Notfall-UI, die komplett ohne React funktioniert
function renderEmergencyUI(errorMsg: string) {
    const root = document.getElementById('root');
    if (!root) return;
    
    root.innerHTML = `
        <div style="
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            background-color: #0f172a; 
            color: #ef4444; 
            font-family: sans-serif;
            text-align: center;
            padding: 20px;
        ">
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Kritischer Startfehler</h1>
            <p style="color: #cbd5e1; margin-bottom: 2rem; max-width: 600px;">
                Die Anwendung konnte nicht initialisiert werden. Dies liegt meist an beschädigten lokalen Daten.
            </p>
            <div style="
                background: rgba(0,0,0,0.3); 
                padding: 1rem; 
                border-radius: 0.5rem; 
                font-family: monospace; 
                font-size: 0.8rem; 
                margin-bottom: 2rem;
                border: 1px solid #334155;
                color: #f87171;
            ">
                ${errorMsg}
            </div>
            <button 
                onclick="indexedDB.deleteDatabase('MRVAssistantDB'); localStorage.clear(); window.location.reload();" 
                style="
                    background-color: #dc2626; 
                    color: white; 
                    border: none; 
                    padding: 12px 24px; 
                    font-size: 1rem; 
                    font-weight: bold; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: background-color 0.2s;
                "
                onmouseover="this.style.backgroundColor='#b91c1c'"
                onmouseout="this.style.backgroundColor='#dc2626'"
            >
                DATENBANK ZURÜCKSETZEN & NEUSTARTEN
            </button>
            <p style="margin-top: 1rem; font-size: 0.8rem; color: #64748b;">
                Dies löscht den lokalen Browser-Speicher und behebt Konflikte.
            </p>
        </div>
    `;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
} catch (e: any) {
    console.error("React render failed:", e);
    renderEmergencyUI(e.message || "Render Initialization Failed");
}
