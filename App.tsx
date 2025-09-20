import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Type, Part } from '@google/genai';

import SidebarNav from './components/ui/SidebarNav';
import AssistantSidebar from './components/ui/AssistantSidebar';
import DashboardTab from './components/tabs/DashboardTab';
import DocumentsTab from './components/tabs/DocumentsTab';
import AnalysisTab from './components/tabs/AnalysisTab';
import GenerationTab from './components/tabs/GenerationTab';
import LibraryTab from './components/tabs/LibraryTab';
import ReportsTab from './components/tabs/ReportsTab';
import KpisTab from './components/tabs/KpisTab';
import AgentManagementTab from './components/tabs/AgentManagementTab';
import StrategyTab from './components/tabs/StrategyTab';
import DispatchTab from './components/tabs/DispatchTab';
import ChronologyTab from './components/tabs/ChronologyTab';
import EntitiesTab from './components/tabs/EntitiesTab';
import KnowledgeBaseTab from './components/tabs/KnowledgeBaseTab';
import ContradictionsTab from './components/tabs/ContradictionsTab';
import SettingsTab from './components/tabs/SettingsTab';
import LegalBasisTab from './components/tabs/LegalBasisTab';
import UNSubmissionsTab from './components/tabs/UNSubmissionsTab';
import EthicsAnalysisTab from './components/tabs/EthicsAnalysisTab';
import AuditLogTab from './components/tabs/AuditLogTab';
import PlaceholderTab from './components/tabs/PlaceholderTab';
import GraphTab from './components/tabs/GraphTab';
import FocusModeSwitcher from './components/ui/FocusModeSwitcher';
import AnalysisChatModal from './components/modals/AnalysisChatModal';

import { 
    Document, DocumentAnalysis, DocumentAnalysisResults, GeneratedDocument, ActiveTab, 
    AgentActivity, Risks, KPI, TimelineEvent, DetailedAnalysis, DetailedAnalysisResults,
    Insight, ChecklistItem, CaseEntity, KnowledgeItem, Contradiction, DocumentLink, SuggestedEntity,
    SuggestedLink, AppSettings, UNSubmission, EthicsAnalysis, CaseSummary, ChainOfCustodyEvent, AnalysisChatMessage,
    AppState, EntityRelationship, Tag
} from './types';
import { saveState, loadState, clearState } from './services/storageService';
import { callGeminiAPIThrottled } from './services/geminiService';
import { extractFileContent } from './utils/fileUtils';
import { hashText } from './utils/cryptoUtils';
import { buildCaseContext } from './utils/contextUtils';
import { selectAgentForTask } from './utils/agentSelection';
import { MRV_AGENTS } from './constants';

