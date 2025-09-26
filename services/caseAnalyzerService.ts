
import { GeminiService } from './geminiService';
import { CaseSummary, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';
import { legalResources } from '../legalResources';

/**
 * @class CaseAnalyzerService
 * @description Provides high-level analysis of the entire case.
 * This includes generating overall case summaries and running freeform queries against the case context.
 */
export class CaseAnalyzerService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the AI's response when generating a case summary.
     * This ensures a structured output containing a summary, identified risks, and suggested next steps.
     */
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

    /**
     * @static
     * @async
     * @function performOverallAnalysis
     * @description Generates a high-level summary of the case, including risks and next steps.
     * @param {AppState} appState - The current state of the application.
     * @returns {Promise<CaseSummary>} A promise that resolves to the structured case summary.
     * @throws {Error} If the AI call fails.
     */
    static async performOverallAnalysis(appState: AppState): Promise<CaseSummary> {
        const context = buildCaseContext(appState);
        const prompt = `
Du bist ein erfahrener Menschenrechtsanwalt und Fallanalyst.
Basierend auf dem folgenden Fallkontext, führe eine übergeordnete Analyse durch.

Fallkontext:
---
${context.substring(0, 15000)}
---

Deine Aufgaben:
1.  **Zusammenfassung:** Fasse den Kern des Falles prägnant zusammen.
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
    
    /**
     * @static
     * @async
     * @function runFreeformQuery
     * @description Executes a freeform natural language query against the case context.
     * @param {string} prompt - The user's query or question.
     * @param {AppState} appState - The current state of the application.
     * @param {boolean} isGrounded - If true, the AI is instructed to base its answer primarily on the provided legal resources.
     * @returns {Promise<string>} A promise that resolves to the AI's textual response.
     * @throws {Error} If the AI call fails.
     */
    static async runFreeformQuery(prompt: string, appState: AppState, isGrounded: boolean): Promise<string> {
        const context = buildCaseContext(appState);
        
        const legalGroundingContext = isGrounded 
            ? `
HINWEIS: Stütze deine Antwort PRIMÄR auf die folgenden rechtlichen Ressourcen und zitiere sie, wo immer möglich.
--- RECHTSGRUNDLAGEN START ---
${JSON.stringify(legalResources, null, 2)}
--- RECHTSGRUNDLAGEN ENDE ---
`
            : '';

        const fullPrompt = `
Du bist ein hochintelligenter KI-Analyse-Assistent für Menschenrechtsfälle.
Du antwortest präzise, faktenbasiert und strukturiert in Markdown.

${legalGroundingContext}

Gesamter Fallkontext:
---
${context}
---

Benutzeranfrage: "${prompt}"

Deine Analyse:
        `;

        try {
            return await GeminiService.callAI(fullPrompt, null, appState.settings.ai);
        } catch (error) {
            console.error('Freeform query failed:', error);
            throw new Error('Die Analyse-Anfrage ist fehlgeschlagen.');
        }
    }
}
