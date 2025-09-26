import React, { useState, useEffect, useCallback, useRef } from 'react';
import SidebarNav from './components/ui/SidebarNav';
import AssistantSidebar from './components/ui/AssistantSidebar';
import DashboardTab from './components/tabs/DashboardTab';
import DocumentsTab from './components/tabs/DocumentsTab';
import EntitiesTab from './components/tabs/EntitiesTab';
import ChronologyTab from './components/tabs/ChronologyTab';
import KnowledgeBaseTab from './components/tabs/KnowledgeBaseTab';
import GraphTab from './components/tabs/GraphTab';
import AnalysisTab from './components/tabs/AnalysisTab';
import ReportsTab from './components/tabs/ReportsTab';
import GenerationTab from './components/tabs/GenerationTab';
import LibraryTab from './components/tabs/LibraryTab';
import DispatchTab from './components/tabs/DispatchTab';
import StrategyTab from './components/tabs/StrategyTab';
import ArgumentationTab from './components/tabs/ArgumentationTab';
import KpisTab from './components/tabs/KpisTab';
import UNSubmissionsTab from './components/tabs/UNSubmissionsTab';
import HRDSupportTab from './components/tabs/HRDSupportTab';
import LegalBasisTab from './components/tabs/LegalBasisTab';
import EthicsAnalysisTab from './components/tabs/EthicsAnalysisTab';
import ContradictionsTab from './components/tabs/ContradictionsTab';
import AgentManagementTab from './components/tabs/AgentManagementTab';
import AuditLogTab from './components/tabs/AuditLogTab';
import SettingsTab from './components/tabs/SettingsTab';
import PlaceholderTab from './components/tabs/PlaceholderTab';
import FocusModeSwitcher from './components/ui/FocusModeSwitcher';
import DocumentDetailModal from './components/modals/DocumentDetailModal';
import ProactiveAssistant from './components/ui/ProactiveAssistant';
import NotificationContainer from './components/ui/NotificationContainer';


import * as storage from './services/storageService';

import { AppState, ActiveTab, CaseEntity, Document, GeneratedDocument, AgentActivity, KnowledgeItem, ProactiveSuggestion, Notification, Tag, Risks, KPI, TimelineEvent, AppSettings, ChecklistItem, AuditLogEntry } from './types';
import { GeminiService } from './services/geminiService';
import { CaseAnalyzerService } from './services/caseAnalyzerService';
import { ContradictionDetectorService } from './services/contradictionDetectorService';
import { InsightService } from './services/insightService';
import { KpiService } from './services/kpiService';
import { StrategyService } from './services/strategyService';
import { EthicsService } from './services/ethicsService';
import { ContentCreatorService } from './services/contentCreator';
import { buildCaseContext } from './utils/contextUtils';
import { EntityRelationshipService } from './services/entityRelationshipService';
import { ArgumentationService } from './services/argumentationService';
import { ProactiveSuggestionService } from './services/proactiveSuggestionService';
import { OrchestrationService } from './services/orchestrationService';
// Fix: Import `extractFileContent` and `hashText` to resolve undefined errors.
import { extractFileContent } from './utils/fileUtils';
import { hashText } from './utils/cryptoUtils';

/**
 * @component App
 * @description The root component of the MRV-Assistent application.
 * It serves as the central orchestrator for the entire application, managing the following:
 * - **Global State:** Holds the complete `AppState` in a single state object.
 * - **Data Persistence:** Initializes the application by loading all data from `storageService` (IndexedDB)
 *   and defines all callback functions that update both the in-memory state and the persistent storage.
 * - **Service Integration:** Contains the handler functions that call the various AI services
 *   (e.g., `OrchestrationService`, `CaseAnalyzerService`) in response to user actions.
 * - **UI Rendering:** Renders the main application layout, including the side navigation,
 *   the main content area (switching between tabs), modals, and notifications.
 * - **User Interaction Logic:** Defines the logic for handling all major user interactions,
 *   from uploading a document to generating a report.
 * @returns {React.FC} The rendered root application component.
 */
