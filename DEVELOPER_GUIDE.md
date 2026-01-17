
# MRV-Assistent Professional – Entwickler-Handbuch

## 1. Projektübersicht

### Zweck der Anwendung
Der **MRV-Assistent Professional** ist ein spezialisiertes "Thick Client"-Dashboard für Menschenrechtsverteidiger (Human Rights Defenders, HRDs), Anwälte und forensische Analysten. Die Anwendung dient der Verwaltung, Analyse und strategischen Aufarbeitung komplexer Menschenrechtsfälle.

Das System folgt einem **"Privacy-by-Design" & "Offline-First"** Ansatz: Sensible Falldaten werden lokal im Browser (IndexedDB) gespeichert und verlassen das Gerät nur temporär und punktuell zur KI-Analyse. Es gibt kein zentrales Backend zur Datenspeicherung.

### Hauptfeatures
*   **Dokumenten-Ingestion & Analyse:** Upload, OCR-Vorstufe (textbasiert), KI-Zusammenfassung, Klassifizierung (HURIDOCS) und Entitäten-Extraktion.
*   **Forensische Validierung:** Deterministische Logic-Engines (`radbruchLogic.ts`) prüfen auf Rechtsverstöße (z.B. Art. 25 GG, Ius Cogens) und Systemfehler.
*   **Widerspruchs-Detektor:** Cross-Check von Aussagen über mehrere Dokumente hinweg.
*   **Wissensgraph & Chronologie:** Automatische Erstellung von Zeitachsen und Beziehungsgeflechten.
*   **Semantische Suche (RAG):** Hybride Suche (Vektor-Embeddings + Volltext) über die gesamte Fallakte.
*   **Strategie & Output:** Generierung von Berichten, UN-Einreichungen und Risiko-Analysen.

### Technologie-Stack
*   **Frontend:** React 18 (via ES Modules / Vite-Umgebung).
*   **Sprache:** TypeScript (TSX).
*   **Styling:** Tailwind CSS (via CDN geladen).
*   **KI & LLM:** Google Gemini API (`@google/genai`) via `gemini-3-flash` & `gemini-3-pro`.
*   **Datenbank:** IndexedDB (via `idb` Wrapper).
*   **Such-Engine:** `lunr.js` (Inverted Index) + Custom Vector Search (Cosine Similarity).
*   **Visualisierung:** `reactflow` (Graphen), `marked` (Markdown Rendering).
*   **NLP:** `wink-nlp` (Regelbasiertes Entity Extraction im Browser).
*   **Testing:** Cypress (E2E Tests).

---

## 2. HURIDOCS Events Standard Formats (ESF) Compliance

Der MRV-Assistent integriert die HURIDOCS ESF-Standards, um Interoperabilität und professionelle Dokumentation zu gewährleisten.

### 2.1 ESF Konformitäts-Checkliste
Entwickler müssen sicherstellen, dass neue Features diese Standards respektieren:

- [ ] **Event-Format (100er Serie):** Ereignisse müssen mindestens über Datum (113), Ort (111) und Beschreibung (115) verfügen.
- [ ] **Person-Format (900er Serie):** Entitäten werden mit biographischen Daten angereichert (Geschlecht, Geburtsdatum).
- [ ] **Act-Format (2100er Serie):** Handlungen werden als spezifische "Acts" (Tat) mit Typ (2101) und Methode (2102) modelliert.
- [ ] **Link-Logik:** Die Verknüpfung zwischen Täter, Tat und Opfer muss technisch nachvollziehbar sein (über IDs in `involvedActors` oder `structuredParticipants`).
- [ ] **Import/Export:** Export-Module sollten die ESF-Tags (z.B. `esf_111_location`) als Schlüssel verwenden.

### 2.2 ESF-Feld-Mapping (Event-Ebene)
Zuordnung von ESF-Event-Feldern zu UI-Komponenten und Services.

| ESF-Feld (Tag)       | Bedeutung                              | Tab / UI                       | Service / Logik                    |
|----------------------|----------------------------------------|--------------------------------|------------------------------------|
| 101 eventRecordNumber| Ereignis-Datensatznummer               | `DashboardTab`, `DocumentsTab` | `storageService`, `searchService`  |
| 102 eventTitle       | Titel der Veranstaltung                | `DocumentsTab`, `ForensicDossierTab`, `ReportsTab` | `documentAnalyst`, `templateService` |
| 108 confidentiality  | Vertraulichkeit                        | `SettingsTab`, Hinweis in Detail‑Modals | `storageService`, Policy‑Checks     |
| 111 geoTerm          | Geografischer Begriff                  | `ChronologyTab`, `GraphTab`    | `knowledgeGraphBuilder`, `searchService` |
| 112 localGeoArea     | Lokales geografisches Gebiet           | `ChronologyTab`, `StrategyTab` | `systemDynamicsService`            |
| 113 startDate        | Erstes Datum                           | `ChronologyTab`                | `temporalAnalyzer`                 |
| 114 endDate          | Endgültiges Datum                      | `ChronologyTab`                | `temporalAnalyzer`                 |
| 115 description      | Ereignisbeschreibung                   | `ForensicDossierTab`, `AnalysisTab` | `documentAnalyst`, `argumentationService` |
| 116 consequences     | Auswirkungen des Ereignisses           | `EthicsAnalysisTab`, `StrategyTab` | `ethicsService`, `strategyService` |
| 150 notes            | Bemerkungen                            | `StatusDocTab`, `AuditLogTab`  | `forensicService`                  |
| 151 violationStatus  | Status des Verstoßes                   | `KpisTab`, `ForensicDossierTab`| `radbruchLogic`, `kpiService`      |
| 152 violationIndex   | Index der Verstöße                     | `KpisTab`, Filter in `DashboardTab` | `indexingService`, `searchService` |
| 153 affectedRights   | Betroffene Rechte                      | `LegalBasisTab`, `ForensicDossierTab` | `radbruchLogic`, `legalResources`  |
| 154 huridocsIndex    | HURIDOCS-Index                         | `KnowledgeBaseTab`             | `indexingService`                  |
| 155 localIndex       | Lokaler Index                          | `KnowledgeBaseTab`, `LibraryTab` | `indexingService`                |
| 160–172 mgmt-Felder  | Verwaltungs-/Monitoringdaten           | `AuditLogTab`, `KpisTab`       | `workloadAnalyzer`, `insightService` |

