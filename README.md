<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MRV Komplex-Kontext-Tool

## Projektübersicht

Dieses Projekt ist eine fortschrittliche Webanwendung, die als KI-gestützter Assistent für die Analyse und Verwaltung komplexer Fallakten konzipiert ist. Sie richtet sich primär an Anwender in juristischen, menschenrechtlichen oder investigativen Bereichen, die große Mengen unstrukturierter Daten (Dokumente, Berichte etc.) verarbeiten müssen.

Die Anwendung nutzt Google Gemini, um tiefe Einblicke in die Falldaten zu gewinnen, Zusammenhänge aufzudecken und die strategische Fallbearbeitung zu unterstützen. Alle Daten werden lokal im Browser des Benutzers gespeichert, um maximale Sicherheit und Vertraulichkeit zu gewährleisten.

## Hauptfunktionen

- **KI-gestützte Dokumentenanalyse**: Automatische Zusammenfassung, Klassifizierung und Extraktion von Schlüsselinformationen wie Ereignissen, Handlungen und Entitäten aus hochgeladenen Dokumenten.
- **Widerspruchserkennung**: Identifiziert automatisch widersprüchliche Aussagen zwischen verschiedenen Dokumenten im Fall.
- **Strategische Einblicke**: Generiert proaktiv Einblicke, Risikobewertungen und strategische Empfehlungen auf Basis des gesamten Fallkontexts.
- **Interaktive Wissensverwaltung**: Bietet Werkzeuge zur Verwaltung von Entitäten (Personen, Orte, Organisationen), eine interaktive Chronologie der Ereignisse und eine zentrale Wissensdatenbank.
- **Content-Generierung**: Erstellt Entwürfe für Berichte, E-Mails und andere Dokumente auf Basis der Falldaten.
- **Sicher & Privat**: Alle Daten werden ausschließlich lokal im Browser mittels IndexedDB gespeichert. Es findet keine Übertragung von Falldaten an externe Server statt (mit Ausnahme der anonymisierten Anfragen an die Gemini API).
- **Datenexport & -import**: Ermöglicht das Sichern und Wiederherstellen des gesamten Fallzustands in einer JSON-Datei.

## Technologie-Stack

- **Frontend**: React, TypeScript, Vite
- **KI-Modell**: Google Gemini Pro
- **Styling**: Tailwind CSS
- **Lokale Speicherung**: IndexedDB (über eine Service-Abstraktion)
- **Markdown-Verarbeitung**: `marked`

## Installation und lokale Ausführung

**Voraussetzungen:** Node.js muss installiert sein.

1.  **Abhängigkeiten installieren:**
    ```bash
    npm install
    ```
2.  **API-Schlüssel einrichten:**
    Erstellen Sie eine Datei namens `.env.local` im Hauptverzeichnis des Projekts und fügen Sie Ihren Gemini API-Schlüssel wie folgt hinzu:
    ```
    VITE_GEMINI_API_KEY=IHR_API_SCHLUESSEL_HIER
    ```
    *Hinweis: Da die App Vite verwendet, müssen Umgebungsvariablen mit `VITE_` beginnen, um im Frontend verfügbar zu sein.*

3.  **Anwendung starten:**
    ```bash
    npm run dev
    ```
    Die Anwendung ist nun unter `http://localhost:5173` (oder einem anderen von Vite angegebenen Port) verfügbar.

## Projektstruktur

Die Codebasis ist modular aufgebaut, um die Wartbarkeit zu erleichtern:

-   `/components`: Enthält alle wiederverwendbaren React-Komponenten, unterteilt in UI-Elemente (`/ui`), Modals (`/modals`) und die Haupt-Tabs der Anwendung (`/tabs`).
-   `/services`: Beinhaltet die Kernlogik der Anwendung. Jeder Service ist für eine spezifische Aufgabe zuständig (z.B. `geminiService.ts` für die KI-Kommunikation, `orchestrationService.ts` für die Steuerung der Analyseprozesse).
-   `/hooks`: Benutzerdefinierte React-Hooks.
-   `/utils`: Hilfsfunktionen, die in der gesamten Anwendung verwendet werden (z.B. für die Kontext-Erstellung oder Datei-Verarbeitung).
-   `/types`: TypeScript-Typdefinitionen für die gesamte Anwendung.
-   `App.tsx`: Die Hauptkomponente, die den globalen Zustand verwaltet und die verschiedenen Teile der Anwendung zusammenfügt.
-   `storageService.ts`: Eine Abstraktionsebene für die Interaktion mit der lokalen IndexedDB.