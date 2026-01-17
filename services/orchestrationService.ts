
import { AppState, Document, AgentActivity, DocumentAnalysisResult, SuggestedEntity, Contradiction, Insight, KnowledgeItem, Tag, Notification, TimelineEvent, OrchestrationResult } from '../types';
import { DocumentAnalystService } from './documentAnalyst';
import { ContradictionDetectorService } from './contradictionDetectorService';
import { InsightService } from './insightService';
import { selectAgentForTask } from '../utils/agentSelection';
import { MRV_AGENTS } from '../constants';
import { GeminiService } from './geminiService';
import { addMultipleEsfEvents, addMultipleEsfActLinks, addMultipleEsfPersons, addMultipleEsfInvolvementLinks } from './storageService';

export class OrchestrationService {
    
    static async handleNewDocument(
        doc: Document,
        currentState: AppState,
        addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string,
        updateAgentActivity: (id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => void,
        addNotification: (message: string, type?: Notification['type']) => void
    ): Promise<OrchestrationResult | null> {
        
        const knowledgeItemsToCreate: Omit<KnowledgeItem, 'id' | 'createdAt' | 'embedding'>[] = [];
        const newTimelineEvents: TimelineEvent[] = [];
        
        // --- 1. Document Analysis ---
        const docAnalysisAgent = MRV_AGENTS.documentAnalyst;
        const analysisActivityId = addAgentActivity({
            agentName: docAnalysisAgent.name,
            action: `Analysiere: ${doc.name}`,
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

        try {
            analysisResult = await DocumentAnalystService.analyzeDocument(doc, currentState.tags, currentState.settings.ai);
            updateAgentActivity(analysisActivityId, { result: 'erfolg', details: `Zusammenfassung, ${analysisResult.structuredEvents?.length || 0} Ereignisse & Normen-Check abgeschlossen.` });
            
            if (analysisResult.summary) {
                knowledgeItemsToCreate.push({
                    title: `KI-Zusammenfassung: ${doc.name}`,
                    summary: analysisResult.summary,
                    sourceDocId: doc.id,
                    tags: ['KI-generiert', 'Zusammenfassung', 'Astraea-Zero']
                });
            }

            // --- PROCESS HURIDOCS ESF DATA (Parallel ESF Analysis) ---
            try {
                const esfResult = await DocumentAnalystService.analyzeToESF(doc, currentState.settings.ai);
                
                if (esfResult.events.length > 0 || esfResult.persons.length > 0) {
                     // 3. Persist ESF Data to IndexedDB
                    await addMultipleEsfEvents(esfResult.events);
                    await addMultipleEsfActLinks(esfResult.actLinks);
                    await addMultipleEsfPersons(esfResult.persons);
                    await addMultipleEsfInvolvementLinks(esfResult.involvementLinks);
                    
                    // Capture for return
                    newEsfEvents = esfResult.events;
                    newEsfPersons = esfResult.persons;
                    newEsfActLinks = esfResult.actLinks;
                    newEsfInvolvementLinks = esfResult.involvementLinks;

                    // 4. Create Knowledge Items from Violations Table
                    if (esfResult.violationsTable && esfResult.violationsTable.length > 0) {
                        esfResult.violationsTable.forEach(v => {
                            knowledgeItemsToCreate.push({
                                title: `Verstoß: ${v.violation_type}`,
                                summary: `Datum: ${v.date || 'Unbekannt'}\nOrt: ${v.location || 'Unbekannt'}\nDetails: ${v.details}\nBetroffen: ${v.persons_or_groups || 'Unbekannt'}`,
                                sourceDocId: doc.id,
                                tags: ['ESF-Violation', v.violation_type, 'HURIDOCS']
                            });
                        });
                    }

                    addNotification(`${esfResult.events.length} ESF-Events, ${esfResult.actLinks.length} Acts und ${esfResult.violationsTable?.length || 0} Verstöße gespeichert.`, 'success');
                }
            } catch (esfError) {
                console.error("ESF Extraction error (non-fatal):", esfError);
            }


            // --- Generate Embedding for Document (RAG Support) ---
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
                embedding: docEmbedding // Store embedding
            };
            newSuggestedEntities = analysisResult.entities || [];

        } catch (e) {
             updateAgentActivity(analysisActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
             addNotification(`Analyse für "${doc.name}" fehlgeschlagen.`, 'error');
             // The caller should handle the UI update for the error status
            return null;
        }
        
        // --- 2. Contradiction Detection ---
        const contradictionAgent = MRV_AGENTS.contradictionDetector;
        const contradictionActivityId = addAgentActivity({
            agentName: contradictionAgent.name,
            action: `Prüfe auf Widersprüche...`,
            result: 'running',
        });

        let newContradictions: Contradiction[] = [];
        try {
            const newDocContext = `Dokument: ${doc.name}\nZusammenfassung: ${analysisResult.summary}`;
            const allDocsForCheck = [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc];
            const stateForContradictionCheck = {
                ...currentState,
                documents: allDocsForCheck
            };
            newContradictions = await ContradictionDetectorService.findContradictions(stateForContradictionCheck, newDocContext);
            if (newContradictions.length > 0) {
                 updateAgentActivity(contradictionActivityId, { result: 'erfolg', details: `${newContradictions.length} neue Widersprüche gefunden.` });
                 addNotification(`${newContradictions.length} neue Widersprüche gefunden.`, 'info');
                 const contradictionKnowledgeItems = newContradictions.map(c => {
                    const doc1Name = currentState.documents.find(d => d.id === c.source1DocId)?.name || 'Unbekannt';
                    const doc2Name = currentState.documents.find(d => d.id === c.source2DocId)?.name || 'Unbekannt';
                    return {
                        title: `Widerspruch: ${doc1Name} vs. ${doc2Name}`,
                        summary: `Aussage A: "${c.statement1}"\nAussage B: "${c.statement2}"\n\nKI-Erklärung: ${c.explanation}`,
                        sourceDocId: c.source1DocId,
                        tags: ['KI-generiert', 'Widerspruch']
                    };
                });
                knowledgeItemsToCreate.push(...contradictionKnowledgeItems);
            } else {
                 updateAgentActivity(contradictionActivityId, { result: 'erfolg', details: `Keine neuen Widersprüche.` });
            }
        } catch (e) {
             updateAgentActivity(contradictionActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
        }


        // --- 3. Insight Generation ---
        const insightAgent = MRV_AGENTS.caseStrategist;
         const insightActivityId = addAgentActivity({
            agentName: insightAgent.name,
            action: `Generiere neue Einblicke...`,
            result: 'running',
        });
        
        let newInsights: Insight[] = [];
        try {
            const newDocContext = `Neues Dokument hinzugefügt: ${doc.name}\nZusammenfassung: ${analysisResult.summary}`;
            const allDocsForCheck = [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc];
            const stateForInsightCheck = {
                ...currentState,
                documents: allDocsForCheck,
                contradictions: [...currentState.contradictions, ...newContradictions]
            };
            newInsights = await InsightService.generateInsights(stateForInsightCheck, newDocContext);
             if (newInsights.length > 0) {
                updateAgentActivity(insightActivityId, { result: 'erfolg', details: `${newInsights.length} neue Einblicke generiert.` });
                addNotification(`${newInsights.length} neue strategische Einblicke generiert.`, 'info');
                newInsights.forEach(i => {
                    knowledgeItemsToCreate.push({
                        title: `Einblick (${i.type}): ${i.text.substring(0, 40)}...`,
                        summary: i.text,
                        sourceDocId: doc.id,
                        tags: ['KI-generiert', 'Einblick', i.type]
                    });
                });
            } else {
                updateAgentActivity(insightActivityId, { result: 'erfolg', details: `Keine neuen Einblicke.` });
            }
        } catch (e) {
             updateAgentActivity(insightActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
        }

        const summaryParts = [];
        if (newTimelineEvents.length > 0) summaryParts.push(`${newTimelineEvents.length} Ereignis(se)`);
        if (newSuggestedEntities.length > 0) summaryParts.push(`${newSuggestedEntities.length} Entität(en)`);
        if (newContradictions.length > 0) summaryParts.push(`${newContradictions.length} Widerspruch/Widersprüche`);
        if (newInsights.length > 0) summaryParts.push(`${newInsights.length} Einblick(e)`);

        let summaryText = `Analyse von "${doc.name}" abgeschlossen.`;
        if (summaryParts.length > 0) {
            summaryText += ` ${summaryParts.join(', ')} gefunden.`;
        } else {
            summaryText += ` Keine neuen strukturierten Daten extrahiert.`
        }
        addNotification(summaryText, 'success');


        // Prepare Knowledge Items with Embeddings (Parallel)
        const newKnowledgeItems: KnowledgeItem[] = await Promise.all(knowledgeItemsToCreate.map(async item => {
            const embedding = await GeminiService.getEmbedding(`${item.title}: ${item.summary}`, 'RETRIEVAL_DOCUMENT');
            return {
                ...item,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                embedding
            };
        }));
        
        // AUTONOMOUS EMBEDDING: Generate embeddings for extracted entities immediately
        // This ensures they are searchable in Vector Search even before manual acceptance
        /* 
           Note: SuggestedEntities structure is slightly different from CaseEntity, 
           but we can map them for search indexing conceptually here or just embed them locally
           if we decide to promote them. For now, we don't store embedding on SuggestedEntity type,
           but ideally we should if we want RAG to find them. 
           
           Refinement: We won't embed SuggestedEntities into the vector store yet to avoid noise,
           but we ensure the *Document* and *KnowledgeItems* (which contain the entity info) are embedded.
        */
        
        return {
            updatedDoc,
            analysisResult,
            newSuggestedEntities,
            newGlobalTags,
            newContradictions,
            newInsights,
            newKnowledgeItems,
            newTimelineEvents,
            // Return ESF Data for state update
            newEsfEvents,
            newEsfPersons,
            newEsfActLinks,
            newEsfInvolvementLinks
        };
    }
}
