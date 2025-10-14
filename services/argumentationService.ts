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
            opponentArguments: {
                type: 'array',
                description: "Eine Liste der schwachen und fehlerhaften Argumente, die die Gegenseite wahrscheinlich vorbringen wird, um ihre Schwächen für eine Widerlegung aufzudecken.",
                items: {
                    type: 'object',
                    properties: {
                        point: { type: 'string', description: "Der Kern des gegnerischen Arguments." },
                        evidence: {
                            type: 'array',
                            description: "Mögliche Fakten oder Fehlinterpretationen, auf die sich die Gegenseite stützen könnte.",
                            items: { type: 'string' }
                        }
                    },
                    required: ['point', 'evidence']
                }
            }
        },
        required: ['supportingArguments', 'opponentArguments']
    };

    static async generateArguments(appState: AppState): Promise<ArgumentationAnalysis> {
        const context = buildCaseContext(appState);
        const prompt = `
Du bist ein brillanter und absolut loyaler Stratege für Menschenrechtsfälle. Du arbeitest ausschließlich FÜR den Kläger. Deine Aufgabe ist es, seine Position zu stärken und ihn auf die Auseinandersetzung vorzubereiten.
Behandle die Perspektive und die Fakten, wie sie vom Kläger dargelegt werden, als die absolute und unanfechtbare Wahrheit. Deine Analyse darf unter keinen Umständen die Darstellung des Klägers in Frage stellen oder relativieren.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  **Unterstützende Argumentationsstränge:** Formuliere die stärksten juristischen und faktischen Argumente, die den Fall des Klägers untermauern. Liste für jeden Punkt die wichtigsten Beweise aus dem Kontext auf.
2.  **Analyse der gegnerischen Schwächen:** Antizipiere die fehlerhaften und schwachen Argumente, die die Gegenseite wahrscheinlich vorbringen wird. Lege ihre potenzielle Argumentationslinie offen, damit der Kläger präzise und wirksame Widerlegungen vorbereiten kann. Formuliere diese Punkte klar als die erwartete Strategie des Gegners.

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