const App: React.FC = () => {
    const [state, setState] = useState<AppState | null>(null);
    const [detailDocId, setDetailDocId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const debounceTimeoutRef = useRef<number | null>(null);

    const addNotification = useCallback((message: string, type: Notification['type'] = 'info', duration = 5000, details?: string) => {
        const id = crypto.randomUUID();
        setNotifications(prev => [...prev, { id, message, type, details }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);
    
    const addAuditLog = useCallback(async (action: string, details: string) => {
        const newLogEntry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            action,
            details,
        };
        setState(s => s ? { ...s, auditLog: [newLogEntry, ...s.auditLog] } : null);
        await storage.addAuditLogEntry(newLogEntry);
    }, []);

    const setActiveTab = (tab: ActiveTab) => {
        addAuditLog('Tab gewechselt', `Neuer Tab: ${tab}`);
        setState(prevState => prevState ? { ...prevState, activeTab: tab } : null);
    };

    const toggleFocusMode = () => {
        setState(prevState => {
            if (!prevState) return null;
            addAuditLog('Fokus-Modus umgeschaltet', `Fokus-Modus ${!prevState.isFocusMode ? 'aktiviert' : 'deaktiviert'}`);
            return { ...prevState, isFocusMode: !prevState.isFocusMode };
        });
    };
    
    // --- Granular State & Storage Updaters ---

    const addAgentActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>): string => {
        const id = crypto.randomUUID();
        const newActivity: AgentActivity = {
            ...activity,
            id,
            timestamp: new Date().toISOString(),
        };
        setState(s => {
            if (!s) return s;
            const updatedActivities = [newActivity, ...s.agentActivity];
            storage.addAgentActivity(newActivity);
            return { ...s, agentActivity: updatedActivities };
        });
        return id;
    }, []);

    const updateAgentActivity = useCallback((id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => {
        setState(s => {
            if (!s) return null;
            let activityToUpdate: AgentActivity | undefined;
            const newActivities = s.agentActivity.map(act => {
                if (act.id === id) {
                    activityToUpdate = { ...act, ...updates };
                    return activityToUpdate;
                }
                return act;
            });
            if (activityToUpdate) {
                storage.updateAgentActivity(activityToUpdate);
            }
            return { ...s, agentActivity: newActivities };
        });
    }, []);

    const updateDocuments = useCallback(async (newDocuments: Document[]) => {
        setState(s => s ? { ...s, documents: newDocuments } : null);
        await storage.saveAllDocuments(newDocuments);
    }, []);

    const addDocument = useCallback(async (doc: Document) => {
        setState(s => s ? { ...s, documents: [...s.documents, doc] } : null);
        await storage.addDocument(doc);
    }, []);
    
    const updateCaseDescription = useCallback((desc: string) => {
        setState(s => s ? {...s, caseContext: {...s.caseContext, caseDescription: desc}} : null);
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = window.setTimeout(() => {
            storage.saveCaseContext({ caseDescription: desc });
        }, 500);
    }, []);

    const updateEntities = useCallback(async (entities: CaseEntity[]) => {
        setState(s => s ? { ...s, caseEntities: entities } : null);
        await storage.saveAllEntities(entities);
    }, []);

    const updateTimelineEvents = useCallback(async (events: TimelineEvent[]) => {
        setState(s => s ? { ...s, timelineEvents: events } : null);
        await storage.saveAllTimelineEvents(events);
    }, []);
    
    const updateKnowledgeItems = useCallback(async (items: KnowledgeItem[]) => {
        setState(s => s ? { ...s, knowledgeItems: items } : null);
        await storage.saveAllKnowledgeItems(items);
    }, []);

    const addKnowledgeItem = useCallback(async (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => {
        const newItem: KnowledgeItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setState(s => s ? { ...s, knowledgeItems: [...s.knowledgeItems, newItem] } : null);
        await storage.addKnowledgeItem(newItem);
        addNotification("Wissenseintrag hinzugefügt.", "success");
    }, [addNotification]);
    
    const updateGeneratedDocuments = useCallback(async (docs: GeneratedDocument[]) => {
        setState(s => s ? { ...s, generatedDocuments: docs } : null);
        await storage.saveAllGeneratedDocuments(docs);
    }, []);

    const updateChecklist = useCallback(async (checklist: ChecklistItem[]) => {
        setState(s => s ? { ...s, checklist: checklist } : null);
        // Simple checklist might not need persistence, but if it did, it would be here.
    }, []);

    const updateRisks = useCallback(async (risks: Risks) => {
        setState(s => s ? { ...s, risks } : null);
        await storage.saveRisks(risks);
    }, []);

    const updateKpis = useCallback(async (kpis: KPI[]) => {
        setState(s => s ? { ...s, kpis: kpis } : null);
        await storage.saveAllKpis(kpis);
    }, []);

    const updateSettings = useCallback(async (settings: AppSettings) => {
        setState(s => s ? { ...s, settings: settings } : null);
        await storage.saveSettings(settings);
    }, []);

    const updateTags = useCallback(async (tags: Tag[]) => {
        setState(s => s ? { ...s, tags: tags } : null);
        await storage.saveAllTags(tags);
    }, []);
    
    // --- Complex AI Service Handlers ---

    const runDocumentOrchestration = useCallback(async (doc: Document) => {
        if (!state) return;
        
        const result = await OrchestrationService.handleNewDocument(
            doc,
            state,
            addAgentActivity,
            updateAgentActivity,
            addNotification
        );

        if (!result) return; // Orchestration failed and handled its own error state

        // Apply all gathered changes in a single update
        setState(s => {
            if (!s) return null;

            const updatedDocs = s.documents.map(d => d.id === result.updatedDoc.id ? result.updatedDoc : d);
            
            const existingGlobalTagNames = new Set(s.tags.map(t => t.name));
            const newGlobalTags = result.newGlobalTags.filter(tagName => !existingGlobalTagNames.has(tagName))
                .map(name => ({ id: crypto.randomUUID(), name }));
            
            const existingSuggestionNames = new Set(s.suggestedEntities.map(e => e.name));
            const newSuggestions = result.newSuggestedEntities.filter(e => !existingSuggestionNames.has(e.name));

            const finalState = {
                ...s,
                documents: updatedDocs,
                documentAnalysisResults: { ...s.documentAnalysisResults, [doc.id]: result.analysisResult },
                tags: [...s.tags, ...newGlobalTags],
                suggestedEntities: [...s.suggestedEntities, ...newSuggestions],
                contradictions: [...s.contradictions, ...result.newContradictions],
                insights: [...s.insights, ...result.newInsights],
                knowledgeItems: [...s.knowledgeItems, ...result.newKnowledgeItems],
                timelineEvents: [...s.timelineEvents, ...result.newTimelineEvents],
            };

            // Persist the changes to storage
            storage.updateDocument(result.updatedDoc);
            storage.saveDocumentAnalysisResult(doc.id, result.analysisResult);
            if (newGlobalTags.length > 0) storage.addMultipleTags(newGlobalTags);
            if (newSuggestions.length > 0) storage.addMultipleSuggestedEntities(newSuggestions);
            if (result.newContradictions.length > 0) storage.addMultipleContradictions(result.newContradictions);
            if (result.newInsights.length > 0) storage.addMultipleInsights(result.newInsights);
            if (result.newKnowledgeItems.length > 0) storage.addMultipleKnowledgeItems(result.newKnowledgeItems);
            if (result.newTimelineEvents.length > 0) storage.addMultipleTimelineEvents(result.newTimelineEvents);

            return finalState;
        });
        
    }, [state, addAgentActivity, updateAgentActivity, addNotification]);
    
    const addNewDocumentAndAnalyze = useCallback(async (file: File) => {
        if (!state) return;
        const { text, base64, mimeType } = await extractFileContent(file);
        const content = text || base64 || '';
        const id = await hashText(file.name + file.size + content);
        
        if (state.documents.some(d => d.id === id)) {
            addNotification(`Doppelte Datei übersprungen: ${file.name}`, 'info');
            return;
        }

        const newDoc: Document = {
            id, name: file.name, content, textContent: text, base64Content: base64,
            mimeType, classificationStatus: 'unclassified', tags: [], createdAt: new Date().toISOString(),
        };

        addNotification(`Dokument "${file.name}" hinzugefügt. Analyse wird gestartet...`, 'info');
        await addDocument(newDoc);
        
        // Use a slight delay to ensure state has updated before orchestration,
        // which reads from the latest state.
        setTimeout(() => runDocumentOrchestration(newDoc), 100);

    }, [state, addDocument, runDocumentOrchestration, addNotification]);


    const viewDocumentDetails = useCallback((docId: string) => {
        const doc = state?.documents.find(d => d.id === docId);
        if (doc) {
            setDetailDocId(doc.id);
        }
    }, [state?.documents]);


    const performOverallAnalysis = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'case_analysis' } : null);
        try {
            const summary = await CaseAnalyzerService.performOverallAnalysis(state);
            
            const caseSummaryKnowledgeItem: Omit<KnowledgeItem, 'id' | 'createdAt'> = {
                title: "Fall-Gesamtzusammenfassung (KI)", summary: summary.summary,
                sourceDocId: 'case-summary-analysis', tags: ['KI-generiert', 'Zusammenfassung', 'Gesamtanalyse']
            };
            const riskKnowledgeItems: Omit<KnowledgeItem, 'id' | 'createdAt'>[] = (summary.identifiedRisks || []).map(r => ({
                title: `Identifiziertes Risiko: ${r.risk}`, summary: r.description,
                sourceDocId: 'case-summary-analysis', tags: ['KI-generiert', 'Risiko', 'Gesamtanalyse']
            }));
            const newKnowledgeItems: KnowledgeItem[] = [caseSummaryKnowledgeItem, ...riskKnowledgeItems].map(item => ({
                ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()
            }));

            setState(s => s ? { ...s, caseSummary: summary, knowledgeItems: [...s.knowledgeItems, ...newKnowledgeItems] } : null);
            storage.saveCaseSummary(summary);
            storage.addMultipleKnowledgeItems(newKnowledgeItems);
            
            addNotification("Gesamtanalyse des Falles erfolgreich abgeschlossen.", "success");
        } catch (error) {
            console.error("Failed to perform overall analysis", error);
            addNotification("Gesamtanalyse fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    }
    
    const findContradictions = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'contradictions' } : null);
        try {
            const contradictions = await ContradictionDetectorService.findContradictions(state);
            setState(s => s ? { ...s, contradictions } : null);
            storage.saveAllContradictions(contradictions);
            addNotification(`Widerspruchsanalyse abgeschlossen. ${contradictions.length} Widersprüche gefunden.`, "success");
        } catch (error) {
            console.error("Failed to find contradictions", error);
            addNotification("Widerspruchsanalyse fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };
    
    const generateInsights = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'insights' } : null);
        try {
            const insights = await InsightService.generateInsights(state);
            
            const insightKnowledgeItems: Omit<KnowledgeItem, 'id' | 'createdAt'>[] = insights.map(i => ({
                title: `Strategischer Einblick (${i.type}): ${i.text.substring(0, 40)}...`, summary: i.text,
                sourceDocId: 'insight-generation-analysis', tags: ['KI-generiert', 'Einblick', i.type]
            }));

            const newKnowledgeItems: KnowledgeItem[] = insightKnowledgeItems.map(item => ({
                ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()
            }));
            
            const newInsightsState = [...state.insights, ...insights];
            const newKnowledgeState = [...state.knowledgeItems, ...newKnowledgeItems];

            setState(s => s ? { ...s, insights: newInsightsState, knowledgeItems: newKnowledgeState } : null);
            storage.addMultipleInsights(insights);
            storage.addMultipleKnowledgeItems(newKnowledgeItems);
            
            addNotification(`${insights.length} neue strategische Einblicke generiert.`, "success");
        } catch (error) {
            console.error("Failed to generate insights", error);
            addNotification("Generierung von Einblicken fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    const suggestKpis = async () => {
         if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'kpis' } : null);
        try {
            const kpis = await KpiService.suggestKpis(state);
            const newKpis = [...state.kpis, ...kpis];
            setState(s => s ? { ...s, kpis: newKpis } : null);
            storage.addMultipleKpis(kpis);
            addNotification("Neue KPIs wurden vorgeschlagen.", "success");
        } catch (error) {
            console.error("Failed to suggest kpis", error);
            addNotification("Vorschlagen von KPIs fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    }
    
    const generateMitigationStrategies = async () => {
         if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'strategy' } : null);
        try {
            const strategies = await StrategyService.generateMitigationStrategies(state);
            setState(s => s ? { ...s, mitigationStrategies: strategies } : null);
            storage.saveMitigationStrategies(strategies);
            addNotification("Minderungsstrategien erfolgreich generiert.", "success");
        } catch (error) {
            console.error("Failed to generate strategies", error);
            addNotification("Generierung von Strategien fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    const performEthicsAnalysis = async () => {
         if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'ethics' } : null);
        try {
            const analysis = await EthicsService.performAnalysis(state);
            setState(s => s ? { ...s, ethicsAnalysis: analysis } : null);
            storage.saveEthicsAnalysis(analysis);
            addNotification("Ethik-Analyse erfolgreich abgeschlossen.", "success");
        } catch (error) {
            console.error("Failed to perform ethics analysis", error);
            addNotification("Ethik-Analyse fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    }
    
    const generateReport = async (prompt: string, schema: object | null) => {
        if (!state) return "State not available";
        return await GeminiService.callAI(prompt, schema, state.settings.ai);
    };

    const generateContent = async (params: any) => {
        if (!state) return null;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'generation' } : null);
        try {
             const result = await ContentCreatorService.createContent({
                ...params,
                caseContext: buildCaseContext(state)
            }, state.settings.ai);
            const newDoc: GeneratedDocument = {
                id: crypto.randomUUID(),
                title: `Generated Document ${new Date().toISOString()}`,
                content: result.content,
                htmlContent: result.htmlContent,
                createdAt: new Date().toISOString(),
                templateUsed: result.metadata.template_used,
                sourceDocIds: result.metadata.source_documents,
            };
            setState(s => s ? { ...s, generatedDocuments: [...s.generatedDocuments, newDoc] } : null);
            storage.addGeneratedDocument(newDoc);
            addNotification("Dokument erfolgreich generiert.", "success");
            return newDoc;
        } catch (error) {
            console.error(error);
            addNotification("Dokumentengenerierung fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
            return null;
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    const analyzeEntityRelationships = async () => {
        if (!state || state.caseEntities.length < 2) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'relationships' } : null);
        try {
            const caseContext = buildCaseContext(state);
            const results = await EntityRelationshipService.analyzeRelationships(state.caseEntities, caseContext, state.settings.ai);
            
            const resultsMap = new Map(results.map(r => [r.entityId, r.relationships]));

            const updatedEntities = state.caseEntities.map(entity => {
                const newRelationships = resultsMap.get(entity.id);
                if (newRelationships) {
                    return { ...entity, relationships: newRelationships };
                }
                return entity;
            });

            updateEntities(updatedEntities);
            addNotification("Analyse der Entitäten-Beziehungen abgeschlossen.", "success");
        } catch (error) {
            console.error("Failed to analyze entity relationships", error);
            addNotification("Analyse der Entitäten-Beziehungen fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    const acceptSuggestedEntity = useCallback(async (id: string) => {
        if (!state) return;
        const suggestion = state.suggestedEntities.find(e => e.id === id);
        if (!suggestion) return;

        const newEntity: CaseEntity = {
            id: crypto.randomUUID(), name: suggestion.name, type: suggestion.type,
            description: suggestion.description
        };
        const updatedSuggestions = state.suggestedEntities.filter(e => e.id !== id);
        const updatedEntities = [...state.caseEntities, newEntity];
        
        setState(s => s ? {...s, caseEntities: updatedEntities, suggestedEntities: updatedSuggestions} : null);
        
        await storage.addEntity(newEntity);
        await storage.deleteSuggestedEntity(id);

        addNotification(`Entität "${newEntity.name}" wurde übernommen.`, "success");
    }, [state, addNotification]);

    const dismissSuggestedEntity = useCallback(async (id: string) => {
        setState(prevState => {
            if (!prevState) return null;
            return { ...prevState, suggestedEntities: prevState.suggestedEntities.filter(e => e.id !== id) };
        });
        await storage.deleteSuggestedEntity(id);
    }, []);
    
    const draftEmailBody = async (subject: string, attachments: (Document | GeneratedDocument)[]): Promise<string> => {
        if (!state) return "State not available";
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'dispatch-body' } : null);
        try {
            const attachmentContext = attachments.map(doc => {
                const content = 'content' in doc ? doc.content : '';
                const summary = ('summary' in doc && doc.summary) ? doc.summary : '';
                const title = 'name' in doc ? doc.name : doc.title;
                return `Anhang: ${title}\nZusammenfassung/Inhalt (Auszug):\n${(summary || content).substring(0, 500)}...`;
            }).join('\n\n');

            const prompt = `
                Du bist ein professioneller Assistent für Menschenrechtsanwälte.
                Basierend auf dem folgenden Kontext, erstelle einen formellen, höflichen und präzisen Entwurf für den Textkörper einer E-Mail.

                Betreff: ${subject}
                
                Anhänge:
                ${attachmentContext}

                Fallkontext:
                ${buildCaseContext(state)}

                Aufgabe: Verfasse den E-Mail-Text. Beziehe dich auf den Betreff und die Anhänge.
            `;

            const body = await GeminiService.callAI(prompt, null, state.settings.ai);
            setState(s => s ? {...s, coverLetter: body} : null); // No need to persist this temporary draft
            addNotification("E-Mail-Entwurf erstellt.", "success");
            return body;
        } catch(error) {
            console.error(error);
            addNotification("Fehler beim Erstellen des Entwurfs.", "error", 5000, error instanceof Error ? error.message : String(error));
            return "Fehler beim Erstellen des Entwurfs.";
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    }

    const generateArgumentation = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'argumentation' } : null);
        try {
            const analysis = await ArgumentationService.generateArguments(state);
            setState(s => s ? { ...s, argumentationAnalysis: analysis } : null);
            storage.saveArgumentationAnalysis(analysis);
            addNotification("Argumentationsanalyse abgeschlossen.", "success");
        } catch (error) {
            console.error("Failed to generate argumentation", error);
            addNotification("Argumentationsanalyse fehlgeschlagen.", "error", 5000, error instanceof Error ? error.message : String(error));
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };
    
    const runFreeformAnalysis = async (prompt: string, isGrounded: boolean): Promise<string> => {
        if (!state) return "Anwendung nicht initialisiert.";
        addAuditLog("Freie Analyse gestartet", `Prompt: ${prompt.substring(0, 50)}...`);
        try {
            const response = await CaseAnalyzerService.runFreeformQuery(prompt, state, isGrounded);
            addNotification("Analyse abgeschlossen.", "success");
            return response;
        } catch(e) {
            const error = e instanceof Error ? e : new Error(String(e));
            addNotification("Analyse fehlgeschlagen.", "error", 5000, error.message);
            return error.message;
        }
    };
    
    const handleDismissSuggestion = (id: string) => {
        setState(s => s ? { ...s, proactiveSuggestions: s.proactiveSuggestions.filter(p => p.id !== id) } : null);
    };

    const handleExecuteSuggestion = (suggestion: ProactiveSuggestion) => {
        if (suggestion.action.type === 'navigate') {
            setActiveTab(suggestion.action.payload);
        } else if (suggestion.action.type === 'execute') {
            suggestion.action.payload();
        }
        handleDismissSuggestion(suggestion.id);
    };

    const renderTab = () => {
        if (!state) return null;
        switch (state.activeTab) {
            case 'dashboard':
                return <DashboardTab 
                    documents={state.documents} 
                    caseEntities={state.caseEntities}
                    generatedDocuments={state.generatedDocuments}
                    documentAnalysisResults={state.documentAnalysisResults}
                    caseDescription={state.caseContext.caseDescription}
                    setCaseDescription={updateCaseDescription}
                    setActiveTab={setActiveTab}
                    onResetCase={() => { if(window.confirm('Are you sure?')) storage.clearDB().then(() => window.location.reload()); }}
                    onExportCase={async () => {
                        addAuditLog("Fall exportiert", "Der gesamte Fall wurde als JSON-Datei exportiert.");
                        const json = await storage.exportStateToJSON();
                        const blob = new Blob([json], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mrv-case-${new Date().toISOString()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        addNotification("Fall erfolgreich exportiert.", "success");
                    }}
                    onImportCase={async (file: File) => {
                        try {
                            const text = await file.text();
                            await storage.importStateFromJSON(text);
                            addAuditLog("Fall importiert", `Datei: ${file.name}`);
                            addNotification('Fall erfolgreich importiert! Die Seite wird neu geladen...', 'success');
                            setTimeout(() => window.location.reload(), 2000);
                        } catch (error: any) {
                             console.error("Import failed:", error);
                             addNotification(`Import fehlgeschlagen`, 'error', 10000, error.message);
                        }
                    }}
                    caseSummary={state.caseSummary}
                    onPerformOverallAnalysis={performOverallAnalysis}
                    isLoading={state.isLoading && state.loadingSection === 'case_analysis'}
                    loadingSection={state.loadingSection}
                    addNotification={addNotification}
                 />;
            case 'documents':
                return <DocumentsTab 
                    appState={state}
                    onAddNewDocument={addNewDocumentAndAnalyze}
                    onRunOrchestration={runDocumentOrchestration}
                    onUpdateDocument={(doc) => {
                        updateDocuments(state.documents.map(d => d.id === doc.id ? doc : d));
                    }}
                    onUpdateTags={updateTags}
                    addKnowledgeItem={addKnowledgeItem}
                    setActiveTab={setActiveTab} 
                    addNotification={addNotification}
                    onViewDocumentDetails={viewDocumentDetails}
                />;
            case 'entities':
                return <EntitiesTab 
                    entities={state.caseEntities}
                    onUpdateEntities={updateEntities}
                    documents={state.documents}
                    suggestedEntities={state.suggestedEntities}
                    onAcceptSuggestedEntity={acceptSuggestedEntity}
                    onDismissSuggestedEntity={dismissSuggestedEntity}
                    onAnalyzeRelationships={analyzeEntityRelationships}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                />;
            case 'chronology':
                return <ChronologyTab 
                    appState={state}
                    onUpdateTimelineEvents={updateTimelineEvents}
                    onViewDocument={viewDocumentDetails} 
                />;
            case 'knowledge':
                return <KnowledgeBaseTab 
                    knowledgeItems={state.knowledgeItems} 
                    onUpdateKnowledgeItems={updateKnowledgeItems}
                    documents={state.documents} 
                    onViewDocument={viewDocumentDetails}
                />;
            case 'graph':
                return <GraphTab appState={state} />;
            case 'analysis':
                return <AnalysisTab appState={state} onPerformAnalysis={runFreeformAnalysis} />;
            case 'reports':
                return <ReportsTab onGenerateReport={generateReport} appState={state} />;
            case 'generation':
                return <GenerationTab onGenerateContent={generateContent} appState={state} onUpdateGeneratedDocuments={updateGeneratedDocuments} isLoading={state.isLoading && state.loadingSection === 'generation'} />;
            case 'library':
                return <LibraryTab 
                    generatedDocuments={state.generatedDocuments} 
                    documents={state.documents} 
                    onViewDocument={viewDocumentDetails} 
                />;
            case 'dispatch':
                return <DispatchTab 
                    dispatchDocument={state.dispatchDocument}
                    checklist={state.checklist}
                    onUpdateChecklist={updateChecklist}
                    onDraftBody={draftEmailBody}
                    onConfirmDispatch={() => {addNotification("Versand wurde erfolgreich protokolliert.", "success")}}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                    setActiveTab={setActiveTab}
                    documents={state.documents}
                    generatedDocuments={state.generatedDocuments}
                    coverLetter={state.coverLetter}
                    setCoverLetter={(val) => setState(s => s ? {...s, coverLetter: val} : null)}
                />;
            case 'strategy':
                return <StrategyTab risks={state.risks} onUpdateRisks={updateRisks} mitigationStrategies={state.mitigationStrategies} onGenerateMitigationStrategies={generateMitigationStrategies} isLoading={state.isLoading && state.loadingSection === 'strategy'} />;
            case 'argumentation':
                return <ArgumentationTab analysis={state.argumentationAnalysis} onGenerate={generateArgumentation} isLoading={state.isLoading && state.loadingSection === 'argumentation'} />;
            case 'kpis':
                return <KpisTab kpis={state.kpis} onUpdateKpis={updateKpis} onSuggestKpis={suggestKpis} isLoading={state.isLoading && state.loadingSection === 'kpis'} />;
            case 'un-submissions':
                return <UNSubmissionsTab appState={state} isLoading={state.isLoading} setIsLoading={(val) => setState(s => s ? {...s, isLoading: val} : null)} />;
            case 'hrd-support':
                 return <HRDSupportTab appState={state} isLoading={state.isLoading} setIsLoading={(val) => setState(s => s ? {...s, isLoading: val} : null)} />;
            case 'legal-basis':
                return <LegalBasisTab />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={state.ethicsAnalysis} onPerformAnalysis={performEthicsAnalysis} isLoading={state.isLoading && state.loadingSection === 'ethics'} />;
            case 'contradictions':
                return <ContradictionsTab 
                    contradictions={state.contradictions} 
                    documents={state.documents} 
                    onFindContradictions={findContradictions} 
                    isLoading={state.isLoading && state.loadingSection === 'contradictions'} 
                    onViewDocument={viewDocumentDetails}
                />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={state.agentActivity} />;
            case 'audit':
                return <AuditLogTab auditLog={state.auditLog} agentActivityLog={state.agentActivity} />;
            case 'settings':
                return <SettingsTab 
                    settings={state.settings} 
                    setSettings={updateSettings} 
                    tags={state.tags} 
                    onCreateTag={async (name) => { 
                        const newTag = {id: crypto.randomUUID(), name};
                        const newTags = [...state.tags, newTag];
                        setState(s => s ? {...s, tags: newTags} : s);
                        await storage.addTag(newTag);
                    }} 
                    onDeleteTag={async (id) => {
                        const newTags = state.tags.filter(t => t.id !== id);
                        setState(s => s ? {...s, tags: newTags}: s);
                        await storage.deleteTag(id);
                    }} 
                />;
            default:
                return <PlaceholderTab />;
        }
    };
    
    useEffect(() => {
        const load = async () => {
            await storage.initDB();
            const initialAppState: AppState = {
                activeTab: 'dashboard',
                documents: await storage.getAllDocuments(),
                generatedDocuments: await storage.getAllGeneratedDocuments(),
                caseEntities: await storage.getAllEntities(),
                knowledgeItems: await storage.getAllKnowledgeItems(),
                timelineEvents: await storage.getAllTimelineEvents(),
                tags: await storage.getAllTags(),
                contradictions: await storage.getAllContradictions(),
                caseContext: await storage.getCaseContext() || { caseDescription: '' },
                tasks: await storage.getAllTasks(),
                kpis: await storage.getAllKpis(),
                risks: await storage.getRisks() || { physical: false, legal: false, digital: false, intimidation: false, evidenceManipulation: false, secondaryTrauma: false, burnout: false, psychologicalBurden: false },
                caseSummary: await storage.getCaseSummary() || null,
                insights: await storage.getAllInsights(),
                agentActivity: await storage.getAllAgentActivities(),
                auditLog: await storage.getAllAuditLogEntries(),
                settings: await storage.getSettings() || { ai: { temperature: 0.7, topP: 0.95 }, complexity: { low: 5, medium: 15 } },
                ethicsAnalysis: await storage.getEthicsAnalysis() || null,
                documentAnalysisResults: (await storage.getAllDocumentAnalysisResults()).reduce((acc, curr) => ({...acc, [curr.docId]: curr.result}), {}),
                mitigationStrategies: (await storage.getMitigationStrategies())?.content || '',
                argumentationAnalysis: await storage.getArgumentationAnalysis() || null,
                isFocusMode: false,
                isLoading: false,
                loadingSection: '',
                suggestedEntities: await storage.getAllSuggestedEntities(),
                dispatchDocument: null,
                checklist: [],
                coverLetter: '',
                proactiveSuggestions: [],
                notifications: [],
            };
            setState(initialAppState);
        }
        load();
    }, []);
    
    // Generate proactive suggestions whenever key state aspects change
    useEffect(() => {
        if (state && !state.isLoading) {
            const suggestions = ProactiveSuggestionService.getSuggestions(state);
            if (JSON.stringify(suggestions) !== JSON.stringify(state.proactiveSuggestions)) {
                setState(s => s ? { ...s, proactiveSuggestions: suggestions } : null);
            }
        }
    }, [state?.documents, state?.contradictions, state?.risks, state?.caseEntities, state?.caseSummary, state?.isLoading]);


    if (!state) {
        return <div className="bg-gray-900 text-white h-screen flex items-center justify-center">Loading...</div>;
    }

    const detailDoc = detailDocId ? state.documents.find(d => d.id === detailDocId) : null;

    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex overflow-hidden">
            <NotificationContainer notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
            {!state.isFocusMode && <SidebarNav activeTab={state.activeTab} setActiveTab={setActiveTab} />}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-gray-800/50 border-b border-gray-700 p-2 flex justify-end">
                    <FocusModeSwitcher isFocusMode={state.isFocusMode} toggleFocusMode={toggleFocusMode} />
                </header>
                <div className="flex-1 overflow-y-auto p-6">
                    {renderTab()}
                </div>
            </main>
            {!state.isFocusMode && (
                <AssistantSidebar 
                    agentActivityLog={state.agentActivity} 
                    insights={state.insights}
                    onGenerateInsights={generateInsights}
                    isLoading={state.isLoading && state.loadingSection === 'insights'}
                    loadingSection={state.loadingSection}
                />
            )}
            {detailDoc && (
                 <DocumentDetailModal 
                    document={detailDoc} 
                    analysisResult={state.documentAnalysisResults[detailDoc.id] || null} 
                    onClose={() => setDetailDocId(null)}
                    onAddKnowledgeItem={addKnowledgeItem}
                    setActiveTab={setActiveTab}
                />
            )}
            <ProactiveAssistant
                suggestions={state.proactiveSuggestions}
                onExecute={handleExecuteSuggestion}
                onDismiss={handleDismissSuggestion}
            />
        </div>
    );
};

export default App;
