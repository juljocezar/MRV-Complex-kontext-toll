
# Roadmap für den MRV-Assistenten

Dieses Dokument skizziert die geplante Weiterentwicklung der Anwendung in logischen Phasen.

## Phase 1: Konsolidierung & Stabilität (Kurzfristig)

*Ziel: Verbesserung der Code-Qualität, Performance und UI-Konsistenz.*

-   **[Technik] State Management Refactoring:**
    -   Umstellung des zentralen `useState` in `App.tsx` auf `useReducer`, um die Update-Logik zu vereinfachen und die Performance bei komplexen Zustandsänderungen zu verbessern.
-   **[Technik] Einführung von Unit-Tests:**
    -   Integration eines Test-Frameworks (z.B. Vitest) und Schreiben von Unit-Tests für kritische Services (`geminiService`, `storageService`, `contextUtils`).
-   **[UI/UX] Optimierung der Ladezustände:**
    -   Implementierung von "Skeleton Loaders" in den Tabs, um das Laden von Daten visuell ansprechender zu gestalten.
-   **[UI/UX] Verbessertes Fehler-Feedback:**
    -   Detailliertere und benutzerfreundlichere Fehlermeldungen bei fehlgeschlagenen KI-Anfragen oder Speicheroperationen.
-   **[Feature] Erweiterte Tag-Verwaltung:**
    -   Möglichkeit, Tags umzubenennen und mit Farben zu versehen.

## Phase 2: Feature-Erweiterung & Backend-Grundlagen (Mittelfristig)

*Ziel: Ausbau der Kernfunktionalität, Verbesserung der Benutzerinteraktion und Aufbau der Backend-Infrastruktur.*

-   **[Architektur] Einführung eines Backends (IN ARBEIT):**
    -   Die Grundlagen wurden durch die Integration von **Prisma** und einem SQLite-Datenbankschema gelegt.
    -   **Nächste Schritte:** Entwicklung eines API-Servers (z.B. mit Express oder Fastify), der die Prisma-Client-Anfragen kapselt und Endpunkte für den Client bereitstellt.
-   **[Feature] Streaming für KI-Antworten:**
    -   Implementierung von `generateContentStream` im Analyse-Chat und bei der Dokumentengenerierung, um die wahrgenommene Geschwindigkeit drastisch zu erhöhen.
-   **[Feature] Globale Suche (Hybrid):**
    -   Erweiterung der clientseitigen Suche um die Möglichkeit, auch das Backend abzufragen, sobald dieses live ist.
-   **[Technik] Progressive Web App (PWA):**
    -   Erweiterung der Anwendung zu einer PWA mit Service Worker, um die Offline-Fähigkeit weiter zu verbessern.

## Phase 3: Kollaboration & strategische Expansion (Langfristig)

*Ziel: Transformation von einem Einzelplatz-Tool zu einer kollaborativen Plattform.*

-   **[Feature] Kollaborations-Modus:**
    -   Mehrere Benutzer können gleichzeitig an einem Fall arbeiten, Änderungen werden in Echtzeit (z.B. via WebSockets) synchronisiert.
-   **[Feature] Benutzerauthentifizierung & Rollen:**
    -   Implementierung eines sicheren Login-Systems mit verschiedenen Berechtigungsstufen.
-   **[Feature] Automatisierte Agenten-Workflows:**
    -   Erstellung von komplexeren Abläufen, bei denen KI-Agenten sich gegenseitig auslösen können (z.B. "Wenn ein Widerspruch gefunden wird, starte automatisch eine neue Strategie-Analyse").
-   **[Feature] Mehrsprachigkeit:**
    -   Implementierung eines i18n-Frameworks zur Unterstützung weiterer Sprachen für die Benutzeroberfläche.
-   **[Feature] Prädiktive Analyse (Experimentell):**
    -   Entwicklung eines neuen KI-Agenten, der basierend auf den vorhandenen Daten versucht, mögliche zukünftige Entwicklungen im Fall oder die Strategie der Gegenseite vorherzusagen.
