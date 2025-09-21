import { GeminiService } from './geminiService';
import { AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * A service for generating strategic plans, particularly for risk mitigation.
 */
export class StrategyService {
    /**
     * Generates a comprehensive mitigation strategy plan based on the case context and selected risks.
     * The response is formatted as an HTML string for direct rendering.
     * @param {AppState} appState - The current state of the application, including selected risks.
     * @returns {Promise<string>} A promise that resolves to an HTML string containing the mitigation strategies.
     * Returns a message if no risks are selected or if an error occurs.
     */
    static async generateMitigationStrategies(appState: AppState): Promise<string> {
        const caseContext = buildCaseContext(appState);
        const activeRisks = Object.entries(appState.risks)
            .filter(([, isActive]) => isActive)
            .map(([risk]) => risk)
            .join(', ');

        if (!activeRisks) {
            return "<p>No risks selected. Cannot generate strategies.</p>";
        }

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
You are an experienced strategy consultant for human rights cases with expertise in risk management.
Based on the case context and the identified risks, create a comprehensive plan with mitigation strategies.

Case Context:
---
${caseContext}
---

Identified Risks: ${activeRisks}

Your Tasks:
1.  For each identified risk, develop concrete, actionable mitigation strategies.
2.  Structure your response clearly and concisely.
3.  Formulate the strategies professionally and precisely.
4.  Return the response as HTML-formatted text. Use <h3> for risk titles and <ul>/<li> for the strategies.
        `;

        try {
            // Returns a string of HTML, no schema needed
            return await GeminiService.callAI(prompt, null, appState.settings.ai);
        } catch (error) {
            console.error('Mitigation strategy generation failed:', error);
            return "<p>Error generating strategies.</p>";
        }
    }
}
