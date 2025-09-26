// A collection of all types used in the application.

// Core Data Structures
export interface Document {
  id: string;
  name: string;
  content: string;
  textContent: string | null;
  base64Content: string | null;
  mimeType: string;
  summary?: string;
  classificationStatus: 'unclassified' | 'classified' | 'error';
  workCategory?: string; // e.g., 'Opferbericht', 'Zeugenaussage'
  tags: string[];
  createdAt: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  createdAt: string;
  templateUsed?: string;
  sourceDocIds: string[];
}

export interface CaseEntity {
  id: string;
  name: string;
  type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
  description: string;
  relationships?: EntityRelationship[];
  roles?: ('Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei')[];
}

export interface EntityRelationship {
    targetEntityId: string;
    targetEntityName: string;
    description: string;
}


export interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  sourceDocId: string;
  createdAt: string;
  tags: string[];
}

export interface TimelineEvent {
  id: string;
  date: string; // ISO format
  title: string;
  description: string;
  documentIds: string[];
}

export interface Tag {
  id: string;
  name:string;
}

export interface Contradiction {
  id: string;
  source1DocId: string;
  statement1: string;
  source2DocId: string;
  statement2: string;
  explanation: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
}

export interface KPI {
  id: string;
  name: string;
  target: string;
  progress: number; // 0-100
}

export interface Insight {
    id: string;
    text: string;
    type: 'recommendation' | 'risk' | 'observation';
}

// Agent & Activity
export type AgentCapability =
  | 'document_analysis'
  | 'entity_extraction'
  | 'summarization'
  | 'document_classification'
  | 'case_analysis'
  | 'risk_assessment'
  | 'strategy_development'
  | 'insight_generation'
  | 'un_submission_assistance'
  | 'un_submission_finalization'
  | 'legal_analysis'
  | 'report_generation'
  | 'content_creation'
  | 'temporal_analysis'
  | 'event_sequencing'
  | 'kpi_suggestion'
  | 'workload_analysis'
  | 'cost_estimation'
  | 'ethics_analysis'
  | 'contradiction_detection'
  | 'template_based_extraction'
  | 'argumentation_support';

export interface AgentProfile {
    name: string;
    role: string;
    icon: string;
    description: string;
    systemPrompt: string;
    capabilities: AgentCapability[];
}

export interface AgentActivity {
    id: string;
    timestamp: string;
    agentName: string;
    action: string;
    result: 'running' | 'erfolg' | 'fehler';
    details?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
}

// --- HURIDOCS-inspired Structured Data Types ---
export interface StructuredEvent {
    title: string;
    startDate: string; // ISO Date
    endDate?: string;
    location: string;
    description: string;
}

export interface StructuredAct {
    victimName: string;
    actType: string; // e.g., 'Folter', 'willkürliche Inhaftierung'
    method?: string;
    consequences?: string;
}

export interface StructuredParticipant {
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    role: 'Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei' | 'Andere';
    description: string;
}


// Analysis Results
export interface DocumentAnalysisResult {
    docId: string;
    summary?: string;
    entities?: SuggestedEntity[];
    timelineEvents?: Omit<TimelineEvent, 'id'>[];
    workloadEstimate?: WorkloadAnalysis;
    costEstimate?: CostAnalysis;
    classification?: string; // HURIDOCS standard
    suggestedTags?: string[];
    // New structured data fields
    structuredEvents?: StructuredEvent[];
    structuredActs?: StructuredAct[];
    structuredParticipants?: StructuredParticipant[];
}

export interface DocumentAnalysisResults {
    [docId: string]: DocumentAnalysisResult | undefined;
}

export interface WorkloadAnalysis {
    totalHours: number;
    complexity: 'niedrig' | 'mittel' | 'hoch';
    breakdown: { task: string; hours: number }[];
}

export interface CostAnalysis {
    recommended: number;
    min: number;
    max: number;
    details: { item: string; cost: number }[];
}

export interface EthicsAnalysis {
    biasAssessment: string;
    privacyConcerns: string[];
    recommendations: string[];
}

