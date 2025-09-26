// A collection of all types used in the application.

// Core Data Structures
/**
 * @interface Document
 * @description Represents an uploaded source document in the application.
 * @property {string} id - A unique identifier for the document, typically a hash of its content.
 * @property {string} name - The original filename of the document.
 * @property {string} content - The full content of the document, either as text or a Base64 string.
 * @property {string | null} textContent - The text content if the file is text-based.
 * @property {string | null} base64Content - The Base64 content if the file is binary.
 * @property {string} mimeType - The MIME type of the file (e.g., 'application/pdf').
 * @property {string} [summary] - An AI-generated summary of the document.
 * @property {'unclassified' | 'classified' | 'error'} classificationStatus - The processing status of the document.
 * @property {string} [workCategory] - The document's classification according to HURIDOCS standards (e.g., 'Victim testimony').
 * @property {string[]} tags - An array of tags associated with the document.
 * @property {string} createdAt - The ISO 8601 timestamp of when the document was added.
 */
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

/**
 * @interface GeneratedDocument
 * @description Represents a document created by the AI within the application.
 * @property {string} id - A unique identifier for the generated document.
 * @property {string} title - The title of the generated document.
 * @property {string} content - The raw (Markdown) content of the document.
 * @property {string} [htmlContent] - The HTML-rendered version of the content.
 * @property {string} createdAt - The ISO 8601 timestamp of when the document was generated.
 * @property {string} [templateUsed] - The name of the template used for generation, if any.
 * @property {string[]} sourceDocIds - An array of IDs of source documents used to generate this document.
 */
export interface GeneratedDocument {
  id: string;
  title: string;
  content: string;
  htmlContent?: string;
  createdAt: string;
  templateUsed?: string;
  sourceDocIds: string[];
}

/**
 * @interface CaseEntity
 * @description Represents a key actor or item in the case (e.g., a person, organization, or location).
 * This corresponds to the HURIDOCS "Person" format, but is used more broadly.
 * @property {string} id - A unique identifier for the entity.
 * @property {string} name - The name of the entity.
 * @property {'Person' | 'Organisation' | 'Standort' | 'Unbekannt'} type - The type of the entity.
 * @property {string} description - A brief description of the entity's role or significance.
 * @property {EntityRelationship[]} [relationships] - An array of relationships this entity has with others.
 * @property {('Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei')[]} [roles] - The roles this entity plays in the case, based on HURIDOCS categories.
 */
export interface CaseEntity {
  id: string;
  name: string;
  type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
  description: string;
  relationships?: EntityRelationship[];
  roles?: ('Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei')[];
}

/**
 * @interface EntityRelationship
 * @description Defines a directional relationship from one entity to another.
 * This corresponds to the HURIDOCS "Biographical Details" and "Event Chain" formats.
 * @property {string} targetEntityId - The ID of the entity to which the relationship points.
 * @property {string} targetEntityName - The name of the target entity.
 * @property {string} description - A description of the relationship (e.g., "is the mother of", "employed by").
 */
export interface EntityRelationship {
    targetEntityId: string;
    targetEntityName: string;
    description: string;
}


/**
 * @interface KnowledgeItem
 * @description Represents a curated piece of information or evidence extracted from a document.
 * This forms the building blocks of the application's knowledge base.
 * @property {string} id - A unique identifier for the knowledge item.
 * @property {string} title - A user-defined or AI-generated title for the item.
 * @property {string} summary - The text content of the knowledge item.
 * @property {string} sourceDocId - The ID of the document from which this item was extracted.
 * @property {string} createdAt - The ISO 8601 timestamp of when the item was created.
 * @property {string[]} tags - An array of tags associated with the item.
 */
export interface KnowledgeItem {
  id: string;
  title: string;
  summary: string;
  sourceDocId: string;
  createdAt: string;
  tags: string[];
}

