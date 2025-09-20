import { Part } from '@google/genai';

export type ActiveTab = 'dashboard' | 'documents' | 'analysis' | 'generation' | 'library' | 'reports' | 'kpis' | 'agents' | 'strategy' | 'dispatch' | 'chronology' | 'entities' | 'knowledge' | 'contradictions' | 'settings' | 'legal' | 'un-submissions' | 'ethics' | 'audit' | 'graph';

export type AgentCapability =
  | 'workload_calculation'
  | 'cost_analysis'
  | 'document_analysis'
  | 'information_extraction'
  | 'document_linking'
  | 'un_submission_assistance'
  | 'legal_analysis'
  | 'contradiction_detection'
  | 'compliance_check'
  | 'risk_assessment'
  | 'case_analysis'
  | 'report_generation'
  | 'attrition_analysis'
  | 'content_creation'
  | 'official_documents'
  | 'un_submission_finalization'
  | 'strategy_development'
  | 'kpi_suggestion'
  | 'task_suggestion'
  | 'research'
  | 'public_communication';

// --- Database Schema Types ---

export interface ChainOfCustodyEvent {
    id: string;
    timestamp: string;
    action: string;
    contentHash: string;
}

export interface Document {
    id: string;
    name: string;
    type: string;
    content: string;
    size: number;
    uploadDate: string;
    classificationStatus: 'unclassified' | 'classifying' | 'classified' | 'failed';
    tags: string[];
    workCategory: string;
    chainOfCustody: ChainOfCustodyEvent[];
}

export interface GeneratedDocument {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    status: 'draft' | 'review' | 'final';
    version: number;
}


export interface Entity {
    id: string;
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    description: string;
}

export interface KnowledgeItem {
    id: string;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    sourceDocumentIds: string[];
    createdAt: string;
}

export interface TimelineEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    documentIds: string[];
}

export interface Tag {
    id: string;
    name: string;
}

export interface DocEntity {
    docId: string;
    entityId: string;
}

export interface KnowledgeTag {
    knowledgeId: string;
    tagId: string;
}

export interface Contradiction {
    id: string;
    statement1: string;
    statement2: string;
    explanation: string;
    source1DocId: string;
    source2DocId: string;
}

export interface CaseContext {
    id: number; // Always 1 for single record
    caseDescription: string;
    risks: Risks;
    mitigationStrategies: string;
}

export interface Task {
    id: string;
    text: string;
    isCompleted: boolean;
    urgency: 'hoch' | 'mittel' | 'niedrig';
    source: string;
    createdAt: string;
}

// --- UI & State-related (Non-DB) Types ---

export interface DocumentAnalysis {
    complexity: 'hoch' | 'mittel' | 'niedrig';
    complexityJustification: string;
    workloadEstimate: {
        research: number;
        classification: number;
        analysis: number;
        documentation: number;
        correspondence: number;
        followUp: number;
        total: number;
    };
    costEstimate: {
        rvgBased: number;
        jvegBased: number;
        recommended: number;
    };
    documentType: string;
    recommendations: {
        category: string;
        urgency: 'hoch' | 'mittel' | 'niedrig';
        text: string;
    }[];
    suggestedActions?: string[];
}

export interface DocumentAnalysisResults {
    [docId: string]: DocumentAnalysis;
}

export interface DetailedAnalysis {
    beteiligte_parteien: {
        name: string;
        type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
        description: string;
    }[];
    rechtliche_grundlagen: {
        reference: string;
        description: string;
    }[];
    zentrale_fakten: string[];
    menschenrechtliche_implikationen: string[];
    schlüsselwörter: string[];
    sentiment: 'positiv' | 'negativ' | 'neutral';
    suggestedActions: string[];
    erkannte_ereignisse?: {
        datum: string;
        titel: string;
        beschreibung: string;
    }[];
    correspondenceAnalysis?: {
        findings: string[];
        intent: string;
        riskAssessment: string;
    };
}

export interface DetailedAnalysisResults {
    [docId: string]: DetailedAnalysis;
}

export interface AgentActivity {
    id: string;
    timestamp: string;
    agentName: string;
    action: string;
    result: 'erfolg' | 'fehler';
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

export interface KPI {
    id: string;
    name: string;
    target: string;
    progress: number;
}

export interface Insight {
    id: string;
    text: string;
    source: string;
    type: 'observation' | 'recommendation' | 'risk';
}

export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

export interface EntityRelationship {
    targetEntityId: string;
    targetEntityName: string;
    description: string;
}

// CaseEntity for UI purposes, combining DB Entity with relationships
export interface CaseEntity extends Entity {
    relationships?: EntityRelationship[];
    documentIds?: string[];
}

export interface DocumentLink {
  id: string;
  sourceDocId: string;
  targetDocId: string;
  description: string;
  type: 'explicit' | 'suggested';
}

export interface SuggestedLink extends DocumentLink {
    reason: string;
}


export interface SuggestedEntity {
    id: string;
    name: string;
    type: string;
    description: string;
    sourceDocumentId: string;
    sourceDocumentName: string;
}

export interface UNSubmission {
    id: string;
    title: string;
    status: 'draft' | 'submitted';
    content: { [section: string]: string };
}

export interface EthicsAnalysis {
    biasAssessment: string;
    privacyConcerns: string[];
    recommendations: string[];
}

export interface CaseSummary {
    summary: string;
    identifiedRisks: { risk: string; description: string; }[];
    suggestedNextSteps: { step: string; justification: string; }[];
    generatedAt: string;
}

export interface AnalysisChatMessage {
    role: 'user' | 'model';
    text: string;
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

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
}

export interface AppState {
    documents: Document[];
    documentAnalysisResults: DocumentAnalysisResults;
    detailedAnalysisResults: DetailedAnalysisResults;
    generatedDocuments: GeneratedDocument[];
    caseDescription: string;
    agentActivityLog: AgentActivity[];
    risks: Risks;
    mitigationStrategies: string;
    kpis: KPI[];
    timelineEvents: TimelineEvent[];
    insights: Insight[];
    pinnedInsights: Insight[];
    dispatchDocument: GeneratedDocument | null;
    dispatchCoverLetter: string;
    dispatchChecklist: ChecklistItem[];
    caseEntities: CaseEntity[];
    suggestedEntities: SuggestedEntity[];
    knowledgeItems: KnowledgeItem[];
    contradictions: Contradiction[];
    documentLinks: DocumentLink[];
    suggestedLinks: SuggestedLink[];
    unSubmissions: UNSubmission[];
    ethicsAnalysis: EthicsAnalysis | null;
    caseSummary: CaseSummary | null;
    settings: AppSettings;
    tags: Tag[];
    auditLog: AuditLogEntry[];
}