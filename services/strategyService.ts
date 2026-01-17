
import { GeminiService } from './geminiService';
import { AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class StrategyService {
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
            return await GeminiService.callAI(prompt, null, appState.settings.ai, 'gemini-3-pro-preview');
        } catch (error) {
            console.error('Mitigation strategy generation failed:', error);
            return "<p>Fehler bei der Generierung der Strategien.</p>";
        }
    }
}
