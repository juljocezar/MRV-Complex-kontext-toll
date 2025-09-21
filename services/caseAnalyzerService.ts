import { GeminiService } from './geminiService';
import { CaseSummary, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

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
}