/**
 * @interface TimelineEvent
 * @description Represents a single event in the case's chronology.
 * This directly corresponds to the HURIDOCS "Event" format.
 * @property {string} id - A unique identifier for the event.
 * @property {string} date - The primary date of the event in ISO 8601 format.
 * @property {string} title - A short title for the event.
 * @property {string} description - A detailed description of what happened.
 * @property {string[]} documentIds - An array of document IDs that are sources for this event.
 */
export interface TimelineEvent {
  id: string;
  date: string; // ISO format
  title: string;
  description: string;
  documentIds: string[];
}

/**
 * @interface Tag
 * @description Represents a single, reusable tag that can be applied to various data types.
 * @property {string} id - A unique identifier for the tag.
 * @property {string} name - The name of the tag.
 */
export interface Tag {
  id: string;
  name:string;
}

/**
 * @interface Contradiction
 * @description Represents a potential contradiction found between two statements from two documents.
 * @property {string} id - A unique identifier for the contradiction.
 * @property {string} source1DocId - The ID of the first source document.
 * @property {string} statement1 - The contradictory statement from the first document.
 * @property {string} source2DocId - The ID of the second source document.
 * @property {string} statement2 - The contradictory statement from the second document.
 * @property {string} explanation - An AI-generated explanation of why the statements are contradictory.
 */
export interface Contradiction {
  id: string;
  source1DocId: string;
  statement1: string;
  source2DocId: string;
  statement2: string;
  explanation: string;
}

/**
 * @interface Task
 * @description Represents a task or to-do item for the user.
 * @property {string} id - A unique identifier for the task.
 * @property {string} title - The description of the task.
 * @property {'todo' | 'in_progress' | 'done'} status - The current status of the task.
 * @property {string} [dueDate] - An optional due date in ISO 8601 format.
 */
export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
}

/**
 * @interface KPI
 * @description Represents a Key Performance Indicator for tracking case progress.
 * @property {string} id - A unique identifier for the KPI.
 * @property {string} name - The name of the KPI.
 * @property {string} target - A description of the target or goal for the KPI.
 * @property {number} progress - The current progress towards the target, as a percentage (0-100).
 */
export interface KPI {
  id: string;
  name: string;
  target: string;
  progress: number; // 0-100
}

/**
 * @interface Insight
 * @description Represents a single strategic insight generated by the AI.
 * @property {string} id - A unique identifier for the insight.
 * @property {string} text - The content of the insight.
 * @property {'recommendation' | 'risk' | 'observation'} type - The category of the insight.
 */
export interface Insight {
    id: string;
    text: string;
    type: 'recommendation' | 'risk' | 'observation';
}

// Agent & Activity
/**
 * @typedef AgentCapability
 * @description A string literal type defining all possible capabilities that an AI agent can possess.
 * This is used to select the correct agent for a specific task.
 */
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

/**
 * @interface AgentProfile
 * @description Defines the static profile and configuration for a specific AI agent.
 * @property {string} name - The display name of the agent.
 * @property {string} role - A brief description of the agent's primary function.
 * @property {string} icon - An emoji or icon character representing the agent.
 * @property {string} description - A more detailed description of what the agent does.
 * @property {string} systemPrompt - The core instruction prompt given to the AI to define its persona and task.
 * @property {AgentCapability[]} capabilities - An array of capabilities that this agent possesses.
 */
export interface AgentProfile {
    name: string;
    role: string;
    icon: string;
    description: string;
    systemPrompt: string;
    capabilities: AgentCapability[];
}

/**
 * @interface AgentActivity
 * @description Logs a single action performed by an AI agent.
 * @property {string} id - A unique identifier for the activity log entry.
 * @property {string} timestamp - The ISO 8601 timestamp of the activity.
 * @property {string} agentName - The name of the agent that performed the action.
 * @property {string} action - A description of the action performed.
 * @property {'running' | 'erfolg' | 'fehler'} result - The outcome of the action.
 * @property {string} [details] - Optional additional details about the action or its result.
 */
export interface AgentActivity {
    id: string;
    timestamp: string;
    agentName: string;
    action: string;
    result: 'running' | 'erfolg' | 'fehler';
    details?: string;
}

