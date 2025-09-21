import { GeminiService } from './geminiService';
import { KPI, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * A service for suggesting Key Performance Indicators (KPIs) based on the case context.
 * It helps in defining measurable goals to track the progress and success of a case.
 */
export class KpiService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the AI's response, ensuring that suggested KPIs
     * are returned in a structured format with an ID, name, target, and initial progress.
     */
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', description: "A unique ID for the KPI." },
                name: { type: 'string', description: "A short, concise name for the KPI." },
                target: { type: 'string', description: "A clear, measurable target description for the KPI." },
                progress: { type: 'number', description: "Initial progress, always set to 0." }
            },
            required: ['id', 'name', 'target', 'progress']
        }
    };

    /**
     * Suggests a list of relevant KPIs based on the overall case context.
     * @param {AppState} appState - The current state of the application.
     * @returns {Promise<KPI[]>} A promise that resolves to an array of suggested KPIs.
     * @throws {Error} If the KPI suggestion process fails.
     */
    static async suggestKpis(appState: AppState): Promise<KPI[]> {
        const context = buildCaseContext(appState);

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
You are an expert in strategic management for human rights organizations.
Based on the following case context, suggest 3-5 relevant Key Performance Indicators (KPIs) to measure the success and progress of the case.

Case Context:
---
${context}
---

Your Tasks:
1.  Analyze the context and identify the main goals of the case.
2.  Formulate Specific, Measurable, Achievable, Relevant, and Time-bound (SMART) KPIs.
3.  For each KPI, provide a name and a clear target description.
4.  Generate a unique ID for each KPI using crypto.randomUUID().
5.  Always set the initial progress to 0.

Return the result as a JSON array that conforms to the schema.
        `;

        try {
            // The AI is asked to generate the ID, but we map it here as a fallback.
            const result = await GeminiService.callAIWithSchema<KPI[]>(prompt, this.SCHEMA, appState.settings.ai);
            return result.map(kpi => ({...kpi, id: kpi.id || crypto.randomUUID(), progress: 0 }));
        } catch (error) {
            console.error('KPI suggestion failed:', error);
            throw new Error('KPI suggestion failed.');
        }
    }
}
