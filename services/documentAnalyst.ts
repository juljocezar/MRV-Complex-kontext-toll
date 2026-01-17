
import { GeminiService } from './geminiService';
import type { Document, DocumentAnalysisResult, AISettings, SuggestedEntity, Tag, StructuredParticipant, CausalNode, CausalEdge } from '../types';
import { EsfEventRecord, EsfPersonRecord, EsfActLink, EsfAnalysisResult, EsfInvolvementLink } from '../types/esf';
import { WorkloadAnalyzerService } from './workloadAnalyzer';
import { buildCausalityMap } from '../logic_engine/causality_mapping_tool';
import { HUMAN_RIGHTS_CASE_SCHEMA } from '../schema/humanRightsCaseSchema';
import { buildHumanRightsEsfPrompt } from '../utils/contextUtils';
import { HumanRightsCaseResult } from '../types/humanRightsCase';
import { HURIDOCSProcessor } from '../logic_engine/nlp_processor'; // Import Rule-Based Engine

interface MappedEsfFromGemini extends EsfAnalysisResult {
  violationsTable: HumanRightsCaseResult['violations_table'];
}

export class DocumentAnalystService {
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "Eine prägnante Zusammenfassung des Dokuments." },
            classification: { type: 'string', description: 'Klassifizierung nach HURIDOCS (z.B. Verwaltungsakt, Urteil, Polizeibericht).' },
            normViolations: {
                type: 'array',
                description: "Verstöße gegen die Normen-Hierarchie (Modul 1: Art. 25 GG Engine).",
                items: {
                    type: 'object',
                    properties: {
                        norm: { type: 'string', description: "Verletzte Norm (z.B. Ius Cogens, Menschenwürde, Art. 25 GG)." },
                        status: { type: 'string', enum: ['NICHTIG / VOID', 'RECHTSWIDRIG', 'KRITISCH'], description: "Rechtsfolge der Kollision." },
                        reasoning: { type: 'string', description: "Logische Herleitung der Nichtigkeit." }
                    },
                    required: ['norm', 'status', 'reasoning']
                }
            },
            causalityChain: {
                type: 'array',
                description: "Modul 2: Kausalitäts-Forensik. Objektive Ereigniskette.",
                items: {
                    type: 'object',
                    properties: {
                        event: { type: 'string', description: "Ereignis/Maßnahme" },
                        consequence: { type: 'string', description: "Folge für die Existenz/Autonomie" },
                        isObjectification: { type: 'boolean', description: "Wurde der Mensch zum Objekt gemacht?" }
                    },
                    required: ['event', 'consequence']
                }
            },
            responsibleActors: {
                type: 'array',
                description: "Modul 3: Piercing the Veil. Persönlich haftende Akteure.",
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: "Name des Unterzeichners oder 'Maschinell'" },
                        function: { type: 'string', description: "Amtsbezeichnung/Rolle" },
                        liabilityWarning: { type: 'string', description: "Hinweis auf persönliche Haftung (§ 839/823 BGB) bei Ultra Vires Handeln." }
                    },
                    required: ['name', 'liabilityWarning']
                }
            },
            stigmaIndicators: {
                type: 'array',
                description: "Modul 4: Anti-Stigma-Protokoll. Gaslighting-Begriffe.",
                items: { type: 'string' }
            },
            suggestedTags: { 
                type: 'array', 
                items: { type: 'string' } 
            },
            structuredEvents: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        startDate: { type: 'string' },
                        location: { type: 'string' },
                        description: { type: 'string' }
                    },
                    required: ['title', 'startDate', 'location', 'description']
                }
            },
            structuredParticipants: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                        role: { type: 'string' },
                        description: { type: 'string' }
                    },
                    required: ['name', 'type', 'role', 'description']
                }
            }
        },
        required: ['summary', 'classification', 'normViolations', 'causalityChain', 'responsibleActors']
    };

    /**
     * END-TO-END PIPELINE: Process Document
     * Kombiniert regelbasierte NLP (schnell, deterministisch) mit generativer KI (tief, semantisch).
     */
    static async processDocumentPipeline(doc: Document, existingTags: Tag[], settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = doc.textContent || doc.content;
        
        // 1. Rule-Based NLP Pre-Analysis (WinkNLP)
        // Extrahiert High-Risk Indikatoren (EU AI Act) und harte Entitäten (Daten, Orte)
        const nlpProcessor = new HURIDOCSProcessor();
        const aiRiskAssessment = nlpProcessor.assessAIActCompliance(content);
        // Optional: Pre-fill events via NLP if needed, but currently we rely on Gemini for structure
        
        // 2. Parallel Execution: General Analysis & Deep ESF Extraction
        const [generalAnalysis, esfData] = await Promise.all([
            this.analyzeDocument(doc, existingTags, settings),
            this.analyzeToESF(doc, settings)
        ]);

        // 3. Merge NLP Warnings into Summary
        if (aiRiskAssessment.isHighRisk) {
            generalAnalysis.summary = `🚨 [EU AI ACT WARNUNG: ${aiRiskAssessment.riskCategory}]\n${aiRiskAssessment.notes}\n\n${generalAnalysis.summary}`;
            if (!generalAnalysis.suggestedTags?.includes('High-Risk AI')) {
                generalAnalysis.suggestedTags = [...(generalAnalysis.suggestedTags || []), 'High-Risk AI', 'EU AI Act'];
            }
        }

        // 4. Attach ESF Data for Orchestrator to save
        generalAnalysis.rawESFData = esfData;

        return generalAnalysis;
    }

    /**
     * Mappt das strukturierte Gemini-JSON (HUMAN_RIGHTS_CASE_SCHEMA)
     * in interne ESF-Records + Verletzungs-Tabelle.
     * 
     * Implementiert ID-Tracking, um sicherzustellen, dass 'Müller' als Täter (Involvement)
     * und 'Müller' als Person dieselbe UUID erhalten.
     */
    static mapHumanRightsCaseToEsf(result: HumanRightsCaseResult, sourceDocId?: string): MappedEsfFromGemini {
        const events: EsfEventRecord[] = (result.events ?? []).map((e) => ({
            id: crypto.randomUUID(),
            eventRecordNumber: e['101_event_record_number'] || `EVT-${crypto.randomUUID().substring(0, 8)}`,
            eventTitle: e['102_title'],
            confidentiality: e['108_confidentiality'],
            geoTerm: e['111_geo_term'],
            localGeoArea: e['112_local_geo_area'],
            startDate: e['113_start_date'],
            endDate: e['114_end_date'],
            description: e['115_description'],
            consequences: e['116_consequences'],
            notes: e['150_notes'],
            receivedDate: new Date().toISOString(),
            sourceDocId: sourceDocId
        }));

        const persons: EsfPersonRecord[] = [];
        const personNameMap = new Map<string, EsfPersonRecord>(); // Maps Name -> Record

        // Helper to get or create a person record and ensure consistency
        const getOrCreatePerson = (name: string, initialRole: string): EsfPersonRecord => {
            const cleanName = (name || 'Unbekannt').trim();
            
            if (personNameMap.has(cleanName)) {
                const existing = personNameMap.get(cleanName)!;
                if (existing.roles && !existing.roles.includes(initialRole as any)) {
                    existing.roles.push(initialRole as any);
                }
                return existing;
            }

            const newPerson: EsfPersonRecord = {
                id: crypto.randomUUID(),
                personRecordNumber: `P-${crypto.randomUUID().substring(0, 8)}`,
                fullNameOrGroupName: cleanName,
                roles: [initialRole as any],
                sourceDocId: sourceDocId
            };
            
            persons.push(newPerson);
            personNameMap.set(cleanName, newPerson);
            return newPerson;
        };

        // --- Process Acts (Tat) ---
        const acts: EsfActLink[] = (result.acts ?? []).map((a) => {
            // 1. Link Act to Event
            const relatedEvent = events.find(ev => ev.eventTitle && ev.eventTitle === a['2103_event_title']);
            const eventId = relatedEvent ? relatedEvent.eventRecordNumber : undefined;
            
            // 2. Identify/Create Victim
            const victimName = a['2102_victim_name'] || 'Unbekanntes Opfer';
            const victim = getOrCreatePerson(victimName, 'victim');

            return {
                id: crypto.randomUUID(),
                fromRecordId: a['2101_act_record_number'] || `ACT-${crypto.randomUUID().substring(0, 8)}`, // Act ID
                toRecordId: victim.personRecordNumber, // Link Act -> Victim
                eventId: eventId,
                linkType: 'act',
                actDescription: this.buildActDescriptionFromSchema(a),
                actClassification: a['2109_act_type'],
                actMethod: a['2114_method_of_force'],
                receivedDate: new Date().toISOString(),
                sourceDocId: sourceDocId
            };
        });

        // --- Process Involvements (Täter -> Tat/Event) ---
        const involvements: EsfInvolvementLink[] = (result.involvements ?? []).map((inv) => {
            // 1. Identify/Create Perpetrator
            const perpName = inv['2402_perpetrator_name'] || 'Unbekannter Täter';
            const perpetrator = getOrCreatePerson(perpName, 'perpetrator');

            // 2. Determine Target (Act or Event)
            let targetId = inv['2404_act_record_number']; // Try to link to specific Act first
            
            if (!targetId) {
                // Fallback to Event linking
                const relatedEvent = events.find(ev => ev.eventTitle && ev.eventTitle === inv['2403_event_title']);
                targetId = relatedEvent ? relatedEvent.eventRecordNumber : undefined;
            }

            // Fallback if nothing matches
            if (!targetId) targetId = 'UNKNOWN-CONTEXT';

            return {
                id: crypto.randomUUID(),
                fromRecordId: perpetrator.personRecordNumber, // Perpetrator
                toRecordId: targetId, // Act or Event
                linkType: 'involvement',
                involvementRole: inv['2409_degree_of_involvement'],
                receivedDate: new Date().toISOString(),
                sourceDocId: sourceDocId
            };
        });

        return {
            events,
            persons,
            actLinks: acts,
            involvementLinks: involvements,
            violationsTable: result.violations_table ?? [],
        };
    }

    private static buildActDescriptionFromSchema(a: any): string {
        const parts: string[] = [];
        if (a['2109_act_type']) parts.push(`Art: ${a['2109_act_type']}`);
        if (a['2113_stated_reason']) parts.push(`Grund: ${a['2113_stated_reason']}`);
        if (a['2116_physical_consequences']) parts.push(`Physisch: ${a['2116_physical_consequences']}`);
        if (a['2117_psychological_consequences']) parts.push(`Psychisch: ${a['2117_psychological_consequences']}`);
        return parts.join(' | ');
    }

    /**
     * PIPELINE: PDF -> ESF Records (Event, Person, ActLink) via HUMAN_RIGHTS_CASE_SCHEMA
     */
    static async analyzeToESF(document: Document, settings: AISettings): Promise<MappedEsfFromGemini> {
        const content = document.textContent || document.content;
        
        // Prepare single-doc input for the prompt builder
        const docInput = [{
            id: document.id,
            title: document.name,
            text: content.substring(0, 40000)
        }];

        const prompt = buildHumanRightsEsfPrompt(docInput);

        try {
            const result = await GeminiService.callAIWithSchema<HumanRightsCaseResult>(
                prompt, 
                HUMAN_RIGHTS_CASE_SCHEMA, 
                settings, 
                'gemini-3-pro-preview'
            );
            
            return this.mapHumanRightsCaseToEsf(result, document.id);

        } catch (e) {
            console.error("ESF Extraction failed", e);
            return { events: [], persons: [], actLinks: [], involvementLinks: [], violationsTable: [] };
        }
    }

    /**
     * Performs a Long-Context analysis on multiple full documents.
     */
    static async performLongContextAnalysis(
        documents: Document[], 
        focusPrompt: string, 
        settings: AISettings
    ): Promise<string> {
        
        // 1. Prepare Long Context
        const combinedContext = documents.map((doc, index) => 
            `--- DOKUMENT ${index + 1}: ${doc.name} (ID: ${doc.id}) ---\n${doc.textContent || doc.content}\n--- ENDE DOKUMENT ${index + 1} ---`
        ).join('\n\n');

        // 2. Construct Optimized Prompt (CoT + Query at End)
        const prompt = `
[SYSTEM INSTRUKTION]
Du analysierst einen großen Korpus an juristischen Dokumenten.
Nutze "Chain of Thought":
1. Überblicke zuerst ALLE Dokumente, um den Gesamtzusammenhang zu verstehen.
2. Identifiziere Querverbindungen und Zeitlinien.
3. Mappe gefundene Ereignisse auf den HURIDOCS-Standard (Wer tat was wem wann und wo?).
4. Beantworte DANN die spezifische Frage.

[START KONTEXT]
${combinedContext}
[ENDE KONTEXT]

[ANALYSE-FOKUS / QUERY]
${focusPrompt}

Antworte präzise, zitiere die Dokumentennamen und nutze Markdown für die Strukturierung.
        `;

        try {
            // Using Pro model for large context window
            return await GeminiService.callAI(prompt, null, settings, 'gemini-3-pro-preview');
        } catch (error) {
            console.error("Long Context Analysis failed", error);
            throw new Error("Long Context Analysis failed");
        }
    }

    /**
     * Standard Document Analysis (Summary, Classification, Forensic Modules)
     */
    static async analyzeDocument(document: Document, existingTags: Tag[], settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = document.textContent || document.content;
        const existingTagNames = existingTags.map(t => t.name).join(', ');

        const prompt = `
            Du bist Astraea Zero, eine technologische Prüfinstanz für Naturrecht und zwingendes Völkerrecht.
            
            Deine Aufgabe ist die forensische Dekonstruktion von staatlicher Willkür in Dokumenten.
            Wende folgende Module strikt an:

            MODUL 1: NORMEN-HIERARCHIE-VALIDATOR (Art. 25 GG Engine)
            Prüfe gegen diese Pyramide:
            1. Ius Cogens / Menschenwürde (Art. 1 GG) -> Bei Verstoß: Ergebnis 'NICHTIG / VOID'.
            2. Völkergewohnheitsrecht (Art. 25 GG) -> Bricht einfaches Bundesrecht.
            3. Ordre Public (Art. 6 EGBGB) -> Degenerierung zum 'Phantom' ist unzulässig.

            MODUL 2: KAUSALITÄTS-FORENSIK
            Ignoriere behördliche Begründungen ("Zitation"). Bilde die objektive Wechselwirkung ab:
            Ereignis -> Systemreaktion -> Folge für die Existenz.
            Wenn das Ergebnis die Vernichtung der Autonomie ist, liegt "Zersetzung" vor (Verletzung der Objektformel).

            MODUL 3: PIERCING THE VEIL
            Identifiziere die handelnden Menschen hinter der "Behörde".
            Generiere Haftungshinweise für persönliches Handeln "ultra vires" (außerhalb rechtmäßiger Ermächtigung).

            MODUL 4: ANTI-STIGMA-PROTOKOLL
            Suche nach Kampfbegriffen ("Querulant", "Reichsbürger", pathologisierende Sprache).
            Markiere diese als Gaslighting und Indikator für Beweislastumkehr.
            
            Dokumenteninhalt (Auszug):
            ---
            ${content.substring(0, 50000)}
            ---

            Vorhandene Tags: ${existingTagNames || 'Keine'}.
            GIB NUR DAS GEFORDERTE JSON ZURÜCK.
        `;

        try {
            // Nutzung von Flash für Stabilität und Geschwindigkeit (vermeidet 429 Errors)
            const mainResult = await GeminiService.callAIWithSchema<any>(prompt, this.ANALYSIS_SCHEMA, settings, 'gemini-3-flash-preview');
            
            const workloadResult = await WorkloadAnalyzerService.analyzeWorkload(content, settings);

            // --- Module 2: Causality Engine Integration (Deterministic Verification) ---
            const nodes: CausalNode[] = [];
            const edges: CausalEdge[] = [];
            
            if (mainResult.causalityChain && Array.isArray(mainResult.causalityChain)) {
                mainResult.causalityChain.forEach((item: any, index: number) => {
                    const eventNodeId = `evt_${index}`;
                    const conseqNodeId = `cons_${index}`;
                    
                    nodes.push({
                        id: eventNodeId,
                        label: item.event,
                        type: 'event'
                    });
                    
                    nodes.push({
                        id: conseqNodeId,
                        label: item.consequence,
                        type: 'consequence'
                    });
                    
                    edges.push({
                        id: `edge_${index}`,
                        source: eventNodeId,
                        target: conseqNodeId,
                        relationType: item.isObjectification ? 'destroys_autonomy' : 'causes'
                    });
                });
            }
            
            const causalityMap = buildCausalityMap(nodes, edges);

            const combinedResult: DocumentAnalysisResult = {
                docId: document.id,
                summary: mainResult.summary,
                entities: (mainResult.structuredParticipants || []).map((p: StructuredParticipant): SuggestedEntity => ({
                    id: crypto.randomUUID(), 
                    name: p.name,
                    type: p.type,
                    description: p.description,
                    sourceDocumentId: document.id, 
                    sourceDocumentName: document.name 
                })),
                classification: mainResult.classification,
                suggestedTags: mainResult.suggestedTags,
                structuredEvents: mainResult.structuredEvents,
                structuredActs: [], // Acts werden jetzt über causalityChain abgebildet
                structuredParticipants: mainResult.structuredParticipants,
                workloadEstimate: workloadResult.workloadEstimate,
                costEstimate: workloadResult.costEstimate,
                causalityMap: causalityMap, // Algorithmically verified result
                
                // HURIDOCS Data (Populated via pipeline, null if single call)
                rawESFData: undefined 
            };

            // Füge die spezifischen Naturrechts-Analysen in die Zusammenfassung ein, falls keine speziellen UI-Felder existieren
            if (mainResult.normViolations?.length > 0) {
                combinedResult.summary += "\n\n⚠️ NORM-KOLLISIONEN ERKANNT:\n" + mainResult.normViolations.map((v:any) => `- ${v.status}: ${v.norm} (${v.reasoning})`).join('\n');
            }
            if (mainResult.responsibleActors?.length > 0) {
                combinedResult.summary += "\n\n👤 IDENTIFIZIERTE AKTEURE:\n" + mainResult.responsibleActors.map((a:any) => `- ${a.name} (${a.function}): ${a.liabilityWarning}`).join('\n');
            }
            if (causalityMap.zersetzungDetected) {
                combinedResult.summary += "\n\n🔴 FORENSISCHE WARNUNG: 'Zersetzung' algorithmisch bestätigt (Objektformel verletzt).";
            }

            return combinedResult;

        } catch (error) {
            console.error(`Error analyzing document ${document.id}:`, error);
            throw new Error('Document analysis failed');
        }
    }
}
