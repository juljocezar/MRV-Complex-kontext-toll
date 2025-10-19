import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult, CaseEntityLink
} from '../types';

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 1;
let db: IDBDatabase;

export const STORES = {
    documents: 'documents',
    generatedDocuments: 'generatedDocuments',
    entities: 'entities',
    caseEntityLinks: 'caseEntityLinks',
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
};

// Stores that are expected to contain only a single record.
const SINGLE_RECORD_STORES = new Set([
    STORES.caseContext, STORES.risks, STORES.caseSummary, 
    STORES.settings, STORES.ethicsAnalysis, STORES.mitigationStrategies
]);


export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', (event.target as IDBOpenDBRequest).error);
            reject('Database error: ' + (event.target as IDBOpenDBRequest).error);
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = (event.target as IDBOpenDBRequest).result;
            Object.values(STORES).forEach(storeName => {
                if (!tempDb.objectStoreNames.contains(storeName)) {
                    // Default keyPath is 'id'. Special cases are handled here.
                    let keyPath = 'id';
                    if (storeName === STORES.documentAnalysisResults) keyPath = 'docId';
                    
                    const store = tempDb.createObjectStore(storeName, { keyPath });
                    if (storeName === STORES.tags) store.createIndex('name', 'name', { unique: true });
                    if (storeName === STORES.timelineEvents) store.createIndex('date', 'date', { unique: false });
                }
            });
        };
    });
};

// Generic CRUD helpers
const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

const add = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

const getOne = <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};


const update = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

export const deleteItem = (storeName: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};


const clearStore = (storeName: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

export const addMultiple = <T>(storeName: string, items: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!items || items.length === 0) return resolve();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.add(item as any));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// --- Specific Implementations ---
export const addDocument = (doc: Document) => add(STORES.documents, doc);
export const getAllDocuments = () => getAll<Document>(STORES.documents);
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);

export const getAllEntities = () => getAll<CaseEntity>(STORES.entities);
export const addMultipleEntities = (items: CaseEntity[]) => addMultiple(STORES.entities, items);

export const getAllCaseEntityLinks = () => getAll<CaseEntityLink>(STORES.caseEntityLinks);
export const saveAllCaseEntityLinks = async (items: CaseEntityLink[]) => { await clearStore(STORES.caseEntityLinks); await addMultiple(STORES.caseEntityLinks, items); };

export const getAllKnowledgeItems = () => getAll<KnowledgeItem>(STORES.knowledgeItems);
export const addMultipleKnowledgeItems = (items: KnowledgeItem[]) => addMultiple(STORES.knowledgeItems, items);
export const updateKnowledgeItem = (item: KnowledgeItem) => update(STORES.knowledgeItems, item);

export const getAllTimelineEvents = () => getAll<TimelineEvent>(STORES.timelineEvents);
export const addMultipleTimelineEvents = (items: TimelineEvent[]) => addMultiple(STORES.timelineEvents, items);

export const saveAllContradictions = async (items: Contradiction[]) => { await clearStore(STORES.contradictions); await addMultiple(STORES.contradictions, items); };
export const getAllContradictions = () => getAll<Contradiction>(STORES.contradictions);

export const getCaseContext = () => getOne<CaseContext>(STORES.caseContext, 1);
export const saveCaseContext = (context: CaseContext) => update(STORES.caseContext, { ...context, id: 1 });

export const getAllKpis = () => getAll<KPI>(STORES.kpis);
export const addMultipleKpis = (items: KPI[]) => addMultiple(STORES.kpis, items);

export const addTag = (tag: Tag) => add(STORES.tags, tag);
export const getAllTags = () => getAll<Tag>(STORES.tags);
export const deleteTag = (tagId: string) => deleteItem(STORES.tags, tagId);

// Fix: Add "save all" functions to correctly persist state collections.
export const saveAllDocuments = async (items: Document[]) => { await clearStore(STORES.documents); await addMultiple(STORES.documents, items); };
export const saveAllGeneratedDocuments = async (items: GeneratedDocument[]) => { await clearStore(STORES.generatedDocuments); await addMultiple(STORES.generatedDocuments, items); };
export const saveAllEntities = async (items: CaseEntity[]) => { await clearStore(STORES.entities); await addMultiple(STORES.entities, items); };
export const saveAllKnowledgeItems = async (items: KnowledgeItem[]) => { await clearStore(STORES.knowledgeItems); await addMultiple(STORES.knowledgeItems, items); };
export const saveAllTimelineEvents = async (items: TimelineEvent[]) => { await clearStore(STORES.timelineEvents); await addMultiple(STORES.timelineEvents, items); };
export const saveAllTags = async (items: Tag[]) => { await clearStore(STORES.tags); await addMultiple(STORES.tags, items); };
export const saveAllKpis = async (items: KPI[]) => { await clearStore(STORES.kpis); await addMultiple(STORES.kpis, items); };


