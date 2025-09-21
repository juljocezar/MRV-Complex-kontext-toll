import { GeminiService } from './geminiService';
import { KPI, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class KpiService {
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string', description: "Ein kurzer, prägnanter Name für den KPI." },
                target: { type: 'string', description: "Eine klare, messbare Zielbeschreibung für den KPI." },
                progress: { type: 'number', description: "Initialer Fortschritt, immer auf 0 setzen." }
            },
            required: ['id', 'name', 'target', 'progress']
        }
    };

    static async suggestKpis(appState: AppState): Promise<KPI[]> {
        const context = buildCaseContext(appState);

        const prompt = `
Du bist ein Experte für strategisches Management in Menschenrechtsorganisationen.
Basierend auf dem folgenden Fallkontext, schlage 3-5 relevante Key Performance Indicators (KPIs) vor, um den Erfolg und Fortschritt des Falles zu messen.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  Analysiere den Kontext und identifiziere die Hauptziele des Falles.
2.  Formuliere spezifische, messbare, erreichbare, relevante und zeitgebundene (SMART) KPIs.
3.  Gib für jeden KPI einen Namen und eine klare Zielbeschreibung an.
4.  Generiere für jeden KPI eine eindeutige ID mit crypto.randomUUID().
5.  Setze den initialen Fortschritt (progress) immer auf 0.

Gib das Ergebnis als JSON-Array zurück, das dem Schema entspricht.
        `;

        try {
            const result = await GeminiService.callAIWithSchema<Omit<KPI, 'id'>[]>(prompt, this.SCHEMA, appState.settings.ai);
            return result.map(kpi => ({...kpi, id: crypto.randomUUID()}));
        } catch (error) {
            console.error('KPI suggestion failed:', error);
            throw new Error('KPI suggestion failed.');
        }
    }
}
