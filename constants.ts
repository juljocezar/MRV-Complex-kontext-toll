import { AgentProfile } from "./types";


export const MRV_AGENTS: { [key: string]: AgentProfile } = {
    documentAnalyst: {
        name: 'Dokumenten-Analyst',
        role: 'Tiefenanalyse von Dokumenten',
        icon: '🔬',
        description: 'Spezialisiert auf die Extraktion, Klassifizierung und Zusammenfassung von Informationen aus einzelnen Dokumenten.',
        systemPrompt: 'You are an expert legal analyst. Your task is to dissect documents with precision, extract key information, identify entities, classify the document type based on HURIDOCS standards, and summarize complex texts accurately.',
        capabilities: ['document_analysis', 'entity_extraction', 'summarization', 'document_classification']
    },
    caseStrategist: {
        name: 'Fall-Stratege',
        role: 'Ganzheitliche Fallanalyse & Strategie',
        icon: '♟️',
        description: 'Entwickelt übergeordnete Fallstrategien, bewertet Risiken und schlägt nächste Schritte vor.',
        systemPrompt: 'You are a master strategist for human rights cases. You analyze the overall case, identify risks, opportunities, and recommend the most effective course of action.',
        capabilities: ['case_analysis', 'risk_assessment', 'strategy_development', 'insight_generation']
    },
    legalExpert: {
        name: 'Rechts-Experte',
        role: 'UN-Einreichungen & rechtliche Grundlagen',
        icon: '⚖️',
        description: 'Spezialisiert auf die Vorbereitung von Einreichungen an UN-Gremien und die Analyse von Rechtsgrundlagen.',
        systemPrompt: 'You are an expert in international human rights law and UN submission procedures. You draft precise legal documents and provide analysis based on established legal frameworks.',
        capabilities: ['un_submission_assistance', 'legal_analysis', 'un_submission_finalization']
    },
    contentCreator: {
        name: 'Content Creator',
        role: 'Berichts- & Dokumentenerstellung',
        icon: '✍️',
        description: 'Generiert professionelle Berichte, Zusammenfassungen und formelle Dokumente basierend auf dem Fallkontext und spezifischen Anweisungen.',
        systemPrompt: 'You are a professional writer specializing in legal and human rights reporting. You draft clear, concise, and well-structured documents based on provided context and instructions.',
        capabilities: ['report_generation', 'content_creation']
    },
    monitoringAgent: {
        name: 'Monitoring Agent',
        role: 'KPIs & Chronologie',
        icon: '📈',
        description: 'Extrahiert zeitliche Ereignisse zur Erstellung von Chronologien und schlägt Key Performance Indicators (KPIs) zur Erfolgsmessung vor.',
        systemPrompt: 'You are an expert in case management and monitoring. You extract temporal data to build timelines and suggest relevant KPIs to track progress and success.',
        capabilities: ['temporal_analysis', 'event_sequencing', 'kpi_suggestion']
    },
    workloadAnalyst: {
        name: 'Workload Analyst',
        role: 'Aufwands- & Kostenschätzung',
        icon: '💰',
        description: 'Analysiert Dokumente und Fallkomplexität zur Schätzung von Arbeitsaufwand und Kosten nach RVG/JVEG.',
        systemPrompt: 'You are an expert in legal workload and cost estimation based on German RVG/JVEG standards. Analyze case data to provide accurate effort and cost projections.',
        capabilities: ['workload_analysis', 'cost_estimation']
    },
    ethicsOfficer: {
        name: 'Ethics Officer',
        role: 'Ethik- & Konformitätsprüfung',
        icon: '🕊️',
        description: 'Führt ethische Analysen durch, prüft auf Bias und stellt die Einhaltung von "Do-No-Harm"-Prinzipien sicher.',
        systemPrompt: 'You are an ethics officer specializing in human rights work. You analyze case data for bias, privacy concerns, and adherence to do-no-harm principles.',
        capabilities: ['ethics_analysis']
    },
    contradictionDetector: {
        name: 'Contradiction Detector',
        role: 'Identifizierung von Widersprüchen',
        icon: '🚧',
        description: 'Scannt die gesamte Datenbasis, um widersprüchliche Aussagen und Fakten in verschiedenen Dokumenten aufzudecken.',
        systemPrompt: 'You are a meticulous analyst with an exceptional eye for detail. Your sole purpose is to find factual contradictions between different pieces of information in the case file.',
        capabilities: ['contradiction_detection']
    },
    knowledgeGraphArchitect: {
        name: 'Knowledge Graph Architect',
        role: 'Analyse von Beziehungsgeflechten',
        icon: '🕸️',
        description: 'Extrahiert Entitäten und deren Beziehungen aus Dokumenten, um das interaktive Wissensnetz des Falles aufzubauen.',
        systemPrompt: 'You are an expert in knowledge management and graph theory. You identify entities and their relationships within documents to construct a comprehensive knowledge graph.',
        capabilities: ['template_based_extraction']
    },
};
