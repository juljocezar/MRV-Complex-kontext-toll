import { GeminiService } from './geminiService';
import { AppState, CaseSummary, AISettings, SuggestedEntity, SnippetAnalysisResult, SearchResult } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class CaseAnalyzerService {
    private static readonly SUMMARY_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "Eine umfassende Zusammenfassung des gesamten Falles in 3-5 Absätzen." },
            identifiedRisks: {
                type: 'array',
                description: "Eine Liste der 3-5 wichtigsten identifizierten Risiken.",
                items: {
                    type: 'object',
                    properties: {
                        risk: { type: 'string', description: "Eine kurze Beschreibung des Risikos." },
                        description: { type: 'string', description: "Eine detailliertere Erklärung des Risikos und seiner potenziellen Auswirkungen." }
                    },
                    required: ['risk', 'description']
                }
            },
            suggestedNextSteps: {
                type: 'array',
                description: "Eine Liste von 3-5 konkreten, umsetzbaren nächsten Schritten.",
                items: {
                    type: 'object',
                    properties: {
                        step: { type: 'string', description: "Der vorgeschlagene nächste Schritt." },
                        justification: { type: 'string', description: "Eine Begründung, warum dieser Schritt wichtig ist." }
                    },
                    required: ['step', 'justification']
                }
            }
        },
        required: ['summary', 'identifiedRisks', 'suggestedNextSteps']
    };

    private static readonly ENTITY_SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                description: { type: 'string' }
            },
            required: ['name', 'type', 'description']
        }
    };
    
    private static readonly SNIPPET_SCHEMA = {
        type: 'object',
        properties: {
            suggestedTitle: { type: 'string', description: "Ein prägnanter, aussagekräftiger Titel für den Textschnipsel." },
            suggestedTags: { type: 'array', items: { type: 'string' }, description: "Eine Liste von 2-4 relevanten Tags." },
            suggestedEntities: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                        description: { type: 'string', description: "Eine kurze Beschreibung der Entität basierend auf dem Schnipsel." }
                    },
                    required: ['name', 'type', 'description']
                },
                 description: "Eine Liste neu identifizierter Entitäten aus dem Schnipsel."
            }
        },
        required: ['suggestedTitle', 'suggestedTags', 'suggestedEntities']
    };

    static async performOverallAnalysis(appState: AppState): Promise<CaseSummary> {
        const context = buildCaseContext(appState);
        const prompt = `
            Du bist ein leitender strategischer Analyst für Menschenrechtsfälle.
            Führe eine umfassende Gesamtanalyse des folgenden Falles durch.

            Fallkontext:
            ---
            ${context}
            ---

            Deine Aufgaben:
            1. Erstelle eine detaillierte Zusammenfassung des gesamten Falles.
            2. Identifiziere die wichtigsten Risiken für den Mandanten und den Fall.
            3. Schlage die dringendsten und strategisch sinnvollsten nächsten Schritte vor.

            Gib das Ergebnis im geforderten JSON-Format zurück.
        `;

        const result = await GeminiService.callAIWithSchema<Omit<CaseSummary, 'generatedAt'>>(prompt, this.SUMMARY_SCHEMA, appState.settings.ai);
        return { ...result, generatedAt: new Date().toISOString() };
    }

    static async extractEntitiesFromText(text: string, sourceName: string, settings: AISettings): Promise<Omit<SuggestedEntity, 'id' | 'sourceDocumentId' | 'sourceDocumentName'>[]> {
        const prompt = `
            Du bist ein Experte für die Extraktion von Entitäten (Named Entity Recognition).
            Analysiere den folgenden Text und extrahiere alle relevanten Entitäten (Personen, Organisationen, Standorte).
            
            Text:
            ---
            ${text.substring(0, 20000)}
            ---

            Gib das Ergebnis als JSON-Array zurück.
        `;

        try {
            return await GeminiService.callAIWithSchema<Omit<SuggestedEntity, 'id' | 'sourceDocumentId' | 'sourceDocumentName'>[]>(prompt, this.ENTITY_SCHEMA, settings);
        } catch (error) {
            console.error(`Entity extraction from ${sourceName} failed:`, error);
            return []; // Return empty array on failure
        }
    }

    static async analyzeTextSnippet(text: string, settings: AISettings): Promise<SnippetAnalysisResult> {
        const prompt = `
            Du bist ein intelligenter Assistent für Wissensmanagement.
            Analysiere den folgenden Textschnipsel, der von einem Benutzer erfasst wurde.

            Text:
            ---
            ${text}
            ---

            Deine Aufgaben:
            1.  **suggestedTitle:** Formuliere einen kurzen, prägnanten Titel, der den Inhalt des Schnipsels zusammenfasst.
            2.  **suggestedTags:** Schlage 2-4 relevante Tags vor, um diesen Schnipsel zu kategorisieren.
            3.  **suggestedEntities:** Extrahiere alle wichtigen Entitäten (Personen, Organisationen, Standorte) aus dem Text.

            Gib das Ergebnis im geforderten JSON-Format zurück.
        `;
        return await GeminiService.callAIWithSchema<SnippetAnalysisResult>(prompt, this.SNIPPET_SCHEMA, settings);
    }
    
    static async runFreeformQueryStream(
        prompt: string,
        appState: AppState,
        isGrounded: boolean,
        searchFunction: (query: string) => SearchResult[],
        onChunk: (chunk: string) => void
    ): Promise<string> {
        
        let context = buildCaseContext(appState);
        
        // Use internal search to find relevant context
        const searchResults = searchFunction(prompt);
        if (searchResults.length > 0) {
            const searchContext = searchResults.slice(0, 5).map(r => 
                `--- RELEVANTER AUSZUG (${r.type}: ${r.title}) ---\n${r.preview}\n--- ENDE ---`
            ).join('\n\n');
            context = `**TOP-SUCHERGEBNISSE FÜR DIE ANFRAGE:**\n${searchContext}\n\n**ALLGEMEINER FALLKONTEXT:**\n${context}`;
        }

        const finalPrompt = `
            Du bist ein hochintelligenter Analyse-Assistent. Beantworte die folgende Frage des Benutzers präzise und umfassend.
            Nutze den bereitgestellten Kontext, um deine Antwort zu formulieren.
            ${isGrounded ? 'Stütze deine Antwort primär auf die im Kontext enthaltenen Rechtsgrundlagen und zitiere diese, wo passend.' : ''}

            **Kontext:**
            ---
            ${context}
            ---

            **Frage des Benutzers:**
            ${prompt}

            **Deine Antwort (in Markdown formatiert):**
        `;

        return GeminiService.generateContentStream(finalPrompt, appState.settings.ai, onChunk);
    }
}
