import { GeminiService } from './geminiService';
import { Insight, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * A service for generating high-level strategic insights from the case data.
 * It prompts the AI to act as a strategic analyst to identify key risks,
 * opportunities, and observations.
 */
export class InsightService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for structuring the AI's response. It ensures that
     * the generated insights are returned in a consistent format, each with an ID,
     * text, and type.
     */
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', description: "A unique ID for the insight." },
                text: { type: 'string', description: "The text of the insight." },
                type: { type: 'string', enum: ['recommendation', 'risk', 'observation'], description: "The type of insight." }
            },
            required: ['id', 'text', 'type']
        }
    };

    /**
     * Generates a list of strategic insights based on the entire case context.
     * @param {AppState} appState - The current state of the application.
     * @returns {Promise<Insight[]>} A promise that resolves to an array of generated insights.
     * @throws {Error} If the insight generation process fails.
     */
    static async generateInsights(appState: AppState): Promise<Insight[]> {
        const context = buildCaseContext(appState);

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
You are a highly intelligent strategic analyst for human rights cases.
Analyze the following case context and generate 3 to 5 concise, strategic insights.

Case Context:
---
${context}
---

Your Tasks:
1.  Identify critical risks, untapped opportunities, or important observations.
2.  Formulate each insight as a clear, actionable sentence.
3.  Classify each insight as 'recommendation', 'risk', or 'observation'.
4.  Generate a unique ID for each insight using crypto.randomUUID().

Return the result as a JSON array that conforms to the schema.
        `;
        
        try {
            // The AI is asked to generate the ID, but we map it here as a fallback.
            const result = await GeminiService.callAIWithSchema<Insight[]>(prompt, this.SCHEMA, appState.settings.ai);
            return result.map(insight => ({...insight, id: insight.id || crypto.randomUUID()}));
        } catch (error) {
            console.error('Insight generation failed:', error);
            throw new Error('Insight generation failed.');
        }
    }
}