export const getRisks = () => getOne<Risks>(STORES.risks, 1);
export const saveRisks = (risks: Risks) => update(STORES.risks, { ...risks, id: 1 });

export const getCaseSummary = () => getOne<CaseSummary>(STORES.caseSummary, 1);
export const saveCaseSummary = (summary: CaseSummary) => update(STORES.caseSummary, { ...summary, id: 1 });

export const getAllTasks = () => getAll<Task>(STORES.tasks);
export const getAllInsights = () => getAll<Insight>(STORES.insights);
export const saveAllInsights = async (items: Insight[]) => { await clearStore(STORES.insights); await addMultiple(STORES.insights, items); };

export const getAllAgentActivities = () => getAll<AgentActivity>(STORES.agentActivity);
export const addAgentActivity = (activity: AgentActivity) => add(STORES.agentActivity, activity);

export const getAllAuditLogEntries = () => getAll<AuditLogEntry>(STORES.auditLog);
export const addAuditLogEntry = (entry: AuditLogEntry) => add(STORES.auditLog, entry);

export const getSettings = () => getOne<AppSettings>(STORES.settings, 1);
export const saveSettings = (settings: AppSettings) => update(STORES.settings, { ...settings, id: 1 });

export const getEthicsAnalysis = () => getOne<EthicsAnalysis>(STORES.ethicsAnalysis, 1);
export const saveEthicsAnalysis = (analysis: EthicsAnalysis) => update(STORES.ethicsAnalysis, { ...analysis, id: 1 });

export const saveDocumentAnalysisResult = (docId: string, result: DocumentAnalysisResult) => update(STORES.documentAnalysisResults, { docId, result });
export const updateDocumentAnalysisResult = async (docId: string, partialResult: Partial<DocumentAnalysisResult>) => {
    const existing = await getOne<{docId: string, result: DocumentAnalysisResult}>(STORES.documentAnalysisResults, docId);
    const newResult = { ...existing?.result, ...partialResult };
    await update(STORES.documentAnalysisResults, { docId, result: newResult });
}
export const getAllDocumentAnalysisResults = () => getAll<{docId: string, result: DocumentAnalysisResult}>(STORES.documentAnalysisResults);

export const getMitigationStrategies = () => getOne<{id: number, content: string}>(STORES.mitigationStrategies, 1);
export const saveMitigationStrategies = (content: string) => update(STORES.mitigationStrategies, { id: 1, content });

// --- DB Management ---
export const clearDB = async (): Promise<void> => {
    await initDB();
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    const promises = Object.values(STORES).map(storeName => {
        return new Promise<void>((resolve, reject) => {
            const request = transaction.objectStore(storeName).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    });
    await Promise.all(promises);
};

export const exportStateToJSON = async (): Promise<string> => {
    const state: any = {};
    for (const storeName of Object.values(STORES)) {
        const storeData = await getAll(storeName);
        state[storeName] = storeData;
    }
    return JSON.stringify(state, null, 2);
};

export const importStateFromJSON = async (json: string): Promise<void> => {
    await clearDB();
    const state: Partial<AppState> & { [key: string]: any } = JSON.parse(json);

    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    const allPromises: Promise<any>[] = [];

    transaction.onerror = (event) => {
        console.error("Import Transaction Error:", (event.target as IDBRequest).error);
    };

    const promisifyRequest = (request: IDBRequest) => new Promise((resolve, reject) => {
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
    });

    for (const storeName of Object.values(STORES)) {
        const dataToImport = state[storeName];
        if (!dataToImport || !Array.isArray(dataToImport)) {
             console.warn(`No data or invalid data format for store "${storeName}" in import file.`);
             continue;
        }

        const store = transaction.objectStore(storeName);
        
        // MIGRATION LOGIC FOR OLDER CASE FILES
        if (SINGLE_RECORD_STORES.has(storeName)) {
            // These stores only have one record.
            if (dataToImport.length > 0) {
                // Ensure single records from old exports always have a static key `id: 1`
                const record = { ...dataToImport[0], id: 1 };
                allPromises.push(promisifyRequest(store.put(record)));
            }
        } else {
            // These stores have multiple records, each needing an ID.
            dataToImport.forEach(item => {
                // Determine the primary key for the store
                const keyPath = store.keyPath as string;

                // Check if item is an object and has the required key path
                if (item && typeof item === 'object' && keyPath in item && item[keyPath] !== undefined) {
                    allPromises.push(promisifyRequest(store.add(item)));
                } else if (storeName === STORES.documentAnalysisResults && item && typeof item === 'object' && 'docId' in item) {
                    // Backwards compatibility for documentAnalysisResults which had docId as key
                    allPromises.push(promisifyRequest(store.add(item)));
                } else {
                    console.warn(`Skipping item in store "${storeName}" during import: missing or invalid keyPath property "${keyPath}".`, item);
                }
            });
        }
    }

    try {
        await Promise.all(allPromises);
    } catch(error) {
        console.error("Error adding data during import transaction:", error);
        transaction.abort();
        throw error;
    }
};
