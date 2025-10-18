import { GeminiService } from './geminiService';
import { EthicsAnalysis, AppState } from '../types';
import { buildCaseContext } from '../utils/contextUtils';

export class EthicsService {
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            ethicalViolationsAssessment: { type: 'string', description: "Eine Analyse der im Fallkontext beschriebenen Handlungen der gegnerischen Parteien auf potenzielle ethische Verstöße." },
            privacyConcerns: {
                type: 'array',
                description: "Eine Liste spezifischer Datenschutzbedenken bezüglich der gesammelten Informationen.",
                items: { type: 'string' }
            },
            recommendations: {
                type: 'array',
                description: "Konkrete Empfehlungen zur Minderung ethischer Risiken und zur Einhaltung von 'Do-No-Harm'-Prinzipien.",
                items: { type: 'string' }
            }
        },
        required: ['ethicalViolationsAssessment', 'privacyConcerns', 'recommendations']
    };

    static async performAnalysis(appState: AppState): Promise<EthicsAnalysis> {
        const context = buildCaseContext(appState);

        const prompt = `
Du bist ein Ethik-Berater, der einen Menschenrechtsverteidiger unterstützt. Deine Aufgabe ist es, die Handlungen der gegnerischen Parteien (in diesem Fall staatliche Akteure) auf der Grundlage der vom Kläger bereitgestellten Informationen ethisch zu bewerten. Nimm die Perspektive des Klägers als gegeben an.

Fallkontext:
---
${context}
---

Deine Aufgaben:
1.  **Ethical Violations Assessment:** Analysiere die im Kontext beschriebenen Handlungen der staatlichen Akteure. Identifiziere und beschreibe potenzielle Verstöße gegen ethische Prinzipien der Menschenrechtsarbeit (z.B. Fairness, Transparenz, Recht auf Anhörung, Nicht-Diskriminierung).
2.  **Privacy Concerns:** Identifiziere potenzielle Datenschutzrisiken, die durch die Handlungen der gegnerischen Parteien für die beteiligten Personen entstanden sind oder entstehen könnten.
3.  **'Do-No-Harm' Recommendations:** Gib klare Handlungsempfehlungen für den Kläger und seine Unterstützer, wie sie in ihrer weiteren Vorgehensweise "Do-No-Harm"-Prinzipien wahren können, insbesondere im Schutz sensibler Daten und der Vermeidung von Retraumatisierung.

Gib das Ergebnis im geforderten JSON-Format zurück.
        `;

        try {
            return await GeminiService.callAIWithSchema<EthicsAnalysis>(prompt, this.SCHEMA, appState.settings.ai);
        } catch (error) {
            console.error('Ethics analysis failed:', error);
            throw new Error('Ethics analysis failed.');
        }
    }
}