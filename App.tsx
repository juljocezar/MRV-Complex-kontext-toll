

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    AppState, Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag,
    Contradiction, CaseContext, Task, Risks, KPI, CaseSummary, Insight, AgentActivity,
    AuditLogEntry, AppSettings, EthicsAnalysis, DocumentAnalysisResult, SuggestedEntity,
    ArgumentationAnalysis, ChecklistItem, Notification, ActiveTab, ProactiveSuggestion,
    SuggestedKnowledgeChunk
} from './types';

// UI Components
import SidebarNav from './components/ui/SidebarNav';
import AssistantSidebar from './components/ui/AssistantSidebar';
import FocusModeSwitcher from './components/ui/FocusModeSwitcher';
import NotificationContainer from './components/ui/NotificationContainer';
import ProactiveAssistant from './components/ui/ProactiveAssistant';
import GlobalSearch from './components/ui/GlobalSearch';

// Tabs
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
import QuickCaptureTab from './components/tabs/QuickCaptureTab';
import AnalyseDocTab from './components/tabs/AnalyseDocTab';
import StatusDocTab from './components/tabs/StatusDocTab';
import PlaceholderTab from './components/tabs/PlaceholderTab';


// Modals
import DocumentDetailModal from './components/modals/DocumentDetailModal';
import SearchResultsModal from './components/modals/SearchResultsModal';
import KnowledgeChunkingModal from './components/modals/KnowledgeChunkingModal';

// Services
import * as storageService from './services/storageService';
import { OrchestrationService } from './services/orchestrationService';
import { CaseAnalyzerService } from './services/caseAnalyzerService';
import { ContradictionDetectorService } from './services/contradictionDetectorService';
import { InsightService } from './services/insightService';
import { KpiService } from './services/kpiService';
import { StrategyService } from './services/strategyService';
import { EthicsService } from './services/ethicsService';
import { ArgumentationService } from './services/argumentationService';
import { EntityRelationshipService } from './services/entityRelationshipService';
import { ContentCreatorService } from './services/contentCreator';
import { KnowledgeService } from './services/knowledgeService';
import { SearchService } from './services/searchService';
import { ProactiveSuggestionService } from './services/proactiveSuggestionService';

// Utils
import { extractFileContent } from './utils/fileUtils';
import { hashText } from './utils/cryptoUtils';
import { buildCaseContext } from './utils/contextUtils';

