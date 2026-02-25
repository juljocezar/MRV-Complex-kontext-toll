
import { 
    EsfEventRecord, 
    EsfActRecord, 
    EsfPersonRecord, 
    EsfInvolvementRecord, 
    EsfInformationRecord, 
    EsfInterventionRecord 
} from './types/esf';

// A collection of all types used in the application.

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
  | 'settings'
  | 'system-analysis'
  | 'forensic-dossier'
  | 'radbruch-check';

// Re-export ESF types
export type { 
    EsfEventRecord, 
    EsfActRecord, 
    EsfPersonRecord, 
    EsfInvolvementRecord, 
    EsfInformationRecord, 
    EsfInterventionRecord 
};

// ----------------------------------------

export type AnalysisMode = 'scan' | 'forensic';

export interface Document {
  id: string;
  name: string;
  content: string;
  textContent: string | null;
  base64Content: string | null;
  mimeType: string;
  summary?: string;
  classificationStatus: 'unclassified' | 'classified' | 'error';
  workCategory?: string;
  tags: string[];
  createdAt: string;
  embedding?: number[];
  analysisMode?: AnalysisMode; // Track which mode was used
  
  // ESF Data extracted from this document (Legacy ref, now in AppState)
  esfExtraction?: any;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  text: string;
  index: number;
  embedding?: number[];
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

export interface ForensicDossier {
    id: string;
    title: string;
    status: 'draft' | 'final' | 'archived';
    createdAt: string;
    updatedAt: string;
    selectedDocIds: string[];
    analysis: {
        rootCause: string;
        incidentTimeline: string;
        systemImpact: string;
        causalChain: string[];
    } | null;
    remediation: {
        shortTermFix: string;
        longTermPrevention: string;
        technicalSteps: string[];
    } | null;
    algorithmicVerification?: CausalityMap; 
    finalContent?: string;
}

export interface CaseEntity {
  id: string;
  name: string;
  type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt' | 'Event' | 'Act';
  description: string;
  relationships?: EntityRelationship[];
  roles?: ('Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei')[];
  embedding?: number[];
  esf_person_id?: string;
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
  embedding?: number[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  documentIds: string[];
  esf_event_id?: string;
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
  progress: number;
}

export interface Insight {
    id: string;
    text: string;
    type: 'recommendation' | 'risk' | 'observation';
}

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
  | 'argumentation_support'
  | 'systemic_analysis'
  | 'future_dynamics'
  | 'forensic_analysis';

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

export interface DocumentAnalysisResult {
    docId: string;
    summary?: string;
    entities?: SuggestedEntity[];
    timelineEvents?: Omit<TimelineEvent, 'id'>[];
    workloadEstimate?: WorkloadAnalysis;
    costEstimate?: CostAnalysis;
    classification?: string;
    suggestedTags?: string[];
    structuredEvents?: StructuredEvent[];
    structuredActs?: StructuredAct[];
    structuredParticipants?: StructuredParticipant[];
    causalityMap?: CausalityMap;
    
    // ESF Data extracted during analysis (Raw form)
    rawESFData?: any; 
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
    ethicalViolationsAssessment: string;
    privacyConcerns: string[];
    recommendations: string[];
}

export interface SystemAnalysisResult {
    systemicMechanisms: string;
    hiddenAspects: string;
    societalImpact: {
        dailyLife: string;
        impactOnGroups: string;
    };
    solutions: {
        proposal: string;
        challenges: string;
    }[];
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

export interface ArgumentationAnalysis {
  supportingArguments: ArgumentationPoint[];
  opponentArguments: ArgumentationPoint[];
}

export interface ArgumentationPoint {
  point: string;
  evidence: string[];
}

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    details?: string;
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

export interface TemporalAnalysisResult {
    zeitlicher_rahmen: {
        start: string;
        ende: string;
        dauer: string;
        ereignis_dichte: string;
    };
    chronologie: {
        zeitpunkt: string;
        ereignis_id: string;
        titel: string;
        typ: string;
        wichtigkeit: number;
        auswirkungen: string[];
        vorgänger: string[];
        nachfolger: string[];
    }[];
    zeitliche_cluster: {
        zeitraum: { start: string; ende: string };
        ereignisse: string[];
        thema: string;
        intensität: number;
        auslöser: string;
        bedeutung: string;
    }[];
    muster: {
        typ: string;
        beschreibung: string;
        intervall: string;
        beispiele: string[];
        vorhersagekraft: number;
        nächste_erwartung: string;
    }[];
    kausale_ketten: {
        auslöser: string;
        folgen: {
            ereignis_id: string;
            verzögerung: string;
            wahrscheinlichkeit: number;
            verstärkende_faktoren: string[];
        }[];
        ketten_länge: number;
        gesamtauswirkung: string;
    }[];
    zeitliche_anomalien: {
        typ: string;
        beschreibung: string;
        ereignisse: string[];
        mögliche_erklärungen: string[];
        empfohlene_untersuchung: string;
    }[];
}

export interface ContentCreationParams {
    instructions: string;
    template?: string;
    templateName?: string;
    caseContext: string;
    sourceDocuments?: Document[];
}

export interface GeneratedContent {
    content: string;
    htmlContent: string;
    metadata: {
        template_used?: string;
        word_count: number;
        estimated_reading_time: number;
        creation_timestamp: string;
        source_documents: string[];
    };
}

export interface OrchestrationResult {
    updatedDoc: Document;
    analysisResult: DocumentAnalysisResult;
    newSuggestedEntities: SuggestedEntity[];
    newGlobalTags: string[];
    newContradictions: Contradiction[];
    newInsights: Insight[];
    newKnowledgeItems: KnowledgeItem[];
    newTimelineEvents: TimelineEvent[];
    // New ESF Data
    newEsfEvents: EsfEventRecord[];
    newEsfPersons: EsfPersonRecord[];
    newEsfActLinks: EsfActRecord[];
    newEsfInvolvementLinks: EsfInvolvementRecord[];
    newEsfInformationLinks: EsfInformationRecord[];
    newEsfInterventionLinks: EsfInterventionRecord[];
}

export interface AppState {
    activeTab: ActiveTab;
    documents: Document[];
    chunks: DocumentChunk[]; // New chunk storage
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
    loadingSection: string;
    analyzingDocId: string | null;
    suggestedEntities: SuggestedEntity[];
    dispatchDocument: GeneratedDocument | null;
    checklist: ChecklistItem[];
    coverLetter: string;
    argumentationAnalysis: ArgumentationAnalysis | null;
    proactiveSuggestions: ProactiveSuggestion[];
    notifications: Notification[];
    systemAnalysisResult?: SystemAnalysisResult | null;
    dossiers: ForensicDossier[];
    
