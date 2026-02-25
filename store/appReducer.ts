import { AppState } from '../types';
import { Action, ActionType } from './types';

export const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case ActionType.SET_STATE:
            return action.payload;
            
        case ActionType.SET_LOADING:
            return {
                ...state,
                isLoading: action.payload.isLoading,
                loadingSection: action.payload.loadingSection
            };
            
        case ActionType.SET_ACTIVE_TAB:
            return { ...state, activeTab: action.payload };
            
        case ActionType.ADD_DOCUMENT:
            return { ...state, documents: [...state.documents, action.payload] };
            
        case ActionType.UPDATE_DOCUMENT:
            return {
                ...state,
                documents: state.documents.map(d => d.id === action.payload.id ? action.payload : d)
            };
            
        case ActionType.SET_ANALYZING_DOC:
            return { ...state, analyzingDocId: action.payload };
            
        case ActionType.SET_DOC_ANALYSIS_RESULT:
            return {
                ...state,
                documentAnalysisResults: {
                    ...state.documentAnalysisResults,
                    [action.payload.docId]: action.payload.result
                }
            };
            
        case ActionType.SET_ENTITIES:
            return { ...state, caseEntities: action.payload };
            
        case ActionType.ADD_KNOWLEDGE_ITEM:
            return { ...state, knowledgeItems: [...state.knowledgeItems, action.payload] };
            
        case ActionType.SET_KNOWLEDGE_ITEMS:
            return { ...state, knowledgeItems: action.payload };
            
        case ActionType.SET_TIMELINE_EVENTS:
            return { ...state, timelineEvents: action.payload };
            
        case ActionType.SET_RISKS:
            return { ...state, risks: action.payload };
            
        case ActionType.SET_MITIGATION_STRATEGIES:
            return { ...state, mitigationStrategies: action.payload };
            
        case ActionType.SET_ARGUMENTATION_ANALYSIS:
            return { ...state, argumentationAnalysis: action.payload };
            
        case ActionType.SET_ETHICS_ANALYSIS:
            return { ...state, ethicsAnalysis: action.payload };
            
        case ActionType.SET_SYSTEM_ANALYSIS:
            return { ...state, systemAnalysisResult: action.payload };
            
        case ActionType.ADD_GENERATED_DOCUMENT:
            return { ...state, generatedDocuments: [...state.generatedDocuments, action.payload] };
            
        case ActionType.ADD_NOTIFICATION:
            return { ...state, notifications: [...state.notifications, action.payload] };
            
        case ActionType.REMOVE_NOTIFICATION:
            return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
            
        case ActionType.ADD_AGENT_ACTIVITY:
            return { ...state, agentActivity: [action.payload, ...state.agentActivity] };
            
        case ActionType.UPDATE_AGENT_ACTIVITY:
            return {
                ...state,
                agentActivity: state.agentActivity.map(act => 
                    act.id === action.payload.id ? action.payload : act
                )
            };
            
        case ActionType.ADD_AUDIT_LOG:
            return { ...state, auditLog: [action.payload, ...state.auditLog] };
            
        case ActionType.SET_SETTINGS:
            return { ...state, settings: action.payload };
            
        case ActionType.SET_TAGS:
            return { ...state, tags: action.payload };
            
        case ActionType.SET_CASE_CONTEXT:
            return { ...state, caseContext: { ...state.caseContext, ...action.payload } };
            
        case ActionType.SET_CASE_SUMMARY:
            return { ...state, caseSummary: action.payload };
            
        case ActionType.SET_FOCUS_MODE:
            return { ...state, isFocusMode: action.payload };
            
        case ActionType.UPDATE_CHECKLIST:
            return { ...state, checklist: action.payload };
            
        case ActionType.SET_TASKS:
            return { ...state, tasks: action.payload };
            
        case ActionType.SET_KPIS:
            return { ...state, kpis: action.payload };
            
        case ActionType.SET_DOSSIERS:
            return { ...state, dossiers: action.payload };
            
        case ActionType.UPDATE_ESF_DATA:
            // Safety Check: Filter out undefined/null keys from payload to prevent accidental state erasure
            // eslint-disable-next-line no-case-declarations
            const safePayload = Object.entries(action.payload).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) {
                    (acc as any)[key] = value;
                }
                return acc;
            }, {} as Partial<AppState>);
            
            return { ...state, ...safePayload };
            
        default:
            return state;
    }
};