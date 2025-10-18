// This file contains all the core type definitions for the MRV Assistant application.

// --- Base & Core Types ---
export type ActiveTab = 
    | 'dashboard' | 'documents' | 'entities' | 'chronology' | 'knowledge' 
    | 'graph' | 'analysis' | 'reports' | 'generation' | 'library' 
    | 'dispatch' | 'strategy' | 'argumentation' | 'kpis' | 'un-submissions' 
    | 'hrd-support' | 'legal-basis' | 'ethics' | 'contradictions' | 'agents' 
    | 'audit' | 'settings' | 'schnellerfassung' | 'architecture-analysis' | 'status';

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
    argumentationAnalysis: ArgumentationAnalysis | null;
    isFocusMode: boolean;
    isLoading: boolean;
    loadingSection: string;
    analyzingDocId: string | null;
    suggestedEntities: SuggestedEntity[];
    dispatchDocument: GeneratedDocument | null;
    checklist: ChecklistItem[];
    coverLetter: string;
    proactiveSuggestions: ProactiveSuggestion[];
    notifications: Notification[];
    analysisQueue: string[];
}

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'error';
    details?: string;
}

// --- Document & Content Types ---
export interface Document {
    id: string;
    name: string;
    content: string; // Raw content or base64
    textContent: string | null; // Extracted text
    base64Content: string | null;
    mimeType: string;
    classificationStatus: 'unclassified' | 'queued' | 'analyzing' | 'classified' | 'error';
    workCategory?: string; // e.g., 'Opferbericht', 'Zeugenaussage'
    contentType?: 'case-specific' | 'contextual-report';
    summary?: string;
    tags: string[];
    createdAt: string;
}

export interface GeneratedDocument {
    id: string;
    title: string;
    content: string; // Markdown
    htmlContent: string; // Parsed HTML
    createdAt: string;
    templateUsed?: string;
    sourceDocIds: string[];
    language?: 'de' | 'en';
    version: number;
    versionChainId: string;
}

// --- Entity & Relationship Types ---
export interface Entity {
    id: string;
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    description: string;
}

export interface CaseEntity extends Entity {
    roles?: string[];
    relationships?: EntityRelationship[];
}

export interface SuggestedEntity extends Entity {
    sourceDocumentId: string;
    sourceDocumentName?: string;
}

export interface EntityRelationship {
    targetEntityId: string;
    targetEntityName: string;
    description: string;
}

// --- Knowledge & Analysis Types ---
export interface KnowledgeItem {
    id: string;
    title: string;
    summary: string;
    sourceDocId: string;
    createdAt: string;
    tags: string[];
}

export interface SuggestedKnowledgeChunk {
    title: string;
    summary: string;
    selected: boolean;
}

export interface DocumentAnalysisResult {
    docId: string;
    summary: string;
    entities: SuggestedEntity[];
    classification: string;
    contentType: 'case-specific' | 'contextual-report';
    suggestedTags: string[];
    structuredEvents?: StructuredEvent[];
    structuredActs?: StructuredAct[];
    structuredParticipants?: StructuredParticipant[];
    workloadEstimate?: WorkloadAnalysis;
    costEstimate?: CostAnalysis;
}

export interface DocumentAnalysisResults {
    [docId: string]: DocumentAnalysisResult | undefined;
}

export interface SnippetAnalysisResult {
    suggestedTitle: string;
    suggestedTags: string[];
    suggestedEntities: SuggestedEntity[];
}

export interface CaseSummary {
    summary: string;
    identifiedRisks: { risk: string; description: string }[];
    suggestedNextSteps: { step: string; justification: string }[];
    generatedAt: string;
}

export interface Contradiction {
    id: string;
    source1DocId: string;
    statement1: string;
    source2DocId: string;
    statement2: string;
    explanation: string;
}

export interface Insight {
    id: string;
    text: string;
    type: 'recommendation' | 'risk' | 'observation';
}

export interface ArgumentationAnalysis {
    supportingArguments: ArgumentationPoint[];
    opponentArguments: ArgumentationPoint[];
    adversarialAnalysis?: AdversarialAnalysis;
}

export interface ArgumentationPoint {
    point: string;
    evidence: string[];
}

export interface AdversarialAnalysis {
    mainWeaknesses: {
        weakness: string;
        attackStrategy: string;
    }[];
    alternativeNarrative: string;
}

export interface EthicsAnalysis {
    ethicalViolationsAssessment: string;
    privacyConcerns: string[];
    recommendations: string[];
}

// --- Structured Data from Documents ---
export interface StructuredEvent {
    title: string;
    startDate: string;
    endDate?: string;
    location: string;
    description: string;
}

// Fix: Add TimelineEvent interface definition to resolve missing type errors.
export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    documentIds: string[];
}

export interface StructuredAct {
    victimName: string;
    actType: string;
    method?: string;
    consequences?: string;
}

export interface StructuredParticipant {
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    role: 'Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei' | 'Andere';
    description: string;
}

// --- Strategy & Planning Types ---
export interface KPI {
    id: string;
    name: string;
    target: string;
    progress: number;
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
    apiKey?: string;
}

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

// --- Agent & System Types ---
export type AgentCapability =
  | 'document_analysis' | 'entity_extraction' | 'summarization' | 'document_classification'
  | 'knowledge_chunking' | 'case_analysis' | 'risk_assessment' | 'strategy_development'
  | 'insight_generation' | 'un_submission_assistance' | 'legal_analysis'
  | 'un_submission_finalization' | 'report_generation' | 'content_creation'
  | 'temporal_analysis' | 'event_sequencing' | 'kpi_suggestion' | 'workload_analysis'
  | 'cost_estimation' | 'ethics_analysis' | 'contradiction_detection'
  | 'template_based_extraction' | 'summarization' | 'risk_assessment' | 'strategy_development' | 'report_generation';
  
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
    agentName: string;
    action: string;
    timestamp: string;
    result: 'running' | 'erfolg' | 'fehler';
    details?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
}

export interface AppSettings {
    ai: AISettings;
    complexity: {
        low: number;
        medium: number;
    };
}

export interface AISettings {
    temperature: number;
    topP: number;
}

export interface ProactiveSuggestion {
    id: string;
    text: string;
    action: {
        type: 'navigate' | 'execute';
        payload: any;
    };
}

// --- Miscellaneous Types ---
export interface CaseContext {
    caseDescription: string;
}

export interface Tag {
    id: string;
    name: string;
}

export interface SearchResult {
    id: string;
    type: 'Document' | 'Entity' | 'Knowledge';
    title: string;
    preview: string;
}

export interface AnalysisChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

// --- Service-specific Types ---

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

export interface TemporalAnalysisResult {
    // This is a complex type, defining a minimal structure
    chronologie: { zeitpunkt: string; titel: string; }[];
    muster: { typ: string; beschreibung: string; }[];
}

export interface ContentCreationParams {
    instructions: string;
    caseContext: string;
    language: 'de' | 'en';
    isBilingual?: boolean;
    template?: string;
    templateName?: string;
    sourceDocuments?: Document[];
    selectedArguments?: ArgumentationPoint[];
    versionChainId?: string;
}

export interface GeneratedContent {
    content: string; // Markdown
    htmlContent: string;
    metadata: { [key: string]: any };
}