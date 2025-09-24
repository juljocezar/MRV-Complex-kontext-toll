<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MRV Komplex Kontext Tool

Das **MRV Komplex Kontext Tool** ist eine fortschrittliche, KI-gestützte Webanwendung, die als intelligenter Assistent für die Verwaltung und Analyse komplexer Fälle konzipiert ist. Sie richtet sich speziell an Fachleute in den Bereichen Recht, Menschenrechte und investigative Recherche, die große Mengen unstrukturierter Daten verarbeiten müssen.

Die Anwendung nutzt die Leistungsfähigkeit von Googles Gemini-KI, um Dokumente zu analysieren, wichtige Informationen zu extrahieren, Risiken zu identifizieren, Strategien vorzuschlagen und kohärente Berichte zu erstellen.

## Hauptfunktionen

*   **Zentrales Dashboard:** Bietet einen Überblick über den gesamten Fall, einschließlich einer KI-generierten Zusammenfassung, identifizierter Risiken und vorgeschlagener nächster Schritte.
*   **Dokumenten-Management:** Ermöglicht das Hochladen und Verwalten von Falldokumenten, die die Grundlage für alle KI-Analysen bilden.
*   **Kontextsensitive Analyse:** Führt tiefgehende Analysen durch, um Entitäten (Personen, Organisationen), Zeitabläufe und wichtige Ereignisse zu identifizieren.
*   **Wissensgraph:** Visualisiert die Beziehungen zwischen verschiedenen Entitäten und Informationen im Fall.
*   **Widerspruchs-Erkennung:** Überprüft Dokumente auf logische Widersprüche und Inkonsistenzen.
*   **KI-gestützte Generierung:** Erstellt auf Basis des Fallkontexts Entwürfe für Berichte, Schriftsätze oder andere Dokumente.
*   **Strategie- und Risiko-Analyse:** Identifiziert potenzielle Risiken und schlägt proaktiv Maßnahmen zur Minderung vor.
*   **Spezialisierte Module:** Enthält Tabs für spezifische Anwendungsfälle wie UN-Einreichungen, Unterstützung für Menschenrechtsverteidiger (HRD) und die Analyse der rechtlichen Grundlagen.

## Technologie-Stack

*   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Build-Tool:** [Vite](https://vitejs.dev/)
*   **KI-Modell:** [Google Gemini](https://ai.google.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (implizit durch Klassennamen im Code)
*   **Lokaler Speicher:** IndexedDB zur persistenten Speicherung des Anwendungszustands im Browser.

## Architektur-Überblick

Die Anwendung ist als Single-Page-Application (SPA) konzipiert, die vollständig im Browser des Benutzers ausgeführt wird. Die Architektur lässt sich wie folgt zusammenfassen:

1.  **UI-Schicht (`components`):** Die Benutzeroberfläche wird mit React-Komponenten aufgebaut. Die Hauptkomponente `App.tsx` verwaltet den globalen Zustand der Anwendung.
2.  **Service-Schicht (`services`):** Eine Abstraktionsschicht, die die Geschäftslogik und die Kommunikation mit der KI kapselt. Dienste wie `CaseAnalyzerService` oder `ContradictionDetectorService` bereiten Prompts vor und rufen den `GeminiService` auf.
3.  **AI-Integration (`GeminiService`):** Dieser Dienst ist die einzige Schnittstelle zum Google Gemini API. Er sendet die aufbereiteten Prompts und die erwarteten JSON-Schemata an die KI und gibt die strukturierten Ergebnisse an die Service-Schicht zurück.
4.  **Lokaler Speicher (`storageService`):** Der gesamte Anwendungszustand (`AppState`) wird im IndexedDB des Browsers gespeichert, um die Persistenz über Sitzungen hinweg zu gewährleisten. Es findet kein Datenaustausch mit einem externen Server statt, mit Ausnahme der Aufrufe an die Gemini-API.

## Lokal ausführen

**Voraussetzungen:** [Node.js](https://nodejs.org/) muss installiert sein.

1.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
2.  **Umgebungsvariablen einrichten:**
    Erstellen Sie eine Datei `.env.local` im Stammverzeichnis des Projekts und fügen Sie Ihren Gemini-API-Schlüssel hinzu:
    ```
    GEMINI_API_KEY=IHR_GEMINI_API_SCHLUESSEL
    ```
3.  **Anwendung starten:**
    ```bash
    npm run dev
    ```
Die Anwendung ist nun unter der in der Konsole angezeigten Adresse (normalerweise `http://localhost:5173`) verfügbar.
