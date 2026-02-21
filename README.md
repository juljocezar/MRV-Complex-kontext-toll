
# MRV-Assistent Professional (Mrv-kompley-kontext-Tool)

## Übersicht

Der MRV-Assistent Professional ist ein fortschrittliches, KI-gestütztes Dashboard für Menschenrechtsverteidiger. Es kombiniert lokale Datensicherheit ("Privacy-First") mit leistungsstarker Cloud-KI und einer optionalen Backend-Synchronisation.

## Technischer Stack

-   **Frontend:** React 18, Tailwind CSS, Vite
-   **Backend:** Node.js (Express), Prisma ORM
-   **Datenbank:** SQLite (Dev) / PostgreSQL (Prod), IndexedDB (Client)
-   **KI:** Google Gemini API (`gemini-3-pro`)

## Inbetriebnahme

### 1. Vorbereitung
Klone das Repository und installiere die Abhängigkeiten:
```bash
npm install
```

### 2. Konfiguration
Erstelle eine `.env` Datei im Hauptverzeichnis (siehe `.env.example`).
```env
VITE_API_KEY=dein_google_gemini_key
VITE_USE_BACKEND=true
DATABASE_URL="file:./dev.db"
```

### 3. Datenbank initialisieren
Erstelle die lokale SQLite-Datenbank:
```bash
npx prisma migrate dev --name init
```

### 4. Anwendung starten
Startet Frontend (Port 5173) und Backend (Port 3001) parallel:
```bash
npm run dev:full
```

## Architektur-Hinweise

*   **Hybrid-Modus:** Die App läuft primär offline-fähig über IndexedDB. Ist `VITE_USE_BACKEND=true` gesetzt, synchronisiert der `storageService` zusätzlich mit dem Express-Backend.
*   **KI-Agenten:** Komplexe Logik (wie der Radbruch-Check) läuft über den `OrchestrationService`, der mehrere KI-Calls und Tools koordiniert.

## Testing & Qualität

*   **Unit Tests:** Ausführen mit `npm test` (nutzt Vitest).
*   **E2E Tests:** Cypress Tests liegen unter `cypress/`.
*   **Fehlerbehandlung:** Eine globale `ErrorBoundary` fängt UI-Abstürze ab.

