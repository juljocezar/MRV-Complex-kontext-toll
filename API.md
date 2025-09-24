# API-Dokumentation (AI Service Layer)

Dieses Dokument beschreibt die "API" der Service-Schicht, die als Schnittstelle zwischen dem Frontend der Anwendung und dem Google Gemini KI-Modell fungiert. Jeder hier dokumentierte Service kapselt eine bestimmte KI-gesteuerte Fähigkeit.

Die Dokumentation für jeden Service umfasst:
*   **Zweck:** Was die Hauptaufgabe des Services ist.
*   **Methode(n):** Die öffentlichen Funktionen, die aufgerufen werden können.
*   **Eingabe:** Die für die Analyse verwendeten Daten aus dem `AppState`.
*   **Ausgabe-Schema:** Das JSON-Schema, das die KI für eine strukturierte Antwort verwenden muss.

---

## 1. CaseAnalyzerService

*   **Zweck:** Führt eine übergeordnete Analyse des gesamten Falles durch, um eine Zusammenfassung, die wichtigsten Risiken und die nächsten Schritte zu generieren.
*   **Methode:** `performOverallAnalysis(appState: AppState): Promise<CaseSummary>`
*   **Eingabe:** Der vollständige `appState`, aus dem ein Fallkontext (`caseContext`) generiert wird. Dieser Kontext umfasst die Fallbeschreibung, Dokumenteninhalte, Entitäten, Zeitachsen etc.
*   **Ausgabe-Schema:**

```json
{
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "Eine prägnante Zusammenfassung des gesamten Falles in 2-3 Sätzen."
        },
        "identifiedRisks": {
            "type": "array",
            "description": "Eine Liste der 3-5 dringendsten Risiken für den Mandanten oder den Fall.",
            "items": {
                "type": "object",
                "properties": {
                    "risk": { "type": "string", "description": "Kurze Beschreibung des Risikos." },
                    "description": { "type": "string", "description": "Detailliertere Erläuterung des Risikos." }
                },
                "required": ["risk", "description"]
            }
        },
        "suggestedNextSteps": {
            "type": "array",
            "description": "Eine Liste der 3-5 wichtigsten nächsten Schritte zur Fallbearbeitung.",
            "items": {
                "type": "object",
                "properties": {
                    "step": { "type": "string", "description": "Kurze Beschreibung des Schrittes." },
                    "justification": { "type": "string", "description": "Begründung, warum dieser Schritt wichtig ist." }
                },
                "required": ["step", "justification"]
            }
        },
        "generatedAt": {
            "type": "string",
            "description": "Aktuelles Datum im ISO 8601 Format."
        }
    },
    "required": ["summary", "identifiedRisks", "suggestedNextSteps", "generatedAt"]
}
```

---

## 2. ContradictionDetectorService

*   **Zweck:** Identifiziert sachliche und logische Widersprüche zwischen verschiedenen Dokumenten im Fall.
*   **Methode:** `findContradictions(appState: AppState): Promise<Contradiction[]>`
*   **Eingabe:** Der `appState`, aus dem alle als `classified` markierten Dokumente extrahiert und zu einem Kontext zusammengefügt werden.
*   **Ausgabe-Schema:**

```json
{
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "id": { "type": "string", "description": "Eine einzigartige UUID für den Widerspruch." },
            "source1DocId": { "type": "string", "description": "Die ID des ersten Dokuments." },
            "statement1": { "type": "string", "description": "Die widersprüchliche Aussage aus dem ersten Dokument." },
            "source2DocId": { "type": "string", "description": "Die ID des zweiten Dokuments." },
            "statement2": { "type": "string", "description": "Die widersprüchliche Aussage aus dem zweiten Dokument." },
            "explanation": { "type": "string", "description": "Eine kurze Erklärung, warum diese Aussagen widersprüchlich sind." }
        },
        "required": ["id", "source1DocId", "statement1", "source2DocId", "statement2", "explanation"]
    }
}
```
