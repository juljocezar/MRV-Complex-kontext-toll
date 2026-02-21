
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AuditLogEntry, AgentActivity, Notification } from '../types';
import { appReducer } from './appReducer';
import { Action, ActionType } from './types';
import * as storage from '../services/storageService';
import { SearchService } from '../services/searchService';

interface AppContextType {
    state: AppState | null;
    dispatch: React.Dispatch<Action>;
    searchService: SearchService | null;
    isDbInitialized: boolean;
    initError: string | null;
    actions: {
        addNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
        addAuditLog: (action: string, details: string) => void;
        addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => string;
        updateAgentActivity: (id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => void;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial State Blueprint
const initialState: AppState = {
    activeTab: 'dashboard',
    documents: [],
    chunks: [],
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
    settings: { ai: { temperature: 0.7, topP: 0.95 }, complexity: { low: 5, medium: 15 } },
    ethicsAnalysis: null,
    documentAnalysisResults: {},
    mitigationStrategies: '',
    isFocusMode: false,
    isLoading: false,
    loadingSection: '',
    analyzingDocId: null,
    suggestedEntities: [],
    dispatchDocument: null,
    checklist: [],
    coverLetter: '',
    argumentationAnalysis: null,
    proactiveSuggestions: [],
    notifications: [],
    systemAnalysisResult: null,
    dossiers: [],
    esfEvents: [],
    esfPersons: [],
    esfActLinks: [],
    esfInvolvementLinks: [],
    esfInformationLinks: [],
    esfInterventionLinks: []
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [searchService, setSearchService] = React.useState<SearchService | null>(null);
    const [isDbInitialized, setIsDbInitialized] = React.useState(false);
    const [initError, setInitError] = React.useState<string | null>(null);

    // Initial Data Load
    useEffect(() => {
        const load = async () => {
            try {
                // Initialize IndexedDB
                await storage.initDB();
                
                // Load ALL data from Storage
                const loadedState: AppState = {
                    ...initialState,
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
                    risks: await storage.getRisks() || initialState.risks,
                    caseSummary: await storage.getCaseSummary() || null,
                    insights: await storage.getAllInsights() || [],
                    agentActivity: await storage.getAllAgentActivities() || [],
                    auditLog: await storage.getAllAuditLogEntries() || [],
                    settings: await storage.getSettings() || initialState.settings,
                    ethicsAnalysis: await storage.getEthicsAnalysis() || null,
                    argumentationAnalysis: await storage.getArgumentationAnalysis() || null,
                    documentAnalysisResults: await storage.getAllDocumentAnalysisResults().then(res => res.reduce((acc, curr) => ({...acc, [curr.docId]: curr.result}), {})),
                    mitigationStrategies: await storage.getMitigationStrategies().then(res => res?.content || ''),
                    suggestedEntities: await storage.getAllSuggestedEntities() || [],
                    dossiers: await storage.getAllDossiers() || [],
                    esfEvents: await storage.getAllEsfEvents() || [],
                    esfActLinks: await storage.getAllEsfActLinks() || [],
                    esfInvolvementLinks: await storage.getAllEsfInvolvementLinks() || [],
                    esfPersons: await storage.getAllEsfPersons() || [],
                    esfInformationLinks: await storage.getAllEsfInformationLinks() || [],
                    esfInterventionLinks: await storage.getAllEsfInterventionLinks() || [],
                };

                // Dispatch initial state
                dispatch({ type: ActionType.SET_STATE, payload: loadedState });
                
                // Init Search Service
                const sService = new SearchService();
                await sService.buildIndex(loadedState);
                setSearchService(sService);
                
                setIsDbInitialized(true);
            } catch (error) {
                console.error("Initialization Failed:", error);
                setInitError(error instanceof Error ? error.message : "Database initialization failed");
            }
        };
        load();
    }, []);

    // Re-index search when critical data changes
    useEffect(() => {
        if (isDbInitialized && searchService && state) {
            // Debounce could be added here for performance
            searchService.buildIndex(state);
        }
    }, [state?.documents, state?.caseEntities, state?.knowledgeItems, isDbInitialized]);

    // Helper Actions
    const helpers = {
        addNotification: (message: string, type: 'info' | 'success' | 'error' = 'info') => {
            const id = crypto.randomUUID();
            dispatch({ type: ActionType.ADD_NOTIFICATION, payload: { id, message, type } });
            setTimeout(() => dispatch({ type: ActionType.REMOVE_NOTIFICATION, payload: id }), 5000);
        },
        addAuditLog: async (action: string, details: string) => {
            const entry: AuditLogEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, details };
            dispatch({ type: ActionType.ADD_AUDIT_LOG, payload: entry });
            await storage.addAuditLogEntry(entry);
        },
        addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => {
            const id = crypto.randomUUID();
            const fullActivity: AgentActivity = { ...activity, id, timestamp: new Date().toISOString() };
            dispatch({ type: ActionType.ADD_AGENT_ACTIVITY, payload: fullActivity });
            storage.addAgentActivity(fullActivity);
            return id;
        },
        updateAgentActivity: (id: string, updates: Partial<Omit<AgentActivity, 'id'>>) => {
            // Find existing to merge (since we need full object for storage update)
            // This relies on the reducer to update state, but for storage we need to query or assume
            // Simplified: We dispatch update, Reducer handles state.
            // For storage, we'd need to fetch-update-save, but AgentActivity is mostly append-only logs.
            // Complex update logic can be handled in Reducer side-effects or thunks.
            // Here we dispatch the action to update UI state.
            if(state) {
                const existing = state.agentActivity.find(a => a.id === id);
                if(existing) {
                    const updated = { ...existing, ...updates };
                    dispatch({ type: ActionType.UPDATE_AGENT_ACTIVITY, payload: updated });
                    storage.updateAgentActivity(updated);
                }
            }
        }
    };

    return (
        <AppContext.Provider value={{ 
            state, 
            dispatch, 
            searchService, 
            isDbInitialized, 
            initError,
            actions: helpers
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppStore = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppProvider');
    }
    return context;
};