/**
 * @interface AuditLogEntry
 * @description Logs a single user- or system-initiated action for audit and traceability purposes.
 * @property {string} id - A unique identifier for the audit log entry.
 * @property {string} timestamp - The ISO 8601 timestamp of the entry.
 * @property {string} action - A high-level description of the action (e.g., "Tab gewechselt").
 * @property {string} details - Specific details about the action (e.g., "Neuer Tab: documents").
 */
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action: string;
    details: string;
}

// --- HURIDOCS-inspired Structured Data Types ---
/**
 * @interface StructuredEvent
 * @description Represents a specific incident or event, corresponding to the HURIDOCS "Event" format.
 * @property {string} title - A short, descriptive title for the event.
 * @property {string} startDate - The start date of the event in ISO 8601 format.
 * @property {string} [endDate] - The end date of the event, if applicable.
 * @property {string} location - The geographical location of the event.
 * @property {string} description - A detailed description of the event.
 */
export interface StructuredEvent {
    title: string;
    startDate: string; // ISO Date
    endDate?: string;
    location: string;
    description: string;
}

/**
 * @interface StructuredAct
 * @description Represents a specific act of violation within an event, corresponding to the HURIDOCS "Act" format.
 * @property {string} victimName - The name of the victim of the act.
 * @property {string} actType - The type of violation (e.g., 'Torture', 'Arbitrary Detention').
 * @property {string} [method] - The method of violence or coercion used.
 * @property {string} [consequences] - The physical or psychological consequences for the victim.
 */
export interface StructuredAct {
    victimName: string;
    actType: string; // e.g., 'Folter', 'willkürliche Inhaftierung'
    method?: string;
    consequences?: string;
}

/**
 * @interface StructuredParticipant
 * @description Represents a participant in an event, corresponding to the HURIDOCS "Participation" format.
 * It links an entity (Person, Organisation) to a specific role within the event.
 * @property {string} name - The name of the participant.
 * @property {'Person' | 'Organisation' | 'Standort' | 'Unbekannt'} type - The type of the participant entity.
 * @property {'Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei' | 'Andere'} role - The role played by the participant in the event.
 * @property {string} description - A brief, context-specific description of the participant.
 */
export interface StructuredParticipant {
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    role: 'Opfer' | 'Täter' | 'Quelle' | 'Intervenierende Partei' | 'Andere';
    description: string;
}


// Analysis Results
/**
 * @interface DocumentAnalysisResult
 * @description A comprehensive container for all analysis results pertaining to a single document.
 * @property {string} docId - The ID of the document that was analyzed.
 * @property {string} [summary] - The AI-generated summary of the document.
 * @property {SuggestedEntity[]} [entities] - A list of entities suggested from the document content.
 * @property {Omit<TimelineEvent, 'id'>[]} [timelineEvents] - A list of timeline events extracted from the document.
 * @property {WorkloadAnalysis} [workloadEstimate] - An estimation of the work required to process the document.
 * @property {CostAnalysis} [costEstimate] - An estimation of the costs associated with the workload.
 * @property {string} [classification] - The document's classification according to HURIDOCS standards.
 * @property {string[]} [suggestedTags] - A list of AI-suggested tags for the document.
 * @property {StructuredEvent[]} [structuredEvents] - A list of structured events extracted from the document, as per HURIDOCS format.
 * @property {StructuredAct[]} [structuredActs] - A list of structured acts of violation extracted from the document.
 * @property {StructuredParticipant[]} [structuredParticipants] - A list of structured participants extracted from the document.
 */
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

/**
 * @interface DocumentAnalysisResults
 * @description A dictionary mapping document IDs to their corresponding analysis results.
 */
export interface DocumentAnalysisResults {
    [docId: string]: DocumentAnalysisResult | undefined;
}

/**
 * @interface WorkloadAnalysis
 * @description Represents the AI's estimation of the work required for a document.
 * @property {number} totalHours - The estimated total hours for processing.
 * @property {'niedrig' | 'mittel' | 'hoch'} complexity - The estimated complexity level.
 * @property {{ task: string; hours: number }[]} breakdown - A breakdown of hours by specific sub-task.
 */
