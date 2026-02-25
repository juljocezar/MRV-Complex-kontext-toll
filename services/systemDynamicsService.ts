
import { GeminiService } from './geminiService';
import { SystemAnalysisResult, AppState, CausalNode, CausalEdge } from '../types';
import { buildCaseContext } from '../utils/contextUtils';
import { selectAgentForTask } from '../utils/agentSelection';
import { buildCausalityMap } from '../logic_engine/causality_mapping_tool';

export class SystemDynamicsService {
    private static readonly SCHEMA = {
        type: 'object',
        properties: {
            systemicMechanisms: { 
                type: 'string', 
                description: "Detaillierte Analyse der Systemdynamik: Welche Rückkopplungsschleifen, Kausalitätsketten und strukturellen Mechanismen (politisch, ökonomisch, sozial) treiben den Konflikt oder die Verletzungen an?" 
            },
            hiddenAspects: { 
                type: 'string', 
                description: "Beschreibung unsichtbarer und verborgener Aspekte, die durch die Analyse der Dokumente sichtbar gemacht wurden (z.B. informelle Machtstrukturen)." 
            },
            societalImpact: {
                type: 'object',
                properties: {
                    dailyLife: { type: 'string', description: "Konkrete Auswirkungen auf das tägliche Leben und die Lebensgrundlagen der betroffenen Individuen." },
                    impactOnGroups: { type: 'string', description: "Differenzierte Analyse der Auswirkungen auf spezifische vulnerable Gruppen und die Gesellschaftsstruktur insgesamt." }
                },
                required: ['dailyLife', 'impactOnGroups']
            },
            solutions: {
                type: 'array',
                description: "Liste systemischer Lösungsansätze, die an den Ursachen ansetzen.",
                items: {
                    type: 'object',
                    properties: {
                        proposal: { type: 'string', description: "Systemischer Interventionsvorschlag." },
                        challenges: { type: 'string', description: "Widerstände im System und Strategien zu deren Überwindung." }
                    },
                    required: ['proposal', 'challenges']
                }
            }
        },
        required: ['systemicMechanisms', 'hiddenAspects', 'societalImpact', 'solutions']
    };

    static async performSystemicAnalysis(appState: AppState, focusArea?: string): Promise<SystemAnalysisResult> {
        const context = buildCaseContext(appState);
        const agent = selectAgentForTask('systemic_analysis');

        // --- LOGIC ENGINE INTEGRATION: Causal Map Construction ---
        // Construct a deterministic graph from ESF data to feed into the AI context
        const nodes: CausalNode[] = appState.esfEvents.map(e => ({
            id: e.recordNumber,
            label: e.eventTitle,
            type: 'event',
            description: e.description
        }));

        const edges: CausalEdge[] = appState.esfActLinks.map(act => {
            const isDestructive = 
                (act.actType && ['Folter', 'Zersetzung', 'Isolierung', 'Psychischer Terror'].includes(act.actType)) ||
                (act.method && act.method.toLowerCase().includes('zersetzung'));

            return {
                id: act.recordNumber,
                source: act.eventId,
                target: act.victimId, // Graph flows from Event -> Person via Act
                relationType: isDestructive ? 'destroys_autonomy' : 'causes',
                description: act.actType
            };
        });

        const causalMap = buildCausalityMap(nodes, edges);
        let causalContext = "";

        if (causalMap.zersetzungDetected) {
            causalContext = `
⚠️ SYSTEM-WARNUNG (LOGIC ENGINE):
Die algorithmische Prüfung der Kausalitätskette hat Muster der "Zersetzung" (Zerstörung der Autonomie) erkannt.
Kritische Ketten:
${causalMap.criticalChains.map(chain => chain.join(' -> ')).join('\n')}

Berücksichtige diese bewiesene strukturelle Gewalt zwingend in der Analyse.
`;
        }
        // ---------------------------------------------------------

        const prompt = `
${agent.systemPrompt}

**AUFGABE:**
Führen Sie eine tiefgehende Analyse der **Systemdynamik und der gesellschaftlichen Auswirkungen** durch, basierend auf den vorliegenden Dokumenten und Fakten.

**ANALYSE-FOKUS:**
${focusArea ? `Untersuchen Sie spezifisch folgenden Aspekt im systemischen Kontext: "${focusArea}"` : "Identifizieren Sie die grundlegenden systemischen Treiber und deren Auswirkungen auf die Gesellschaft."}

${causalContext}

**FALLKONTEXT (Datenbasis):**
---
${context}
---

**ANWEISUNGEN:**
1.  **Systemdynamik:** Gehen Sie über lineare Ereignisse hinaus. Identifizieren Sie Zyklen, Verstärker und strukturelle Ursachen.
2.  **Gesellschaftliche Tiefe:** Analysieren Sie, wie sich diese Strukturen auf das soziale Gefüge und das Individuum auswirken.
3.  **Evidenz:** Stützen Sie Ihre Analyse streng auf die Informationen im Fallkontext.

Nutzen Sie Ihre "Thinking"-Kapazität, um komplexe Zusammenhänge zu dekonstruieren.
        `;

        try {
            // Using Gemini 3 Pro with Thinking Config for maximum reasoning depth
            return await GeminiService.callAIWithSchema<SystemAnalysisResult>(
                prompt, 
                this.SCHEMA, 
                appState.settings.ai, 
                'gemini-3-pro-preview'
            );
        } catch (error) {
            console.error('System dynamics analysis failed:', error);
            throw new Error('System dynamics analysis failed.');
        }
    }
}
