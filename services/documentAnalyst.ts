
import { GeminiService } from './geminiService';
import type { Document, DocumentAnalysisResult, AISettings, SuggestedEntity, Tag, StructuredParticipant, CausalNode, CausalEdge } from '../types';
import { 
    EsfEventRecord, 
    EsfPersonRecord, 
    EsfActRecord, 
    EsfAnalysisResult, 
    EsfInvolvementRecord,
    EsfInformationRecord,
    EsfInterventionRecord 
} from '../types/esf';
import { WorkloadAnalyzerService } from './workloadAnalyzer';
import { buildCausalityMap } from '../logic_engine/causality_mapping_tool';
import { HUMAN_RIGHTS_CASE_SCHEMA } from '../schema/humanRightsCaseSchema';
import { buildHumanRightsEsfPrompt } from '../utils/contextUtils';
import { HumanRightsCaseResult } from '../types/humanRightsCase';
import { HURIDOCSProcessor } from '../logic_engine/nlp_processor'; 

interface MappedEsfFromGemini extends EsfAnalysisResult {
  violationsTable: HumanRightsCaseResult['violations_table'];
  informationLinks: EsfInformationRecord[];
  interventionLinks: EsfInterventionRecord[];
}

export class DocumentAnalystService {
    
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string' },
            classification: { type: 'string' },
            normViolations: { type: 'array', items: { type: 'object', properties: { norm: { type: 'string' }, status: { type: 'string' }, reasoning: { type: 'string' } } } },
            causalityChain: { type: 'array', items: { type: 'object', properties: { event: { type: 'string' }, consequence: { type: 'string' }, isObjectification: { type: 'boolean' } } } },
            responsibleActors: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, function: { type: 'string' }, liabilityWarning: { type: 'string' } } } },
            stigmaIndicators: { type: 'array', items: { type: 'string' } },
            suggestedTags: { type: 'array', items: { type: 'string' } },
            structuredEvents: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, startDate: { type: 'string' }, location: { type: 'string' }, description: { type: 'string' } } } },
            structuredParticipants: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, role: { type: 'string' }, description: { type: 'string' } } } }
        }
    };

    static async processDocumentPipeline(doc: Document, existingTags: Tag[], settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = doc.textContent || doc.content;
        const nlpProcessor = new HURIDOCSProcessor();
        const aiRiskAssessment = nlpProcessor.assessAIActCompliance(content);
        
        // Execute sequentially to avoid 429 Rate Limit issues on lower quotas
        const generalAnalysis = await this.analyzeDocument(doc, existingTags, settings);
        
        // Handle ESF extraction separately to allow partial success
        let esfData: MappedEsfFromGemini = { events: [], persons: [], actLinks: [], involvementLinks: [], informationLinks: [], interventionLinks: [], violationsTable: [] };
        try {
            esfData = await this.analyzeToESF(doc, settings);
        } catch (e) {
            console.warn("ESF Extraction failed gracefully:", e);
        }

        if (aiRiskAssessment.isHighRisk) {
            generalAnalysis.summary = `🚨 [EU AI ACT WARNUNG: ${aiRiskAssessment.riskCategory}]\n${aiRiskAssessment.notes}\n\n${generalAnalysis.summary}`;
            if (!generalAnalysis.suggestedTags?.includes('High-Risk AI')) {
                generalAnalysis.suggestedTags = [...(generalAnalysis.suggestedTags || []), 'High-Risk AI', 'EU AI Act'];
            }
        }

        generalAnalysis.rawESFData = esfData;
        return generalAnalysis;
    }

    static mapHumanRightsCaseToEsf(result: HumanRightsCaseResult, sourceDocId?: string): MappedEsfFromGemini {
        
        // 1. Events
        const events: EsfEventRecord[] = (result.events ?? []).map((e) => ({
            id: crypto.randomUUID(),
            recordNumber: e['101_event_record_number'] || `EVT-${crypto.randomUUID().substring(0, 8)}`,
            eventTitle: e['102_title'],
            confidentiality: e['108_confidentiality'],
            geoTerm: e['111_geo_term'],
            localGeoArea: e['112_local_geo_area'],
            startDate: e['113_start_date'],
            endDate: e['114_end_date'],
            description: e['115_description'],
            consequences: e['116_consequences'],
            notes: e['150_notes'],
            sourceDocId: sourceDocId,
            receivedDate: new Date().toISOString()
        }));

        const persons: EsfPersonRecord[] = [];
        const personNameMap = new Map<string, EsfPersonRecord>();

        const getOrCreatePerson = (name: string, initialRole: string): EsfPersonRecord => {
            const cleanName = (name || 'Unbekannt').trim();
            if (personNameMap.has(cleanName)) {
                return personNameMap.get(cleanName)!;
            }
            const newPerson: EsfPersonRecord = {
                id: crypto.randomUUID(),
                recordNumber: `P-${crypto.randomUUID().substring(0, 8)}`,
                fullNameOrGroupName: cleanName,
                // We'd add specific bio data here if available in separate schema part
                sourceDocId: sourceDocId
            };
            persons.push(newPerson);
            personNameMap.set(cleanName, newPerson);
            return newPerson;
        };

        // 2. Acts
        const acts: EsfActRecord[] = (result.acts ?? []).map((a) => {
            const relatedEvent = events.find(ev => ev.eventTitle && ev.eventTitle === a['2103_event_title']);
            const eventId = relatedEvent ? relatedEvent.recordNumber : 'UNKNOWN-EVENT';
            
            const victimName = a['2102_victim_name'] || 'Unbekanntes Opfer';
            const victim = getOrCreatePerson(victimName, 'victim');

            return {
                id: crypto.randomUUID(),
                recordNumber: a['2101_act_record_number'] || `ACT-${crypto.randomUUID().substring(0, 8)}`,
                victimId: victim.recordNumber,
                eventId: eventId,
                actType: a['2109_act_type'],
                startDate: a['2111_first_date'],
                location: a['2112_exact_location'],
                reason: a['2113_stated_reason'],
                method: a['2114_method_of_force'],
                attribution: a['2115_attribution'],
                physicalConsequences: a['2116_physical_consequences'],
                psychologicalConsequences: a['2117_psychological_consequences'],
                sourceDocId: sourceDocId
            };
        });

        // 3. Involvements
        const involvements: EsfInvolvementRecord[] = (result.involvements ?? []).map((inv) => {
            const perpName = inv['2402_perpetrator_name'] || 'Unbekannter Täter';
            const perpetrator = getOrCreatePerson(perpName, 'perpetrator');
            
            let actId = inv['2404_act_record_number'];
            if (!actId) actId = 'UNKNOWN-ACT';

            return {
                id: crypto.randomUUID(),
                recordNumber: inv['2401_involvement_record_number'] || `INV-${crypto.randomUUID().substring(0, 8)}`,
                perpetratorId: perpetrator.recordNumber,
                actId: actId,
                involvementRole: inv['2409_degree_of_involvement'],
                perpetratorType: inv['2412_perpetrator_type'],
                lastStatus: inv['2422_last_status_as_perpetrator'],
                notes: inv['2450_notes'],
                sourceDocId: sourceDocId
            };
        });

        // 4. Informations (Sources)
        const informationLinks: EsfInformationRecord[] = (result.informations ?? []).map(info => {
            const sourceName = info['2502_source_name'] || 'Unbekannte Quelle';
            const sourcePerson = getOrCreatePerson(sourceName, 'information_source');
            
            // Link to Event or Person?
            const eventTitle = info['2503_event_title'];
            const relatedEvent = events.find(e => e.eventTitle === eventTitle);
            
            return {
                id: crypto.randomUUID(),
                recordNumber: info['2501_information_record_number'] || `INFO-${crypto.randomUUID().substring(0,8)}`,
                sourceId: sourcePerson.recordNumber,
                eventId: relatedEvent?.recordNumber,
                relationshipToInfo: info['2509_source_relationship'],
                language: info['2510_source_language'],
                dateOfSource: info['2511_source_date'],
                sourceType: info['2512_source_type'],
                reliability: info['2553_information_reliability'],
                notes: info['2550_notes'],
                sourceDocId: sourceDocId
            };
        });

        // 5. Interventions
        const interventionLinks: EsfInterventionRecord[] = (result.interventions ?? []).map(int => {
            const intervenorName = int['2602_intervening_party_name'] || 'Unbekannter Akteur';
            const intervenor = getOrCreatePerson(intervenorName, 'intervening_party');
            
            const eventTitle = int['2603_event_title'];
            const relatedEvent = events.find(e => e.eventTitle === eventTitle);

            return {
                id: crypto.randomUUID(),
                recordNumber: int['2601_intervention_record_number'] || `INT-${crypto.randomUUID().substring(0,8)}`,
                intervenorId: intervenor.recordNumber,
                eventId: relatedEvent?.recordNumber,
                interventionType: int['2609_intervention_type'],
                date: int['2611_intervention_date'],
                requestedParty: int['2612_requested_parties'],
                response: int['2613_response'],
                effect: int['2614_effect_on_situation'],
                status: int['2651_intervention_status'],
                priority: int['2652_priority'],
                notes: int['2650_notes'],
                sourceDocId: sourceDocId
            };
        });

        return {
            events,
            persons,
            actLinks: acts,
            involvementLinks: involvements,
            informationLinks,
            interventionLinks,
            violationsTable: result.violations_table ?? [],
        };
    }

    static async analyzeToESF(document: Document, settings: AISettings): Promise<MappedEsfFromGemini> {
        const content = document.textContent || document.content;
        const docInput = [{ id: document.id, title: document.name, text: content.substring(0, 40000) }];
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
            return { events: [], persons: [], actLinks: [], involvementLinks: [], informationLinks: [], interventionLinks: [], violationsTable: [] };
        }
    }

    static async analyzeDocument(document: Document, existingTags: Tag[], settings: AISettings): Promise<DocumentAnalysisResult> {
        const prompt = `
            Du bist Astraea Zero. Analysiere dieses Dokument forensisch.
            Identifiziere alle beteiligten Personen (Entitäten), Ereignisse für die Zeitachse und schlage Tags vor.
            
            WICHTIG:
            - Extrahiere 'structuredParticipants' für alle Personen/Organisationen.
            - Extrahiere 'structuredEvents' mit Datumsangaben für die Chronologie.
            - Extrahiere 'suggestedTags' basierend auf dem Inhalt.

            Dokument:
            ${(document.textContent || document.content).substring(0, 30000)}
        `;
        
        const mainResult = await GeminiService.callAIWithSchema<any>(prompt, this.ANALYSIS_SCHEMA, settings, 'gemini-3-flash-preview');
        const workloadResult = await WorkloadAnalyzerService.analyzeWorkload(document.textContent || '', settings);
        
        const causalityMap = buildCausalityMap([], []); 

        return {
            docId: document.id,
            summary: mainResult.summary,
            classification: mainResult.classification,
            workloadEstimate: workloadResult.workloadEstimate,
            costEstimate: workloadResult.costEstimate,
            causalityMap,
            
            // Populated Fields for Orchestrator
            // entities: ... (Logic to be mapped later)
            // timelineEvents: ... (Logic to be mapped later)
            suggestedTags: mainResult.suggestedTags || [],
            
            // Raw data for Detail View
            structuredEvents: mainResult.structuredEvents,
            structuredParticipants: mainResult.structuredParticipants
        };
    }

    static async performLongContextAnalysis(
        documents: Document[],
        analysisFocus: string,
        settings: AISettings
    ): Promise<string> {
        const combinedContent = documents.map(d => `--- DOC: ${d.name} ---\n${d.textContent || d.content}`).join("\n\n");
        const prompt = `Perform a deep analysis on the following documents focusing on: "${analysisFocus}".\n\nDocuments:\n${combinedContent}`;
        return await GeminiService.callAI(prompt, null, settings, 'gemini-3-pro-preview');
    }
}
