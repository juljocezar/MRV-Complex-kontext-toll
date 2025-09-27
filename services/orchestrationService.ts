import React from 'react';
import { AppState, Document, AgentActivity, DocumentAnalysisResult, SuggestedEntity, Contradiction, Insight, KnowledgeItem, Tag, Notification, TimelineEvent } from '../types';
import { DocumentAnalystService } from './documentAnalyst';
import { ContradictionDetectorService } from './contradictionDetectorService';
import { InsightService } from './insightService';
import { selectAgentForTask } from '../utils/agentSelection';
import { MRV_AGENTS } from '../constants';

interface OrchestrationResult {
    updatedDoc: Document;
    analysisResult: DocumentAnalysisResult;
    newSuggestedEntities: SuggestedEntity[];
    newGlobalTags: string[];
    newContradictions: Contradiction[];
    newInsights: Insight[];
    newKnowledgeItems: KnowledgeItem[];
    newTimelineEvents: TimelineEvent[];
}

/**
 * Der OrchestrationService ist für die Koordination komplexer, mehrstufiger Analyseprozesse verantwortlich.
 * Wenn ein neues Dokument hinzugefügt wird, steuert dieser Service eine Kette von KI-Analysen,
 * sammelt die Ergebnisse und gibt sie gebündelt zurück.
 */
export class OrchestrationService {
    