export interface CaseSummary {
    summary: string;
    identifiedRisks: { risk: string; description: string }[];
    suggestedNextSteps: { step: string; justification: string }[];
    generatedAt: string;
}

export interface SuggestedEntity {
    id: string;
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    description: string;
    sourceDocumentId: string;
    sourceDocumentName: string;
}

export interface ArgumentationPoint {
  point: string;
  evidence: string[];
}

export interface ArgumentationAnalysis {
  supportingArguments: ArgumentationPoint[];
  counterArguments: ArgumentationPoint[];
}

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    details?: string;
}

// State & Settings
export interface CaseContext {
    caseDescription: string;
}

export interface Risks {
    physical: boolean;
    legal: boolean;
    digital: boolean;
    intimidation: boolean;
    evidenceManipulation: boolean;
    secondaryTrauma: boolean;
    burnout: boolean;
    psychologicalBurden: boolean;
}

export interface AISettings {
    temperature: number;
    topP: number;
}

export interface ComplexitySettings {
    low: number;
    medium: number;
}

export interface AppSettings {
    ai: AISettings;
    complexity: ComplexitySettings;
}

export interface AppState {
    activeTab: ActiveTab;
    documents: Document[];
    generatedDocuments: GeneratedDocument[];
    caseEntities: CaseEntity[];
    knowledgeItems: KnowledgeItem[];
    timelineEvents: TimelineEvent[];
    tags: Tag[];
    contradictions: Contradiction[];
    caseContext: CaseContext;
    tasks: Task[];
    kpis: KPI[];
    risks: Risks;
    caseSummary: CaseSummary | null;
    insights: Insight[];
    agentActivity: AgentActivity[];
    auditLog: AuditLogEntry[];
    settings: AppSettings;
    ethicsAnalysis: EthicsAnalysis | null;
    documentAnalysisResults: DocumentAnalysisResults;
    mitigationStrategies: string;
    isFocusMode: boolean;
    isLoading: boolean;
    loadingSection: string; // e.g., 'document_analysis', 'insights'
    suggestedEntities: SuggestedEntity[];
    dispatchDocument: GeneratedDocument | null;
    checklist: ChecklistItem[];
    coverLetter: string;
    argumentationAnalysis: ArgumentationAnalysis | null;
    proactiveSuggestions: ProactiveSuggestion[];
    notifications: Notification[];
}

// UI & Component Props
export type ActiveTab =
  | 'dashboard'
  | 'documents'
  | 'entities'
  | 'chronology'
  | 'knowledge'
  | 'graph'
  | 'analysis'
  | 'reports'
  | 'generation'
  | 'library'
  | 'dispatch'
  | 'strategy'
  | 'argumentation'
  | 'kpis'
  | 'un-submissions'
  | 'hrd-support'
  | 'legal-basis'
  | 'ethics'
  | 'contradictions'
  | 'agents'
  | 'audit'
  | 'settings';
  
export interface AnalysisChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface ProactiveSuggestion {
    id: string;
    text: string;
    action: { 
        type: 'navigate'; 
        payload: ActiveTab 
    } | { 
        type: 'execute'; 
        payload: () => void 
    };
}

// Misc
export interface ContentCreationParams {
    instructions: string;
    caseContext: string;
    sourceDocuments?: Document[];
    template?: string;
    templateName?: string;
}

export interface GeneratedContent {
    content: string;
    htmlContent: string;
    metadata: { [key: string]: any };
}

// Temporal Analysis Types - based on services/temporalAnalyzer.ts
export interface TemporalAnalysisResult {
    zeitlicher_rahmen: object;
    chronologie: object[];
    zeitliche_cluster: object[];
    muster: object[];
    kausale_ketten: object[];
    zeitliche_anomalien: object[];
}

export type Entity = any; // Placeholder for legacy Entity type, prefer CaseEntity
export type DocEntity = any; // Placeholder
export type KnowledgeTag = any; // Placeholder