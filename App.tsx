
import React, { useState, useEffect, useCallback } from 'react';
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
import AnalyseDocTab from './components/tabs/AnalyseDocTab';
import StatusDocTab from './components/tabs/StatusDocTab';
import DocumentDetailModal from './components/modals/DocumentDetailModal';
import RadbruchWizardTab from './components/tabs/RadbruchWizardTab';

import * as storage from './services/storageService';

import { AppState, ActiveTab, Document, AgentActivity, GeneratedDocument, AuditLogEntry, SearchResult, Task, Radbruch4DAssessment, KnowledgeItem } from './types';
import { GeminiService } from './services/geminiService';
import { CaseAnalyzerService } from './services/caseAnalyzerService';
import { InsightService } from './services/insightService';
import { KpiService } from './services/kpiService';
import { StrategyService } from './services/strategyService';
import { EthicsService } from './services/ethicsService';
import { ArgumentationService } from './services/argumentationService';
import { SearchService } from './services/searchService';
import { SystemDynamicsService } from './services/systemDynamicsService';
import { EntityRelationshipService } from './services/entityRelationshipService';
import { extractFileContent } from './utils/fileUtils';
import { OrchestrationService } from './services/orchestrationService';
import { ContentCreatorService } from './services/contentCreator';
import { buildCaseContext } from './utils/contextUtils';

