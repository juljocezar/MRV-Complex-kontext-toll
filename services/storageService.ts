import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult,
    ArgumentationAnalysis,
    SuggestedEntity,
    ForensicDossier,
    DocumentChunk
} from '../types';
import { 
    EsfEventRecord, 
    EsfPersonRecord, 
    EsfActRecord, 
    EsfInvolvementRecord, 
    EsfInformationRecord, 
    EsfInterventionRecord 
} from '../types/esf';
import { ApiService } from './apiService';
import { z } from 'zod'; // Ensure zod is installed

// FEATURE FLAG: Control Hybrid Mode via Environment Variable
const getUseBackendFlag = (): boolean => {
    try {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
            return (import.meta as any).env.VITE_USE_BACKEND === 'true';
        }
    } catch (e) {}
    return false;
};

const USE_BACKEND = getUseBackendFlag();

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 12;
let db: IDBDatabase;

// --- STORE DEFINITIONS ---
export const STORES = {
    documents: 'documents',
    chunks: 'chunks',
    generatedDocuments: 'generatedDocuments',
    entities: 'entities',
    knowledgeItems: 'knowledgeItems',
    timelineEvents: 'timelineEvents',
    tags: 'tags',
    contradictions: 'contradictions',
    caseContext: 'caseContext',
    tasks: 'tasks',
    kpis: 'kpis',
    risks: 'risks',
    caseSummary: 'caseSummary',
    insights: 'insights',
    agentActivity: 'agentActivity',
    auditLog: 'auditLog',
    settings: 'settings',
    ethicsAnalysis: 'ethicsAnalysis',
    documentAnalysisResults: 'documentAnalysisResults',
    mitigationStrategies: 'mitigationStrategies',
    argumentationAnalysis: 'argumentationAnalysis',
    suggestedEntities: 'suggestedEntities',
    dossiers: 'dossiers',
    esfEvents: 'esfEvents',
    esfPersons: 'esfPersons',
    esfActLinks: 'esfActLinks',
    esfInvolvementLinks: 'esfInvolvementLinks',
    esfInformationLinks: 'esfInformationLinks',
    esfInterventionLinks: 'esfInterventionLinks'
};

const SINGLE_RECORD_STORES = new Set([
    STORES.caseContext, STORES.risks, STORES.caseSummary, 
    STORES.settings, STORES.ethicsAnalysis, STORES.mitigationStrategies,
    STORES.argumentationAnalysis
]);

// --- SCHEMA VALIDATION (ZOD) ---
// Basic schema to validate import structure. Can be expanded for strict type checking.
const ImportSchema = z.record(z.string(), z.union([z.array(z.any()), z.record(z.any()), z.null(), z.undefined()]));

// --- IDB INIT ---
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
        request.onsuccess = (e) => { db = (e.target as IDBOpenDBRequest).result; resolve(db); };
        request.onupgradeneeded = (e) => {
            const tempDb = (e.target as IDBOpenDBRequest).result;
            // Create all stores
            Object.values(STORES).forEach(storeName => {
                if (!tempDb.objectStoreNames.contains(storeName)) {
                    let keyPath = 'id';
                    // Using indexOf instead of includes to avoid potential argument mismatch errors in some environments
                    const esfStores = ['esfEvents', 'esfPersons', 'esfActLinks', 'esfInvolvementLinks', 'esfInformationLinks', 'esfInterventionLinks'];
                    if (esfStores.indexOf(storeName) !== -1) {
                        keyPath = 'recordNumber';
                    }
                    if (storeName === STORES.documentAnalysisResults) {
                        keyPath = 'docId';
                    }
                    
                    const store = tempDb.createObjectStore(storeName, { keyPath });
                    if (storeName === STORES.tags) store.createIndex('name', 'name', { unique: true });
                    if (storeName === STORES.timelineEvents) store.createIndex('date', 'date', { unique: false });
                    if (storeName === STORES.chunks) store.createIndex('by-docId', 'docId', { unique: false });
                }
            });
        };
    });
};

// --- BASE IDB HELPERS ---
const getStore = (storeName: string, mode: IDBTransactionMode) => {
    if (!db) throw new Error("Database not initialized");
    return db.transaction(storeName, mode).objectStore(storeName);
};

const idbAdd = <T>(storeName: string, item: T) => new Promise<void>((res, rej) => {
    const req = getStore(storeName, 'readwrite').add(item);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
});

