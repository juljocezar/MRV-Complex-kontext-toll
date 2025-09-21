import { GeminiService } from './geminiService';
import { EthicsAnalysis, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * Provides services for conducting ethical analysis of the case data.
 * This includes assessing for bias, identifying privacy concerns, and providing recommendations.
 */
export class EthicsService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for structuring the AI's response for the ethics analysis.
     * It ensures the output contains a bias assessment, a list of privacy concerns,
     * and actionable recommendations.
     */
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            biasAssessment: { type: 'string', description: "An assessment of potential bias in the provided data or case description." },
            privacyConcerns: {
                type: 'array',
                description: "A list of specific privacy concerns regarding the collected information.",
                items: { type: 'string' }
            },
            recommendations: {
                type: 'array',
                description: "Concrete recommendations to mitigate ethical risks and adhere to 'Do-No-Harm' principles.",
                items: { type: 'string' }
            }
        },
        required: ['biasAssessment', 'privacyConcerns', 'recommendations']
    };

    /**
     * Performs an ethical analysis on the entire case context provided by the application state.
     * @param {AppState} appState - The current state of the application.
     * @returns {Promise<EthicsAnalysis>} A promise that resolves to a structured ethics analysis report.
     * @throws {Error} Throws an error if the analysis fails.
     */
    static async performAnalysis(appState: AppState): Promise<EthicsAnalysis> {
        const context = buildCaseContext(appState);

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
You are an ethics advisor specializing in human rights work and data security.
Analyze the following case context for ethical concerns.

Case Context:
---
${context}
---

Your Tasks:
1.  **Bias Assessment:** Evaluate the available information for potential bias (e.g., in language, selection of facts).
2.  **Privacy Concerns:** Identify potential privacy risks for the individuals involved.
3.  **Recommendations:** Provide clear recommendations to maintain ethical integrity and follow "Do-No-Harm" principles.

Return the result in the required JSON format.
        `;

        try {
            return await GeminiService.callAIWithSchema<EthicsAnalysis>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Ethics analysis failed:', error);
            throw new Error('Ethics analysis failed.');
        }
    }
}