### 2.3 ESF-Feld-Mapping (Personen-Ebene)
Zuordnung der 900er-Serie (Personen/Gruppen) zu den Modulen.

| Aspekt (ESF Person)           | Bedeutung                                   | Tab / UI                | Service / Logik                       |
|------------------------------|---------------------------------------------|-------------------------|---------------------------------------|
| personRecordNumber (900er)   | Personen‑Datensatznummer                    | `EntitiesTab`           | `storageService`, `searchService`     |
| fullNameOrGroupName          | Name / Gruppenname                          | `EntitiesTab`, `GraphTab` | `entityRelationshipService`, `knowledgeGraphBuilder` |
| Rollen (victim, perpetrator…) | Rolle(n) im Fall                            | `EntitiesTab`, Badge in `DocumentsTab` | `forensicService`, `radbruchLogic` |
| Basis-Biodaten (z. B. aus ESF) | optionale Identitäts-/Kontextinfos        | `EntitiesTab`, Detail‑Modal | `ethicsService` (Schutz / Pseudonymisierung) |

### 2.4 ESF-Feld-Mapping (Act & Involvement Links)
Zuordnung der Verbindungs-Formate (Act, Involvement) für die forensische Rekonstruktion.

| ESF-Link-Format            | Bedeutung                               | Tab / UI                        | Service / Logik                        |
|---------------------------|-----------------------------------------|---------------------------------|----------------------------------------|
| ActLink (Event → Opfer)   | Konkrete Tat gegen eine Person/Gruppe  | `ForensicDossierTab`, `ContradictionsTab` | `forensicService`, `contradictionDetectorService` |
| actDescription            | Tatbeschreibung                         | `ForensicDossierTab`           | `argumentationService`, `ethicsService` |
| actClassification         | Klassifikation (z. B. Folter, Willkür) | `EthicsAnalysisTab`, `KpisTab` | `radbruchLogic`, `kpiService`          |
| InvolvementLink (Event/Act → Täter) | Beteiligung eines Akteurs an Tat | `GraphTab`, `SystemAnalysisTab` | `identify_responsible_actor`, `systemDynamicsService` |

### 2.5 Tab-Spezifische Workflows
Detaillierte Implementierungsstrategie für die Kernkomponenten unter Verwendung von ESF.

#### ForensicDossierTab – Forensische Beweisführung
*   **Zweck:** Erstellung eines gerichtsfesten Dossiers aus ESF-Daten.
*   **Workflow:**
    1.  **Eingang:** Auswahl eines `ESF-Events (101)` + verbundene `Acts`/`Persons` aus IndexedDB.
    2.  **Fakten-Liste:** Zeitliche Liste aller Acts mit Quellen.
    3.  **Beweis-Matrix:** Mapping von Claims (z.B. "Willkürliche Inhaftierung") auf Belege (Act-ID, Dokument-Snippet).
    4.  **Verantwortung:** Nutzung von `identify_responsible_actor` zur Rollenzuweisung.
*   **Output:** Dossier-JSON und PDF-Export via TemplateService.

#### GenerationTab – Dokumenten-Generator
*   **Zweck:** Textgenerierung basierend auf validierten ESF-Daten (keine Halluzinationen).
*   **Workflow:**
    1.  **Kontextaufbau:** `contextUtils` zieht spezifische ESF-Felder (115 Beschreibung, 153 Rechte).
    2.  **Prompting:** Strikte Anweisung an Gemini, nur Fakten aus den ESF-Records zu nutzen.
*   **Output:** Markdown-Entwurf, speicherbar in der Library.

#### GraphTab – Visueller Beziehungs-Graph
*   **Zweck:** Visualisierung des Fallgeflechts.
*   **Workflow:**
    1.  **Nodes:** Generierung aus `esfEvents` (Rot), `esfPersons` (Blau), `caseEntities` (Grau).
    2.  **Edges:** Generierung aus `esfActLinks` (Tat -> Opfer) und `esfInvolvementLinks` (Täter -> Tat).
*   **Output:** Interaktiver Graph mit Filterung nach Zeit/Ort.

#### KnowledgeBaseTab – Fakten & Wissen
*   **Zweck:** Zentrale Faktensammlung.
*   **Workflow:**
    1.  **Listing:** Tabelle aller extrahierten Fakten, verlinkt mit `esfRecordID`.
    2.  **Suche:** Hybrid-Suche über den Facts-Index.

#### HRDSupportTab – Schutz & Sicherheit
*   **Zweck:** Risiko-Assessment für Verteidiger.
*   **Workflow:**
    1.  Nutzung von `Intervention (2601)` und `Information (2501)` Formaten zur Risikoanalyse.
    2.  Abgleich mit `hrdResources` für Schutzmaßnahmen.

---

## 3. Vollständige Ordnerstruktur & Dateiliste

Dies ist die exakte Struktur des Projekts basierend auf dem aktuellen Stand.

```text
/
├── cypress/                        # End-to-End Testing
... (rest of structure)
```

---

## 4. Getting Started
...
