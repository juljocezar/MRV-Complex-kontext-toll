
import { 
    AppState, Document, GeneratedDocument, CaseEntity, KnowledgeItem, 
    TimelineEvent, Tag, Contradiction, Task, KPI, Risks, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, 
    CaseSummary, DocumentAnalysisResult, ChecklistItem, ProactiveSuggestion, 
    SystemAnalysisResult, ForensicDossier, ArgumentationAnalysis 
} from '../types';

export enum ActionType {
    SET_STATE = 'SET_STATE',
    SET_LOADING = 'SET_LOADING',
    SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',
    
    // Documents
    ADD_DOCUMENT = 'ADD_DOCUMENT',
    UPDATE_DOCUMENT = 'UPDATE_DOCUMENT',
    SET_ANALYZING_DOC = 'SET_ANALYZING_DOC',
    
    // Analysis Results
    SET_DOC_ANALYSIS_RESULT = 'SET_DOC_ANALYSIS_RESULT',
    
    // Entities & Knowledge
    SET_ENTITIES = 'SET_ENTITIES',
    ADD_KNOWLEDGE_ITEM = 'ADD_KNOWLEDGE_ITEM',
    SET_KNOWLEDGE_ITEMS = 'SET_KNOWLEDGE_ITEMS',
    
    // Timeline & Graph
    SET_TIMELINE_EVENTS = 'SET_TIMELINE_EVENTS',
    
    // Strategy & Risks
    SET_RISKS = 'SET_RISKS',
    SET_MITIGATION_STRATEGIES = 'SET_MITIGATION_STRATEGIES',
    SET_ARGUMENTATION_ANALYSIS = 'SET_ARGUMENTATION_ANALYSIS',
    
    // Specialized Tools
    SET_ETHICS_ANALYSIS = 'SET_ETHICS_ANALYSIS',
    SET_SYSTEM_ANALYSIS = 'SET_SYSTEM_ANALYSIS',
    ADD_GENERATED_DOCUMENT = 'ADD_GENERATED_DOCUMENT',
    
    // System
    ADD_NOTIFICATION = 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
    ADD_AGENT_ACTIVITY = 'ADD_AGENT_ACTIVITY',
    UPDATE_AGENT_ACTIVITY = 'UPDATE_AGENT_ACTIVITY',
    ADD_AUDIT_LOG = 'ADD_AUDIT_LOG',
    
    // Settings & Meta
    SET_SETTINGS = 'SET_SETTINGS',
    SET_TAGS = 'SET_TAGS',
    SET_CASE_CONTEXT = 'SET_CASE_CONTEXT',
    SET_CASE_SUMMARY = 'SET_CASE_SUMMARY',
    
    // Operational
    SET_FOCUS_MODE = 'SET_FOCUS_MODE',
    UPDATE_CHECKLIST = 'UPDATE_CHECKLIST',
    SET_TASKS = 'SET_TASKS',
    SET_KPIS = 'SET_KPIS',
    SET_DOSSIERS = 'SET_DOSSIERS',
    
    // ESF Data
    UPDATE_ESF_DATA = 'UPDATE_ESF_DATA'
}

export type Action =
    | { type: ActionType.SET_STATE; payload: AppState }
    | { type: ActionType.SET_LOADING; payload: { isLoading: boolean; loadingSection: string } }
    | { type: ActionType.SET_ACTIVE_TAB; payload: AppState['activeTab'] }
    | { type: ActionType.ADD_DOCUMENT; payload: Document }
    | { type: ActionType.UPDATE_DOCUMENT; payload: Document }
    | { type: ActionType.SET_ANALYZING_DOC; payload: string | null }
    | { type: ActionType.SET_DOC_ANALYSIS_RESULT; payload: { docId: string; result: DocumentAnalysisResult } }
    | { type: ActionType.SET_ENTITIES; payload: CaseEntity[] }
    | { type: ActionType.ADD_KNOWLEDGE_ITEM; payload: KnowledgeItem }
    | { type: ActionType.SET_KNOWLEDGE_ITEMS; payload: KnowledgeItem[] }
    | { type: ActionType.SET_TIMELINE_EVENTS; payload: TimelineEvent[] }
    | { type: ActionType.SET_RISKS; payload: Risks }
    | { type: ActionType.SET_MITIGATION_STRATEGIES; payload: string }
    | { type: ActionType.SET_ARGUMENTATION_ANALYSIS; payload: ArgumentationAnalysis }
    | { type: ActionType.SET_ETHICS_ANALYSIS; payload: EthicsAnalysis }
    | { type: ActionType.SET_SYSTEM_ANALYSIS; payload: SystemAnalysisResult }
    | { type: ActionType.ADD_GENERATED_DOCUMENT; payload: GeneratedDocument }
    | { type: ActionType.ADD_NOTIFICATION; payload: { id: string; message: string; type: 'info' | 'success' | 'error' } }
    | { type: ActionType.REMOVE_NOTIFICATION; payload: string }
    | { type: ActionType.ADD_AGENT_ACTIVITY; payload: AgentActivity }
    | { type: ActionType.UPDATE_AGENT_ACTIVITY; payload: AgentActivity }
    | { type: ActionType.ADD_AUDIT_LOG; payload: AuditLogEntry }
    | { type: ActionType.SET_SETTINGS; payload: AppSettings }
    | { type: ActionType.SET_TAGS; payload: Tag[] }
    | { type: ActionType.SET_CASE_CONTEXT; payload: { caseDescription: string } }
    | { type: ActionType.SET_CASE_SUMMARY; payload: CaseSummary }
    | { type: ActionType.SET_FOCUS_MODE; payload: boolean }
    | { type: ActionType.UPDATE_CHECKLIST; payload: ChecklistItem[] }
    | { type: ActionType.SET_TASKS; payload: Task[] }
    | { type: ActionType.SET_KPIS; payload: KPI[] }
    | { type: ActionType.SET_DOSSIERS; payload: ForensicDossier[] }
    | { type: ActionType.UPDATE_ESF_DATA; payload: Partial<AppState> };
