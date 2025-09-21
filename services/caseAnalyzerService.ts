import { GeminiService } from './geminiService';
import { CaseSummary, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * Provides services for conducting high-level analysis of the entire case.
 * It synthesizes the overall application state to generate summaries, identify risks,
 * and suggest next steps.
 */
export class CaseAnalyzerService {
    /**
     * @private
     * @static
     * @readonly
     * @type {object}
     * @description The JSON schema used to structure the AI's response for the overall case analysis.
     * This ensures the AI returns data in a predictable format, including a summary,
     * identified risks, and suggested next steps.
     */
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "A concise summary of the entire case in 2-3 sentences." },
            identifiedRisks: {
                type: 'array',
                description: "A list of the 3-5 most urgent risks for the client or the case.",
                items: {
                    type: 'object',
                    properties: {
                        risk: { type: 'string', description: "Brief description of the risk." },
                        description: { type: 'string', description: "More detailed explanation of the risk." }
                    },
                    required: ['risk', 'description']
                }
            },
            suggestedNextSteps: {
                type: 'array',
                description: "A list of the 3-5 most important next steps for case processing.",
                items: {
                    type: 'object',
                    properties: {
                        step: { type: 'string', description: "Brief description of the step." },
                        justification: { type: 'string', description: "Justification for why this step is important." }
                    },
                    required: ['step', 'justification']
                }
            },
            generatedAt: { type: 'string', description: "Current date in ISO 8601 format." }
        },
        required: ['summary', 'identifiedRisks', 'suggestedNextSteps', 'generatedAt']
    };

    /**
     * Performs a comprehensive analysis of the entire case based on the current application state.
     * It constructs a context from the app state, sends it to the AI with a specific prompt,
     * and expects a structured response conforming to the service's schema.
     * @param {AppState} appState - The complete current state of the application.
     * @returns {Promise<CaseSummary>} A promise that resolves to a structured case summary,
     * including risks and next steps.
     * @throws {Error} Throws an error if the analysis fails.
     */
    static async performOverallAnalysis(appState: AppState): Promise<CaseSummary> {
        const context = buildCaseContext(appState);
        const prompt = `
You are an experienced human rights lawyer and case analyst.
Based on the following case context, perform a high-level analysis.

Case Context:
---
${context.substring(0, 15000)}
---

Your tasks:
1.  **Summary:** Concisely summarize the core of the case.
2.  **Risk Identification:** Identify the most urgent risks for the client and the case.
3.  **Next Steps:** Propose the most important next steps to advance the case.

Return the result in the required JSON format. Set the 'generatedAt' field to the current ISO 8601 time.
        `;

        try {
            // Note: The prompt is in German, which might be intentional.
            // The schema descriptions have been translated to English for clarity in the source code.
            return await GeminiService.callAIWithSchema<CaseSummary>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Overall case analysis failed:', error);
            throw new Error('Case analysis failed.');
        }
    }
}
