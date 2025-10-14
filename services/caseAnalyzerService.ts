import { GeminiService } from './geminiService';
import { CaseSummary, AppState, SuggestedEntity, SearchResult, SnippetAnalysisResult } from '../types';
import { buildCaseContext } from '../utils/contextUtils';
import { legalResources } from '../legalResources';

export class CaseAnalyzerService {
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "Eine prägnante Zusammenfassung des gesamten Falles in 2-3 Sätzen." },
            identifiedRisks: {
                type: 'array',
                description: "Eine Liste der 3-5 dringendsten Risiken für den Mandanten oder den Fall.",
                items: {
                    type: 'object',
                    properties: {
                        risk: { type: 'string', description: "Kurze Beschreibung des Risikos." },
                        description: { type: 'string', description: "Detailliertere Erläuterung des Risikos." }
                    },
                    required: ['risk', 'description']
                }
            },
            suggestedNextSteps: {
                type: 'array',
                description: "Eine Liste der 3-5 wichtigsten nächsten Schritte zur Fallbearbeitung.",
                items: {
                    type: 'object',
                    properties: {
                        step: { type: 'string', description: "Kurze Beschreibung des Schrittes." },
                        justification: { type: 'string', description: "Begründung, warum dieser Schritt wichtig ist." }
                    },
                    required: ['step', 'justification']
                }
            },
            generatedAt: { type: 'string', description: "Aktuelles Datum im ISO 8601 Format." }
        },
        required: ['summary', 'identifiedRisks', 'suggestedNextSteps', 'generatedAt']
    };

    static async performOverallAnalysis(appState: AppState): Promise<CaseSummary> {
        const context = buildCaseContext(appState);
        const prompt = `
Du bist ein erfahrener Menschenrechtsanwalt und Fallanalyst, der den Kläger unterstützt. Nimm die Perspektive des Klägers als gegeben an.
Basierend auf dem folgenden Fallkontext, führe eine übergeordnete Analyse durch, die dem Kläger hilft, seinen Fall zu stärken.

Fallkontext:
---
${context.substring(0, 15000)}
---

Deine Aufgaben:
1.  **Zusammenfassung:** Fasse den Kern des Falles prägnant zusammen. Gehe über die reine Wiederholung von Fakten hinaus und identifiziere die zentralen strategischen Konfliktlinien.
2.  **Risikoidentifikation:** Identifiziere die dringendsten Risiken für den Mandanten und den Fall.
3.  **Nächste Schritte:** Schlage die wichtigsten nächsten Schritte vor, um den Fall voranzutreiben.

Gib das Ergebnis im geforderten JSON-Format zurück. Setze das 'generatedAt' Feld auf die aktuelle ISO 8601 Zeit.
        `;

        try {
            return await GeminiService.callAIWithSchema<CaseSummary>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Overall case analysis failed:', error);
            throw new Error('Case analysis failed.');
        }
    }
    
    private static _getDynamicContextForQuery(prompt: string, appState: AppState, searchFunction: (query: string) => SearchResult[]): string {
        const searchResults = searchFunction(prompt);
        if (searchResults.length === 0) {
            return buildCaseContext(appState); // Fallback to general context
        }

        let dynamicContext = "Die KI hat die folgenden Informationen als hochrelevant für die Anfrage identifiziert:\n\n";

        searchResults.forEach(result => {
            if (result.type === 'Document') {
                const doc = appState.documents.find(d => d.id === result.id);
                if (doc) {
                    dynamicContext += `**Aus Dokument "${doc.name}":**\n${doc.summary || (doc.textContent || '').substring(0, 500)}...\n\n`;
                }
            } else if (result.type === 'Knowledge') {
                const item = appState.knowledgeItems.find(k => k.id === result.id);
                if (item) {
                     dynamicContext += `**Aus Wissensbasis "${item.title}":**\n${item.summary}\n\n`;
                }
            } else if (result.type === 'Entity') {
                 const entity = appState.caseEntities.find(e => e.id === result.id);
                if (entity) {
                     dynamicContext += `**Über Entität "${entity.name}":**\nTyp: ${entity.type}, Beschreibung: ${entity.description}\n\n`;
                }
            }
        });
        
        dynamicContext += "\n**Allgemeiner Fallkontext (Auszug):**\n" + appState.caseContext.caseDescription.substring(0, 1000) + "...\n";

        return dynamicContext;
    }

    static async runFreeformQueryStream(
        prompt: string,
        appState: AppState,
        isGrounded: boolean,
        searchFunction: (query: string) => SearchResult[],
        onChunk: (chunk: string) => void
    ): Promise<string> {
        
        const dynamicContext = this._getDynamicContextForQuery(prompt, appState, searchFunction);

        const legalGroundingContext = isGrounded
            ? `
HINWEIS: Stütze deine Antwort PRIMÄR auf die folgenden rechtlichen Ressourcen und zitiere sie, wo immer möglich.
--- RECHTSGRUNDLAGEN START ---
${JSON.stringify(legalResources, null, 2)}
--- RECHTSGRUNDLAGEN ENDE ---
`
            : '';

        const fullPrompt = `
Du bist ein hochintelligenter KI-Analyse-Assistent, der einen Kläger in einem Menschenrechtsfall unterstützt. Deine Aufgabe ist es, Analysen zu liefern, die seine Position stärken. Antworte präzise, faktenbasiert und strukturiert in Markdown.

${legalGroundingContext}

Kontext (speziell für diese Anfrage zusammengestellt):
---
${dynamicContext}
---

Benutzeranfrage: "${prompt}"

Deine Analyse (beziehe dich primär auf den oben bereitgestellten, spezifischen Kontext):
        `;

        try {
            return await GeminiService.generateContentStream(fullPrompt, appState.settings.ai, onChunk);
        } catch (error) {
            console.error('Freeform query failed:', error);
            throw new Error('Die Analyse-Anfrage ist fehlgeschlagen.');
        }
    }

    static async extractEntitiesFromText(
        text: string, 
        sourceDocName: string, 
        settings: AppState['settings']['ai']
    ): Promise<Omit<SuggestedEntity, 'id' | 'sourceDocumentId'>[]> {
        const SCHEMA = {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                    description: { type: 'string' },
                    sourceDocumentName: { type: 'string' }
                },
                required: ['name', 'type', 'description', 'sourceDocumentName']
            }
        };

        const prompt = `
            Analysiere den folgenden Text und extrahiere alle relevanten Entitäten (Personen, Organisationen, Standorte).
            Gib für jede Entität eine kurze, kontextbezogene Beschreibung. Setze das Feld 'sourceDocumentName' auf "${sourceDocName}".

            Text:
            ---
            ${text.substring(0, 20000)}
            ---

            Gib das Ergebnis als JSON-Array zurück. Wenn keine Entitäten gefunden werden, gib ein leeres Array zurück.
        `;

        try {
            const results = await GeminiService.callAIWithSchema<Omit<SuggestedEntity, 'id' | 'sourceDocumentId'>[]>(
                prompt,
                SCHEMA,
                settings
            );
            return results;
        } catch (error) {
            console.error("Entity extraction from text failed:", error);
            return []; // Return empty on failure
        }
    }

    static async analyzeTextSnippet(
        snippet: string,
        settings: AppState['settings']['ai']
    ): Promise<SnippetAnalysisResult> {
        const SCHEMA = {
            type: 'object',
            properties: {
                suggestedTitle: { type: 'string', description: "Ein prägnanter, kurzer Titel für diesen Textschnipsel, der seinen Inhalt zusammenfasst." },
                suggestedTags: { type: 'array', items: { type: 'string' }, description: "Eine Liste von 1-3 relevanten Schlagwörtern." },
                suggestedEntities: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                            description: { type: 'string', description: "Eine kurze, kontextbezogene Beschreibung der Entität." }
                        },
                        required: ['name', 'type', 'description']
                    }
                }
            },
            required: ['suggestedTitle', 'suggestedTags', 'suggestedEntities']
        };
    
        const prompt = `
            Du bist ein Experte für die schnelle Analyse von unstrukturierten Texten im juristischen Kontext.
            Analysiere den folgenden Textschnipsel und extrahiere die wichtigsten Informationen.
    
            Textschnipsel:
            ---
            ${snippet.substring(0, 20000)}
            ---
    
            Deine Aufgaben:
            1.  **Titel vorschlagen:** Formuliere einen kurzen, aussagekräftigen Titel für den Schnipsel.
            2.  **Tags vorschlagen:** Schlage 1-3 passende Schlagwörter vor.
            3.  **Entitäten extrahieren:** Identifiziere alle Personen, Organisationen und Standorte, die im Text erwähnt werden, und gib eine kurze Beschreibung.
    
            Gib das Ergebnis im geforderten JSON-Format zurück.
        `;
    
        try {
            const result = await GeminiService.callAIWithSchema<SnippetAnalysisResult>(
                prompt,
                SCHEMA,
                settings
            );
            return result;
        } catch (error) {
            console.error("Text snippet analysis failed:", error);
            throw new Error('Snippet analysis failed.');
        }
    }
}