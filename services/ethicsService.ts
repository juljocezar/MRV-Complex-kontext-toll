import { GeminiService } from './geminiService';
import { EthicsAnalysis, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * @class EthicsService
 * @description A service dedicated to performing an ethical analysis of the case.
 * It assesses potential biases, privacy concerns, and provides actionable recommendations.
 */
export class EthicsService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the AI's response, ensuring a structured output
     * covering bias assessment, privacy concerns, and recommendations.
     */
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            biasAssessment: { type: 'string', description: "Eine Einschätzung potenzieller Voreingenommenheit (Bias) in den vorliegenden Daten oder der Fallbeschreibung." },
            privacyConcerns: {
                type: 'array',
                description: "Eine Liste spezifischer Datenschutzbedenken bezüglich der gesammelten Informationen.",
                items: { type: 'string' }
            },
            recommendations: {
                type: 'array',
                description: "Konkrete Empfehlungen zur Minderung ethischer Risiken und zur Einhaltung von 'Do-No-Harm'-Prinzipien.",
                items: { type: 'string' }
            }
        },
        required: ['biasAssessment', 'privacyConcerns', 'recommendations']
    };

    /**
     * @static
     * @async
     * @function performAnalysis
     * @description Performs a comprehensive ethical analysis on the entire case context.
     * @param {AppState} appState - The current application state.
     * @returns {Promise<EthicsAnalysis>} A promise that resolves to the structured ethics analysis.
     * @throws {Error} If the AI call fails.
     */
    static async performAnalysis(appState: AppState): Promise<EthicsAnalysis> {
        const context = buildCaseContext(appState);

        const prompt = `
Du bist ein Ethik-Berater mit Spezialisierung auf Menschenrechtsarbeit und Datensicherheit.
Analysiere den folgenden Fallkontext auf ethische Bedenken.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  **Bias Assessment:** Bewerte die vorliegenden Informationen auf mögliche Voreingenommenheit (z.B. in der Sprache, Auswahl der Fakten).
2.  **Privacy Concerns:** Identifiziere potenzielle Datenschutzrisiken für die beteiligten Personen.
3.  **Recommendations:** Gib klare Handlungsempfehlungen, um die ethische Integrität zu wahren und "Do-No-Harm"-Prinzipien zu folgen.

Gib das Ergebnis im geforderten JSON-Format zurück.
        `;

        try {
            return await GeminiService.callAIWithSchema<EthicsAnalysis>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Ethics analysis failed:', error);
            throw new Error('Ethics analysis failed.');
        }
    }
}
