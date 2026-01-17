
import { GeminiService } from './geminiService';
import { ForensicDossier, AppState, Document, CausalNode, CausalEdge, CausalRelationType } from '../types';
import { buildCausalityMap } from '../logic_engine/causality_mapping_tool';

export class ForensicService {
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            rootCause: { type: 'string', description: "Identifizierte Hauptursache des Systemfehlers." },
            incidentTimeline: { type: 'string', description: "Forensische Zeitlinie des Vorfalls." },
            systemImpact: { type: 'string', description: "Auswirkungen auf das Gesamtsystem." },
            causalChain: { 
                type: 'array', 
                items: { type: 'string' },
                description: "Schritt-für-Schritt Kausalkette."
            },
            remediation: {
                type: 'object',
                properties: {
                    shortTermFix: { type: 'string' },
                    longTermPrevention: { type: 'string' },
                    technicalSteps: { type: 'array', items: { type: 'string' } }
                },
                required: ['shortTermFix', 'longTermPrevention', 'technicalSteps']
            }
        },
        required: ['rootCause', 'incidentTimeline', 'systemImpact', 'causalChain', 'remediation']
    };

    static async analyzeIncident(selectedDocs: Document[], appState: AppState): Promise<Partial<ForensicDossier>> {
        const docContext = selectedDocs.map(d => `DOC: ${d.name}\nCONTENT: ${d.textContent || d.content}`).join('\n\n---\n\n');
        
        const prompt = `
Führe eine forensische Systemanalyse für folgendes Dossier durch.
Konzentriere dich auf die Aufdeckung von Systemfehlern und die Erstellung eines Remediation-Plans.

DATENGRUNDLAGE:
${docContext}

Aufgaben:
1. Erstelle eine RCA (Root Cause Analysis).
2. Dokumentiere die Kausalkette. Sei präzise. Wenn ein Schritt zur Zerstörung der Autonomie führt, erwähne dies explizit.
3. Entwirf einen Behebungsplan (Remediation).
`;

        try {
            // Using Pro model with implied thinking budget handling in GeminiService
            const result = await GeminiService.callAIWithSchema<any>(
                prompt,
                this.ANALYSIS_SCHEMA,
                appState.settings.ai,
                'gemini-3-pro-preview'
            );

            // --- Deterministic Verification Layer ---
            // Convert AI Causal Chain to Graph for the Logic Engine
            const nodes: CausalNode[] = [];
            const edges: CausalEdge[] = [];

            if (result.causalChain && Array.isArray(result.causalChain)) {
                // 1. Create Nodes
                result.causalChain.forEach((step: string, index: number) => {
                    nodes.push({
                        id: `node_${index}`,
                        label: step,
                        type: index === 0 ? 'event' : 'consequence'
                    });
                });

                // 2. Create Edges
                for (let i = 0; i < nodes.length - 1; i++) {
                    const currentText = nodes[i].label.toLowerCase();
                    const nextText = nodes[i+1].label.toLowerCase();
                    
                    let type: CausalRelationType = 'causes';
                    
                    // Semantic detection of 'Zersetzung' indicators to map to 'destroys_autonomy' logic
                    const criticalKeywords = ['autonomie', 'vernichtung', 'zersetzung', 'willkür', 'objekt', 'existenz', 'würde'];
                    if (criticalKeywords.some(kw => nextText.includes(kw) || currentText.includes(kw))) {
                        type = 'destroys_autonomy';
                    }

                    edges.push({
                        id: `edge_${i}_${i+1}`,
                        source: nodes[i].id,
                        target: nodes[i+1].id,
                        relationType: type
                    });
                }
            }

            // 3. Run Logic Engine
            const verificationMap = buildCausalityMap(nodes, edges);

            return {
                analysis: {
                    rootCause: result.rootCause,
                    incidentTimeline: result.incidentTimeline,
                    systemImpact: result.systemImpact,
                    causalChain: result.causalChain
                },
                remediation: result.remediation,
                algorithmicVerification: verificationMap // Store verification result
            };
        } catch (error) {
            console.error("Forensic analysis failed:", error);
            throw error;
        }
    }
}