    // Loaded ESF Data Collections
    esfEvents: EsfEventRecord[];
    esfPersons: EsfPersonRecord[];
    esfActLinks: EsfActRecord[];
    esfInvolvementLinks: EsfInvolvementRecord[];
    esfInformationLinks: EsfInformationRecord[];
    esfInterventionLinks: EsfInterventionRecord[];
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

export interface StructuredEvent {
    title: string;
    startDate: string;
    endDate?: string;
    location: string;
    description: string;
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

export interface AnalysisChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface SearchResult {
    id: string;
    type: 'Document' | 'Entity' | 'Knowledge';
    title: string;
    preview: string;
    score: number;
    isSemantic?: boolean;
}

// --- Radbruch / Phantom Layer Types ---

export type SystemicIssueCode =
  | "ISSUE_UNCAC_108E_GAP"
  | "ISSUE_UNCAC_PARTY_FINANCING"
  | "ISSUE_GRECO_CODE_OF_CONDUCT"
  | "ISSUE_GRECO_REVOLVING_DOORS"
  | "ISSUE_NDS_SOG_EXPANSIVE_POWERS"
  | "ISSUE_NDS_SOG_PREVENTIVE_SURVEILLANCE"
  | "ISSUE_LOCAL_CULTURE_OF_SILENCE"
  | "ISSUE_CHILLING_EFFECT_WHISTLEBLOWERS"
  | "ISSUE_PROFILING_RISK"
  | "ISSUE_ALGORITHMIC_OPACITY"
  | "ISSUE_STRUCTURAL_BIAS"
  | "ISSUE_LACK_OF_REMEDY"
  | "ISSUE_MEDICAL_NEUTRALITY_VIOLATION"
  | "ISSUE_LEGISLATIVE_GENEALOGY_SUSPECT";

export interface Location {
  country: string;      // "DE"
  region?: string;      // "Niedersachsen"
  city?: string;        // "Schaumburg"
}

export type DecisionOpacityLevel =
  | "transparent"
  | "partially_explained"
  | "black_box"
  | "paper_only_no_hearing";

export interface RadbruchEvent {
  eventId: string;
  eventType: string;
  dateStart?: string;
  dateEnd?: string;
  location: Location;
  jurisdictionUnitId: string;

  summary: string;
  allegedRightsViolated: string[];

  usesAlgorithmicDecision: boolean;
  aiSystemNameOrType?: string | null;
  decisionOpacityLevel: DecisionOpacityLevel;
  legalProcedureStage:
    | "administrative"
    | "criminal_or_OWi_court"
    | "civil_court"
    | "other";
    
  involvedActors: string;
  
  referencedLaws: string[];
  signerName?: string;
  isMachineGenerated: boolean;
  officialSignal: string;
  sphereRisks: {
      lossOfHousing: boolean;
      lossOfIncome: boolean;
      healthRisk: boolean;
  };
  
