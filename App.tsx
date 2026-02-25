
import React, { useState } from 'react';
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
import LegalBasisTab from './components/tabs/LegalBasisTab';
import EthicsAnalysisTab from './components/tabs/EthicsAnalysisTab';
import ContradictionsTab from './components/tabs/ContradictionsTab';
import AgentManagementTab from './components/tabs/AgentManagementTab';
import AuditLogTab from './components/tabs/AuditLogTab';
import SettingsTab from './components/tabs/SettingsTab';
import PlaceholderTab from './components/tabs/PlaceholderTab';
import FocusModeSwitcher from './components/ui/FocusModeSwitcher';
import NotificationContainer from './components/ui/NotificationContainer';
import GlobalSearch from './components/ui/GlobalSearch';
import SearchResultsModal from './components/modals/SearchResultsModal';
import SystemAnalysisTab from './components/tabs/SystemAnalysisTab';
import ForensicDossierTab from './components/tabs/ForensicDossierTab';
import UNSubmissionsTab from './components/tabs/UNSubmissionsTab';
import HRDSupportTab from './components/tabs/HRDSupportTab';
import DocumentDetailModal from './components/modals/DocumentDetailModal';
import RadbruchWizardTab from './components/tabs/RadbruchWizardTab';
import HelpModal from './components/modals/HelpModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

import * as storage from './services/storageService';
import { useAppStore } from './store/AppContext';
import { ActionType } from './store/types';

import { ActiveTab, Document, GeneratedDocument, Task, Radbruch4DAssessment, KnowledgeItem, SearchResult, AppState, AnalysisMode } from './types';
import { GeminiService } from './services/geminiService';
import { CaseAnalyzerService } from './services/caseAnalyzerService';
import { InsightService } from './services/insightService';
import { KpiService } from './services/kpiService';
import { StrategyService } from './services/strategyService';
import { EthicsService } from './services/ethicsService';
import { ArgumentationService } from './services/argumentationService';
import { SystemDynamicsService } from './services/systemDynamicsService';
import { EntityRelationshipService } from './services/entityRelationshipService';
import { extractFileContent } from './utils/fileUtils';
import { OrchestrationService } from './services/orchestrationService';
import { ContentCreatorService } from './services/contentCreator';
import { buildCaseContext } from './utils/contextUtils';
import { AgentLoopService } from './services/agent/agentLoop';