const idbGetAll = <T>(storeName: string) => new Promise<T[]>((res, rej) => {
    const req = getStore(storeName, 'readonly').getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
});

const idbGetOne = <T>(storeName: string, key: IDBValidKey) => new Promise<T | undefined>((res, rej) => {
    const req = getStore(storeName, 'readonly').get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
});

const idbUpdate = <T>(storeName: string, item: T) => new Promise<void>((res, rej) => {
    const req = getStore(storeName, 'readwrite').put(item);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
});

const idbDelete = (storeName: string, id: string) => new Promise<void>((res, rej) => {
    const req = getStore(storeName, 'readwrite').delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
});

const idbAddMultiple = <T>(storeName: string, items: T[]) => new Promise<void>((res, rej) => {
    if (!items.length) return res();
    const tx = db.transaction(storeName, 'readwrite');
    items.forEach(i => tx.objectStore(storeName).put(i));
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
});

const idbClearStore = (storeName: string) => new Promise<void>((res, rej) => {
    const req = getStore(storeName, 'readwrite').clear();
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
});

// --- HELPER: Hybrid Sync Error Handling ---
// Logs error but doesn't block local execution, yet signals warning
const handleBackendError = (operation: string, error: unknown) => {
    console.error(`Backend Sync Failed [${operation}]:`, error);
    // In a real app, dispatch to a global error queue for UI indication
};

// --- HYBRID EXPORTS ---

// DOCUMENTS
export const addDocument = async (doc: Document) => {
    if (USE_BACKEND) try { return await ApiService.createDocument(doc); } catch(e) { handleBackendError('createDocument', e); }
    return idbAdd(STORES.documents, doc);
};
export const getAllDocuments = async () => {
    if (USE_BACKEND) try { return await ApiService.getDocuments(); } catch(e) { handleBackendError('getDocuments', e); }
    return idbGetAll<Document>(STORES.documents);
};
export const updateDocument = async (doc: Document) => {
    if (USE_BACKEND) try { return await ApiService.updateDocument(doc); } catch(e) { handleBackendError('updateDocument', e); }
    return idbUpdate(STORES.documents, doc);
};

// ENTITIES
export const getAllEntities = async () => {
    if (USE_BACKEND) try { return await ApiService.getEntities(); } catch(e) { handleBackendError('getEntities', e); }
    return idbGetAll<CaseEntity>(STORES.entities);
};
export const saveAllEntities = async (items: CaseEntity[]) => {
    if (USE_BACKEND) try { return await ApiService.saveAllEntities(items); } catch(e) { handleBackendError('saveAllEntities', e); }
    await idbClearStore(STORES.entities); return idbAddMultiple(STORES.entities, items);
};
export const addEntity = (e: CaseEntity) => idbAdd(STORES.entities, e);
export const updateEntity = (e: CaseEntity) => idbUpdate(STORES.entities, e);

// TIMELINE
export const getAllTimelineEvents = async () => {
    if (USE_BACKEND) try { return await ApiService.getTimeline(); } catch(e) { handleBackendError('getTimeline', e); }
    return idbGetAll<TimelineEvent>(STORES.timelineEvents);
};
export const saveAllTimelineEvents = async (items: TimelineEvent[]) => {
    if (USE_BACKEND) try { return await ApiService.saveAllTimelineEvents(items); } catch(e) { handleBackendError('saveAllTimelineEvents', e); }
    await idbClearStore(STORES.timelineEvents); return idbAddMultiple(STORES.timelineEvents, items);
};

// KNOWLEDGE
export const getAllKnowledgeItems = async () => {
    if (USE_BACKEND) try { return await ApiService.getKnowledgeItems(); } catch(e) { handleBackendError('getKnowledgeItems', e); }
    return idbGetAll<KnowledgeItem>(STORES.knowledgeItems);
};
export const saveAllKnowledgeItems = async (items: KnowledgeItem[]) => {
    if (USE_BACKEND) try { return await ApiService.saveAllKnowledgeItems(items); } catch(e) { handleBackendError('saveAllKnowledgeItems', e); }
    await idbClearStore(STORES.knowledgeItems); return idbAddMultiple(STORES.knowledgeItems, items);
};
export const addKnowledgeItem = (item: KnowledgeItem) => idbAdd(STORES.knowledgeItems, item);
export const addMultipleKnowledgeItems = (items: KnowledgeItem[]) => idbAddMultiple(STORES.knowledgeItems, items);
export const updateKnowledgeItem = (item: KnowledgeItem) => idbUpdate(STORES.knowledgeItems, item);