    /**
     * Behandelt die vollständige Analyse eines neu hinzugefügten oder manuell analysierten Dokuments.
     * Dieser Prozess umfasst mehrere Schritte:
     * 1.  Grundlegende Dokumentenanalyse (Zusammenfassung, Entitäten, Ereignisse).
     * 2.  Widerspruchserkennung gegen bestehende Dokumente.
     * 3.  Generierung von strategischen Einblicken basierend auf den neuen Informationen.
     *
     * @param doc - Das zu analysierende Dokument.
     * @param currentState - Der aktuelle Gesamtzustand der Anwendung.
     * @param addAgentActivity - Funktion zum Protokollieren des Starts einer Agenten-Aktivität.
     * @param updateAgentActivity - Funktion zum Aktualisieren des Status einer Agenten-Aktivität.
     * @param addNotification - Funktion zum Anzeigen von Benachrichtigungen für den Benutzer.
     * @returns Ein `OrchestrationResult`-Objekt mit allen neuen Daten oder `null` bei einem Fehler.
     */
    static async handleNewDocument(
        doc: Document,
        currentState: AppState,
        addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string,
        updateAgentActivity: (id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => void,
        addNotification: (message: string, type?: Notification['type']) => void
    ): Promise<OrchestrationResult | null> {
        
        // Initialisiert leere Arrays zum Sammeln der Ergebnisse aus den verschiedenen Analyseschritten.
        const knowledgeItemsToCreate: Omit<KnowledgeItem, 'id' | 'createdAt'>[] = [];
        const newTimelineEvents: TimelineEvent[] = [];
        
        // --- Schritt 1: Dokumentenanalyse ---
        // Extrahiert grundlegende Informationen aus dem Dokument.
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

        try {
            // Ruft den DocumentAnalystService auf, um die KI-Analyse durchzuführen.
            analysisResult = await DocumentAnalystService.analyzeDocument(doc, currentState.tags, currentState.settings.ai);
            updateAgentActivity(analysisActivityId, { result: 'erfolg', details: `Zusammenfassung, ${analysisResult.structuredEvents?.length || 0} Ereignisse & ${analysisResult.structuredActs?.length || 0} Handlungen extrahiert.` });
            
            // Erstellt einen Wissenseintrag aus der generierten Zusammenfassung.
            if (analysisResult.summary) {
                knowledgeItemsToCreate.push({
                    title: `KI-Zusammenfassung: ${doc.name}`,
                    summary: analysisResult.summary,
                    sourceDocId: doc.id,
                    tags: ['KI-generiert', 'Zusammenfassung']
                });
            }

            // Erstellt Chronologie-Ereignisse aus den extrahierten strukturierten Daten.
            if (analysisResult.structuredEvents) {
                analysisResult.structuredEvents.forEach(event => {
                    newTimelineEvents.push({
                        id: crypto.randomUUID(),
                        date: event.startDate,
                        title: event.title,
                        description: event.description,
                        documentIds: [doc.id]
                    });
                });
            }
            
            // Verarbeitet die Ergebnisse: neue Tags, aktualisiertes Dokumentobjekt und neue Entitätsvorschläge.
            newGlobalTags = analysisResult.suggestedTags || [];
            const combinedTags = Array.from(new Set([...doc.tags, ...newGlobalTags]));
            updatedDoc = {
                ...doc,
                summary: analysisResult.summary,
                classificationStatus: 'classified',
                workCategory: analysisResult.classification,
                tags: combinedTags
            };
            newSuggestedEntities = analysisResult.entities || [];

        } catch (e) {
             updateAgentActivity(analysisActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
             addNotification(`Analyse für "${doc.name}" fehlgeschlagen.`, 'error');
             // Bei einem kritischen Fehler in diesem ersten Schritt wird die Orchestrierung abgebrochen.
            return null;
        }
        
        // --- Schritt 2: Widerspruchserkennung ---
        // Vergleicht das neue Dokument mit allen vorhandenen Dokumenten, um Widersprüche zu finden.
        const contradictionAgent = MRV_AGENTS.contradictionDetector;
        const contradictionActivityId = addAgentActivity({
            agentName: contradictionAgent.name,
            action: `Prüfe auf Widersprüche...`,
            result: 'running',
        });

        let newContradictions: Contradiction[] = [];
        try {
            const newDocContext = `Dokument: ${doc.name}\nZusammenfassung: ${analysisResult.summary}`;
            // Erstellt einen temporären Zustand für die Prüfung, der das aktualisierte neue Dokument enthält.
            const allDocsForCheck = [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc];
            const stateForContradictionCheck = {
                ...currentState,
                documents: allDocsForCheck
            };
            newContradictions = await ContradictionDetectorService.findContradictions(stateForContradictionCheck, newDocContext);

            // Verarbeitet die gefundenen Widersprüche und erstellt entsprechende Wissenseinträge.
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
             // Fehler bei der Widerspruchserkennung werden protokolliert, brechen aber nicht die gesamte Orchestrierung ab.
             updateAgentActivity(contradictionActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
        }


        // --- Schritt 3: Generierung von Einblicken ---
        // Sucht nach übergeordneten strategischen Einblicken, die sich aus den neuen Daten ergeben.
        const insightAgent = MRV_AGENTS.caseStrategist;
         const insightActivityId = addAgentActivity({
            agentName: insightAgent.name,
            action: `Generiere neue Einblicke...`,
            result: 'running',
        });
        
        let newInsights: Insight[] = [];
        try {
            const newDocContext = `Neues Dokument hinzugefügt: ${doc.name}\nZusammenfassung: ${analysisResult.summary}`;
            // Erstellt einen temporären Zustand, der alle bisherigen Ergebnisse (neues Dokument, neue Widersprüche) enthält.
            const allDocsForCheck = [...currentState.documents.filter(d => d.id !== doc.id), updatedDoc];
            const stateForInsightCheck = {
                ...currentState,
                documents: allDocsForCheck,
                contradictions: [...currentState.contradictions, ...newContradictions]
            };
            newInsights = await InsightService.generateInsights(stateForInsightCheck, newDocContext);

            // Verarbeitet die neuen Einblicke und erstellt entsprechende Wissenseinträge.
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
             // Fehler bei der Einblickgenerierung werden ebenfalls protokolliert, ohne den Prozess abzubrechen.
             updateAgentActivity(insightActivityId, { result: 'fehler', details: e instanceof Error ? e.message : 'Unbekannter Fehler' });
        }

        // --- Zusammenfassung und Ergebnis-Aggregation ---
        // Stellt eine zusammenfassende Benachrichtigung für den Benutzer zusammen.
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

        // Fügt allen gesammelten Wissenseinträgen IDs und Zeitstempel hinzu.
        const newKnowledgeItems: KnowledgeItem[] = knowledgeItemsToCreate.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        }));
        
        // Gibt das gebündelte Ergebnisobjekt zurück, das alle neuen und aktualisierten Daten enthält.
        return {
            updatedDoc,
            analysisResult,
            newSuggestedEntities,
            newGlobalTags,
            newContradictions,
            newInsights,
            newKnowledgeItems,
            newTimelineEvents
        };
    }
}