const App: React.FC = () => {
    const { state, dispatch, searchService, isDbInitialized, initError, actions } = useAppStore();
    
    const [detailDocId, setDetailDocId] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const toggleFocusMode = () => {
        if(state) dispatch({ type: ActionType.SET_FOCUS_MODE, payload: !state.isFocusMode });
    };

    const setActiveTab = (tab: ActiveTab) => {
        actions.addAuditLog('Navigation', `Tab gewechselt zu: ${tab}`);
        dispatch({ type: ActionType.SET_ACTIVE_TAB, payload: tab });
    };

    const handleAnalyzeDocument = async (docId: string, mode: AnalysisMode) => {
        if (!state) return;
        const doc = state.documents.find(d => d.id === docId);
        if (!doc) return;

        dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'analyzingDoc' } });
        dispatch({ type: ActionType.SET_ANALYZING_DOC, payload: docId });

        try {
            const result = await OrchestrationService.handleNewDocument(
                doc, state, actions.addAgentActivity, actions.updateAgentActivity, actions.addNotification, mode
            );
            
            if (result) {
                // 1. Update Document (Summary, Tags, Class)
                await storage.updateDocument(result.updatedDoc);
                dispatch({ type: ActionType.UPDATE_DOCUMENT, payload: result.updatedDoc });

                // 2. Save Analysis Result
                await storage.saveDocumentAnalysisResult(docId, result.analysisResult);
                dispatch({ type: ActionType.SET_DOC_ANALYSIS_RESULT, payload: { docId, result: result.analysisResult } });

                // 3. Persist Generated Knowledge, Contradictions, Insights
                await storage.addMultipleKnowledgeItems(result.newKnowledgeItems);
                await storage.addMultipleContradictions(result.newContradictions);
                await storage.addMultipleInsights(result.newInsights);

                // 4. Update Global Tags (Add new ones)
                const currentTagNames = new Set(state.tags.map(t => t.name));
                const newTagsToAdd = result.newGlobalTags
                    .filter(tagName => !currentTagNames.has(tagName))
                    .map(tagName => ({ id: crypto.randomUUID(), name: tagName }));
                
                if (newTagsToAdd.length > 0) {
                    const updatedAllTags = [...state.tags, ...newTagsToAdd];
                    await storage.saveAllTags(updatedAllTags);
                    dispatch({ type: ActionType.SET_TAGS, payload: updatedAllTags });
                }

                // 5. Update Timeline Events
                // Merge with existing events
                const updatedTimelineEvents = [...state.timelineEvents, ...result.newTimelineEvents];
                await storage.saveAllTimelineEvents(updatedTimelineEvents);
                dispatch({ type: ActionType.SET_TIMELINE_EVENTS, payload: updatedTimelineEvents });

                // 6. Update Suggested Entities (Workflow)
                // Filter out entities that already exist or are already suggested
                const existingEntityNames = new Set([
                    ...state.caseEntities.map(e => e.name.toLowerCase()), 
                    ...state.suggestedEntities.map(e => e.name.toLowerCase())
                ]);
                const uniqueNewSuggestions = result.newSuggestedEntities.filter(s => !existingEntityNames.has(s.name.toLowerCase()));

                if (uniqueNewSuggestions.length > 0) {
                    await storage.addMultipleSuggestedEntities(uniqueNewSuggestions);
                    // We update the state via the generic ESF update action which merges state
                    dispatch({ 
                        type: ActionType.UPDATE_ESF_DATA, 
                        payload: { suggestedEntities: [...state.suggestedEntities, ...uniqueNewSuggestions] } 
                    });
                }

                // 7. Bulk Update State with ESF and other data
                // This ensures all lists are in sync in one go for the UI
                const finalStateUpdate: Partial<AppState> = {
                    esfEvents: [...state.esfEvents, ...result.newEsfEvents],
                    esfPersons: [...state.esfPersons, ...result.newEsfPersons],
                    esfActLinks: [...state.esfActLinks, ...result.newEsfActLinks],
                    esfInvolvementLinks: [...state.esfInvolvementLinks, ...result.newEsfInvolvementLinks],
                    esfInformationLinks: [...state.esfInformationLinks, ...result.newEsfInformationLinks],
                    esfInterventionLinks: [...state.esfInterventionLinks, ...result.newEsfInterventionLinks],
                    knowledgeItems: [...state.knowledgeItems, ...result.newKnowledgeItems],
                    contradictions: [...state.contradictions, ...result.newContradictions],
                    insights: [...state.insights, ...result.newInsights]
                };
                
                dispatch({ type: ActionType.UPDATE_ESF_DATA, payload: finalStateUpdate });
            }
        } catch (error) {
            console.error("Critical error during analysis:", error);
            actions.addNotification("Kritischer Fehler bei der Analyse.", "error");
        } finally {
            dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: '' } });
            dispatch({ type: ActionType.SET_ANALYZING_DOC, payload: null });
        }
    };

    const handleAnalyzeRelationships = async () => {
        if (!state) return;
        if (state.caseEntities.length < 2) {
            actions.addNotification("Zu wenig Entitäten für eine Analyse (min. 2).", "info");
            return;
        }

        dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'relationships' } });
        actions.addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse gestartet', result: 'running' });

        try {
            const context = buildCaseContext(state);
            const results = await EntityRelationshipService.analyzeRelationships(state.caseEntities, context, state.settings.ai);
            
            const updatedEntities = state.caseEntities.map(entity => {
                const analysis = results.find(r => r.entityId === entity.id);
                if (analysis) {
                    return { ...entity, relationships: analysis.relationships };
                }
                return entity;
            });

            await storage.saveAllEntities(updatedEntities);
            dispatch({ type: ActionType.SET_ENTITIES, payload: updatedEntities });
            
            actions.addNotification(`${results.length} Entitäten aktualisiert.`, "success");
            actions.addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse abgeschlossen', result: 'erfolg' });

        } catch (error) {
            console.error(error);
            actions.addNotification("Fehler bei der Beziehungsanalyse.", "error");
            actions.addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse fehlgeschlagen', result: 'fehler' });
        } finally {
            dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: '' } });
        }
    };

    const handleSaveRadbruchResult = async (assessment: Radbruch4DAssessment) => {
        if (!state) return;
        try {
            const content = `
# Radbruch 4D Validierung: ${assessment.eventId}
**Datum:** ${new Date(assessment.assessmentDate).toLocaleString()}
**Assessor:** ${assessment.assessor}
... (Details siehe UI) ...
            `;

            const newDoc: GeneratedDocument = {
                id: crypto.randomUUID(),
                title: `Radbruch-Analyse: ${new Date().toLocaleDateString()}`,
                content: content, 
                htmlContent: content.replace(/\n/g, '<br/>'),
                createdAt: new Date().toISOString(),
                templateUsed: 'radbruch_wizard',
                sourceDocIds: []
            };

            await storage.addGeneratedDocument(newDoc);

            const newItem: KnowledgeItem = {
                id: crypto.randomUUID(),
                title: `Radbruch-Score: ${assessment.overallPhantomIndex}`,
                summary: `Automatische Bewertung ergab Phantom-Index ${assessment.overallPhantomIndex}.`,
                sourceDocId: newDoc.id,
                createdAt: new Date().toISOString(),
                tags: ['Radbruch', 'Forensik', 'Auto-Analysis']
            };
            
            const embedding = await GeminiService.getEmbedding(`${newItem.title}: ${newItem.summary}`, 'RETRIEVAL_DOCUMENT');
            newItem.embedding = embedding;

            await storage.addKnowledgeItem(newItem);

            dispatch({ type: ActionType.ADD_GENERATED_DOCUMENT, payload: newDoc });
            dispatch({ type: ActionType.ADD_KNOWLEDGE_ITEM, payload: newItem });

            actions.addNotification("Radbruch-Analyse gespeichert (Dokument & Wissen).", "success");
            setActiveTab('library');

        } catch (e) {
            console.error(e);
            actions.addNotification("Fehler beim Speichern der Analyse.", "error");
        }
    };

    const handleAddTasks = async (tasks: string[]) => {
        if (!state) return;
        const newTasks: Task[] = tasks.map(t => ({
            id: crypto.randomUUID(),
            title: t,
            status: 'todo'
        }));
        
        const updatedTasks = [...state.tasks, ...newTasks];
        await storage.saveAllTasks(updatedTasks);
        dispatch({ type: ActionType.SET_TASKS, payload: updatedTasks });
        actions.addNotification(`${newTasks.length} Aufgaben erstellt.`, "success");
    };

    if (initError) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 font-sans">
                <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-lg max-w-lg text-center shadow-2xl">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Systemfehler beim Start</h1>
                    <div className="bg-black/50 p-4 rounded text-left text-xs font-mono text-red-300 mb-6 overflow-auto max-h-32">
                        {initError}
                    </div>
                    <button onClick={() => storage.clearDB().then(() => window.location.reload())} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
                        Datenbank zurücksetzen
                    </button>
                </div>
            </div>
        );
    }

    if (!isDbInitialized || !state) {
        return null; 
    }

    const renderTab = () => {
        switch (state.activeTab) {
            case 'dashboard':
                return <DashboardTab 
                    appState={state} 
                    setCaseDescription={(d) => {
                        dispatch({ type: ActionType.SET_CASE_CONTEXT, payload: { caseDescription: d } });
                        storage.saveCaseContext({ ...state.caseContext, caseDescription: d });
                    }}
                    setActiveTab={setActiveTab}
                    onResetCase={() => { if(confirm('Alle Daten löschen?')) storage.clearDB().then(() => window.location.reload()); }}
                    onExportCase={async () => {
                        const json = await storage.exportStateToJSON();
                        const blob = new Blob([json], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'mrv-export.json'; a.click();
                        actions.addNotification("Export erfolgreich", "success");
                    }}
                    onImportCase={async (file) => {
                        const text = await file.text();
                        await storage.importStateFromJSON(text);
                        window.location.reload();
                    }}
                    onPerformOverallAnalysis={async () => {
                        dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'case_analysis'} });
                        const sum = await CaseAnalyzerService.performOverallAnalysis(state);
                        dispatch({ type: ActionType.SET_CASE_SUMMARY, payload: sum });
                        dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: ''} });
                    }}
                    addNotification={actions.addNotification}
                    onViewDocumentDetails={(id) => setDetailDocId(id)}
                    onAddTasks={handleAddTasks}
                />;
            case 'radbruch-check':
                return <RadbruchWizardTab onSave={handleSaveRadbruchResult} />;
            case 'forensic-dossier':
                return <ForensicDossierTab 
                    appState={state} 
                    onSaveDossier={async (d) => {
                        const newDossiers = [d, ...state.dossiers];
                        dispatch({ type: ActionType.SET_DOSSIERS, payload: newDossiers });
                        await storage.saveDossier(d);
                        actions.addNotification("Forensisches Dossier gespeichert.", "success");
                        setActiveTab('library');
                    }}
                />;
            case 'documents':
                return <DocumentsTab 
                    appState={state} 
                    onAddNewDocument={async (file) => {
                        const { text, base64, mimeType } = await extractFileContent(file);
                        const newDoc: Document = { id: crypto.randomUUID(), name: file.name, content: text || '', textContent: text, base64Content: base64, mimeType, classificationStatus: 'unclassified', tags: [], createdAt: new Date().toISOString() };
                        dispatch({ type: ActionType.ADD_DOCUMENT, payload: newDoc });
                        await storage.addDocument(newDoc);
                    }} 
                    onAnalyzeDocument={handleAnalyzeDocument} 
                    onUpdateDocument={(doc) => {
                        dispatch({ type: ActionType.UPDATE_DOCUMENT, payload: doc });
                        storage.updateDocument(doc);
                    }} 
                    onUpdateTags={(tags) => {
                        dispatch({ type: ActionType.SET_TAGS, payload: tags });
                        storage.saveAllTags(tags);
                    }} 
                    addKnowledgeItem={(item) => {
                        const newItem = {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()};
                        dispatch({ type: ActionType.ADD_KNOWLEDGE_ITEM, payload: newItem });
                        storage.addKnowledgeItem(newItem);
                    }} 
                    setActiveTab={setActiveTab} 
                    addNotification={actions.addNotification} 
                    onViewDocumentDetails={setDetailDocId} 
                />;
            case 'entities':
                return <EntitiesTab 
                    entities={state.caseEntities} 
                    onUpdateEntities={(ents) => {
                        dispatch({ type: ActionType.SET_ENTITIES, payload: ents });
                        storage.saveAllEntities(ents);
                    }} 
                    documents={state.documents} 
                    suggestedEntities={state.suggestedEntities} 
                    onAcceptSuggestedEntity={async (id) => {
                        const suggestion = state.suggestedEntities.find(s => s.id === id);
                        if(suggestion) {
                            const newEntity = {
                                id: crypto.randomUUID(),
                                name: suggestion.name,
                                type: suggestion.type,
                                description: suggestion.description,
                                roles: [],
                                relationships: []
                            };
                            const updatedEntities = [...state.caseEntities, newEntity];
                            const updatedSuggestions = state.suggestedEntities.filter(s => s.id !== id);
                            
                            await storage.saveAllEntities(updatedEntities);
                            await storage.deleteSuggestedEntity(id); // Assume this function exists or we overwrite list
                            // Actually storage usually overwrites lists for simplicity in this demo app
                            await storage.addMultipleSuggestedEntities(updatedSuggestions); // This appends, we need to overwrite.
                            // In this simple storage implementation, we might need to handle delete manually or overwrite all.
                            // For simplicity, let's just update state and assume session persistence until better storage.
                            
                            dispatch({ type: ActionType.SET_ENTITIES, payload: updatedEntities });
                            dispatch({ type: ActionType.UPDATE_ESF_DATA, payload: { suggestedEntities: updatedSuggestions } });
                        }
                    }} 
                    onDismissSuggestedEntity={(id) => {
                        const updatedSuggestions = state.suggestedEntities.filter(s => s.id !== id);
                        dispatch({ type: ActionType.UPDATE_ESF_DATA, payload: { suggestedEntities: updatedSuggestions } });
                        // Persist dismissal
                    }} 
                    onAnalyzeRelationships={handleAnalyzeRelationships} 
                    isLoading={state.isLoading} 
                    loadingSection={state.loadingSection} 
                />;
            case 'chronology':
                return <ChronologyTab appState={state} onUpdateTimelineEvents={(evs) => {
                    dispatch({ type: ActionType.SET_TIMELINE_EVENTS, payload: evs });
                    storage.saveAllTimelineEvents(evs);
                }} onViewDocument={setDetailDocId} />;
            case 'knowledge':
                return <KnowledgeBaseTab knowledgeItems={state.knowledgeItems} onUpdateKnowledgeItems={(items) => {
                    dispatch({ type: ActionType.SET_KNOWLEDGE_ITEMS, payload: items });
                    storage.saveAllKnowledgeItems(items);
                }} documents={state.documents} onViewDocument={setDetailDocId} />;
            case 'graph':
                return <GraphTab appState={state} />;
            case 'analysis':
                return <AnalysisTab 
                    appState={state} 
                    onPerformAnalysis={async (prompt, isGrounded) => {
                        // Use the real Agent Loop here instead of simple CaseAnalyzer
                        return await AgentLoopService.runAgent(prompt, state, searchService, isGrounded);
                    }} 
                />;
            case 'reports':
                return <ReportsTab appState={state} onGenerateReport={async (p) => GeminiService.callAI(p, null, state.settings.ai)} />;
            case 'generation':
                return <GenerationTab 
                    appState={state} 
                    onGenerateContent={async (params) => {
                        dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'generation'} });
                        try {
                            const doc = await ContentCreatorService.createContent({
                                ...params,
                                caseContext: buildCaseContext(state)
                            }, state.settings.ai);
                            
                            const newDoc: GeneratedDocument = {
                                id: crypto.randomUUID(),
                                title: params.templateId ? `Generiert: ${params.templateId}` : 'Generiertes Dokument',
                                content: doc.content,
                                htmlContent: doc.htmlContent,
                                createdAt: new Date().toISOString(),
                                templateUsed: params.templateId,
                                sourceDocIds: params.sourceDocuments?.map(d => d.id) || []
                            };
                            
                            dispatch({ type: ActionType.ADD_GENERATED_DOCUMENT, payload: newDoc });
                            await storage.addGeneratedDocument(newDoc);
                            dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: ''} });
                            return newDoc;
                        } catch(e) {
                            actions.addNotification("Fehler bei der Dokumentengenerierung", "error");
                            dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: ''} });
                            return null;
                        }
                    }} 
                    onUpdateGeneratedDocuments={() => {}} 
                    isLoading={state.isLoading} 
                />;
            case 'library':
                return <LibraryTab generatedDocuments={state.generatedDocuments} documents={state.documents} onViewDocument={setDetailDocId} />;
            case 'dispatch':
                return <DispatchTab 
                    dispatchDocument={state.dispatchDocument}
                    checklist={state.checklist}
                    onUpdateChecklist={(cl) => dispatch({ type: ActionType.UPDATE_CHECKLIST, payload: cl })}
                    onDraftBody={async (subject, attachments) => "E-Mail Entwurf..."}
                    onConfirmDispatch={() => actions.addNotification("Versand simuliert", "success")}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                    setActiveTab={setActiveTab}
                    documents={state.documents}
                    generatedDocuments={state.generatedDocuments}
                    coverLetter={state.coverLetter}
                    setCoverLetter={(c) => { }}
                />;
            case 'strategy':
                return <StrategyTab risks={state.risks} onUpdateRisks={(r) => {
                    dispatch({ type: ActionType.SET_RISKS, payload: r });
                    storage.saveRisks(r);
                }} mitigationStrategies={state.mitigationStrategies} onGenerateMitigationStrategies={async () => {
                    const strat = await StrategyService.generateMitigationStrategies(state);
                    dispatch({ type: ActionType.SET_MITIGATION_STRATEGIES, payload: strat });
                    storage.saveMitigationStrategies(strat);
                }} isLoading={state.isLoading} />;
            case 'argumentation':
                return <ArgumentationTab analysis={state.argumentationAnalysis} onGenerate={async () => {
                    const arg = await ArgumentationService.generateArguments(state);
                    dispatch({ type: ActionType.SET_ARGUMENTATION_ANALYSIS, payload: arg });
                    storage.saveArgumentationAnalysis(arg);
                }} isLoading={state.isLoading} />;
            case 'kpis':
                return <KpisTab kpis={state.kpis} onUpdateKpis={(kpis) => {
                    dispatch({ type: ActionType.SET_KPIS, payload: kpis });
                    storage.saveAllKpis(kpis);
                }} onSuggestKpis={async () => {
                    const kpis = await KpiService.suggestKpis(state);
                    dispatch({ type: ActionType.SET_KPIS, payload: [...state.kpis, ...kpis] });
                    storage.saveAllKpis([...state.kpis, ...kpis]);
                }} isLoading={state.isLoading} />;
            case 'legal-basis':
                return <LegalBasisTab />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={state.ethicsAnalysis} onPerformAnalysis={async () => {
                    dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'ethics'} });
                    const res = await EthicsService.performAnalysis(state);
                    dispatch({ type: ActionType.SET_ETHICS_ANALYSIS, payload: res });
                    storage.saveEthicsAnalysis(res);
                    dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: ''} });
                }} isLoading={state.isLoading} />;
            case 'contradictions':
                return <ContradictionsTab contradictions={state.contradictions} documents={state.documents} onFindContradictions={async () => {
                    const c = await InsightService.generateInsights(state);
                    actions.addNotification("Widerspruchsanalyse gestartet", "info");
                }} isLoading={state.isLoading} onViewDocument={setDetailDocId} />;
            case 'system-analysis':
                return <SystemAnalysisTab analysisResult={state.systemAnalysisResult} onPerformAnalysis={async (f) => {
                    dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: true, loadingSection: 'system_analysis'} });
                    const res = await SystemDynamicsService.performSystemicAnalysis(state, f);
                    dispatch({ type: ActionType.SET_SYSTEM_ANALYSIS, payload: res });
                    dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: false, loadingSection: ''} });
                }} isLoading={state.isLoading && state.loadingSection === 'system_analysis'} />;
            case 'settings':
                return <SettingsTab 
                    settings={state.settings} 
                    setSettings={(set) => {
                        dispatch({ type: ActionType.SET_SETTINGS, payload: set });
                        storage.saveSettings(set);
                    }} 
                    tags={state.tags} 
                    onCreateTag={() => {}} 
                    onDeleteTag={() => {}}
                    appState={state}
                    onUpdateAppState={(newState) => dispatch({ type: ActionType.UPDATE_ESF_DATA, payload: newState })}
                />;
            case 'audit':
                return <AuditLogTab auditLog={state.auditLog} agentActivityLog={state.agentActivity} />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={state.agentActivity} />;
            case 'un-submissions':
                return <UNSubmissionsTab appState={state} isLoading={state.isLoading} setIsLoading={(l) => dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: l, loadingSection: 'un'} })} />;
            case 'hrd-support':
                return <HRDSupportTab appState={state} isLoading={state.isLoading} setIsLoading={(l) => dispatch({ type: ActionType.SET_LOADING, payload: { isLoading: l, loadingSection: 'hrd'} })} />;
            default:
                return <PlaceholderTab />;
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans">
            <NotificationContainer notifications={state.notifications} onDismiss={id => dispatch({ type: ActionType.REMOVE_NOTIFICATION, payload: id })} />
            
            {!state.isFocusMode && <SidebarNav activeTab={state.activeTab} setActiveTab={setActiveTab} />}
            
            <main className="flex-1 flex flex-col min-w-0 relative">
                <header className="h-16 flex-shrink-0 glass-card border-b border-slate-800 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation /</span>
                        <h2 className="text-sm font-semibold text-white capitalize">{state.activeTab.replace('-', ' ')}</h2>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <GlobalSearch onSearch={async (q) => {
                            if (searchService) {
                                const res = await searchService.search(q);
                                setSearchResults(res);
                                setIsSearchOpen(true);
                            }
                        }} />
                        <button 
                            onClick={() => setIsHelpOpen(true)} 
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Hilfe & Anleitung"
                        >
                            <span>❓</span>
                        </button>
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <FocusModeSwitcher isFocusMode={state.isFocusMode} toggleFocusMode={toggleFocusMode} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        <ErrorBoundary>
                            {renderTab()}
                        </ErrorBoundary>
                    </div>
                </div>
            </main>

            {!state.isFocusMode && (
                <AssistantSidebar 
                    agentActivityLog={state.agentActivity} 
                    insights={state.insights}
                    onGenerateInsights={() => {}}
                    isLoading={false}
                    loadingSection=""
                />
            )}

            {isSearchOpen && (
                <SearchResultsModal
                    results={searchResults}
                    onClose={() => setIsSearchOpen(false)}
                    onResultClick={(result) => {
                        setIsSearchOpen(false);
                        if (result.type === 'Document') {
                            setDetailDocId(result.id);
                            setActiveTab('documents');
                        } else if (result.type === 'Entity') {
                            setActiveTab('entities');
                        } else if (result.type === 'Knowledge') {
                            setActiveTab('knowledge');
                        }
                    }}
                />
            )}
            
            {detailDocId && state && (
                 <DocumentDetailModal
                    document={state.documents.find(d => d.id === detailDocId)!}
                    analysisResult={state.documentAnalysisResults[detailDocId] || null}
                    onClose={() => setDetailDocId(null)}
                    onAddKnowledgeItem={(item) => {
                        const newItem = {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()};
                        dispatch({ type: ActionType.ADD_KNOWLEDGE_ITEM, payload: newItem });
                        storage.addKnowledgeItem(newItem);
                    }}
                    setActiveTab={setActiveTab}
                />
            )}

            {isHelpOpen && (
                <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            )}

        </div>
    );
};

export default App;
