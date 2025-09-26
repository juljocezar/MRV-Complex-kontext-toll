import { GeminiService } from './geminiService';
import { ArgumentationAnalysis, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class ArgumentationService {
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            supportingArguments: {
                type: 'array',
                description: "Eine Liste von Argumenten, die den Fall stützen.",
                items: {
                    type: 'object',
                    properties: {
                        point: { type: 'string', description: "Der Kern des Arguments." },
                        evidence: {
                            type: 'array',
                            description: "Eine Liste von Fakten oder Beweisen aus dem Kontext, die dieses Argument stützen.",
                            items: { type: 'string' }
                        }
                    },
                    required: ['point', 'evidence']
                }
            },
            counterArguments: {
                type: 'array',
                description: "Eine Liste von möglichen Gegenargumenten, die die Gegenseite vorbringen könnte.",
                items: {
                    type: 'object',
                    properties: {
                        point: { type: 'string', description: "Der Kern des Gegenarguments." },
                        evidence: {
                            type: 'array',
                            description: "Mögliche Fakten oder Interpretationen, die dieses Gegenargument stützen könnten.",
                            items: { type: 'string' }
                        }
                    },
                    required: ['point', 'evidence']
                }
            }
        },
        required: ['supportingArguments', 'counterArguments']
    };

    static async generateArguments(appState: AppState): Promise<ArgumentationAnalysis> {
        const context = buildCaseContext(appState);
        const prompt = `
Du bist ein brillanter Stratege für Menschenrechtsfälle mit jahrzehntelanger Erfahrung vor internationalen Tribunalen.
Basierend auf dem folgenden, umfassenden Fallkontext, entwickle eine robuste Argumentationsstrategie.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  **Argumentationsstränge entwickeln:** Identifiziere die stärksten Argumentationslinien für den Fall. Formuliere jeden Punkt klar und überzeugend. Liste für jeden Punkt die wichtigsten Beweise oder Fakten aus dem Kontext auf.
2.  **Gegenargumente antizipieren:** Denke wie die Gegenseite. Identifiziere die wahrscheinlichsten Gegenargumente oder Schwachstellen im Fall. Formuliere diese ebenfalls klar und liste die Fakten auf, auf die sich die Gegenseite stützen könnte.

Gib das Ergebnis im geforderten JSON-Format zurück.
        `;

        try {
            return await GeminiService.callAIWithSchema<ArgumentationAnalysis>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Argumentation analysis failed:', error);
            throw new Error('Argumentation analysis failed.');
        }
    }
}
