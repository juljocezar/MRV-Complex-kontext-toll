import { GeminiService } from './geminiService';
import { AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * @class StrategyService
 * @description A service focused on generating strategic advice, specifically risk mitigation strategies.
 */
export class StrategyService {
    /**
     * @static
     * @async
     * @function generateMitigationStrategies
     * @description Generates a set of mitigation strategies in HTML format based on the active risks in the application state.
     * @param {AppState} appState - The current state of the application, used to get context and identify selected risks.
     * @returns {Promise<string>} A promise that resolves to an HTML string containing the suggested strategies, or an error message.
     */
    static async generateMitigationStrategies(appState: AppState): Promise<string> {
        const caseContext = buildCaseContext(appState);
        const activeRisks = Object.entries(appState.risks)
            .filter(([, isActive]) => isActive)
            .map(([risk]) => risk)
            .join(', ');

        if (!activeRisks) {
            return "<p>Keine Risiken ausgewählt. Es können keine Strategien generiert werden.</p>";
        }

        const prompt = `
Du bist ein erfahrener Strategieberater für Menschenrechtsfälle mit Expertise im Risikomanagement.
Basierend auf dem Fallkontext und den identifizierten Risiken, erstelle einen umfassenden Plan mit Minderungsstrategien.

Fallkontext:
---
${caseContext}
---

Identifizierte Risiken: ${activeRisks}

Deine Aufgaben:
1.  Entwickle für jedes identifizierte Risiko konkrete, umsetzbare Minderungsstrategien.
2.  Strukturiere deine Antwort klar und übersichtlich.
3.  Formuliere die Strategien professionell und präzise.
4.  Gib die Antwort als HTML-formatierten Text zurück. Verwende <h3> für Risiko-Titel und <ul>/<li> für die Strategien.
        `;

        try {
            // Returns a string of HTML, no schema needed
            return await GeminiService.callAI(prompt, null, appState.settings.ai);
        } catch (error) {
            console.error('Mitigation strategy generation failed:', error);
            return "<p>Fehler bei der Generierung der Strategien.</p>";
        }
    }
}