const initialState: AppState = {
    activeTab: 'dashboard',
    documents: [],
    generatedDocuments: [],
    caseEntities: [],
    knowledgeItems: [],
    timelineEvents: [],
    tags: [],
    contradictions: [],
    caseContext: { caseDescription: '' },
    tasks: [],
    kpis: [],
    risks: { physical: false, legal: false, digital: false, intimidation: false, evidenceManipulation: false, secondaryTrauma: false, burnout: false, psychologicalBurden: false },
    caseSummary: null,
    insights: [],
    agentActivity: [],
    auditLog: [],
    settings: { ai: { temperature: 0.5, topP: 0.95 }, complexity: { low: 20, medium: 50 } },
    ethicsAnalysis: null,
    documentAnalysisResults: {},
    mitigationStrategies: '',
    argumentationAnalysis: null,
    isFocusMode: false,
    isLoading: true,
    loadingSection: 'Initialisierung',
    analyzingDocId: null,
    suggestedEntities: [],
    dispatchDocument: null,
    checklist: [
        { id: 'c1', text: 'Inhalt final geprüft', checked: false },
        { id: 'c2', text: 'Empfänger verifiziert', checked: false },
        { id: 'c3', text: 'Anhänge korrekt', checked: false },
        { id: 'c4', text: 'Interne Freigabe erhalten', checked: false },
    ],
    coverLetter: '',
    proactiveSuggestions: [],
    notifications: [],
    analysisQueue: [],
};


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(initialState);
    const [isProcessingQueue, setIsProcessingQueue] = useState(false);
    const [viewingDocId, setViewingDocId] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchService = useRef(new SearchService());

    const [chunkingModalState, setChunkingModalState] = useState<{ isOpen: boolean, docName: string, suggestions: SuggestedKnowledgeChunk[] }>({ isOpen: false, docName: '', suggestions: [] });

    // --- Core State & Data Management ---

    const addNotification = useCallback((message: string, type: Notification['type'] = 'info', duration = 5000, details?: string) => {
        const id = crypto.randomUUID();
        setAppState(prev => ({
            ...prev,
            notifications: [...prev.notifications, { id, message, type, details }]
        }));
        setTimeout(() => {
            setAppState(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== id)
            }));
        }, duration);
    }, []);

    const addAgentActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>): string => {
        const id = crypto.randomUUID();
        const newActivity = { ...activity, id, timestamp: new Date().toISOString() };
        setAppState(prev => {
            const updatedLog = [newActivity, ...prev.agentActivity];
            storageService.addAgentActivity(newActivity);
            return { ...prev, agentActivity: updatedLog };
        });
        return id;
    }, []);

    const updateAgentActivity = useCallback((id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => {
        setAppState(prev => {
            const updatedLog = prev.agentActivity.map(act => act.id === id ? { ...act, ...updates } : act);
            const activityToUpdate = updatedLog.find(act => act.id === id);
            if (activityToUpdate) {
                storageService.updateAgentActivity(activityToUpdate);
            }
            return { ...prev, agentActivity: updatedLog };
        });
    }, []);
    
    // --- Data Loading and Initialization ---
    useEffect(() => {
        const loadData = async () => {
            await storageService.initDB();
            const [
                docs, genDocs, entities, knowledge, timeline, tags, contradictions, context,
                tasks, kpis, risks, summary, insights, agentActivity, audit, settings,
                ethics, docAnalysis, mitigation, argumentation, suggestedEntities,
            ] = await Promise.all([
                storageService.getAllDocuments(), storageService.getAllGeneratedDocuments(), storageService.getAllEntities(),
                storageService.getAllKnowledgeItems(), storageService.getAllTimelineEvents(), storageService.getAllTags(),
                storageService.getAllContradictions(), storageService.getCaseContext(), storageService.getAllTasks(),
                storageService.getAllKpis(), storageService.getRisks(), storageService.getCaseSummary(),
                storageService.getAllInsights(), storageService.getAllAgentActivities(), storageService.getAllAuditLogEntries(),
                storageService.getSettings(), storageService.getEthicsAnalysis(), storageService.getAllDocumentAnalysisResults(),
                storageService.getMitigationStrategies(), storageService.getArgumentationAnalysis(), storageService.getAllSuggestedEntities(),
            ]);

            const analysisResultsMap = docAnalysis.reduce((acc, item) => {
                acc[item.docId] = item.result;
                return acc;
            }, {} as { [docId: string]: DocumentAnalysisResult });

            setAppState(prev => ({
                ...prev,
                documents: docs || [],
                generatedDocuments: genDocs || [],
                caseEntities: entities || [],
                knowledgeItems: knowledge || [],
                timelineEvents: timeline || [],
                tags: tags || [],
                contradictions: contradictions || [],
                caseContext: context || prev.caseContext,
                tasks: tasks || [],
                kpis: kpis || [],
                risks: risks || prev.risks,
                caseSummary: summary || null,
                insights: insights || [],
                agentActivity: agentActivity || [],
                auditLog: audit || [],
                settings: settings || prev.settings,
                ethicsAnalysis: ethics || null,
                documentAnalysisResults: analysisResultsMap,
                mitigationStrategies: mitigation?.content || '',
                argumentationAnalysis: argumentation || null,
                suggestedEntities: suggestedEntities || [],
                isLoading: false,
                loadingSection: '',
            }));
        };
        loadData();
    }, []);

    // Proactive suggestions effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!appState.isLoading) {
                const suggestions = ProactiveSuggestionService.getSuggestions(appState);
                setAppState(prev => ({ ...prev, proactiveSuggestions: suggestions }));
            }
        }, 2000); // Delay to avoid showing suggestions immediately on load
        return () => clearTimeout(timer);
    }, [appState.activeTab, appState.isLoading, appState.documents, appState.contradictions, appState.risks, appState.caseSummary, appState.caseEntities]);


    const setActiveTab = (tab: ActiveTab) => {
        setAppState(prev => ({ ...prev, activeTab: tab }));
    };

    // --- Document Handling and Orchestration ---

    const handleAddNewDocument = useCallback(async (file: File) => {
        try {
            const { text, base64, mimeType } = await extractFileContent(file);
            const docId = await hashText(file.name + file.size + file.lastModified);

            if (appState.documents.some(d => d.id === docId)) {
                addNotification(`Dokument "${file.name}" existiert bereits.`, 'info');
                return;
            }

            const newDoc: Document = {
                id: docId,
                name: file.name,
                content: text || base64 || '',
                textContent: text,
                base64Content: base64,
                mimeType,
                classificationStatus: 'queued',
                tags: [],
                createdAt: new Date().toISOString(),
            };
            
            setAppState(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc],
                analysisQueue: [...prev.analysisQueue, newDoc.id]
            }));
            await storageService.addDocument(newDoc);
            addNotification(`"${file.name}" hinzugefügt und in Warteschlange.`, 'success');

        } catch (error) {
            console.error(error);
            addNotification('Fehler beim Hinzufügen des Dokuments.', 'error');
        }
    }, [appState.documents, addNotification]);

    const handleQueueDocumentsForAnalysis = useCallback((docIds: string[]) => {
        setAppState(prev => ({
            ...prev,
            documents: prev.documents.map(d => docIds.includes(d.id) ? { ...d, classificationStatus: 'queued' } : d),
            analysisQueue: [...new Set([...prev.analysisQueue, ...docIds])]
        }));
        addNotification(`${docIds.length} Dokument(e) zur Analyse in die Warteschlange gestellt.`, 'info');
    }, []);

     // Analysis Queue Processor
    useEffect(() => {
        const processQueue = async () => {
            if (isProcessingQueue || appState.analysisQueue.length === 0) return;

            setIsProcessingQueue(true);
            const docId = appState.analysisQueue[0];
            const docToProcess = appState.documents.find(d => d.id === docId);

            if (!docToProcess) {
                setAppState(prev => ({ ...prev, analysisQueue: prev.analysisQueue.slice(1) }));
                setIsProcessingQueue(false);
                return;
            }

            // Set status to analyzing
            setAppState(prev => ({...prev, documents: prev.documents.map(d => d.id === docId ? {...d, classificationStatus: 'analyzing'} : d)}));

            const result = await OrchestrationService.handleNewDocument(docToProcess, appState, addAgentActivity, updateAgentActivity, addNotification);

            if (result) {
                setAppState(prev => {
                    const newTags = [...prev.tags];
                    result.newGlobalTags.forEach(tagName => {
                        if (!newTags.some(t => t.name === tagName)) {
                            newTags.push({ id: crypto.randomUUID(), name: tagName });
                        }
                    });
                    
                    storageService.saveAllTags(newTags);
                    storageService.addMultipleContradictions(result.newContradictions);
                    storageService.addMultipleInsights(result.newInsights);
                    storageService.addMultipleKnowledgeItems(result.newKnowledgeItems);
                    storageService.addMultipleTimelineEvents(result.newTimelineEvents);
                    storageService.addMultipleSuggestedEntities(result.newSuggestedEntities);
                    storageService.updateDocument(result.updatedDoc);
                    storageService.saveDocumentAnalysisResult(result.updatedDoc.id, result.analysisResult);


                    return {
                        ...prev,
                        documents: prev.documents.map(d => d.id === docId ? result.updatedDoc : d),
                        documentAnalysisResults: { ...prev.documentAnalysisResults, [docId]: result.analysisResult },
                        suggestedEntities: [...prev.suggestedEntities, ...result.newSuggestedEntities],
                        tags: newTags,
                        contradictions: [...prev.contradictions, ...result.newContradictions],
                        insights: [...prev.insights, ...result.newInsights],
                        knowledgeItems: [...prev.knowledgeItems, ...result.newKnowledgeItems],
                        timelineEvents: [...prev.timelineEvents, ...result.newTimelineEvents],
                        analysisQueue: prev.analysisQueue.slice(1)
                    };
                });
            } else {
                 setAppState(prev => ({
                    ...prev,
                    documents: prev.documents.map(d => d.id === docId ? { ...d, classificationStatus: 'error' } : d),
                    analysisQueue: prev.analysisQueue.slice(1)
                }));
            }
            
            setIsProcessingQueue(false);
        };

        processQueue();
    }, [appState, isProcessingQueue, addAgentActivity, updateAgentActivity, addNotification]);

    const handleDecomposeDocument = useCallback(async (docId: string) => {
        const doc = appState.documents.find(d => d.id === docId);
        if (!doc) return;

        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'decomposing' }));
        try {
            const chunks = await KnowledgeService.suggestChunksFromDocument(doc, appState.settings.ai);
            setChunkingModalState({ isOpen: true, docName: doc.name, suggestions: chunks.map(c => ({...c, selected: true})) });
        } catch (error) {
            addNotification('Fehler beim Zerlegen des Dokuments.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState.documents, appState.settings.ai, addNotification]);

    const handleAcceptKnowledgeChunks = useCallback((chunks: SuggestedKnowledgeChunk[]) => {
        const acceptedChunks = chunks.filter(c => c.selected);
        const newItems: KnowledgeItem[] = acceptedChunks.map(chunk => ({
            id: crypto.randomUUID(),
            title: chunk.title,
            summary: chunk.summary,
            sourceDocId: appState.documents.find(d => d.name === chunkingModalState.docName)!.id,
            createdAt: new Date().toISOString(),
            tags: ['KI-extrahiert']
        }));

        setAppState(prev => ({
            ...prev,
            knowledgeItems: [...prev.knowledgeItems, ...newItems]
        }));
        storageService.addMultipleKnowledgeItems(newItems);
        setChunkingModalState({ isOpen: false, docName: '', suggestions: [] });
        addNotification(`${newItems.length} Wissensbausteine hinzugefügt.`, 'success');
        setActiveTab('knowledge');
    }, [appState.documents, chunkingModalState.docName, addNotification]);

    // --- AI Analysis Handlers ---
    
    const handlePerformOverallAnalysis = useCallback(async () => {
        setAppState(prev => ({...prev, isLoading: true, loadingSection: 'case_analysis'}));
        try {
            const summary = await CaseAnalyzerService.performOverallAnalysis(appState);
            setAppState(prev => ({...prev, caseSummary: summary}));
            storageService.saveCaseSummary(summary);
            addNotification('Gesamtanalyse abgeschlossen.', 'success');
        } catch(e) {
            addNotification('Gesamtanalyse fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({...prev, isLoading: false, loadingSection: ''}));
        }
    }, [appState, addNotification]);
    
    const handleGenerateInsights = useCallback(async () => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'insights' }));
        try {
            const insights = await InsightService.generateInsights(appState);
            setAppState(prev => ({ ...prev, insights: [...prev.insights, ...insights] }));
            storageService.addMultipleInsights(insights);
            addNotification(`${insights.length} neue Einblicke generiert.`, 'success');
        } catch (error) {
            addNotification('Generierung von Einblicken fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);

    const handlePerformAnalysisStream = useCallback(async (prompt: string, isGrounded: boolean, onChunk: (chunk: string) => void) => {
        return CaseAnalyzerService.runFreeformQueryStream(prompt, appState, isGrounded, searchService.current.search.bind(searchService.current), onChunk);
    }, [appState]);

    const handleGenerateContentStream = useCallback(async (params: any) => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'generation' }));
        let generatedDocs: GeneratedDocument[] = [];
        try {
            const fullContext = buildCaseContext(appState);
            const fullParams = { ...params, caseContext: fullContext };

            const handleStream = async (lang: 'de' | 'en'): Promise<GeneratedDocument> => {
                let accumulatedText = "";
                const streamParams = { ...fullParams, language: lang };
                const fullResponse = await ContentCreatorService.createContentStream(streamParams, appState.settings.ai, (chunk) => {
                    accumulatedText += chunk;
                });
                const htmlContent = await new (await import('marked')).marked(fullResponse);
                const version = params.versionChainId ? (appState.generatedDocuments.find(d => d.versionChainId === params.versionChainId)?.version || 0) + 1 : 1;
                
                return {
                    id: crypto.randomUUID(),
                    title: `${params.templateName || 'Generiertes Dokument'} (${lang.toUpperCase()})`,
                    content: fullResponse,
                    htmlContent,
                    createdAt: new Date().toISOString(),
                    templateUsed: params.templateName,
                    sourceDocIds: params.sourceDocuments.map((d: Document) => d.id),
                    language: lang,
                    version: version,
                    versionChainId: params.versionChainId || crypto.randomUUID(),
                };
            };
            
            if (params.isBilingual) {
                const [deDoc, enDoc] = await Promise.all([handleStream('de'), handleStream('en')]);
                // Link them by version chain
                const chainId = deDoc.versionChainId;
                enDoc.versionChainId = chainId;
                generatedDocs = [deDoc, enDoc];
            } else {
                generatedDocs = [await handleStream('de')];
            }

            setAppState(prev => ({ ...prev, generatedDocuments: [...prev.generatedDocuments, ...generatedDocs] }));
            storageService.addMultiple(storageService.STORES.generatedDocuments, generatedDocs);

            return generatedDocs;
        } catch (error) {
            addNotification('Fehler bei der Dokumentengenerierung.', 'error');
            return null;
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);
    
    // --- Other Handlers ---
    
    const handleUpdateRisks = useCallback((risks: Risks) => {
        setAppState(prev => ({...prev, risks}));
        storageService.saveRisks(risks);
    }, []);

    const handleFindContradictions = useCallback(async () => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'contradictions' }));
        try {
            const contradictions = await ContradictionDetectorService.findContradictions(appState);
            setAppState(prev => ({ ...prev, contradictions }));
            storageService.saveAllContradictions(contradictions);
            addNotification(`Analyse abgeschlossen. ${contradictions.length} Widersprüche gefunden.`, 'success');
        } catch (error) {
            addNotification('Widerspruchsanalyse fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);
    
    const handleGenerateArguments = useCallback(async () => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'argumentation' }));
        try {
            const analysis = await ArgumentationService.generateArguments(appState);
            setAppState(prev => ({ ...prev, argumentationAnalysis: analysis }));
            storageService.saveArgumentationAnalysis(analysis);
        } catch (error) {
            addNotification('Argumentationsanalyse fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);

    const handleRunAdversarialAnalysis = useCallback(async () => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'adversarial_analysis' }));
        try {
            const adversarial = await ArgumentationService.runAdversarialAnalysis(appState);
            setAppState(prev => ({
                ...prev,
                argumentationAnalysis: prev.argumentationAnalysis ? { ...prev.argumentationAnalysis, adversarialAnalysis: adversarial } : null,
            }));
            if (appState.argumentationAnalysis) {
                storageService.saveArgumentationAnalysis({ ...appState.argumentationAnalysis, adversarialAnalysis: adversarial });
            }
        } catch (error) {
            addNotification('Stresstest fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);
    
    const handleAnalyzeRelationships = useCallback(async () => {
        setAppState(prev => ({ ...prev, isLoading: true, loadingSection: 'relationships' }));
        try {
            const context = buildCaseContext(appState);
            const results = await EntityRelationshipService.analyzeRelationships(appState.caseEntities, context, appState.settings.ai);
            
            // Fix: Refactored to use an immutable update pattern, which resolves type inference issues.
            // A map of entity IDs to their new relationships is created for efficient lookup.
            const resultsMap = new Map(results.map(r => [r.entityId, r.relationships]));

            // A new array of entities is created. For each entity, if new relationships are found,
            // a new entity object is created with the updated relationships.
            const updatedEntities = appState.caseEntities.map(entity => {
                const newRelationships = resultsMap.get(entity.id);
                if (newRelationships) {
                    return { ...entity, relationships: newRelationships };
                }
                return entity;
            });

            setAppState(prev => ({ ...prev, caseEntities: updatedEntities }));
            storageService.saveAllEntities(updatedEntities);
            addNotification('Beziehungsgeflecht analysiert.', 'success');
        } catch (error) {
            addNotification('Beziehungsanalyse fehlgeschlagen.', 'error');
        } finally {
            setAppState(prev => ({ ...prev, isLoading: false, loadingSection: '' }));
        }
    }, [appState, addNotification]);

    const handleSearch = useCallback((query: string) => {
        if (!query) {
            setIsSearchOpen(false);
            return;
        }
        searchService.current.buildIndex(appState);
        const results = searchService.current.search(query);
        setSearchResults(results);
        setIsSearchOpen(true);
    }, [appState]);

    const renderActiveTab = () => {
        switch (appState.activeTab) {
            case 'dashboard':
                return <DashboardTab appState={appState} setActiveTab={setActiveTab} onPerformOverallAnalysis={handlePerformOverallAnalysis} setCaseDescription={(desc) => setAppState(prev => ({ ...prev, caseContext: { ...prev.caseContext, caseDescription: desc } }))} onResetCase={() => { if (window.confirm('Wirklich alle Daten löschen?')) { storageService.clearDB().then(() => setAppState(initialState)); } }} onExportCase={async () => { const json = await storageService.exportStateToJSON(); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mrv-assistant-export.json'; a.click(); URL.revokeObjectURL(url); }} onImportCase={async (file) => { const text = await file.text(); await storageService.importStateFromJSON(text); window.location.reload(); }} addNotification={addNotification} onViewDocumentDetails={setViewingDocId} />;
            case 'documents':
                return <DocumentsTab appState={appState} onAddNewDocument={handleAddNewDocument} onQueueDocumentsForAnalysis={handleQueueDocumentsForAnalysis} onDecomposeDocument={handleDecomposeDocument} onUpdateDocument={(doc) => { setAppState(prev => ({...prev, documents: prev.documents.map(d => d.id === doc.id ? doc : d)})); storageService.updateDocument(doc); }} onUpdateTags={(tags) => { setAppState(prev => ({...prev, tags})); storageService.saveAllTags(tags); }} addKnowledgeItem={(item) => { const newItem = {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()}; setAppState(prev => ({...prev, knowledgeItems: [...prev.knowledgeItems, newItem]})); storageService.addKnowledgeItem(newItem); }} setActiveTab={setActiveTab} addNotification={addNotification} onViewDocumentDetails={setViewingDocId} />;
            case 'entities':
                return <EntitiesTab appState={appState} entities={appState.caseEntities} onUpdateEntities={(entities) => {setAppState(prev => ({...prev, caseEntities: entities})); storageService.saveAllEntities(entities); }} documents={appState.documents} suggestedEntities={appState.suggestedEntities} onAcceptSuggestedEntity={(id) => { const entity = appState.suggestedEntities.find(e => e.id === id); if(entity) { const newEntity: CaseEntity = { ...entity, id: crypto.randomUUID() }; setAppState(prev => ({...prev, caseEntities: [...prev.caseEntities, newEntity], suggestedEntities: prev.suggestedEntities.filter(e => e.id !== id) })); storageService.addEntity(newEntity); storageService.deleteSuggestedEntity(id); } }} onDismissSuggestedEntity={(id) => { setAppState(prev => ({...prev, suggestedEntities: prev.suggestedEntities.filter(e => e.id !== id)})); storageService.deleteSuggestedEntity(id); }} onAnalyzeRelationships={handleAnalyzeRelationships} isLoading={appState.isLoading} loadingSection={appState.loadingSection}/>;
            case 'chronology':
                return <ChronologyTab appState={appState} onUpdateTimelineEvents={(events) => { setAppState(prev => ({...prev, timelineEvents: events})); storageService.saveAllTimelineEvents(events); }} onViewDocument={setViewingDocId} />;
            case 'knowledge':
                 return <KnowledgeBaseTab knowledgeItems={appState.knowledgeItems} onUpdateKnowledgeItems={(items) => { setAppState(prev => ({...prev, knowledgeItems: items})); storageService.saveAllKnowledgeItems(items); }} documents={appState.documents} onViewDocument={setViewingDocId} />;
            case 'graph':
                return <GraphTab appState={appState} />;
            case 'analysis':
                return <AnalysisTab appState={state} addAgentActivity={addAgentActivity} setAppState={setState} />;
            case 'reports':
                return <ReportsTab appState={appState} onGenerateReport={async (prompt, schema) => { setAppState(prev => ({...prev, isLoading: true, loadingSection: 'reports'})); const report = await CaseAnalyzerService.runFreeformQueryStream(prompt, appState, false, () => [], () => {}); setAppState(prev => ({...prev, isLoading: false, loadingSection: ''})); return report; }}/>;
            case 'generation':
                return <GenerationTab appState={state} addAgentActivity={addAgentActivity} setAppState={setState} />;
                return <GenerationTab onGenerateContentStream={handleGenerateContentStream} appState={appState} onUpdateGeneratedDocuments={(docs) => { setAppState(prev => ({...prev, generatedDocuments: docs})); storageService.saveAllGeneratedDocuments(docs);}} isLoading={appState.isLoading && appState.loadingSection === 'generation'} onPrepareDispatch={(doc) => { setAppState(prev => ({...prev, dispatchDocument: doc})); setActiveTab('dispatch'); }}/>;
            case 'library':
                return <LibraryTab generatedDocuments={appState.generatedDocuments} documents={appState.documents} onViewDocument={setViewingDocId} />;
            case 'dispatch':
                return <DispatchTab dispatchDocument={appState.dispatchDocument} checklist={appState.checklist} onUpdateChecklist={(cl) => setAppState(prev => ({...prev, checklist: cl}))} onDraftBody={async (subject, attachments) => { /* TODO */ return "Email body drafted by AI."; }} onConfirmDispatch={() => addNotification("Dispatch logged.", "success")} isLoading={appState.isLoading} loadingSection={appState.loadingSection} setActiveTab={setActiveTab} documents={appState.documents} generatedDocuments={appState.generatedDocuments} coverLetter={appState.coverLetter} setCoverLetter={(val) => setAppState(prev => ({...prev, coverLetter: val}))} />;
            case 'strategy':
                return <StrategyTab risks={appState.risks} onUpdateRisks={handleUpdateRisks} mitigationStrategies={appState.mitigationStrategies} onGenerateMitigationStrategies={async () => { setAppState(prev => ({...prev, isLoading: true, loadingSection: 'strategy'})); const strats = await StrategyService.generateMitigationStrategies(appState); setAppState(prev => ({...prev, mitigationStrategies: strats})); storageService.saveMitigationStrategies(strats); setAppState(prev => ({...prev, isLoading: false, loadingSection: ''})); }} isLoading={appState.isLoading && appState.loadingSection === 'strategy'} />;
            case 'argumentation':
                return <ArgumentationTab analysis={appState.argumentationAnalysis} onGenerate={handleGenerateArguments} onRunAdversarial={handleRunAdversarialAnalysis} isLoading={appState.isLoading} loadingSection={appState.loadingSection} />;
            case 'kpis':
                return <KpisTab kpis={appState.kpis} onUpdateKpis={(kpis) => {setAppState(prev => ({...prev, kpis})); storageService.saveAllKpis(kpis); }} onSuggestKpis={async () => { setAppState(prev => ({...prev, isLoading: true, loadingSection: 'kpis'})); const kpis = await KpiService.suggestKpis(appState); setAppState(prev => ({...prev, kpis: [...prev.kpis, ...kpis]})); storageService.addMultipleKpis(kpis); setAppState(prev => ({...prev, isLoading: false, loadingSection: ''})); }} isLoading={appState.isLoading && appState.loadingSection === 'kpis'} />;
            case 'un-submissions':
                return <UNSubmissionsTab appState={appState} isLoading={appState.isLoading} setIsLoading={(l) => setAppState(prev => ({...prev, isLoading: l}))} />;
            case 'hrd-support':
                return <HRDSupportTab appState={appState} isLoading={appState.isLoading} setIsLoading={(l) => setAppState(prev => ({...prev, isLoading: l}))}/>;
            case 'legal-basis':
                return <LegalBasisTab />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={appState.ethicsAnalysis} onPerformAnalysis={async () => { setAppState(prev => ({...prev, isLoading: true, loadingSection: 'ethics'})); const analysis = await EthicsService.performAnalysis(appState); setAppState(prev => ({...prev, ethicsAnalysis: analysis})); storageService.saveEthicsAnalysis(analysis); setAppState(prev => ({...prev, isLoading: false, loadingSection: ''})); }} isLoading={appState.isLoading && appState.loadingSection === 'ethics'} />;
            case 'contradictions':
                return <ContradictionsTab contradictions={appState.contradictions} documents={appState.documents} onFindContradictions={handleFindContradictions} isLoading={appState.isLoading && appState.loadingSection === 'contradictions'} onViewDocument={setViewingDocId} onAddRiskNotification={(c) => { addNotification(`Contradiction between ${c.source1DocId} and ${c.source2DocId} flagged as potential risk.`, 'info'); setActiveTab('strategy'); }} />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={appState.agentActivity} />;
            case 'audit':
                return <AuditLogTab auditLog={appState.auditLog} agentActivityLog={appState.agentActivity} />;
            case 'settings':
                return <SettingsTab settings={appState.settings} setSettings={(s) => {setAppState(prev => ({...prev, settings: s})); storageService.saveSettings(s);}} tags={appState.tags} onCreateTag={(name) => { const newTag = {id: crypto.randomUUID(), name}; setAppState(prev => ({...prev, tags: [...prev.tags, newTag]})); storageService.addTag(newTag); }} onDeleteTag={(id) => { setAppState(prev => ({...prev, tags: prev.tags.filter(t => t.id !== id)})); storageService.deleteTag(id);}} />;
            case 'schnellerfassung':
                 return <QuickCaptureTab appState={appState} onSaveSnippet={async (text, analysis) => { const newItem: KnowledgeItem = { id: crypto.randomUUID(), title: analysis.suggestedTitle, summary: text, sourceDocId: 'schnellerfassung', createdAt: new Date().toISOString(), tags: analysis.suggestedTags }; setAppState(prev => ({...prev, knowledgeItems: [...prev.knowledgeItems, newItem]})); storageService.addKnowledgeItem(newItem); addNotification('Snippet als Wissenseintrag gespeichert.', 'success'); setActiveTab('knowledge'); }} />;
            case 'architecture-analysis':
                return <AnalyseDocTab />;
            case 'status':
                return <StatusDocTab />;
            default:
                return <PlaceholderTab />;
        }
    };

    if (appState.isLoading && appState.loadingSection === 'Initialisierung') {
        return <div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">Lade Anwendung...</div>;
    }

    const viewingDoc = viewingDocId ? appState.documents.find(d => d.id === viewingDocId) : null;
    const viewingDocAnalysis = viewingDocId ? appState.documentAnalysisResults[viewingDocId] || null : null;

    return (
        <div className={`h-screen w-screen bg-gray-900 text-gray-200 flex ${appState.isFocusMode ? 'flex-col' : ''}`}>
            {!appState.isFocusMode && <SidebarNav activeTab={appState.activeTab} setActiveTab={setActiveTab} />}

            <div className="flex-grow flex flex-col overflow-hidden">
                <header className="flex-shrink-0 bg-gray-800/50 border-b border-gray-700 p-2 flex items-center justify-between">
                    <GlobalSearch onSearch={handleSearch} />
                    <FocusModeSwitcher isFocusMode={appState.isFocusMode} toggleFocusMode={() => setAppState(prev => ({...prev, isFocusMode: !prev.isFocusMode}))} />
                </header>
                <main className="flex-grow p-6 overflow-y-auto">
                    {renderActiveTab()}
                </main>
            </div>

            {!appState.isFocusMode && (
                <AssistantSidebar
                    agentActivityLog={appState.agentActivity}
                    insights={appState.insights}
                    onGenerateInsights={handleGenerateInsights}
                    isLoading={appState.isLoading && appState.loadingSection === 'insights'}
                    loadingSection={appState.loadingSection}
                />
            )}
            
            {/* --- Modals & Overlays --- */}
            {viewingDoc && (
                <DocumentDetailModal
                    document={viewingDoc}
                    analysisResult={viewingDocAnalysis}
                    onClose={() => setViewingDocId(null)}
                    onAddKnowledgeItem={(item) => { const newItem = {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()}; setAppState(prev => ({...prev, knowledgeItems: [...prev.knowledgeItems, newItem]})); storageService.addKnowledgeItem(newItem); }}
                    setActiveTab={setActiveTab}
                />
            )}
            
            {isSearchOpen && (
                <SearchResultsModal
                    results={searchResults}
                    onClose={() => setIsSearchOpen(false)}
                    onResultClick={(result) => {
                        if (result.type === 'Document') setViewingDocId(result.id);
                        if (result.type === 'Entity') setActiveTab('entities');
                        if (result.type === 'Knowledge') setActiveTab('knowledge');
                        setIsSearchOpen(false);
                    }}
                />
            )}
            
            <NotificationContainer
                notifications={appState.notifications}
                onDismiss={(id) => setAppState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }))}
            />

            <ProactiveAssistant
                suggestions={appState.proactiveSuggestions}
                onExecute={(suggestion) => {
                    if (suggestion.action.type === 'navigate') {
                        setActiveTab(suggestion.action.payload);
                    }
                    setAppState(prev => ({...prev, proactiveSuggestions: prev.proactiveSuggestions.filter(s => s.id !== suggestion.id)}));
                }}
                onDismiss={(id) => setAppState(prev => ({...prev, proactiveSuggestions: prev.proactiveSuggestions.filter(s => s.id !== id)}))}
            />

            <KnowledgeChunkingModal
                isOpen={chunkingModalState.isOpen}
                documentName={chunkingModalState.docName}
                suggestions={chunkingModalState.suggestions}
                onClose={() => setChunkingModalState({isOpen: false, docName: '', suggestions: []})}
                onAccept={handleAcceptKnowledgeChunks}
            />

        </div>
    );
};

export default App;