export interface WorkloadAnalysis {
    totalHours: number;
    complexity: 'niedrig' | 'mittel' | 'hoch';
    breakdown: { task: string; hours: number }[];
}

/**
 * @interface CostAnalysis
 * @description Represents the calculated cost estimation based on the workload analysis.
 * @property {number} recommended - The recommended total cost in EUR.
 * @property {number} min - The minimum estimated cost.
 * @property {number} max - The maximum estimated cost.
 * @property {{ item: string; cost: number }[]} details - A breakdown of costs by line item.
 */
export interface CostAnalysis {
    recommended: number;
    min: number;
    max: number;
    details: { item: string; cost: number }[];
}

/**
 * @interface EthicsAnalysis
 * @description Represents the result of an ethical analysis of the case.
 * @property {string} biasAssessment - A textual assessment of potential biases in the case data.
 * @property {string[]} privacyConcerns - A list of identified privacy concerns.
 * @property {string[]} recommendations - A list of actionable recommendations to mitigate ethical risks.
 */
export interface EthicsAnalysis {
    biasAssessment: string;
    privacyConcerns: string[];
    recommendations: string[];
}

/**
 * @interface CaseSummary
 * @description Represents a high-level, AI-generated summary of the entire case.
 * @property {string} summary - The overall summary text.
 * @property {{ risk: string; description: string }[]} identifiedRisks - A list of key identified risks.
 * @property {{ step: string; justification: string }[]} suggestedNextSteps - A list of suggested next actions.
 * @property {string} generatedAt - The ISO 8601 timestamp of when the summary was generated.
 */
export interface CaseSummary {
    summary: string;
    identifiedRisks: { risk: string; description: string }[];
    suggestedNextSteps: { step: string; justification: string }[];
    generatedAt: string;
}

/**
 * @interface SuggestedEntity
 * @description Represents an entity that has been suggested by the AI but not yet confirmed by the user.
 * @property {string} id - A unique identifier for the suggestion.
 * @property {string} name - The name of the suggested entity.
 * @property {'Person' | 'Organisation' | 'Standort' | 'Unbekannt'} type - The suggested type for the entity.
 * @property {string} description - The AI-generated description for the entity.
 * @property {string} sourceDocumentId - The ID of the document from which the entity was extracted.
 * @property {string} sourceDocumentName - The name of the source document.
 */
export interface SuggestedEntity {
    id: string;
    name: string;
    type: 'Person' | 'Organisation' | 'Standort' | 'Unbekannt';
    description: string;
    sourceDocumentId: string;
    sourceDocumentName: string;
}

/**
 * @interface ArgumentationPoint
 * @description Represents a single point of argument, either supporting or counter.
 * @property {string} point - The core statement of the argument.
 * @property {string[]} evidence - An array of evidence or facts from the case context that support the point.
 */
export interface ArgumentationPoint {
  point: string;
  evidence: string[];
}

/**
 * @interface ArgumentationAnalysis
 * @description Contains the complete result of an argumentation analysis, separating supporting and counter-arguments.
 * @property {ArgumentationPoint[]} supportingArguments - A list of arguments that support the user's case.
 * @property {ArgumentationPoint[]} counterArguments - A list of potential arguments the opposing side might use.
 */
export interface ArgumentationAnalysis {
  supportingArguments: ArgumentationPoint[];
  counterArguments: ArgumentationPoint[];
}

/**
 * @interface Notification
 * @description Represents a toast notification to be displayed to the user.
 * @property {string} id - A unique identifier for the notification.
 * @property {string} message - The main message text of the notification.
 * @property {'success' | 'error' | 'info'} type - The type of notification, which affects its styling.
 * @property {string} [details] - Optional additional details for the notification.
 */
export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    details?: string;
}

// State & Settings
/**
 * @interface CaseContext
 * @description Holds the user-defined description of the case.
 * @property {string} caseDescription - A free-text description of the case.
 */
export interface CaseContext {
    caseDescription: string;
}

/**
 * @interface Risks
 * @description A dictionary of boolean flags representing different categories of risk relevant to the case.
 */
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