const initialState: AppState = {
    documents: [],
    documentAnalysisResults: {},
    detailedAnalysisResults: {},
    generatedDocuments: [],
    caseDescription: 'Dieser Fall befasst sich mit den Menschenrechtsverletzungen, die von [BETROFFENER/GRUPPE] aufgrund von [ART DER VERLETZUNG] durch [TÄTER] in [ORT] am [DATUM] erlitten wurden. Ziel ist es, Beweise zu sammeln, rechtliche Schritte zu prüfen und internationale Aufmerksamkeit zu erlangen.',
    agentActivityLog: [],
    risks: { physical: false, legal: false, digital: false, intimidation: false, evidenceManipulation: false, secondaryTrauma: false, burnout: false, psychologicalBurden: false },
    mitigationStrategies: '',
    kpis: [],
    timelineEvents: [],
    insights: [],
    pinnedInsights: [],
    dispatchDocument: null,
    dispatchCoverLetter: '',
    dispatchChecklist: [
        { id: 'c1', text: 'Opfer-Zustimmung (Consent) eingeholt und dokumentiert.', checked: false },
        { id: 'c2', text: 'Alle Namen und persönlichen Daten anonymisiert (falls erforderlich).', checked: false },
        { id: 'c3', text: 'Dokument auf sachliche Korrektheit geprüft.', checked: false },
        { id: 'c4', text: 'Adressat und Anschrift sind korrekt.', checked: false },
    ],
    caseEntities: [],
    suggestedEntities: [],
    knowledgeItems: [],
    contradictions: [],
    documentLinks: [],
    suggestedLinks: [],
    unSubmissions: [],
    ethicsAnalysis: null,
    caseSummary: null,
    settings: {
        ai: { temperature: 0.3, topP: 0.95 },
        complexity: { low: 5, medium: 15 },
    },
    tags: [],
    auditLog: [],
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
    const [documents, setDocuments] = useState<Document[]>(initialState.documents);
    const [documentAnalysisResults, setDocumentAnalysisResults] = useState<DocumentAnalysisResults>(initialState.documentAnalysisResults);
    const [detailedAnalysisResults, setDetailedAnalysisResults] = useState<DetailedAnalysisResults>(initialState.detailedAnalysisResults);
    const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>(initialState.generatedDocuments);
    const [caseDescription, setCaseDescription] = useState<string>(initialState.caseDescription);
    const [agentActivityLog, setAgentActivityLog] = useState<AgentActivity[]>(initialState.agentActivityLog);
    const [risks, setRisks] = useState<Risks>(initialState.risks);
    const [mitigationStrategies, setMitigationStrategies] = useState<string>(initialState.mitigationStrategies);
    const [kpis, setKpis] = useState<KPI[]>(initialState.kpis);
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialState.timelineEvents);
    const [dispatchDocument, setDispatchDocument] = useState<GeneratedDocument | null>(initialState.dispatchDocument);
    const [dispatchCoverLetter, setDispatchCoverLetter] = useState<string>(initialState.dispatchCoverLetter);
    const [dispatchChecklist, setDispatchChecklist] = useState<ChecklistItem[]>(initialState.dispatchChecklist);
    const [caseEntities, setCaseEntities] = useState<CaseEntity[]>(initialState.caseEntities);
    const [suggestedEntities, setSuggestedEntities] = useState<SuggestedEntity[]>(initialState.suggestedEntities);
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>(initialState.knowledgeItems);
    const [contradictions, setContradictions] = useState<Contradiction[]>(initialState.contradictions);
    const [insights, setInsights] = useState<Insight[]>(initialState.insights);
    const [pinnedInsights, setPinnedInsights] = useState<Insight[]>(initialState.pinnedInsights);
    const [documentLinks, setDocumentLinks] = useState<DocumentLink[]>(initialState.documentLinks);
    const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLink[]>(initialState.suggestedLinks);
    const [unSubmissions, setUnSubmissions] = useState<UNSubmission[]>(initialState.unSubmissions);
    const [ethicsAnalysis, setEthicsAnalysis] = useState<EthicsAnalysis | null>(initialState.ethicsAnalysis);
    const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(initialState.caseSummary);
    const [settings, setSettings] = useState<AppSettings>(initialState.settings);
    const [tags, setTags] = useState<Tag[]>(initialState.tags);
    const [auditLog, setAuditLog] = useState<any[]>(initialState.auditLog);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingSection, setLoadingSection] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);

    const [chatDocuments, setChatDocuments] = useState<Document[]>([]);
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);


    const appState: AppState = useMemo(() => ({
        documents, documentAnalysisResults, detailedAnalysisResults, generatedDocuments, caseDescription,
        agentActivityLog, risks, mitigationStrategies, kpis, timelineEvents,
        dispatchDocument, dispatchCoverLetter, dispatchChecklist, caseEntities, suggestedEntities, knowledgeItems,
        contradictions, unSubmissions, ethicsAnalysis, caseSummary, settings, auditLog,
        insights, pinnedInsights, documentLinks, suggestedLinks, tags
    }), [
        documents, documentAnalysisResults, detailedAnalysisResults, generatedDocuments, caseDescription,
        agentActivityLog, risks, mitigationStrategies, kpis, timelineEvents,
        dispatchDocument, dispatchCoverLetter, dispatchChecklist, caseEntities, suggestedEntities, knowledgeItems,
        contradictions, unSubmissions, ethicsAnalysis, caseSummary, settings, auditLog,
        insights, pinnedInsights, documentLinks, suggestedLinks, tags
    ]);

    const logUserAction = useCallback((action: string, details: string) => {
        setAuditLog(prev => [...prev, { id: crypto.randomUUID(), timestamp: new Date().toISOString(), action, details }]);
    }, []);

    const logAgentAction = useCallback((agentName: string, action: string, result: 'erfolg' | 'fehler') => {
        setAgentActivityLog(prev => [...prev, { id: crypto.randomUUID(), timestamp: new Date().toISOString(), agentName, action, result }]);
    }, []);

    useEffect(() => {
        const savedState = loadState();
        if (savedState) {
            setDocuments(savedState.documents || initialState.documents);
            setDocumentAnalysisResults(savedState.documentAnalysisResults || initialState.documentAnalysisResults);
            setDetailedAnalysisResults(savedState.detailedAnalysisResults || initialState.detailedAnalysisResults);
            setGeneratedDocuments(savedState.generatedDocuments || initialState.generatedDocuments);
            setCaseDescription(savedState.caseDescription || initialState.caseDescription);
            setAgentActivityLog(savedState.agentActivityLog || initialState.agentActivityLog);
            setRisks({ ...initialState.risks, ...(savedState.risks || {}) });
            setMitigationStrategies(savedState.mitigationStrategies || initialState.mitigationStrategies);
            setKpis(savedState.kpis || initialState.kpis);
            setTimelineEvents(savedState.timelineEvents || initialState.timelineEvents);
            setDispatchDocument(savedState.dispatchDocument || initialState.dispatchDocument);
            setDispatchCoverLetter(savedState.dispatchCoverLetter || initialState.dispatchCoverLetter);
            setDispatchChecklist(savedState.dispatchChecklist || initialState.dispatchChecklist);
            setCaseEntities(savedState.caseEntities || initialState.caseEntities);
            setSuggestedEntities(savedState.suggestedEntities || initialState.suggestedEntities);
            setKnowledgeItems(savedState.knowledgeItems || initialState.knowledgeItems);
            setContradictions(savedState.contradictions || initialState.contradictions);
            setInsights(savedState.insights || initialState.insights);
            setPinnedInsights(savedState.pinnedInsights || initialState.pinnedInsights);
            setDocumentLinks(savedState.documentLinks || initialState.documentLinks);
            setSuggestedLinks(savedState.suggestedLinks || initialState.suggestedLinks);
            setUnSubmissions(savedState.unSubmissions || initialState.unSubmissions);
            setEthicsAnalysis(savedState.ethicsAnalysis || initialState.ethicsAnalysis);
            setCaseSummary(savedState.caseSummary || initialState.caseSummary);
            setSettings({
                ...initialState.settings,
                ...(savedState.settings || {}),
                ai: { ...initialState.settings.ai, ...(savedState.settings?.ai || {}) },
                complexity: { ...initialState.settings.complexity, ...(savedState.settings?.complexity || {}) }
            });
            setTags(savedState.tags || initialState.tags);
            setAuditLog(savedState.auditLog || initialState.auditLog);
        }
    }, []);

    useEffect(() => {
        saveState(appState);
    }, [appState]);
    
    const handleCreateTag = useCallback((name: string) => {
        if (name.trim() === '' || tags.some(t => t.name.toLowerCase() === name.trim().toLowerCase())) {
            alert("Tag-Name darf nicht leer sein oder bereits existieren.");
            return;
        }
        const newTag: Tag = { id: crypto.randomUUID(), name: name.trim() };
        setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
        logUserAction("Tag erstellt", `Name: ${name.trim()}`);
    }, [tags, logUserAction]);

    const handleDeleteTag = useCallback((tagId: string) => {
        const tagToDelete = tags.find(t => t.id === tagId);
        if (!tagToDelete) return;

        setTags(prev => prev.filter(t => t.id !== tagId));
        setDocuments(prev => prev.map(doc => ({
            ...doc,
            tags: doc.tags.filter(tagName => tagName !== tagToDelete.name)
        })));
        setKnowledgeItems(prev => prev.map(item => ({
            ...item,
            tags: item.tags.filter(tagName => tagName !== tagToDelete.name)
        })));
        logUserAction("Tag gelöscht", `Name: ${tagToDelete.name}`);
    }, [tags, logUserAction]);
    
    const handleUpdateDocumentTags = useCallback((docId: string, newTags: string[]) => {
        setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, tags: newTags.sort() } : doc));
    }, []);

    const handleUpdateKnowledgeItemTags = useCallback((itemId: string, newTags: string[]) => {
        setKnowledgeItems(prev => prev.map(item => item.id === itemId ? { ...item, tags: newTags.sort() } : item));
    }, []);

    const handleAutoClassify = useCallback(async (docId: string) => {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, classificationStatus: 'classifying' } : d));
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        const agent = selectAgentForTask('document_analysis');
        logAgentAction(agent.name, `Automatische Triage für "${doc.name}"`, 'erfolg');
        
        try {
            const availableTags = tags.map(t => t.name);
            const prompt = `
Analysiere den Inhalt des folgenden Dokuments, um es zu klassifizieren und relevante Tags zuzuweisen.
Verfügbare Tags: ${availableTags.join(', ')}
Dokumenteninhalt (erste 2000 Zeichen): """${doc.content.substring(0, 2000)}"""

Gib eine JSON-Antwort mit einer geeigneten 'workCategory' (z.B. "Zeugenaussage", "Gerichtsdokument", "Medizinischer Bericht", "Behördenschreiben", "Beweismittel") und einem Array 'suggestedTags' zurück, das NUR Tags aus der Liste der verfügbaren Tags enthält.
`;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    workCategory: { type: Type.STRING },
                    suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            };
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const { workCategory, suggestedTags } = JSON.parse(resultJson);
            
            setDocuments(prev => prev.map(d => d.id === docId ? {
                ...d,
                classificationStatus: 'classified',
                workCategory: workCategory || 'Unbestimmt',
                tags: [...new Set([...d.tags, ...(suggestedTags || [])])].sort()
            } : d));
            logAgentAction(agent.name, `Triage für "${doc.name}" erfolgreich`, 'erfolg');
        } catch (e) {
            console.error(`Auto-classification failed for ${doc.name}`, e);
            setDocuments(prev => prev.map(d => d.id === docId ? { ...d, classificationStatus: 'failed' } : d));
            logAgentAction(agent.name, `Triage für "${doc.name}"`, 'fehler');
        }
    }, [documents, tags, settings.ai, logAgentAction]);

    const handleFileUpload = useCallback(async (files: File[]) => {
        setIsLoading(true);
        setLoadingSection('file-upload');
        logUserAction('Dateiupload gestartet', `Anzahl: ${files.length}`);
        const newDocuments: Document[] = [];
        for (const file of files) {
            try {
                const { text, base64, mimeType } = await extractFileContent(file);
                let content = text ?? '';
                
                if (base64 && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
                    try {
                        const ocrAgent = selectAgentForTask('information_extraction');
                        logAgentAction(ocrAgent.name, `OCR für "${file.name}"`, 'erfolg');
                        const ocrPrompt = 'Extrahiere den gesamten Text aus diesem Bild. Gib nur den Text zurück.';
                        const imagePart: Part = {
                            inlineData: { mimeType: mimeType, data: base64 },
                        };
                        const ocrText = await callGeminiAPIThrottled([ocrPrompt, imagePart], null, settings.ai);
                        content = ocrText;
                         logAgentAction(ocrAgent.name, `OCR für "${file.name}" erfolgreich`, 'erfolg');
                    } catch (e) {
                        console.error('OCR failed for file:', file.name, e);
                        logAgentAction(selectAgentForTask('information_extraction').name, `OCR für "${file.name}"`, 'fehler');
                    }
                }

                const contentHash = await hashText(content);
                const chainOfCustody: ChainOfCustodyEvent[] = [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), action: 'Created', contentHash }];

                const newDoc: Document = {
                    id: crypto.randomUUID(),
                    name: file.name,
                    type: file.type,
                    content: content,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    classificationStatus: 'unclassified',
                    tags: [],
                    workCategory: 'Unbestimmt',
                    chainOfCustody: chainOfCustody,
                };
                newDocuments.push(newDoc);
            } catch (error) {
                console.error("Error processing file:", file.name, error);
            }
        }
        setDocuments(prev => {
            const updatedDocs = [...prev, ...newDocuments];
            // Start auto-classification in the background
            newDocuments.forEach(doc => handleAutoClassify(doc.id));
            return updatedDocs;
        });
        setIsLoading(false);
    }, [logUserAction, settings.ai, logAgentAction, handleAutoClassify]);

    const handleAnalyzeDocumentWorkload = useCallback(async (docId: string, docName: string, docContent: string) => {
        setIsLoading(true);
        setLoadingSection(`workload-${docId}`);
        const agent = selectAgentForTask('workload_calculation');
        logAgentAction(agent.name, `Arbeitsaufwandanalyse für "${docName}"`, 'erfolg');

        try {
            const context = buildCaseContext(appState);
            const prompt = `
Context: ${context}
Document Content: """${docContent.substring(0, 8000)}"""
Analyze the document to estimate the workload for a human rights case worker in Germany.
Provide a JSON response with complexity, justification, workload estimates, cost estimates, recommendations, and a list of suggested next actions.
The complexity is determined by these thresholds: low (up to ${settings.complexity.low}h), medium (up to ${settings.complexity.medium}h), high (more than ${settings.complexity.medium}h).
`;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    complexity: { type: Type.STRING, enum: ['hoch', 'mittel', 'niedrig'] },
                    complexityJustification: { type: Type.STRING },
                    workloadEstimate: {
                        type: Type.OBJECT,
                        properties: {
                            research: { type: Type.NUMBER }, classification: { type: Type.NUMBER }, analysis: { type: Type.NUMBER },
                            documentation: { type: Type.NUMBER }, correspondence: { type: Type.NUMBER }, followUp: { type: Type.NUMBER }, total: { type: Type.NUMBER }
                        }
                    },
                    costEstimate: {
                        type: Type.OBJECT, properties: { rvgBased: { type: Type.NUMBER }, jvegBased: { type: Type.NUMBER }, recommended: { type: Type.NUMBER } }
                    },
                    documentType: { type: Type.STRING },
                    recommendations: {
                        type: Type.ARRAY, items: {
                            type: Type.OBJECT, properties: {
                                category: { type: Type.STRING }, urgency: { type: Type.STRING, enum: ['hoch', 'mittel', 'niedrig'] }, text: { type: Type.STRING }
                            }
                        }
                    },
                    suggestedActions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Eine Liste von 2-3 konkreten, vorgeschlagenen nächsten Schritten basierend auf dem Dokumenteninhalt."
                    }
                }
            };
            const result = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const analysisResult = JSON.parse(result) as DocumentAnalysis;
            setDocumentAnalysisResults(prev => ({ ...prev, [docId]: analysisResult }));
        } catch (error) {
            console.error('Workload analysis failed:', error);
            logAgentAction(agent.name, `Arbeitsaufwandanalyse für "${docName}"`, 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings, logAgentAction]);

    const handlePerformDetailedAnalysis = useCallback(async (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;
        setIsLoading(true);
        setLoadingSection(`detailed-${docId}`);
        const agent = selectAgentForTask('document_analysis');
        logAgentAction(agent.name, `Detaillierte Analyse für "${doc.name}"`, 'erfolg');
        try {
            const context = buildCaseContext(appState);
            const prompt = `Führe eine detaillierte Analyse des folgenden Dokuments im Kontext des Falles durch. Extrahiere alle relevanten Informationen, inklusive Personen, Organisationen, Fakten und Ereignisse mit Datum.
Kontext: ${context}
Dokument: """${doc.content.substring(0, 8000)}"""`;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    beteiligte_parteien: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, type: { type: Type.STRING, enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] }, description: { type: Type.STRING } } } },
                    rechtliche_grundlagen: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { reference: { type: Type.STRING }, description: { type: Type.STRING } } } },
                    zentrale_fakten: { type: Type.ARRAY, items: { type: Type.STRING } },
                    erkannte_ereignisse: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { datum: { type: Type.STRING, description: "Das Datum des Ereignisses im Format YYYY-MM-DD" }, titel: { type: Type.STRING }, beschreibung: { type: Type.STRING } } } },
                    menschenrechtliche_implikationen: { type: Type.ARRAY, items: { type: Type.STRING } },
                    schlüsselwörter: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sentiment: { type: Type.STRING, enum: ['positiv', 'negativ', 'neutral'] },
                }
            };

            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const result = JSON.parse(resultJson) as DetailedAnalysis;
            setDetailedAnalysisResults(prev => ({ ...prev, [docId]: result }));

            if (result.beteiligte_parteien) {
                const newSuggestions = result.beteiligte_parteien
                    .filter(extracted => !caseEntities.some(existing => existing.name.toLowerCase() === extracted.name.toLowerCase()))
                    .map(p => ({
                        id: crypto.randomUUID(),
                        name: p.name,
                        type: p.type,
                        description: p.description,
                        sourceDocumentId: doc.id,
                        sourceDocumentName: doc.name,
                    }));
                setSuggestedEntities(prev => [...prev, ...newSuggestions]);
            }
            if (result.zentrale_fakten && result.zentrale_fakten.length > 0) {
                const newKnowledgeItem: KnowledgeItem = {
                    id: crypto.randomUUID(),
                    title: `Fakten aus "${doc.name}"`,
                    summary: result.zentrale_fakten.join('; '),
                    category: 'Faktenextraktion',
                    tags: result.schlüsselwörter || [],
                    sourceDocumentIds: [doc.id],
                    createdAt: new Date().toISOString(),
                };
                setKnowledgeItems(prev => [...prev, newKnowledgeItem]);
            }
            if (result.erkannte_ereignisse) {
                const newEvents: TimelineEvent[] = result.erkannte_ereignisse.map(e => ({
                    id: crypto.randomUUID(),
                    date: e.datum,
                    title: e.titel,
                    description: e.beschreibung,
                    documentIds: [doc.id],
                }));
                setTimelineEvents(prev => [...prev.filter(e => !e.documentIds.includes(doc.id)), ...newEvents]
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            }

        } catch (e) {
            console.error("Detailed analysis failed", e);
            logAgentAction(agent.name, `Detaillierte Analyse für "${doc.name}"`, 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [documents, appState, settings.ai, logAgentAction, caseEntities]);
    
    const handleAnalyzeCorrespondence = useCallback(async (docId: string) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;
        setIsLoading(true);
        setLoadingSection(`correspondence-${docId}`);
        const agent = selectAgentForTask('legal_analysis');
        logAgentAction(agent.name, `Analyse Behördenschreiben: "${doc.name}"`, 'erfolg');

        const prompt = `Analysiere das folgende Behördenschreiben auf subtile Zermürbungsstrategien, juristische Fallstricke, unklare Formulierungen oder Machtmissbrauch.
Dokument: """${doc.content}"""`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                findings: { type: Type.ARRAY, items: { type: Type.STRING, description: "Konkrete problematische Textstellen oder Formulierungen." } },
                intent: { type: Type.STRING, description: "Die vermutete Absicht hinter dem Schreiben (z.B. Einschüchterung, Verzögerung)." },
                riskAssessment: { type: Type.STRING, description: "Bewertung des Risikos, das von diesem Schreiben ausgeht." }
            }
        };

        try {
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const result = JSON.parse(resultJson);
            setDetailedAnalysisResults(prev => ({
                ...prev,
                [docId]: {
                    ...(prev[docId] || {}),
                    correspondenceAnalysis: result,
                } as DetailedAnalysis
            }));
        } catch (e) {
            console.error("Correspondence analysis failed", e);
            logAgentAction(agent.name, `Analyse Behördenschreiben: "${doc.name}"`, 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [documents, settings.ai, logAgentAction]);
    
    const handleGenerateDocument = useCallback(async (prompt: string, title: string, sourceDocIds: string[]) => {
        setIsLoading(true);
        setLoadingSection('doc-generation');
        
        let agentCapability: 'content_creation' | 'public_communication' = 'content_creation';
        if (title.toLowerCase().includes('presse') || title.toLowerCase().includes('social media')) {
            agentCapability = 'public_communication';
        }
        const agent = selectAgentForTask(agentCapability);
        logAgentAction(agent.name, `Dokumentgenerierung: "${title}"`, 'erfolg');

        try {
            let fullPrompt = buildCaseContext(appState);
            
            if (sourceDocIds.length > 0) {
                const sourceDocs = documents.filter(doc => sourceDocIds.includes(doc.id));
                let sourceContext = "\n\n**Zusätzlicher Kontext aus ausgewählten Dokumenten:**\n";
                sourceDocs.forEach(doc => {
                    sourceContext += `--- DOKUMENT: ${doc.name} ---\n${doc.content}\n\n`;
                });
                fullPrompt += sourceContext;
            }

            fullPrompt += `\n\n**Anweisung:**\n${prompt}`;

            const result = await callGeminiAPIThrottled(fullPrompt, null, settings.ai);
            const newDoc: GeneratedDocument = {
              id: crypto.randomUUID(),
              title: title,
              content: result,
              createdAt: new Date().toISOString(),
              status: 'draft',
              version: 1,
            };
            setGeneratedDocuments(prev => [...prev, newDoc]);
            return result;
        } catch (error) {
            console.error('Document generation failed:', error);
            logAgentAction(agent.name, `Dokumentgenerierung: "${title}"`, 'fehler');
            return 'Fehler bei der Dokumentenerstellung.';
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings.ai, logAgentAction, documents]);

    const onResetCase = () => {
        if (window.confirm("Sind Sie sicher, dass Sie den gesamten Fall zurücksetzen möchten? Alle Daten gehen verloren.")) {
            clearState();
            window.location.reload();
        }
    };

    const onExportCase = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `mrv_case_${new Date().toISOString()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        logUserAction('Fall exportiert', '');
    };

    const onImportCase = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target?.result as string) as AppState;
                setDocuments(importedState.documents || initialState.documents);
                setDocumentAnalysisResults(importedState.documentAnalysisResults || initialState.documentAnalysisResults);
                setDetailedAnalysisResults(importedState.detailedAnalysisResults || initialState.detailedAnalysisResults);
                setGeneratedDocuments(importedState.generatedDocuments || initialState.generatedDocuments);
                setCaseDescription(importedState.caseDescription || initialState.caseDescription);
                setAgentActivityLog(importedState.agentActivityLog || initialState.agentActivityLog);
                setRisks({ ...initialState.risks, ...(importedState.risks || {}) });
                setMitigationStrategies(importedState.mitigationStrategies || initialState.mitigationStrategies);
                setKpis(importedState.kpis || initialState.kpis);
                setTimelineEvents(importedState.timelineEvents || initialState.timelineEvents);
                setDispatchDocument(importedState.dispatchDocument || initialState.dispatchDocument);
                setDispatchCoverLetter(importedState.dispatchCoverLetter || initialState.dispatchCoverLetter);
                setDispatchChecklist(importedState.dispatchChecklist || initialState.dispatchChecklist);
                setCaseEntities(importedState.caseEntities || initialState.caseEntities);
                setSuggestedEntities(importedState.suggestedEntities || initialState.suggestedEntities);
                setKnowledgeItems(importedState.knowledgeItems || initialState.knowledgeItems);
                setContradictions(importedState.contradictions || initialState.contradictions);
                setInsights(importedState.insights || initialState.insights);
                setPinnedInsights(importedState.pinnedInsights || initialState.pinnedInsights);
                setDocumentLinks(importedState.documentLinks || initialState.documentLinks);
                setSuggestedLinks(importedState.suggestedLinks || initialState.suggestedLinks);
                setUnSubmissions(importedState.unSubmissions || initialState.unSubmissions);
                setEthicsAnalysis(importedState.ethicsAnalysis || initialState.ethicsAnalysis);
                setCaseSummary(importedState.caseSummary || initialState.caseSummary);
                setSettings({
                    ...initialState.settings,
                    ...(importedState.settings || {}),
                    ai: { ...initialState.settings.ai, ...(importedState.settings?.ai || {}) },
                    complexity: { ...initialState.settings.complexity, ...(importedState.settings?.complexity || {}) }
                });
                setTags(importedState.tags || initialState.tags);
                setAuditLog(importedState.auditLog || initialState.auditLog);
                logUserAction('Fall importiert (ersetzt)', `Datei: ${file.name}`);

            } catch (e) {
                alert('Fehler beim Parsen der Importdatei.');
                console.error(e);
            }
        };
        reader.readAsText(file);
    };

    const handlePerformOverallAnalysis = async () => {
        setIsLoading(true);
        setLoadingSection('overall-analysis');
        const agent = selectAgentForTask('case_analysis');
        logAgentAction(agent.name, "Gesamtanalyse des Falls", 'erfolg');

        const context = buildCaseContext(appState);

        const prompt = `Führe eine übergreifende Analyse des gesamten Falles durch, basierend auf der Fallbeschreibung und den analysierten Dokumenten. Gib eine prägnante Zusammenfassung, identifiziere die 3 dringendsten Risiken und schlage die 3 wichtigsten nächsten Schritte vor.
        Kontext: ${context}`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: 'Eine kurze, prägnante Zusammenfassung des gesamten Falles.' },
                identifiedRisks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            risk: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                },
                suggestedNextSteps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            step: { type: Type.STRING },
                            justification: { type: Type.STRING }
                        }
                    }
                }
            }
        };

        try {
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const summary: Omit<CaseSummary, 'generatedAt'> = JSON.parse(resultJson);
            setCaseSummary({ ...summary, generatedAt: new Date().toISOString() });
        } catch (e) {
            console.error("Overall analysis failed", e);
            logAgentAction(agent.name, "Gesamtanalyse des Falls", 'fehler');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestKpis = async () => {
        setIsLoading(true);
        setLoadingSection('kpi-suggestion');
        const agent = selectAgentForTask('kpi_suggestion');
        logAgentAction(agent.name, 'Vorschlag von KPIs', 'erfolg');

        const prompt = `Basierend auf dem folgenden Fallkontext, schlage 3-5 relevante, messbare Key Performance Indicators (KPIs) vor, um die Wirkung der Arbeit zu verfolgen.
Kontext: ${buildCaseContext(appState)}`;
        const schema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, target: { type: Type.STRING } }
            }
        };

        try {
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const suggested = JSON.parse(resultJson) as { name: string, target: string }[];
            const newKpis: KPI[] = suggested.map(k => ({ ...k, id: crypto.randomUUID(), progress: 0 }));
            setKpis(prev => [...prev, ...newKpis.filter(nk => !prev.some(ek => ek.name === nk.name))]);
        } catch (e) {
            console.error("KPI suggestion failed", e);
            logAgentAction(agent.name, 'Vorschlag von KPIs', 'fehler');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateMitigationStrategies = useCallback(async () => {
        setIsLoading(true);
        setLoadingSection('mitigation');
        const agent = selectAgentForTask('risk_assessment');
        logAgentAction(agent.name, 'Generierung von Minderungsstrategien', 'erfolg');

        try {
            const activeRisks = Object.entries(risks)
                .filter(([, value]) => value)
                .map(([key]) => key)
                .join(', ');

            if (!activeRisks) {
                setMitigationStrategies("Keine Risiken ausgewählt. Bitte wählen Sie zuerst Risiken aus der Liste aus.");
                return;
            }

            const context = buildCaseContext(appState);
            const prompt = `
Context: ${context}
Identifizierte Risiken: ${activeRisks}

Basierend auf den oben genannten Risiken und dem Fallkontext, schlage detaillierte und umsetzbare Strategien zur Minderung dieser Risiken vor. Formatiere die Antwort als Markdown.`;
            
            const result = await callGeminiAPIThrottled(prompt, null, settings.ai);
            setMitigationStrategies(result);

        } catch (error) {
            console.error("Mitigation strategy generation failed:", error);
            logAgentAction(agent.name, 'Generierung von Minderungsstrategien', 'fehler');
            setMitigationStrategies("Fehler bei der Generierung der Strategien.");
        } finally {
            setIsLoading(false);
        }
    }, [appState, risks, settings.ai, logAgentAction]);

    const handleFindContradictions = useCallback(async () => {
        setIsLoading(true);
        setLoadingSection('contradictions');
        const agent = selectAgentForTask('contradiction_detection');
        logAgentAction(agent.name, 'Widerspruchsanalyse', 'erfolg');

        try {
            const classifiedDocs = documents.filter(d => d.classificationStatus === 'classified' && d.content);
            if (classifiedDocs.length < 2) {
                alert("Es müssen mindestens zwei analysierte Dokumente vorhanden sein, um Widersprüche zu finden.");
                setIsLoading(false);
                return;
            }

            let documentsContext = "";
            classifiedDocs.forEach(doc => {
                documentsContext += `--- DOKUMENT: ${doc.name} (ID: ${doc.id}) ---\n${doc.content.substring(0, 4000)}\n\n`;
            });
            
            const prompt = `Analysiere die folgenden Dokumente und identifiziere alle faktischen Widersprüche zwischen ihnen.
Dokumente:
${documentsContext}

Gib eine Liste von Widersprüchen im JSON-Format zurück.
`;
            const schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        statement1: { type: Type.STRING },
                        sourceDoc1: { type: Type.STRING, description: `Die ID des ersten Dokuments. Muss eine von [${classifiedDocs.map(d => d.id).join(', ')}] sein.` },
                        statement2: { type: Type.STRING },
                        sourceDoc2: { type: Type.STRING, description: `Die ID des zweiten Dokuments. Muss eine von [${classifiedDocs.map(d => d.id).join(', ')}] sein.` },
                        explanation: { type: Type.STRING },
                    }
                }
            };

            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const foundContradictions: Omit<Contradiction, 'id'>[] = JSON.parse(resultJson);
            const newContradictions: Contradiction[] = foundContradictions.map(c => ({...c, id: crypto.randomUUID() }));
            setContradictions(newContradictions);

        } catch (error) {
            console.error("Contradiction analysis failed:", error);
            logAgentAction(agent.name, 'Widerspruchsanalyse', 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [documents, settings.ai, logAgentAction]);

    const handleGenerateInsights = useCallback(async () => {
        setIsLoading(true);
        setLoadingSection('insights');
        const agent = selectAgentForTask('task_suggestion');
        logAgentAction(agent.name, 'Strategische Einblicke generieren', 'erfolg');
        try {
            const context = buildCaseContext(appState);
            const prompt = `
Du bist ein proaktiver strategischer Assistent für einen Menschenrechtsfall.
Analysiere den folgenden Fallkontext und generiere 3-5 prägnante, handlungsorientierte Einblicke ("Insights").
Ein Insight kann eine Beobachtung, eine Empfehlung oder ein identifiziertes Risiko sein, das bisher übersehen wurde.
Kontext:
${context}
`;
            const schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['observation', 'recommendation', 'risk'] }
                    }
                }
            };
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const results: Omit<Insight, 'id' | 'source'>[] = JSON.parse(resultJson);
            const newInsights: Insight[] = results.map(r => ({ ...r, id: crypto.randomUUID(), source: agent.name }));
            setInsights(prev => [...newInsights, ...prev]);
        } catch (e) {
            console.error("Failed to generate insights", e);
            logAgentAction(agent.name, 'Strategische Einblicke generieren', 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings.ai, logAgentAction]);

    const handleDraftDispatchBody = useCallback(async (subject: string, attachments: (Document | GeneratedDocument)[]) => {
        setIsLoading(true);
        setLoadingSection('dispatch-body');
        const agent = selectAgentForTask('content_creation');
        logAgentAction(agent.name, 'E-Mail-Entwurf generieren', 'erfolg');
        try {
            const context = buildCaseContext(appState);
            const attachmentList = attachments.map(a => `- ${'name' in a ? a.name : a.title}`).join('\n');
            const prompt = `
Kontext: ${context}
Betreff der E-Mail: "${subject}"
Anhänge:
${attachmentList}

Erstelle einen formellen, kurzen E-Mail-Text, der den Versand der oben genannten Dokumente ankündigt und den Kontext erklärt.
`;
            const result = await callGeminiAPIThrottled(prompt, null, settings.ai);
            return result;
        } catch (error) {
            console.error("Dispatch body generation failed:", error);
            logAgentAction(agent.name, 'E-Mail-Entwurf generieren', 'fehler');
            return "Fehler bei der Erstellung des E-Mail-Entwurfs.";
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings.ai, logAgentAction]);
    
    const handlePerformEthicsAnalysis = useCallback(async () => {
        setIsLoading(true);
        setLoadingSection('ethics-analysis');
        const agent = selectAgentForTask('attrition_analysis');
        logAgentAction(agent.name, 'Ethik-Analyse durchführen', 'erfolg');

        try {
            const context = buildCaseContext(appState);
            const prompt = `
Führe eine Ethik-Analyse für den folgenden Menschenrechtsfall durch. 
Analysiere den Fall auf potenzielle Voreingenommenheit (Bias) in den Daten, Datenschutzbedenken, "Do-No-Harm"-Prinzipien und systemische Probleme wie Zermürbungsstrategien oder Machtmissbrauch.
Kontext:
${context}
`;
            const schema = {
                type: Type.OBJECT,
                properties: {
                    biasAssessment: { type: Type.STRING, description: "Bewertung potenzieller Voreingenommenheit in den vorliegenden Daten und der Fallbeschreibung." },
                    privacyConcerns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Liste spezifischer Datenschutzbedenken." },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Konkrete Handlungsempfehlungen, um ethischen Bedenken zu begegnen." },
                }
            };
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            setEthicsAnalysis(JSON.parse(resultJson));
        } catch (e) {
            console.error("Failed to perform ethics analysis", e);
            logAgentAction(agent.name, 'Ethik-Analyse durchführen', 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings.ai, logAgentAction]);

     const handleAnalyzeRelationships = useCallback(async () => {
        setIsLoading(true);
        setLoadingSection('relationships');
        const agent = selectAgentForTask('research');
        logAgentAction(agent.name, 'Beziehungsanalyse der Entitäten', 'erfolg');
        try {
            if (caseEntities.length < 2) {
                alert("Es müssen mindestens zwei Entitäten vorhanden sein, um Beziehungen zu analysieren.");
                return;
            }
            const context = buildCaseContext(appState);
            const entitiesContext = caseEntities.map(e => `- ID: ${e.id}, Name: ${e.name}, Typ: ${e.type}, Beschreibung: ${e.description}`).join('\n');
            const prompt = `
Fall-Kontext:
${context}

Entitäten-Liste:
${entitiesContext}

Analysiere die Beziehungen zwischen den oben genannten Entitäten basierend auf dem gesamten Fall-Kontext. Beschreibe jede signifikante Beziehung.
`;
            const schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        sourceId: { type: Type.STRING, description: "Die ID der Quell-Entität." },
                        targetId: { type: Type.STRING, description: "Die ID der Ziel-Entität." },
                        description: { type: Type.STRING, description: "Eine kurze Beschreibung der Beziehung von der Quelle zum Ziel (z.B. 'ist der Anwalt von', 'hat Anzeige erstattet gegen')." }
                    }
                }
            };
            const resultJson = await callGeminiAPIThrottled(prompt, schema, settings.ai);
            const relationships: { sourceId: string, targetId: string, description: string }[] = JSON.parse(resultJson);
            
            setCaseEntities(prevEntities => {
                const entitiesMap = new Map(prevEntities.map(e => [e.id, { ...e, relationships: [] as EntityRelationship[] }]));
                
                relationships.forEach(rel => {
                    const source = entitiesMap.get(rel.sourceId);
                    const target = entitiesMap.get(rel.targetId);
                    if (source && target) {
                        source.relationships.push({
                            targetEntityId: rel.targetId,
                            targetEntityName: target.name,
                            description: rel.description
                        });
                    }
                });

                return Array.from(entitiesMap.values());
            });

        } catch (e) {
            console.error("Failed to analyze relationships", e);
            logAgentAction(agent.name, 'Beziehungsanalyse der Entitäten', 'fehler');
        } finally {
            setIsLoading(false);
        }
    }, [appState, caseEntities, settings.ai, logAgentAction]);
    
    const handleGenerateUNSubmissionSection = useCallback(async (sectionTitle: string, currentContent: { [key: string]: string }) => {
        setIsLoading(true);
        setLoadingSection(`un-section-${sectionTitle}`);
        const agent = selectAgentForTask('un_submission_assistance');
        logAgentAction(agent.name, `UN-Sektion generieren: ${sectionTitle}`, 'erfolg');
        try {
            const context = buildCaseContext(appState);
            const existingContent = Object.entries(currentContent).map(([key, value]) => `Sektion "${key}":\n${value}`).join('\n\n');

            const prompt = `
Fall-Kontext:
${context}

Bestehender Inhalt der UN-Einreichung:
${existingContent}

---
Anweisung: Formuliere den Inhalt für die Sektion "${sectionTitle}" der UN-Einreichung. Sei präzise, faktenbasiert und beziehe dich auf die Informationen im Fall-Kontext.
`;

            const result = await callGeminiAPIThrottled(prompt, null, settings.ai);
            return result;
        } catch (error) {
            console.error(`Failed to generate UN submission section ${sectionTitle}`, error);
            logAgentAction(agent.name, `UN-Sektion generieren: ${sectionTitle}`, 'fehler');
            return `Fehler bei der Generierung der Sektion ${sectionTitle}.`;
        } finally {
            setIsLoading(false);
        }
    }, [appState, settings.ai, logAgentAction]);

    const handleOpenChat = useCallback((docs: Document[]) => {
        setChatDocuments(docs);
        const docNames = docs.map(d => `"${d.name}"`).join(', ');
        setChatHistory([{ role: 'model', text: `Hallo! Ich bin bereit, Fragen zu ${docNames} zu beantworten. Was möchten Sie wissen?` }]);
    }, []);

    const handleCloseChat = () => {
        setChatDocuments([]);
        setChatHistory([]);
    };

    const handleSendChatMessage = useCallback(async (message: string) => {
        if (chatDocuments.length === 0) return;

        const newHistory = [...chatHistory, { role: 'user' as const, text: message }];
        setChatHistory(newHistory);
        setIsLoading(true);
        setLoadingSection('chat');
        selectAgentForTask('information_extraction');
        
        const documentsContext = chatDocuments.map(doc => `Document Name: "${doc.name}"\nDocument Content: """${doc.content}"""`).join('\n\n---\n\n');

        const prompt = `
Context: You are an AI assistant answering questions about a specific set of documents.
${documentsContext}
Previous Conversation:
${newHistory.map(m => `${m.role}: ${m.text}`).join('\n')}

New Question: ${message}
Answer concisely based *only* on the provided document content and conversation history.
`;

        try {
            const responseText = await callGeminiAPIThrottled(prompt, null, settings.ai);
            setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (e) {
            console.error("Chat message failed", e);
            setChatHistory(prev => [...prev, { role: 'model', text: "Entschuldigung, bei der Analyse ist ein Fehler aufgetreten." }]);
        } finally {
            setIsLoading(false);
        }
    }, [chatDocuments, chatHistory, settings.ai]);

    const handleAddKnowledge = useCallback((title: string, summary: string, sourceDocId: string) => {
        const newItem: KnowledgeItem = {
            id: crypto.randomUUID(),
            title,
            summary,
            category: 'Manuelle Erfassung',
            tags: ['chat-extraktion'],
            sourceDocumentIds: [sourceDocId],
            createdAt: new Date().toISOString(),
        };
        setKnowledgeItems(prev => [...prev, newItem]);
        logUserAction("Wissenseintrag erstellt", `Titel: ${title}`);
    }, [logUserAction]);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab
                    documents={documents}
                    generatedDocuments={generatedDocuments}
                    documentAnalysisResults={documentAnalysisResults}
                    caseDescription={caseDescription}
                    setCaseDescription={setCaseDescription}
                    setActiveTab={setActiveTab}
                    onResetCase={onResetCase}
                    onExportCase={onExportCase}
                    onImportCase={onImportCase}
                    caseSummary={caseSummary}
                    onPerformOverallAnalysis={handlePerformOverallAnalysis}
                    isLoading={isLoading}
                    loadingSection={loadingSection}
                />;
            case 'documents':
                return <DocumentsTab
                    documents={documents}
                    setDocuments={setDocuments}
                    onFileUpload={handleFileUpload}
                    onAnalyzeDocumentWorkload={handleAnalyzeDocumentWorkload}
                    onOpenChat={handleOpenChat}
                    isLoading={isLoading}
                    loadingSection={loadingSection}
                    tags={tags}
                    onUpdateDocumentTags={handleUpdateDocumentTags}
                />;
            case 'analysis':
                return <AnalysisTab
                    documentAnalysisResults={documentAnalysisResults}
                    detailedAnalysisResults={detailedAnalysisResults}
                    documents={documents}
                    onPerformDetailedAnalysis={handlePerformDetailedAnalysis}
                    onAnalyzeCorrespondence={handleAnalyzeCorrespondence}
                    isLoading={isLoading}
                    loadingSection={loadingSection}
                />;
            case 'generation':
                return <GenerationTab
                    onGenerateDocument={handleGenerateDocument}
                    isLoading={isLoading && loadingSection === 'doc-generation'}
                    generatedDocuments={generatedDocuments}
                    setGeneratedDocuments={setGeneratedDocuments}
                    documents={documents}
                    setActiveTab={setActiveTab}
                    onDispatchDocument={setDispatchDocument}
                />;
            case 'library':
                return <LibraryTab />;
            case 'reports':
                return <ReportsTab onGenerateReport={async (p, s) => callGeminiAPIThrottled(p, s, settings.ai)} appState={appState} />;
            case 'kpis':
                return <KpisTab kpis={kpis} setKpis={setKpis} onSuggestKpis={handleSuggestKpis} isLoading={isLoading && loadingSection === 'kpi-suggestion'} />;
            case 'agents':
                return <AgentManagementTab agentActivityLog={agentActivityLog} />;
            case 'strategy':
                return <StrategyTab risks={risks} setRisks={setRisks} mitigationStrategies={mitigationStrategies} onGenerateMitigationStrategies={handleGenerateMitigationStrategies} isLoading={isLoading && loadingSection === 'mitigation'} />;
            case 'dispatch':
                return <DispatchTab 
                    dispatchDocument={dispatchDocument}
                    coverLetter={dispatchCoverLetter}
                    setCoverLetter={setDispatchCoverLetter} 
                    checklist={dispatchChecklist} 
                    setChecklist={setDispatchChecklist} 
                    onDraftBody={handleDraftDispatchBody}
                    onConfirmDispatch={() => {}} 
                    isLoading={isLoading} 
                    loadingSection={loadingSection} 
                    setActiveTab={setActiveTab}
                    documents={documents}
                    generatedDocuments={generatedDocuments}
                />;
            case 'chronology':
                return <ChronologyTab timelineEvents={timelineEvents} setTimelineEvents={setTimelineEvents} documents={documents} />;
            case 'entities':
                return <EntitiesTab
                    entities={caseEntities}
                    setEntities={setCaseEntities}
                    documents={documents}
                    suggestedEntities={suggestedEntities}
                    onAcceptSuggestedEntity={(id) => {
                        const suggestion = suggestedEntities.find(s => s.id === id);
                        if (suggestion) {
                            setCaseEntities(prev => [...prev, { id: crypto.randomUUID(), name: suggestion.name, type: suggestion.type as CaseEntity['type'], description: suggestion.description, documentIds: [suggestion.sourceDocumentId] }]);
                            setSuggestedEntities(prev => prev.filter(s => s.id !== id));
                        }
                    }}
                    onDismissSuggestedEntity={(id) => setSuggestedEntities(prev => prev.filter(s => s.id !== id))}
                    onAnalyzeRelationships={handleAnalyzeRelationships}
                    isLoading={isLoading}
                    loadingSection={loadingSection}
                />;
            case 'graph':
                return <GraphTab entities={caseEntities} />;
            case 'knowledge':
                return <KnowledgeBaseTab 
                    knowledgeItems={knowledgeItems} 
                    tags={tags}
                    onUpdateKnowledgeItemTags={handleUpdateKnowledgeItemTags}
                    />;
            case 'contradictions':
                return <ContradictionsTab contradictions={contradictions} onFindContradictions={handleFindContradictions} isLoading={isLoading && loadingSection === 'contradictions'} documents={documents} />;
            case 'settings':
                return <SettingsTab 
                    settings={settings} 
                    setSettings={setSettings} 
                    tags={tags}
                    onCreateTag={handleCreateTag}
                    onDeleteTag={handleDeleteTag}
                    />;
            case 'legal':
                return <LegalBasisTab />;
            case 'un-submissions':
                return <UNSubmissionsTab 
                    submissions={unSubmissions} 
                    setSubmissions={setUnSubmissions} 
                    onGenerateSection={handleGenerateUNSubmissionSection}
                    onFinalize={async () => {}} 
                    isLoading={isLoading} 
                    loadingSection={loadingSection} 
                />;
            case 'ethics':
                return <EthicsAnalysisTab analysisResult={ethicsAnalysis} onPerformAnalysis={handlePerformEthicsAnalysis} isLoading={isLoading && loadingSection === 'ethics-analysis'} />;
            case 'audit':
                return <AuditLogTab auditLog={auditLog} agentActivityLog={agentActivityLog} />;
            default:
                return <PlaceholderTab />;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-100 flex h-screen font-sans">
            {!isFocusMode && <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />}
            <main className="flex-grow flex flex-col h-screen">
                <header className="flex-shrink-0 bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">MRV Assistant Professional</h2>
                    <FocusModeSwitcher isFocusMode={isFocusMode} toggleFocusMode={() => setIsFocusMode(!isFocusMode)} />
                </header>
                <div className="flex-grow p-6 overflow-y-auto bg-gray-800/50">
                    {renderActiveTab()}
                </div>
            </main>
            {!isFocusMode && <AssistantSidebar 
                agentActivityLog={agentActivityLog}
                insights={insights}
                onGenerateInsights={handleGenerateInsights}
                isLoading={isLoading}
                loadingSection={loadingSection}
                />}
            {chatDocuments.length > 0 && (
                <AnalysisChatModal
                    documents={chatDocuments}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendChatMessage}
                    onClose={handleCloseChat}
                    isLoading={isLoading && loadingSection === 'chat'}
                    onAddKnowledge={handleAddKnowledge}
                />
            )}
        </div>
    );
};

export default App;