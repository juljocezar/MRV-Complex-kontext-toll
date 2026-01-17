
import { GeminiService } from './geminiService';
import { CaseSummary, AppState, SearchResult } from '../types';
import { buildCaseContext } from '../utils/contextUtils';
import { legalResources } from '../legalResources';
import { VectorSearchService } from './vectorSearchService';

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
            return await GeminiService.callAIWithSchema<CaseSummary>(prompt, this.SCHEMA, appState.settings.ai, 'gemini-3-pro-preview');
        } catch (error) {
            console.error('Overall case analysis failed:', error);
            throw new Error('Case analysis failed.');
        }
    }
    
    static async runFreeformQuery(prompt: string, appState: AppState, isGrounded: boolean): Promise<string> {
        // --- RAG IMPLEMENTATION START ---
        // Try to construct a relevant context using embeddings first.
        let ragContext = "";
        let usedRAG = false;

        const hasEmbeddings = appState.documents.some(d => d.embedding) || appState.caseEntities.some(e => e.embedding);

        if (hasEmbeddings) {
            try {
                const queryEmbedding = await GeminiService.getEmbedding(prompt, 'RETRIEVAL_QUERY');
                if (queryEmbedding) {
                    const docMatches = VectorSearchService.search(queryEmbedding, appState.documents, 'Document');
                    const entityMatches = VectorSearchService.search(queryEmbedding, appState.caseEntities, 'Entity');
                    const knowledgeMatches = VectorSearchService.search(queryEmbedding, appState.knowledgeItems, 'Knowledge');

                    // Combine and take top 10 most relevant results across all types
                    const allMatches = [...docMatches, ...entityMatches, ...knowledgeMatches]
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 10);

                    if (allMatches.length > 0 && allMatches[0].score > 0.6) { // Only use RAG if relevance is decent
                        ragContext = "**RELEVANTER KONTEXT (RAG):**\n" + allMatches.map(m => 
                            `[${m.type}] ${m.title} (Relevanz: ${(m.score * 100).toFixed(0)}%):\n${m.preview}`
                        ).join('\n---\n');
                        usedRAG = true;
                    }
                }
            } catch (e) {
                console.warn("RAG retrieval failed, falling back to standard context", e);
            }
        }

        // If RAG yielded no strong results or failed, use the standard summary context
        if (!usedRAG) {
            ragContext = buildCaseContext(appState);
        }
        // --- RAG IMPLEMENTATION END ---

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

${usedRAG ? `HINWEIS: Der folgende Kontext wurde basierend auf semantischer Ähnlichkeit zur Frage ausgewählt (RAG).` : ''}

Kontext:
---
${ragContext}
---

Benutzeranfrage: "${prompt}"

Deine Analyse:
        `;

        try {
            let result = await GeminiService.callAI(fullPrompt, null, appState.settings.ai, 'gemini-3-pro-preview');
            if (usedRAG) {
                result += "\n\n*(Antwort generiert mittels semantischer Suche/RAG)*";
            }
            return result;
        } catch (error) {
            console.error('Freeform query failed:', error);
            throw new Error('Die Analyse-Anfrage ist fehlgeschlagen.');
        }
    }
}
