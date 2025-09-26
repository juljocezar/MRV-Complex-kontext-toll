import { GeminiService } from './geminiService';
import { ArgumentationAnalysis, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * @class ArgumentationService
 * @description A service dedicated to generating strategic legal arguments for a case.
 * It analyzes the overall case context to identify supporting arguments and anticipate counter-arguments.
 */
export class ArgumentationService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema definition for the expected output from the AI model.
     * This ensures the AI returns a structured object containing lists of supporting and counter-arguments.
     */
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            supportingArguments: {
                type: 'array',
                description: "Eine Liste von Argumenten, die den Fall stützen.",
                items: {
                    type: 'object',
                    properties: {
                        point: { type: 'string', description: "Der Kern des Arguments." },
                        evidence: {
                            type: 'array',
                            description: "Eine Liste von Fakten oder Beweisen aus dem Kontext, die dieses Argument stützen.",
                            items: { type: 'string' }
                        }
                    },
                    required: ['point', 'evidence']
                }
            },
            counterArguments: {
                type: 'array',
                description: "Eine Liste von möglichen Gegenargumenten, die die Gegenseite vorbringen könnte.",
                items: {
                    type: 'object',
                    properties: {
                        point: { type: 'string', description: "Der Kern des Gegenarguments." },
                        evidence: {
                            type: 'array',
                            description: "Mögliche Fakten oder Interpretationen, die dieses Gegenargument stützen könnten.",
                            items: { type: 'string' }
                        }
                    },
                    required: ['point', 'evidence']
                }
            }
        },
        required: ['supportingArguments', 'counterArguments']
    };

    /**
     * @static
     * @async
     * @function generateArguments
     * @description Generates a structured analysis of supporting and counter-arguments based on the entire case context.
     * @param {AppState} appState - The current state of the application, used to build the case context.
     * @returns {Promise<ArgumentationAnalysis>} A promise that resolves to the structured argumentation analysis.
     * @throws {Error} If the AI call fails or returns an invalid format.
     */
    static async generateArguments(appState: AppState): Promise<ArgumentationAnalysis> {
        const context = buildCaseContext(appState);
        const prompt = `
Du bist ein brillanter Stratege für Menschenrechtsfälle mit jahrzehntelanger Erfahrung vor internationalen Tribunalen.
Basierend auf dem folgenden, umfassenden Fallkontext, entwickle eine robuste Argumentationsstrategie.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  **Argumentationsstränge entwickeln:** Identifiziere die stärksten Argumentationslinien für den Fall. Formuliere jeden Punkt klar und überzeugend. Liste für jeden Punkt die wichtigsten Beweise oder Fakten aus dem Kontext auf.
2.  **Gegenargumente antizipieren:** Denke wie die Gegenseite. Identifiziere die wahrscheinlichsten Gegenargumente oder Schwachstellen im Fall. Formuliere diese ebenfalls klar und liste die Fakten auf, auf die sich die Gegenseite stützen könnte.

Gib das Ergebnis im geforderten JSON-Format zurück.
        `;

        try {
            return await GeminiService.callAIWithSchema<ArgumentationAnalysis>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Argumentation analysis failed:', error);
            throw new Error('Argumentation analysis failed.');
        }
    }
}
