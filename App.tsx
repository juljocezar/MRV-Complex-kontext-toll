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

import * as storage from './services/storageService';

import { AppState, ActiveTab } from './types';
import { GeminiService } from './services/geminiService';
import { CaseAnalyzerService } from './services/caseAnalyzerService';
import { ContradictionDetectorService } from './services/contradictionDetectorService';
import { InsightService } from './services/insightService';
import { KpiService } from './services/kpiService';
import { StrategyService } from './services/strategyService';
import { EthicsService } from './services/ethicsService';
import { ContentCreatorService } from './services/contentCreator';
import { buildCaseContext } from './utils/contextUtils';

const App: React.FC = () => {
    const [state, setState] = useState<AppState | null>(null);

    const setActiveTab = (tab: ActiveTab) => {
        setState(prevState => prevState ? { ...prevState, activeTab: tab } : null);
    };

    const toggleFocusMode = () => {
        setState(prevState => prevState ? { ...prevState, isFocusMode: !prevState.isFocusMode } : null);
    };

    const performOverallAnalysis = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'case_analysis' } : null);
        try {
            const summary = await CaseAnalyzerService.performOverallAnalysis(state);
            setState(s => s ? { ...s, caseSummary: summary } : null);
        } catch (error) {
            console.error("Failed to perform overall analysis", error);
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
        } catch (error) {
            console.error("Failed to find contradictions", error);
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };
    
    const generateInsights = async () => {
        if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'insights' } : null);
        try {
            const insights = await InsightService.generateInsights(state);
            setState(s => s ? { ...s, insights } : null);
        } catch (error) {
            console.error("Failed to generate insights", error);
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };

    const suggestKpis = async () => {
         if (!state) return;
        setState(s => s ? { ...s, isLoading: true, loadingSection: 'kpis' } : null);
        try {
            const kpis = await KpiService.suggestKpis(state);
            setState(s => s ? { ...s, kpis: [...s.kpis, ...kpis] } : null);
        } catch (error) {
            console.error("Failed to suggest kpis", error);
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
        } catch (error) {
            console.error("Failed to generate strategies", error);
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
        } catch (error) {
            console.error("Failed to perform ethics analysis", error);
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
            const newDoc = {
                id: crypto.randomUUID(),
                title: `Generated Document ${new Date().toISOString()}`,
                content: result.content,
                htmlContent: result.htmlContent,
                createdAt: new Date().toISOString(),
                templateUsed: result.metadata.template_used,
                sourceDocIds: result.metadata.source_documents,
            };
            setState(s => s ? { ...s, generatedDocuments: [...s.generatedDocuments, newDoc] } : null);
            return newDoc;
        } catch (error) {
            console.error(error);
            return null;
        } finally {
            setState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    };
    
    const setProp = (prop: keyof AppState) => (value: any) => setState(s => s ? { ...s, [prop]: value } : null);

    const renderTab = () => {
        if (!state) return null;
        switch (state.activeTab) {
            case 'dashboard':
                return <DashboardTab 
                    documents={state.documents} 
                    generatedDocuments={state.generatedDocuments}
                    documentAnalysisResults={state.documentAnalysisResults}
                    caseDescription={state.caseContext.caseDescription}
                    setCaseDescription={(desc) => setState(s => s ? {...s, caseContext: {...s.caseContext, caseDescription: desc}} : null)}
                    setActiveTab={setActiveTab}
                    onResetCase={() => { if(window.confirm('Are you sure?')) storage.clearDB().then(() => window.location.reload()); }}
                    onExportCase={async () => {
                        const json = await storage.exportStateToJSON();
                        const blob = new Blob([json], {type: 'application/json'});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `mrv-case-${new Date().toISOString()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    onImportCase={async (file: File) => {
                        const text = await file.text();
                        await storage.importStateFromJSON(text);
                        window.location.reload();
                    }}
                    caseSummary={state.caseSummary}
                    onPerformOverallAnalysis={performOverallAnalysis}
                    isLoading={state.isLoading && state.loadingSection === 'case_analysis'}
                    loadingSection={state.loadingSection}
                 />;
            case 'documents':
                return <DocumentsTab appState={state} setAppState={setState} />;
            case 'entities':
                return <EntitiesTab 
                    entities={state.caseEntities}
                    setEntities={setProp('caseEntities')}
                    documents={state.documents}
                    suggestedEntities={state.suggestedEntities}
                    onAcceptSuggestedEntity={(id) => {}}
                    onDismissSuggestedEntity={(id) => {}}
                    onAnalyzeRelationships={() => {}}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                />;
            case 'chronology':
                return <ChronologyTab timelineEvents={state.timelineEvents} setTimelineEvents={setProp('timelineEvents')} documents={state.documents} />;
            case 'knowledge':
                return <KnowledgeBaseTab knowledgeItems={state.knowledgeItems} setKnowledgeItems={setProp('knowledgeItems')} documents={state.documents} />;
            case 'graph':
                return <GraphTab appState={state} />;
            case 'analysis':
                return <AnalysisTab appState={state} />;
            case 'reports':
                return <ReportsTab onGenerateReport={generateReport} appState={state} />;
            case 'generation':
                return <GenerationTab onGenerateContent={generateContent} appState={state} setGeneratedDocuments={setProp('generatedDocuments')} isLoading={state.isLoading && state.loadingSection === 'generation'} />;
            case 'library':
                return <LibraryTab generatedDocuments={state.generatedDocuments} />;
            case 'dispatch':
                return <DispatchTab 
                    dispatchDocument={state.dispatchDocument}
                    checklist={state.checklist}
                    setChecklist={setProp('checklist')}
                    onDraftBody={async (subject, attachments) => "Draft body"}
                    onConfirmDispatch={() => {}}
                    isLoading={state.isLoading}
                    loadingSection={state.loadingSection}
                    setActiveTab={setActiveTab}
                    documents={state.documents}
                    generatedDocuments={state.generatedDocuments}
                    coverLetter={state.coverLetter}
                    setCoverLetter={setProp('coverLetter')}
                />;
            case 'strategy':
                return <StrategyTab risks={state.risks} setRisks={setProp('risks')} mitigationStrategies={state.mitigationStrategies} onGenerateMitigationStrategies={generateMitigationStrategies} isLoading={state.isLoading && state.loadingSection === 'strategy'} />;
            case 'kpis':
                return <KpisTab kpis={state.kpis} setKpis={setProp('kpis')} onSuggestKpis={suggestKpis} isLoading={state.isLoading && state.loadingSection === 'kpis'} />;
            case 'un-submissions':
                return <UNSubmissionsTab appState={state} isLoading={state.isLoading} setIsLoading={(val) => setState(s => s ? {...s, isLoading: val} : null)} />;
            case 'hrd-support':
                 return <HRDSupportTab appState={state} isLoading={state.isLoading} setIsLoading={(val) => setState(s => s ? {...s, isLoading: val} : null)} />;
            case 'legal-basis':
                return <LegalBasisTab />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={state.ethicsAnalysis} onPerformAnalysis={performEthicsAnalysis} isLoading={state.isLoading && state.loadingSection === 'ethics'} />;
            case 'contradictions':
                return <ContradictionsTab contradictions={state.contradictions} documents={state.documents} onFindContradictions={findContradictions} isLoading={state.isLoading && state.loadingSection === 'contradictions'} />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={state.agentActivity} />;
            case 'audit':
                return <AuditLogTab auditLog={state.auditLog} agentActivityLog={state.agentActivity} />;
            case 'settings':
                return <SettingsTab settings={state.settings} setSettings={setProp('settings')} tags={state.tags} onCreateTag={(name) => { const newTag = {id: crypto.randomUUID(), name}; setState(s => s ? {...s, tags: [...s.tags, newTag]} : s); }} onDeleteTag={(id) => setState(s => s ? {...s, tags: s.tags.filter(t => t.id !== id)}: s)} />;
            default:
                return <PlaceholderTab />;
        }
    };
    
    // Load initial state
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
                isFocusMode: false,
                isLoading: false,
                loadingSection: '',
                suggestedEntities: [],
                dispatchDocument: null,
                checklist: [],
                coverLetter: '',
            };
            setState(initialAppState);
        }
        load();
    }, []);
    
    // Save state whenever it changes
    useEffect(() => {
        if (state) {
            storage.saveAllDocuments(state.documents);
            storage.saveAllGeneratedDocuments(state.generatedDocuments);
            storage.saveAllEntities(state.caseEntities);
            storage.saveAllKnowledgeItems(state.knowledgeItems);
            storage.saveAllTimelineEvents(state.timelineEvents);
            storage.saveAllTags(state.tags);
            storage.saveAllContradictions(state.contradictions);
            storage.saveCaseContext(state.caseContext);
            // storage.saveAllTasks(state.tasks);
            storage.saveAllKpis(state.kpis);
            storage.saveRisks(state.risks);
            if (state.caseSummary) storage.saveCaseSummary(state.caseSummary);
            storage.saveAllInsights(state.insights);
            if(state.settings) storage.saveSettings(state.settings);
            if(state.ethicsAnalysis) storage.saveEthicsAnalysis(state.ethicsAnalysis);
            if(state.mitigationStrategies) storage.saveMitigationStrategies(state.mitigationStrategies);
        }
    }, [state]);

    if (!state) {
        return <div className="bg-gray-900 text-white h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="h-screen w-screen bg-gray-900 text-gray-200 flex overflow-hidden">
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
        </div>
    );
};

export default App;