const App: React.FC = () => {
    const [state, setState] = useState<AppState | null>(null);
    const [initError, setInitError] = useState<string | null>(null);
    const [detailDocId, setDetailDocId] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'info' | 'success' | 'error' }[]>([]);
    const [searchService, setSearchService] = useState<SearchService | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    const addNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info', duration = 5000) => {
        const id = crypto.randomUUID();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);
    
    const addAuditLog = useCallback(async (action: string, details: string) => {
        const newLogEntry: AuditLogEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, details };
        setState(s => s ? { ...s, auditLog: [newLogEntry, ...s.auditLog] } : null);
        await storage.addAuditLogEntry(newLogEntry);
    }, []);

    const toggleFocusMode = () => {
        setState(s => s ? { ...s, isFocusMode: !s.isFocusMode } : null);
    };

    const setActiveTab = (tab: ActiveTab) => {
        addAuditLog('Navigation', `Tab gewechselt zu: ${tab}`);
        setState(prevState => prevState ? { ...prevState, activeTab: tab } : null);
    };

    const addAgentActivity = useCallback((activity: Omit<AgentActivity, 'id' | 'timestamp'>): string => {
        const id = crypto.randomUUID();
        const newActivity: AgentActivity = { ...activity, id, timestamp: new Date().toISOString() };
        setState(s => {
            if (!s) return s;
            storage.addAgentActivity(newActivity);
            return { ...s, agentActivity: [newActivity, ...s.agentActivity] };
        });
        return id;
    }, []);

    const updateAgentActivity = useCallback((id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => {
        setState(s => {
            if (!s) return null;
            const newActivities = s.agentActivity.map(act => act.id === id ? { ...act, ...updates } : act);
            const updated = newActivities.find(a => a.id === id);
            if (updated) storage.updateAgentActivity(updated);
            return { ...s, agentActivity: newActivities };
        });
    }, []);

    const handleAnalyzeDocument = async (docId: string) => {
        if (!state) return;
        const doc = state.documents.find(d => d.id === docId);
        if (!doc) return;

        setState(s => s ? { ...s, isLoading: true, analyzingDocId: docId } : null);
        try {
            const result = await OrchestrationService.handleNewDocument(
                doc, state, addAgentActivity, updateAgentActivity, addNotification
            );
            
            if (result) {
                await storage.updateDocument(result.updatedDoc);
                await storage.saveDocumentAnalysisResult(docId, result.analysisResult);
                await storage.addMultipleKnowledgeItems(result.newKnowledgeItems);
                await storage.addMultipleContradictions(result.newContradictions);
                await storage.addMultipleInsights(result.newInsights);

                setState(s => {
                    if (!s) return null;
                    const docs = s.documents.map(d => d.id === docId ? result.updatedDoc : d);
                    
                    // Safe mapping for SuggestedEntity -> CaseEntity
                    const acceptedEntities = result.newSuggestedEntities.map(e => ({
                        ...e, 
                        roles: [], 
                        relationships: [], 
                        esf_person_id: undefined
                    }));

                    return {
                        ...s,
                        documents: docs,
                        caseEntities: [...s.caseEntities, ...acceptedEntities],
                        knowledgeItems: [...s.knowledgeItems, ...result.newKnowledgeItems],
                        timelineEvents: [...s.timelineEvents, ...result.newTimelineEvents],
                        contradictions: [...s.contradictions, ...result.newContradictions],
                        insights: [...s.insights, ...result.newInsights],
                        documentAnalysisResults: { ...s.documentAnalysisResults, [docId]: result.analysisResult },
                        // Merge ESF Data instantly for live updates in Graph/Forensic Tabs
                        esfEvents: [...s.esfEvents, ...result.newEsfEvents],
                        esfPersons: [...s.esfPersons, ...result.newEsfPersons],
                        esfActLinks: [...s.esfActLinks, ...result.newEsfActLinks],
                        esfInvolvementLinks: [...s.esfInvolvementLinks, ...result.newEsfInvolvementLinks]
                    };
                });
            }
        } catch (error) {
            console.error("Critical error during analysis:", error);
            addNotification("Kritischer Fehler bei der Analyse.", "error");
        } finally {
            setState(s => s ? { ...s, isLoading: false, analyzingDocId: null } : null);
        }
    };

    // New: Connect Entity Relationship Analysis
    const handleAnalyzeRelationships = async () => {
        if (!state) return;
        if (state.caseEntities.length < 2) {
            addNotification("Zu wenig Entitäten für eine Analyse (min. 2).", "info");
            return;
        }

        setState(s => s ? { ...s, isLoading: true, loadingSection: 'relationships' } : null);
        addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse gestartet', result: 'running' });

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
            setState(s => s ? { ...s, caseEntities: updatedEntities } : null);
            
            addNotification(`${results.length} Entitäten aktualisiert.`, "success");
            addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse abgeschlossen', result: 'erfolg' });

        } catch (error) {
            console.error(error);
            addNotification("Fehler bei der Beziehungsanalyse.", "error");
            addAgentActivity({ agentName: 'Knowledge Graph Architect', action: 'Beziehungsanalyse fehlgeschlagen', result: 'fehler' });
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    // New: Save Radbruch Wizard Result
    const handleSaveRadbruchResult = async (assessment: Radbruch4DAssessment) => {
        if (!state) return;
        
        try {
            // 1. Save as Generated Document (Official Record)
            const content = `
# Radbruch 4D Validierung: ${assessment.eventId}
**Datum:** ${new Date(assessment.assessmentDate).toLocaleString()}
**Assessor:** ${assessment.assessor}

## Gesamtergebnis
**Phantom Index:** ${assessment.overallPhantomIndex} / 100

### Dimensionen
1. **Explainability:** ${assessment.d1Explainability.score}/10 (${assessment.d1Explainability.label}) - ${assessment.d1Explainability.notes}
2. **Responsibility:** ${assessment.d2Responsibility.score}/10 (${assessment.d2Responsibility.label}) - ${assessment.d2Responsibility.notes}
3. **Data Status:** ${assessment.d3DataStatus.score}/10 (${assessment.d3DataStatus.label}) - ${assessment.d3DataStatus.notes}
4. **Right to Truth:** ${assessment.d4TruthRight.score}/10 (${assessment.d4TruthRight.label}) - ${assessment.d4TruthRight.notes}

### Forensische Details
${assessment.normHierarchy ? `**Normen-Check:** ${assessment.normHierarchy.severity} - ${assessment.normHierarchy.notes}` : ''}
${assessment.stigmaAnalysis ? `**Stigma-Check:** ${assessment.stigmaAnalysis.gaslightingIndicators ? 'Auffällig' : 'Unauffällig'}` : ''}

### Empfohlene Maßnahmen
${assessment.suggestedLegalActions.map(action => `- ${action}`).join('\n')}
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

            // 2. Save as Knowledge Item (Semantic Context)
            const newItem: KnowledgeItem = {
                id: crypto.randomUUID(),
                title: `Radbruch-Score: ${assessment.overallPhantomIndex}`,
                summary: `Automatische Bewertung ergab Phantom-Index ${assessment.overallPhantomIndex}. ${assessment.suggestedLegalActions.join(', ')}`,
                sourceDocId: newDoc.id,
                createdAt: new Date().toISOString(),
                tags: ['Radbruch', 'Forensik', 'Auto-Analysis']
            };
            
            // Embedding for the knowledge item
            const embedding = await GeminiService.getEmbedding(`${newItem.title}: ${newItem.summary}`, 'RETRIEVAL_DOCUMENT');
            newItem.embedding = embedding;

            await storage.addKnowledgeItem(newItem);

            setState(s => {
                if(!s) return null;
                return {
                    ...s,
                    generatedDocuments: [newDoc, ...s.generatedDocuments],
                    knowledgeItems: [newItem, ...s.knowledgeItems]
                }
            });

            addNotification("Radbruch-Analyse gespeichert (Dokument & Wissen).", "success");
            setActiveTab('library');

        } catch (e) {
            console.error(e);
            addNotification("Fehler beim Speichern der Analyse.", "error");
        }
    };

    // New: Convert Dashboard Suggestions to Tasks
    const handleAddTasks = async (tasks: string[]) => {
        if (!state) return;
        const newTasks: Task[] = tasks.map(t => ({
            id: crypto.randomUUID(),
            title: t,
            status: 'todo'
        }));
        
        await storage.saveAllTasks([...state.tasks, ...newTasks]);
        setState(s => s ? { ...s, tasks: [...s.tasks, ...newTasks] } : null);
        addNotification(`${newTasks.length} Aufgaben erstellt.`, "success");
    };

    // Re-initialize search index when data changes
    useEffect(() => {
        if (state && searchService) {
            searchService.buildIndex(state);
        }
    }, [state?.documents, state?.caseEntities, state?.knowledgeItems]);

    const renderTab = () => {
        if (!state) return null;
        switch (state.activeTab) {
            case 'dashboard':
                return <DashboardTab 
                    appState={state} 
                    setCaseDescription={(d) => setState(s => s ? {...s, caseContext: {...s.caseContext, caseDescription: d}} : null)}
                    setActiveTab={setActiveTab}
                    onResetCase={() => { if(confirm('Alle Daten löschen?')) storage.clearDB().then(() => window.location.reload()); }}
                    onExportCase={async () => {
                        const json = await storage.exportStateToJSON();
                        const blob = new Blob([json], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'mrv-export.json'; a.click();
                        addNotification("Export erfolgreich", "success");
                    }}
                    onImportCase={async (file) => {
                        const text = await file.text();
                        await storage.importStateFromJSON(text);
                        window.location.reload();
                    }}
                    onPerformOverallAnalysis={async () => {
                        setState(s => s ? {...s, isLoading: true, loadingSection: 'case_analysis'} : null);
                        const sum = await CaseAnalyzerService.performOverallAnalysis(state);
                        setState(s => s ? {...s, caseSummary: sum, isLoading: false, loadingSection: ''} : null);
                    }}
                    addNotification={addNotification}
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
                        setState(s => s ? {...s, dossiers: newDossiers} : null);
                        await storage.saveDossier(d);
                        addNotification("Forensisches Dossier gespeichert.", "success");
                        setActiveTab('library');
                    }}
                />;
            case 'documents':
                return <DocumentsTab 
                    appState={state} 
                    onAddNewDocument={async (file) => {
                        const { text, base64, mimeType } = await extractFileContent(file);
                        const newDoc: Document = { id: crypto.randomUUID(), name: file.name, content: text || '', textContent: text, base64Content: base64, mimeType, classificationStatus: 'unclassified', tags: [], createdAt: new Date().toISOString() };
                        setState(s => s ? {...s, documents: [...s.documents, newDoc]} : null);
                        await storage.addDocument(newDoc);
                    }} 
                    onAnalyzeDocument={handleAnalyzeDocument} 
                    onUpdateDocument={(doc) => setState(s => s ? {...s, documents: s.documents.map(d => d.id === doc.id ? doc : d)} : null)} 
                    onUpdateTags={(tags) => setState(s => s ? {...s, tags} : null)} 
                    addKnowledgeItem={(item) => setState(s => s ? {...s, knowledgeItems: [...s.knowledgeItems, {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()}]} : null)} 
                    setActiveTab={setActiveTab} 
                    addNotification={addNotification} 
                    onViewDocumentDetails={setDetailDocId} 
                />;
            case 'entities':
                return <EntitiesTab 
                    entities={state.caseEntities} 
                    onUpdateEntities={(ents) => setState(s => s ? {...s, caseEntities: ents} : null)} 
                    documents={state.documents} 
                    suggestedEntities={state.suggestedEntities} 
                    onAcceptSuggestedEntity={() => {}} 
                    onDismissSuggestedEntity={() => {}} 
                    onAnalyzeRelationships={handleAnalyzeRelationships} 
                    isLoading={state.isLoading} 
                    loadingSection={state.loadingSection} 
                />;
            case 'chronology':
                return <ChronologyTab appState={state} onUpdateTimelineEvents={(evs) => setState(s => s ? {...s, timelineEvents: evs} : null)} onViewDocument={setDetailDocId} />;
            case 'knowledge':
                return <KnowledgeBaseTab knowledgeItems={state.knowledgeItems} onUpdateKnowledgeItems={(items) => setState(s => s ? {...s, knowledgeItems: items} : null)} documents={state.documents} onViewDocument={setDetailDocId} />;
            case 'graph':
                return <GraphTab appState={state} />;
            case 'analysis':
                return <AnalysisTab appState={state} onPerformAnalysis={async (p, g) => CaseAnalyzerService.runFreeformQuery(p, state, g)} />;
            case 'reports':
                return <ReportsTab appState={state} onGenerateReport={async (p) => GeminiService.callAI(p, null, state.settings.ai)} />;
            case 'generation':
                return <GenerationTab 
                    appState={state} 
                    onGenerateContent={async (params) => {
                        setState(s => s ? {...s, isLoading: true} : null);
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
                            
                            setState(s => s ? {...s, generatedDocuments: [...s.generatedDocuments, newDoc], isLoading: false} : null);
                            await storage.addGeneratedDocument(newDoc);
                            return newDoc;
                        } catch(e) {
                            addNotification("Fehler bei der Dokumentengenerierung", "error");
                            setState(s => s ? {...s, isLoading: false} : null);
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
                    onUpdateChecklist={(cl) => setState(s => s ? {...s, checklist: cl} : null)}
                    onDraftBody={async (subject, attachments) => "E-Mail Entwurf..."}
                    onConfirmDispatch={() => addNotification("Versand simuliert", "success")}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                    setActiveTab={setActiveTab}
                    documents={state.documents}
                    generatedDocuments={state.generatedDocuments}
                    coverLetter={state.coverLetter}
                    setCoverLetter={(c) => setState(s => s ? {...s, coverLetter: c} : null)}
                />;
            case 'strategy':
                return <StrategyTab risks={state.risks} onUpdateRisks={(r) => setState(s => s ? {...s, risks: r} : null)} mitigationStrategies={state.mitigationStrategies} onGenerateMitigationStrategies={async () => {
                    const strat = await StrategyService.generateMitigationStrategies(state);
                    setState(s => s ? {...s, mitigationStrategies: strat} : null);
                }} isLoading={state.isLoading} />;
            case 'argumentation':
                return <ArgumentationTab analysis={state.argumentationAnalysis} onGenerate={async () => {
                    const arg = await ArgumentationService.generateArguments(state);
                    setState(s => s ? {...s, argumentationAnalysis: arg} : null);
                }} isLoading={state.isLoading} />;
            case 'kpis':
                return <KpisTab kpis={state.kpis} onUpdateKpis={(kpis) => setState(s => s ? {...s, kpis} : null)} onSuggestKpis={async () => {
                    const kpis = await KpiService.suggestKpis(state);
                    setState(s => s ? {...s, kpis: [...s.kpis, ...kpis]} : null);
                }} isLoading={state.isLoading} />;
            case 'legal-basis':
                return <LegalBasisTab />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={state.ethicsAnalysis} onPerformAnalysis={async () => {
                    setState(s => s ? {...s, isLoading: true} : null);
                    const res = await EthicsService.performAnalysis(state);
                    setState(s => s ? {...s, ethicsAnalysis: res, isLoading: false} : null);
                }} isLoading={state.isLoading} />;
            case 'contradictions':
                return <ContradictionsTab contradictions={state.contradictions} documents={state.documents} onFindContradictions={async () => {
                    const c = await InsightService.generateInsights(state);
                    addNotification("Widerspruchsanalyse gestartet", "info");
                }} isLoading={state.isLoading} onViewDocument={setDetailDocId} />;
            case 'system-analysis':
                return <SystemAnalysisTab analysisResult={state.systemAnalysisResult} onPerformAnalysis={async (f) => {
                    setState(s => s ? { ...s, isLoading: true, loadingSection: 'system_analysis'} : null);
                    const res = await SystemDynamicsService.performSystemicAnalysis(state, f);
                    setState(s => s ? {...s, systemAnalysisResult: res, isLoading: false, loadingSection: ''} : null);
                }} isLoading={state.isLoading && state.loadingSection === 'system_analysis'} />;
            case 'settings':
                return <SettingsTab 
                    settings={state.settings} 
                    setSettings={(set) => setState(s => s ? {...s, settings: set} : null)} 
                    tags={state.tags} 
                    onCreateTag={() => {}} 
                    onDeleteTag={() => {}}
                    appState={state}
                    onUpdateAppState={(newState) => setState(s => ({...s, ...newState}))}
                />;
            case 'audit':
                return <AuditLogTab auditLog={state.auditLog} agentActivityLog={state.agentActivity} />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={state.agentActivity} />;
            case 'un-submissions':
                return <UNSubmissionsTab appState={state} isLoading={state.isLoading} setIsLoading={(l) => setState(s => s ? {...s, isLoading: l} : null)} />;
            case 'hrd-support':
                return <HRDSupportTab appState={state} isLoading={state.isLoading} setIsLoading={(l) => setState(s => s ? {...s, isLoading: l} : null)} />;
            case 'architecture-analysis':
                return <AnalyseDocTab />;
            case 'status':
                return <StatusDocTab />;
            default:
                return <PlaceholderTab />;
        }
    };
    
    useEffect(() => {
        const load = async () => {
            // Reduced Timeout: 3 seconds to fail faster and show the error UI
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Datenbank-Initialisierung dauerte zu lange.")), 3000)
            );

            try {
                // Versuche DB zu laden, aber mit Timeout
                await Promise.race([storage.initDB(), timeoutPromise]);
                
                const initialAppState: AppState = {
                    activeTab: 'dashboard',
                    documents: await storage.getAllDocuments() || [],
                    generatedDocuments: await storage.getAllGeneratedDocuments() || [],
                    caseEntities: await storage.getAllEntities() || [],
                    knowledgeItems: await storage.getAllKnowledgeItems() || [],
                    timelineEvents: await storage.getAllTimelineEvents() || [],
                    tags: await storage.getAllTags() || [],
                    contradictions: await storage.getAllContradictions() || [],
                    caseContext: await storage.getCaseContext() || { caseDescription: '' },
                    tasks: await storage.getAllTasks() || [],
                    kpis: await storage.getAllKpis() || [],
                    risks: await storage.getRisks() || { physical: false, legal: false, digital: false, intimidation: false, evidenceManipulation: false, secondaryTrauma: false, burnout: false, psychologicalBurden: false },
                    caseSummary: await storage.getCaseSummary() || null,
                    insights: await storage.getAllInsights() || [],
                    agentActivity: await storage.getAllAgentActivities() || [],
                    auditLog: await storage.getAllAuditLogEntries() || [],
                    settings: await storage.getSettings() || { ai: { temperature: 0.7, topP: 0.95 }, complexity: { low: 5, medium: 15 } },
                    ethicsAnalysis: await storage.getEthicsAnalysis() || null,
                    argumentationAnalysis: await storage.getArgumentationAnalysis() || null,
                    documentAnalysisResults: await storage.getAllDocumentAnalysisResults().then(res => res.reduce((acc, curr) => ({...acc, [curr.docId]: curr.result}), {})),
                    mitigationStrategies: await storage.getMitigationStrategies().then(res => res?.content || ''),
                    isFocusMode: false,
                    isLoading: false,
                    loadingSection: '',
                    analyzingDocId: null,
                    suggestedEntities: await storage.getAllSuggestedEntities() || [],
                    dispatchDocument: null,
                    checklist: [],
                    coverLetter: '',
                    proactiveSuggestions: [],
                    notifications: [],
                    systemAnalysisResult: null,
                    dossiers: await storage.getAllDossiers() || [],
                    esfEvents: await storage.getAllEsfEvents() || [],
                    esfActLinks: await storage.getAllEsfActLinks() || [],
                    esfInvolvementLinks: await storage.getAllEsfInvolvementLinks() || [],
                    esfPersons: await storage.getAllEsfPersons() || [],
                };
                setState(initialAppState);
                const sService = new SearchService();
                sService.buildIndex(initialAppState);
                setSearchService(sService);
            } catch (error) {
                console.error("Initialization Error:", error);
                setInitError(error instanceof Error ? error.message : "Unbekannter Fehler bei der Initialisierung");
            }
        }
        load();
    }, []);

    // Notfall-Screen bei Datenbankfehlern
    if (initError) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 font-sans">
                <div className="bg-red-900/20 border border-red-500/50 p-8 rounded-lg max-w-lg text-center shadow-2xl">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Systemfehler beim Start</h1>
                    <div className="text-6xl mb-6">⚠️</div>
                    <p className="mb-4 text-gray-300">Die Anwendung konnte nicht geladen werden. Dies liegt oft an veralteten oder beschädigten Daten im Browser-Speicher nach einem Update oder Import.</p>
                    <div className="bg-black/50 p-4 rounded text-left text-xs font-mono text-red-300 mb-6 overflow-auto max-h-32">
                        {initError}
                    </div>
                    <button 
                        onClick={() => storage.clearDB().then(() => window.location.reload())}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Datenbank zurücksetzen & Neu starten
                    </button>
                    <p className="mt-4 text-xs text-gray-500">Achtung: Dies löscht alle lokal gespeicherten Falldaten.</p>
                </div>
            </div>
        );
    }

    if (!state) return null; // Wait for index.html loader to be replaced

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-200 flex overflow-hidden font-sans">
            <NotificationContainer notifications={notifications} onDismiss={id => setNotifications(prev => prev.filter(n => n.id !== id))} />
            
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
                        <div className="h-4 w-[1px] bg-slate-800"></div>
                        <FocusModeSwitcher isFocusMode={state.isFocusMode} toggleFocusMode={toggleFocusMode} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">
                        {renderTab()}
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
                    onAddKnowledgeItem={(item) => setState(s => s ? {...s, knowledgeItems: [...s.knowledgeItems, {...item, id: crypto.randomUUID(), createdAt: new Date().toISOString()}]} : null)}
                    setActiveTab={setActiveTab}
                />
            )}

        </div>
    );
};

export default App;