/**
 * @interface AISettings
 * @description Defines the parameters for controlling the behavior of the AI model.
 * @property {number} temperature - Controls the randomness of the AI's output. Higher values are more creative.
 * @property {number} topP - Controls the nucleus sampling. Higher values consider more possible words.
 */
export interface AISettings {
    temperature: number;
    topP: number;
}

/**
 * @interface ComplexitySettings
 * @description Defines the thresholds (in hours) for classifying workload complexity.
 * @property {number} low - The upper limit for a "low" complexity task.
 * @property {number} medium - The upper limit for a "medium" complexity task.
 */
export interface ComplexitySettings {
    low: number;
    medium: number;
}

/**
 * @interface AppSettings
 * @description A container for all user-configurable settings in the application.
 * @property {AISettings} ai - The settings for the AI model.
 * @property {ComplexitySettings} complexity - The settings for workload complexity calculation.
 */
export interface AppSettings {
    ai: AISettings;
    complexity: ComplexitySettings;
}

/**
 * @interface AppState
 * @description The main interface that defines the entire state of the application.
 * This is the single source of truth for all data managed by the root App component.
 */
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
/**
 * @typedef ActiveTab
 * @description A string literal type defining all possible identifiers for the main application tabs.
 */
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
  
/**
 * @interface AnalysisChatMessage
 * @description Represents a single message in a chat history, with a role and text content.
 * @property {'user' | 'assistant'} role - The sender of the message.
 * @property {string} text - The content of the message.
 */
export interface AnalysisChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/**
 * @interface ChecklistItem
 * @description Represents a single item in a checklist, used for pre-dispatch verification.
 * @property {string} id - A unique identifier for the checklist item.
 * @property {string} text - The descriptive text of the checklist item.
 * @property {boolean} checked - Whether the item has been checked off.
 */
export interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

/**
 * @interface ProactiveSuggestion
 * @description Represents an actionable, proactive suggestion presented to the user by the assistant.
 * @property {string} id - A unique identifier for the suggestion.
 * @property {string} text - The text of the suggestion shown to the user.
 * @property {object} action - The action to be performed if the user accepts the suggestion. Can be a navigation or an executable function.
 */
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
/**
 * @interface ContentCreationParams
 * @description Defines the parameters required for the ContentCreatorService to generate a new document.
 * @property {string} instructions - The primary, user-provided instructions for the generation task.
 * @property {string} caseContext - The overall context of the case.
 * @property {Document[]} [sourceDocuments] - Optional source documents to be used as context.
 * @property {string} [template] - The string content of a template to be used.
 * @property {string} [templateName] - The name of the template being used.
 */
export interface ContentCreationParams {
    instructions: string;
    caseContext: string;
    sourceDocuments?: Document[];
    template?: string;
    templateName?: string;
}

/**
 * @interface GeneratedContent
 * @description Represents the output from the ContentCreatorService.
 * @property {string} content - The raw, Markdown-formatted content.
 * @property {string} htmlContent - The HTML-rendered version of the content.
 * @property {object} metadata - A collection of metadata about the generated content (e.g., word count).
 */
export interface GeneratedContent {
    content: string;
    htmlContent: string;
    metadata: { [key: string]: any };
}

/**
 * @interface TemporalAnalysisResult
 * @description Represents the structured result of a temporal analysis.
 * Contains various temporal aspects like chronology, clusters, patterns, and causal chains.
 */
export interface TemporalAnalysisResult {
    zeitlicher_rahmen: object;
    chronologie: object[];
    zeitliche_cluster: object[];
    muster: object[];
    kausale_ketten: object[];
    zeitliche_anomalien: object[];
}

/** @deprecated Use `CaseEntity` instead. */
export type Entity = any; // Placeholder for legacy Entity type, prefer CaseEntity
/** @deprecated This type is a placeholder and should not be used. */
export type DocEntity = any; // Placeholder
/** @deprecated This type is a placeholder and should not be used. */
export type KnowledgeTag = any; // Placeholder