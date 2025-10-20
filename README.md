# MRV-Assistent Professional (Mrv-kompley-kontext-Tool)

## Übersicht

Der MRV-Assistent Professional ist ein fortschrittliches, KI-gestütztes Dashboard, das speziell für Fallbearbeiter im Bereich Menschenrechte entwickelt wurde. Die Anwendung dient der Verwaltung, Analyse und Generierung von Falldokumenten, Strategien und Berichten. Sie nutzt die generative KI der Gemini-API, um detaillierte Einblicke, Risikobewertungen und optimierte Arbeitsabläufe zu ermöglichen.

Die gesamte Anwendung ist als reine Client-Side-Anwendung konzipiert, die alle Daten sicher in der IndexedDB des Browsers speichert. Dies gewährleistet hohe Datensicherheit und Offline-Fähigkeit.

## Hauptfunktionen

- **Dashboard:** Bietet einen schnellen Überblick über den Fallstatus, Statistiken und eine KI-gestützte Gesamtanalyse.
- **Dokumentenverwaltung:** Hochladen und Verwalten von Falldokumenten mit KI-gestützter Analyse (Zusammenfassung, Klassifizierung, Entitätenextraktion).
- **Stammdaten (Entitäten):** Erfassen und Verwalten von Personen, Organisationen und Orten mit automatischer Analyse von Beziehungsgeflechten.
- **Chronologie & Wissensbasis:** Automatische und manuelle Erstellung von Ereignis-Zeitachsen und einer durchsuchbaren Wissensdatenbank.
- **Tiefe Analyse:**
    - **Analyse-Zentrum:** Freiform-Chat mit der KI über den gesamten Fallkontext.
    - **Widerspruchsanalyse:** Findet widersprüchliche Aussagen über mehrere Dokumente hinweg.
    - **Strategie & Risiko:** Identifiziert Risiken und generiert Minderungsstrategien.
    - **Argumentationshilfe:** Entwickelt Argumente für die eigene Position und antizipiert Gegenargumente.
- **Dokumentenerstellung:** Generiert Berichte und andere Dokumente basierend auf dem Fallkontext und anpassbaren Vorlagen.
- **Spezialwerkzeuge:** Bietet Unterstützung für UN-Einreichungen, HRD-Support und Ethik-Analysen.
- **System & Audit:** Transparente Protokollierung aller Benutzer- und KI-Agenten-Aktionen.

## Technischer Stack

-   **Framework:** React 18 (via CDN)
-   **Sprache:** TypeScript
-   **Styling:** Tailwind CSS (via CDN)
-   **KI-Modell:** Google Gemini API (`@google/genai`)
-   **Lokaler Speicher:** IndexedDB
-   **Markdown-Rendering:** `marked`
-   **Architektur:** Build-less Frontend-Anwendung mit `importmap` für das Laden von Modulen.

## Projektstruktur

Das Projekt ist in eine logische und serviceorientierte Struktur unterteilt:

-   `components/`: Enthält alle React-Komponenten, unterteilt in `tabs`, `ui` und `modals`.
-   `services/`: Kapselt die Geschäftslogik, insbesondere die Interaktion mit externen APIs und die Datenverarbeitung.
    -   `geminiService.ts`: Zentraler, gedrosselter und fehlerresistenter Gateway zur Gemini-API.
    -   `storageService.ts`: Abstraktionsschicht für alle IndexedDB-Operationen.
    -   `orchestrationService.ts`: Koordiniert komplexe, mehrstufige KI-Workflows.
    -   Weitere Services für spezifische Analyseaufgaben (z.B. `caseAnalyzerService`, `contradictionDetectorService`).
-   `utils/`: Globale Hilfsfunktionen.
-   `types.ts`: Zentrale Definition aller TypeScript-Typen.
-   `constants.ts`: Anwendungsweite Konstanten, wie z.B. die Definitionen der KI-Agenten.

## Inbetriebnahme

1.  Stellen Sie sicher, dass eine Umgebungsvariable `API_KEY` mit einem gültigen Google Gemini API-Schlüssel vorhanden ist.
2.  Da es sich um eine build-less Anwendung handelt, können die Dateien von jedem einfachen statischen Webserver (z.B. `python -m http.server` oder `npx serve`) ausgeliefert werden.
3.  Öffnen Sie die `index.html` im Browser.