// SINGLETONS (Hybrid)
export const getCaseContext = async () => {
    if (USE_BACKEND) try { return await ApiService.getContext(); } catch(e) { handleBackendError('getContext', e); }
    return idbGetOne<CaseContext>(STORES.caseContext, 1);
};
export const saveCaseContext = async (ctx: CaseContext) => {
    if (USE_BACKEND) try { await ApiService.saveContext(ctx); } catch(e) { handleBackendError('saveContext', e); }
    return idbUpdate(STORES.caseContext, { ...ctx, id: 1 });
};

export const getRisks = async () => {
    if (USE_BACKEND) try { return await ApiService.getRisks(); } catch(e) { handleBackendError('getRisks', e); }
    return idbGetOne<Risks>(STORES.risks, 1);
};
export const saveRisks = async (risks: Risks) => {
    if (USE_BACKEND) try { await ApiService.saveRisks(risks); } catch(e) { handleBackendError('saveRisks', e); }
    return idbUpdate(STORES.risks, { ...risks, id: 1 });
};

export const getSettings = async () => {
    if (USE_BACKEND) try { return await ApiService.getSettings(); } catch(e) { handleBackendError('getSettings', e); }
    return idbGetOne<AppSettings>(STORES.settings, 1);
};
export const saveSettings = async (set: AppSettings) => {
    if (USE_BACKEND) try { await ApiService.saveSettings(set); } catch(e) { handleBackendError('saveSettings', e); }
    return idbUpdate(STORES.settings, { ...set, id: 1 });
};

export const getAllTags = async () => {
    if (USE_BACKEND) try { return await ApiService.getTags(); } catch(e) { handleBackendError('getTags', e); }
    return idbGetAll<Tag>(STORES.tags);
};
export const saveAllTags = async (tags: Tag[]) => {
    if (USE_BACKEND) try { await ApiService.saveAllTags(tags); } catch(e) { handleBackendError('saveAllTags', e); }
    await idbClearStore(STORES.tags); return idbAddMultiple(STORES.tags, tags);
};

// IDB ONLY (Heavy data or non-critical for sync)
export const addChunk = (chunk: DocumentChunk) => idbAdd(STORES.chunks, chunk);
export const getAllChunks = () => idbGetAll<DocumentChunk>(STORES.chunks);
export const addMultipleChunks = (items: DocumentChunk[]) => idbAddMultiple(STORES.chunks, items);