  huridocsEvent?: EsfEventRecord;
}

export type RadbruchLabel = "ok" | "problematic" | "critical";

export interface DimensionAssessment {
  score: number;       // 0–10
  label: RadbruchLabel;
  notes: string;
}

export type NormCollisionSeverity = "none" | "ordre_public" | "ius_cogens";

export interface NormHierarchyResult {
  severity: NormCollisionSeverity;
  violatedLevels: Array<1 | 2 | 3>;
  notes: string;
  voidSuggested: boolean;
}

export interface ResponsibleActor {
  name: string | null;
  role: "signing_official" | "system_operator" | "unknown";
  machineGenerated: boolean;
  potentialPersonalLiability: string[];
}

export interface StigmaResult {
  foundTerms: string[];
  gaslightingIndicators: boolean;
  burdenOfProofShift: boolean;
  notes: string;
}

export interface GenealogyFinding {
  lawId: string;
  originPeriod: "NS_ERA" | "POST_1949" | "UNKNOWN";
  cleanedUpConstitutionally: boolean | null;
  notes: string;
}

export interface LegislativeGenealogyResult {
  suspicious: boolean;
  findings: GenealogyFinding[];
}

export interface MedicalNeutralityResult {
  medicalContextDetected: boolean;
  coerciveElements: string[];
  neutralityViolation: boolean;
  notes: string;
}

export interface SphereAuditResult {
  humanitarianMinimumViolated: boolean;
  affectedSectors: string[];
  notes: string;
}

export interface SignalCodeResult {
  officialSignal: string;
  forensicSignal: string;
  dissonanceScore: number; // 0-1
  notes: string;
}

export interface UncacAuditFlag {
  code: SystemicIssueCode;
  severity: "low" | "medium" | "high";
  rationale: string;
}

export interface UncacAuditResult {
  applicable: boolean;
  flags: UncacAuditFlag[];
  overallRisk: "none" | "elevated" | "severe";
}

export interface ProfilingIssue {
  dimension: "protected_characteristics" | "opaque_scoring" | "lack_of_consent" | "no_human_review";
  severity: "low" | "medium" | "high";
  rationale: string;
}

export interface ProfilingCheckResult {
  profilingDetected: boolean;
  issues: ProfilingIssue[];
}

export interface Radbruch4DAssessment {
  eventId: string;
  assessmentDate: string;
  assessor: string;

  d1Explainability: DimensionAssessment;
  d2Responsibility: DimensionAssessment;
  d3DataStatus: DimensionAssessment;
  d4TruthRight: DimensionAssessment;

  overallPhantomIndex: number;
  suggestedLegalActions: string[];
  
  identifiedIssues: SystemicIssueCode[]; 
  
  // Detailed Validator Results
  normHierarchy?: NormHierarchyResult;
  responsibleActor?: ResponsibleActor;
  stigmaAnalysis?: StigmaResult;
  genealogyAudit?: LegislativeGenealogyResult;
  medicalNeutrality?: MedicalNeutralityResult;
  sphereAudit?: SphereAuditResult;
  signalComparison?: SignalCodeResult;
}

export interface CausalNode {
  id: string;
  label: string;
  type: 'event' | 'state' | 'action' | 'consequence';
  description?: string;
  timestamp?: string;
}

export type CausalRelationType = 
  | 'causes' 
  | 'enables' 
  | 'inhibits' 
  | 'destroys_autonomy' 
  | 'violates_right'
  | 'mitigates';

export interface CausalEdge {
  id: string;
  source: string;
  target: string;
  relationType: CausalRelationType;
  description?: string;
  weight?: number;
}

export interface CausalityMap {
  nodes: CausalNode[];
  edges: CausalEdge[];
  zersetzungDetected: boolean;
  rootCauses: string[];
  criticalChains: string[][];
  generatedAt: string;
}

export type LegalMechanism =
  | 'UN_TREATY_BODY'
  | 'UN_SPECIAL_PROCEDURE'
  | 'UN_UPR'
  | 'UN_POLICY_LIBRARY'
  | 'UN_ORGANISED_CRIME'
  | 'IHL_TREATY'
  | 'IHL_CUSTOMARY'
  | 'HUMANITARIAN_STANDARD'
  | 'NGO_GUIDANCE'
  | 'REGIONAL_MECHANISM';

export interface LegalSourceCard {
  id: string;
  title: string;
  description: string;
  mechanism: LegalMechanism;
  region: 'GLOBAL' | 'AFRICA' | 'EUROPE' | 'AMERICAS' | 'ASIA' | 'MENA' | 'OTHER';
  topics: string[];
  baseUrl: string;
}

export type HrdResourceType = 'LEARNING_MODULE' | 'GUIDE' | 'SUBMISSION_PORTAL' | 'SECURITY' | 'ADVOCACY_TOOL';

export interface HrdResourceCard {
  id: string;
  title: string;
  description: string;
  type: HrdResourceType;
  targetGroup: ('HRD' | 'LAWYER' | 'NGO' | 'JOURNALIST')[];
  topics: string[];
  baseUrl: string;
}
