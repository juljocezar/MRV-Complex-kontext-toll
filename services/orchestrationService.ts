
import { AppState, Document, AgentActivity, DocumentAnalysisResult, SuggestedEntity, Contradiction, Insight, KnowledgeItem, Tag, Notification, TimelineEvent, OrchestrationResult, RadbruchEvent, AnalysisMode } from '../types';
import { DocumentAnalystService } from './documentAnalyst';
import { ContradictionDetectorService } from './contradictionDetectorService';
import { InsightService } from './insightService';
import { selectAgentForTask } from '../utils/agentSelection';
import { MRV_AGENTS } from '../constants';
import { GeminiService } from './geminiService';
import { addMultipleEsfEvents, addMultipleEsfActLinks, addMultipleEsfPersons, addMultipleEsfInvolvementLinks, addMultipleEsfInformationLinks, addMultipleEsfInterventionLinks } from './storageService';
import { validateNormHierarchy } from '../logic_engine/norm_hierarchy_validator';

export class OrchestrationService {
    
    static async handleNewDocument(
        doc: Document,
        currentState: AppState,
        addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string,
        updateAgentActivity: (id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => void,
        addNotification: (message: string, type?: Notification['type']) => void,
        analysisMode: AnalysisMode = 'scan'
    ): Promise<OrchestrationResult | null> {
        
        const knowledgeItemsToCreate: Omit<KnowledgeItem, 'id' | 'createdAt' | 'embedding'>[] = [];
        const newTimelineEvents: TimelineEvent[] = [];
        
        // --- 1. Document Analysis (Base Layer - Always runs) ---
        const docAnalysisAgent = MRV_AGENTS.documentAnalyst;
        const analysisActivityId = addAgentActivity({
            agentName: docAnalysisAgent.name,
            action: `Analysiere (${analysisMode}): ${doc.name}`,
            result: 'running',
        });

        let analysisResult: DocumentAnalysisResult;
        let updatedDoc: Document;
        let newSuggestedEntities: SuggestedEntity[] = [];
        let newGlobalTags: string[] = [];
        
        // ESF Containers to return for state update
        let newEsfEvents: any[] = [];
        let newEsfPersons: any[] = [];
        let newEsfActLinks: any[] = [];
        let newEsfInvolvementLinks: any[] = [];
        let newEsfInformationLinks: any[] = [];
        let newEsfInterventionLinks: any[] = [];

        try {
            // Use lighter model for 'scan' mode
            const modelOverride = analysisMode === 'scan' ? { temperature: 0.3, topP: 0.8 } : currentState.settings.ai;
            analysisResult = await DocumentAnalystService.analyzeDocument(doc, currentState.tags, modelOverride);
            
            updateAgentActivity(analysisActivityId, { result: 'erfolg', details: `Basis-Analyse abgeschlossen.` });
            
            if (analysisResult.summary) {
                knowledgeItemsToCreate.push({
                    title: `Zusammenfassung (${analysisMode}): ${doc.name}`,
                    summary: analysisResult.summary,
                    sourceDocId: doc.id,
                    tags: ['KI-generiert', 'Zusammenfassung']
                });
            }

            // Extract Timeline Events from Analysis Result
            if (analysisResult.timelineEvents && analysisResult.timelineEvents.length > 0) {
                analysisResult.timelineEvents.forEach(evt => {
                    newTimelineEvents.push({
                        ...evt,
                        id: crypto.randomUUID(),
                        documentIds: [doc.id]
                    });
                });
            }

            // --- TIER 2: DEEP FORENSIC LOGIC (Only if Forensic Mode) ---
            if (analysisMode === 'forensic') {
                addNotification("Starte forensische Tiefenanalyse (ESF & Logic Engine)...", "info");
                
                // 1. Logic Engine Validation on Events
                analysisResult.timelineEvents?.forEach(evt => {
                     const tempRadbruchEvent: RadbruchEvent = {
                        eventId: 'temp', 
                        eventType: 'extracted',
                        location: { country: 'DE' },
                        jurisdictionUnitId: '',
                        summary: `${evt.title}. ${evt.description}`,
                        allegedRightsViolated: [], 
                        decisionOpacityLevel: 'transparent',
                        legalProcedureStage: 'other',
                        involvedActors: '',
                        referencedLaws: [],
                        isMachineGenerated: false,
                        officialSignal: '',
                        usesAlgorithmicDecision: false,
                        sphereRisks: { lossOfHousing: false, lossOfIncome: false, healthRisk: false }
                    };

                    const validationResult = validateNormHierarchy(tempRadbruchEvent);

                    if (validationResult.severity === 'ius_cogens' || validationResult.voidSuggested) {
                        knowledgeItemsToCreate.push({
                            title: `⚠️ RECHTSBRUCH ERKANNT: ${evt.title}`,
                            summary: `Automatische Validierung (Art. 1/25 GG Engine) schlug Alarm.\n\nGrund: ${validationResult.notes}`,
                            sourceDocId: doc.id,
                            tags: ['WARNUNG', 'Ius Cogens', 'Verfassungsbruch']
                        });
                    }
                });

                // 2. Full ESF Extraction (Expensive)
                try {
                    const esfResult = await DocumentAnalystService.analyzeToESF(doc, currentState.settings.ai);
                    
                    if (esfResult.events.length > 0 || esfResult.persons.length > 0) {
                        const cleanEvents = esfResult.events.filter(e => !!e.recordNumber);
                        const cleanPersons = esfResult.persons.filter(p => !!p.recordNumber);
                        const cleanActs = esfResult.actLinks.filter(a => !!a.recordNumber);
                        const cleanInvolvements = esfResult.involvementLinks.filter(i => !!i.recordNumber);
                        const cleanInfo = esfResult.informationLinks.filter(i => !!i.recordNumber);
                        const cleanInterventions = esfResult.interventionLinks.filter(i => !!i.recordNumber);

                        await addMultipleEsfEvents(cleanEvents);
                        await addMultipleEsfActLinks(cleanActs);
                        await addMultipleEsfPersons(cleanPersons);
                        await addMultipleEsfInvolvementLinks(cleanInvolvements);
                        await addMultipleEsfInformationLinks(cleanInfo);
                        await addMultipleEsfInterventionLinks(cleanInterventions);
                        
                        newEsfEvents = cleanEvents;
                        newEsfPersons = cleanPersons;
                        newEsfActLinks = cleanActs;
                        newEsfInvolvementLinks = cleanInvolvements;
                        newEsfInformationLinks = cleanInfo;
                        newEsfInterventionLinks = cleanInterventions;

                        if (esfResult.violationsTable && esfResult.violationsTable.length > 0) {
                            esfResult.violationsTable.forEach(v => {
                                knowledgeItemsToCreate.push({
                                    title: `Verstoß: ${v.violation_type}`,
                                    summary: `Datum: ${v.date || 'Unbekannt'}\nDetails: ${v.details}`,
                                    sourceDocId: doc.id,
                                    tags: ['ESF-Violation', v.violation_type]
                                });
                            });
                        }
                    }
                } catch (esfError) {
                    console.error("ESF Extraction error:", esfError);
                }
            } // End Forensic Mode

            // --- Generate Embedding (Always useful for RAG) ---
            const docEmbedding = await GeminiService.getEmbedding(
                (doc.textContent || doc.content).substring(0, 8000) + "\nSummary: " + analysisResult.summary,
                'RETRIEVAL_DOCUMENT'
            );

            newGlobalTags = analysisResult.suggestedTags || [];
            const combinedTags = Array.from(new Set([...doc.tags, ...newGlobalTags]));
            updatedDoc = {
                ...doc,
                summary: analysisResult.summary,
                classificationStatus: 'classified',
                workCategory: analysisResult.classification,
                tags: combinedTags,
                embedding: docEmbedding,
                analysisMode: analysisMode 
            };
            newSuggestedEntities = analysisResult.entities || [];

        } catch (e) {
             updateAgentActivity(analysisActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
             addNotification(`Analyse für "${doc.name}" fehlgeschlagen.`, 'error');
            return null;
        }
        
        let newContradictions: Contradiction[] = [];
        let newInsights: Insight[] = [];

        // --- Post-Processing only in Forensic Mode ---
        if (analysisMode === 'forensic') {
            // Contradictions
            const contradictionAgent = MRV_AGENTS.contradictionDetector;
            const contradictionActivityId = addAgentActivity({
                agentName: contradictionAgent.name,
                action: `Prüfe auf Widersprüche...`,
                result: 'running',
            });

            try {
                const newDocContext = `Dokument: ${doc.name}\nZusammenfassung: ${analysisResult.summary}`;
                const allDocsForCheck = [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc];
                const stateForContradictionCheck = { ...currentState, documents: allDocsForCheck };
                
                newContradictions = await ContradictionDetectorService.findContradictions(stateForContradictionCheck, newDocContext);
                updateAgentActivity(contradictionActivityId, { result: 'erfolg', details: `${newContradictions.length} Widersprüche.` });
            } catch (e) {
                updateAgentActivity(contradictionActivityId, { result: 'fehler', details: 'Fehler bei Widerspruchsprüfung' });
            }

            // Insights
            const insightAgent = MRV_AGENTS.caseStrategist;
            const insightActivityId = addAgentActivity({
                agentName: insightAgent.name,
                action: 'Strategie-Update...',
                result: 'running',
            });
            
            try {
                let triggerContext = `Neues Dokument (Forensik): ${doc.name}`;
                if (newContradictions.length > 0) triggerContext += `\n${newContradictions.length} Widersprüche erkannt.`;
                
                const stateForInsightCheck = {
                    ...currentState,
                    documents: [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc],
                    contradictions: [...currentState.contradictions, ...newContradictions]
                };
                
                newInsights = await InsightService.generateInsights(stateForInsightCheck, triggerContext);
                updateAgentActivity(insightActivityId, { result: 'erfolg', details: `${newInsights.length} Einblicke.` });
            } catch (e) {
                updateAgentActivity(insightActivityId, { result: 'fehler', details: 'Fehler bei Insights' });
            }
        }

        const newKnowledgeItems: KnowledgeItem[] = await Promise.all(knowledgeItemsToCreate.map(async item => {
            const embedding = await GeminiService.getEmbedding(`${item.title}: ${item.summary}`, 'RETRIEVAL_DOCUMENT');
            return {
                ...item,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                embedding
            };
        }));
        
        addNotification(`Analyse "${doc.name}" (${analysisMode}) fertig.`, 'success');

        return {
            updatedDoc,
            analysisResult,
            newSuggestedEntities,
            newGlobalTags,
            newContradictions,
            newInsights,
            newKnowledgeItems,
            newTimelineEvents,
            newEsfEvents,
            newEsfPersons,
            newEsfActLinks,
            newEsfInvolvementLinks,
            newEsfInformationLinks,
            newEsfInterventionLinks
        };
    }
}
