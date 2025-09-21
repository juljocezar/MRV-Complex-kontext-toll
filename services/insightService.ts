import { GeminiService } from './geminiService';
import { Insight, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class InsightService {
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                text: { type: 'string', description: "Der Text der Einsicht." },
                type: { type: 'string', enum: ['recommendation', 'risk', 'observation'], description: "Die Art der Einsicht." }
            },
            required: ['id', 'text', 'type']
        }
    };

    static async generateInsights(appState: AppState): Promise<Insight[]> {
        const context = buildCaseContext(appState);

        const prompt = `
Du bist ein hochintelligenter strategischer Analyst für Menschenrechtsfälle.
Analysiere den folgenden Fallkontext und generiere 3 bis 5 prägnante, strategische Einblicke.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  Identifiziere kritische Risiken, ungenutzte Chancen oder wichtige Beobachtungen.
2.  Formuliere jeden Einblick als klaren, umsetzbaren Satz.
3.  Klassifiziere jeden Einblick als 'recommendation' (Empfehlung), 'risk' (Risiko) oder 'observation' (Beobachtung).
4.  Generiere für jeden Einblick eine eindeutige ID mit crypto.randomUUID().

Gib das Ergebnis als JSON-Array zurück, das dem Schema entspricht.
        `;
        
        try {
            const result = await GeminiService.callAIWithSchema<Omit<Insight, 'id'>[]>(prompt, this.SCHEMA, appState.settings.ai);
             return result.map(insight => ({...insight, id: crypto.randomUUID()}));
        } catch (error) {
            console.error('Insight generation failed:', error);
            throw new Error('Insight generation failed.');
        }
    }
}