export const addGeneratedDocument = (doc: GeneratedDocument) => idbAdd(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => idbGetAll<GeneratedDocument>(STORES.generatedDocuments);

export const getAllContradictions = () => idbGetAll<Contradiction>(STORES.contradictions);
export const addMultipleContradictions = (items: Contradiction[]) => idbAddMultiple(STORES.contradictions, items);

export const getAllKpis = () => idbGetAll<KPI>(STORES.kpis);
export const saveAllKpis = (items: KPI[]) => idbAddMultiple(STORES.kpis, items);

export const getCaseSummary = () => idbGetOne<CaseSummary>(STORES.caseSummary, 1);
export const saveCaseSummary = (s: CaseSummary) => idbUpdate(STORES.caseSummary, { ...s, id: 1 });

export const getAllInsights = () => idbGetAll<Insight>(STORES.insights);
export const addMultipleInsights = (items: Insight[]) => idbAddMultiple(STORES.insights, items);

export const getAllAgentActivities = () => idbGetAll<AgentActivity>(STORES.agentActivity);
export const addAgentActivity = (a: AgentActivity) => idbAdd(STORES.agentActivity, a);
export const updateAgentActivity = (a: AgentActivity) => idbUpdate(STORES.agentActivity, a);

export const getAllAuditLogEntries = () => idbGetAll<AuditLogEntry>(STORES.auditLog);
export const addAuditLogEntry = (e: AuditLogEntry) => idbAdd(STORES.auditLog, e);

export const getEthicsAnalysis = () => idbGetOne<EthicsAnalysis>(STORES.ethicsAnalysis, 1);
export const saveEthicsAnalysis = (a: EthicsAnalysis) => idbUpdate(STORES.ethicsAnalysis, { ...a, id: 1 });

export const getAllDocumentAnalysisResults = () => idbGetAll<{docId: string, result: DocumentAnalysisResult}>(STORES.documentAnalysisResults);
export const saveDocumentAnalysisResult = (docId: string, result: DocumentAnalysisResult) => idbUpdate(STORES.documentAnalysisResults, { id: docId, docId, result });

export const getMitigationStrategies = () => idbGetOne<{id: number, content: string}>(STORES.mitigationStrategies, 1);
export const saveMitigationStrategies = (c: string) => idbUpdate(STORES.mitigationStrategies, { id: 1, content: c });

export const getArgumentationAnalysis = () => idbGetOne<ArgumentationAnalysis>(STORES.argumentationAnalysis, 1);
export const saveArgumentationAnalysis = (a: ArgumentationAnalysis) => idbUpdate(STORES.argumentationAnalysis, { ...a, id: 1 });

export const getAllSuggestedEntities = () => idbGetAll<SuggestedEntity>(STORES.suggestedEntities);
export const addMultipleSuggestedEntities = (i: SuggestedEntity[]) => idbAddMultiple(STORES.suggestedEntities, i);
export const deleteSuggestedEntity = (id: string) => idbDelete(STORES.suggestedEntities, id);

export const getAllDossiers = () => idbGetAll<ForensicDossier>(STORES.dossiers);
export const saveDossier = (d: ForensicDossier) => idbUpdate(STORES.dossiers, d);

export const saveAllTasks = (t: Task[]) => idbAddMultiple(STORES.tasks, t);
export const getAllTasks = () => idbGetAll<Task>(STORES.tasks);

// ESF Local Storage
export const addMultipleEsfEvents = (i: EsfEventRecord[]) => idbAddMultiple(STORES.esfEvents, i);
export const getAllEsfEvents = () => idbGetAll<EsfEventRecord>(STORES.esfEvents);
export const addMultipleEsfPersons = (i: EsfPersonRecord[]) => idbAddMultiple(STORES.esfPersons, i);
export const getAllEsfPersons = () => idbGetAll<EsfPersonRecord>(STORES.esfPersons);
export const addMultipleEsfActLinks = (i: EsfActRecord[]) => idbAddMultiple(STORES.esfActLinks, i);
export const getAllEsfActLinks = () => idbGetAll<EsfActRecord>(STORES.esfActLinks);
export const addMultipleEsfInvolvementLinks = (i: EsfInvolvementRecord[]) => idbAddMultiple(STORES.esfInvolvementLinks, i);
export const getAllEsfInvolvementLinks = () => idbGetAll<EsfInvolvementRecord>(STORES.esfInvolvementLinks);
export const addMultipleEsfInformationLinks = (i: EsfInformationRecord[]) => idbAddMultiple(STORES.esfInformationLinks, i);
export const getAllEsfInformationLinks = () => idbGetAll<EsfInformationRecord>(STORES.esfInformationLinks);
export const addMultipleEsfInterventionLinks = (i: EsfInterventionRecord[]) => idbAddMultiple(STORES.esfInterventionLinks, i);
export const getAllEsfInterventionLinks = () => idbGetAll<EsfInterventionRecord>(STORES.esfInterventionLinks);

// Global
export const clearDB = async () => {
    await initDB();
    const tx = db.transaction(Object.values(STORES), 'readwrite');
    Object.values(STORES).forEach(s => tx.objectStore(s).clear());
    return new Promise<void>((res) => { tx.oncomplete = () => res(); });
};

export const exportStateToJSON = async () => {
    const state: Record<string, any> = {};
    for (const store of Object.values(STORES)) {
        state[store] = await idbGetAll(store);
    }
    return JSON.stringify(state, null, 2);
};

export const importStateFromJSON = async (json: string) => {
    await initDB(); 
    await clearDB();
    
    try {
        const rawState = JSON.parse(json);
        // Validating structure before writing to DB
        const state = ImportSchema.parse(rawState);
        
        const tx = db.transaction(Object.values(STORES), 'readwrite');
        const stores = Object.values(STORES);
        
        for (const store of stores) {
            const storeData = state[store];
            if (storeData) {
                const items = Array.isArray(storeData) ? storeData : [storeData];
                items.forEach((i: any) => tx.objectStore(store).put(i));
            }
        }
        
        return new Promise<void>((res, rej) => { 
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    } catch (error) {
        console.error("Import failed due to validation or parsing error:", error);
        throw new Error("Import failed: Invalid JSON structure or schema validation error.");
    }
};