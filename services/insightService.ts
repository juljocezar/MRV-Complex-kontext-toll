
import { GeminiService } from './geminiService';
import { Insight, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

/**
 * @class InsightService
 * @description A service for generating high-level strategic insights about the case.
 * It synthesizes the overall context, including risks and contradictions, to provide actionable advice.
 */
export class InsightService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the AI's response, ensuring it returns a structured array of insight objects.
     */
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                text: { type: 'string', description: "Der Text der Einsicht." },
                type: { type: 'string', enum: ['recommendation', 'risk', 'observation'], description: "Die Art der Einsicht." }
            },
            required: ['text', 'type']
        }
    };

    /**
     * @static
     * @async
     * @function generateInsights
     * @description Generates strategic insights by analyzing the case context, active risks, and contradictions.
     * @param {AppState} appState - The current application state.
     * @param {string} [newInfoContext] - Optional context about new information to focus the analysis.
     * @returns {Promise<Insight[]>} A promise that resolves to an array of generated insights.
     * @throws {Error} If the AI call fails.
     */
    static async generateInsights(appState: AppState, newInfoContext?: string): Promise<Insight[]> {
        const context = buildCaseContext(appState);

        const activeRisks = Object.entries(appState.risks)
            .filter(([, isActive]) => isActive)
            .map(([risk]) => risk)
            .join(', ');

        const contradictionsSummary = appState.contradictions.slice(0, 3).map(c => 
            `- Zwischen Dokument ${c.source1DocId} und ${c.source2DocId}: "${c.statement1}" vs "${c.statement2}"`
        ).join('\n');

        const prompt = `
Du bist ein hochintelligenter strategischer Analyst für Menschenrechtsfälle.
Analysiere den folgenden Fallkontext und generiere 2-3 prägnante, strategische Einblicke.
${newInfoContext ? `Konzentriere dich dabei besonders auf die Implikationen der folgenden neuen Information:\n${newInfoContext}` : ''}

Fallkontext:
---
${context}
---

Berücksichtige insbesondere die folgenden zusätzlichen strategischen Informationen:
- Aktive Risiken: ${activeRisks || 'Keine'}
- Jüngste Widersprüche: ${contradictionsSummary || 'Keine'}

Deine Aufgaben:
1.  Identifiziere kritische Risiken, ungenutzte Chancen oder wichtige Beobachtungen, die sich aus dem Gesamtkontext ergeben. Welche strategischen Implikationen ergeben sich aus den Risiken und Widersprüchen?
2.  Formuliere jeden Einblick als klaren, umsetzbaren Satz.
3.  Klassifiziere jeden Einblick als 'recommendation' (Empfehlung), 'risk' (Risiko) oder 'observation' (Beobachtung).
4.  Wenn keine signifikanten neuen Einblicke gefunden werden, gib ein leeres Array zurück.

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
