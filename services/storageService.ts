// Fix: Corrected import path for types.
import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult,
    ArgumentationAnalysis,
    SuggestedEntity
} from '../types';

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 1;
let db: IDBDatabase;

export const STORES = {
    documents: 'documents',
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
};

// Stores that are expected to contain only a single record.
const SINGLE_RECORD_STORES = new Set([
    STORES.caseContext, STORES.risks, STORES.caseSummary, 
    STORES.settings, STORES.ethicsAnalysis, STORES.mitigationStrategies,
    STORES.argumentationAnalysis
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

export const addMultiple = <T extends { id: any }>(storeName: string, items: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!items || items.length === 0) return resolve();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.put(item as any)); // Use put for robustness
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

export const addEntity = (entity: CaseEntity) => add(STORES.entities, entity);
export const getAllEntities = () => getAll<CaseEntity>(STORES.entities);
export const addMultipleEntities = (items: CaseEntity[]) => addMultiple(STORES.entities, items);

export const addKnowledgeItem = (item: KnowledgeItem) => add(STORES.knowledgeItems, item);
export const getAllKnowledgeItems = () => getAll<KnowledgeItem>(STORES.knowledgeItems);
export const addMultipleKnowledgeItems = (items: KnowledgeItem[]) => addMultiple(STORES.knowledgeItems, items);
export const updateKnowledgeItem = (item: KnowledgeItem) => update(STORES.knowledgeItems, item);

export const getAllTimelineEvents = () => getAll<TimelineEvent>(STORES.timelineEvents);
export const addMultipleTimelineEvents = (items: TimelineEvent[]) => addMultiple(STORES.timelineEvents, items);

export const addMultipleContradictions = (items: Contradiction[]) => addMultiple(STORES.contradictions, items);
export const saveAllContradictions = async (items: Contradiction[]) => { await clearStore(STORES.contradictions); await addMultiple(STORES.contradictions, items); };
export const getAllContradictions = () => getAll<Contradiction>(STORES.contradictions);

export const getCaseContext = () => getOne<CaseContext>(STORES.caseContext, 1);
export const saveCaseContext = (context: CaseContext) => update(STORES.caseContext, { ...context, id: 1 });

export const getAllKpis = () => getAll<KPI>(STORES.kpis);
export const addMultipleKpis = (items: KPI[]) => addMultiple(STORES.kpis, items);

export const addTag = (tag: Tag) => add(STORES.tags, tag);
export const addMultipleTags = (tags: Tag[]) => addMultiple(STORES.tags, tags);
export const getAllTags = () => getAll<Tag>(STORES.tags);
export const deleteTag = (tagId: string) => deleteItem(STORES.tags, tagId);

// saveAll functions are useful for bulk updates or imports, but should not be used for frequent state saving
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
export const addMultipleInsights = (items: Insight[]) => addMultiple(STORES.insights, items);
export const getAllInsights = () => getAll<Insight>(STORES.insights);
export const saveAllInsights = async (items: Insight[]) => { await clearStore(STORES.insights); await addMultiple(STORES.insights, items); };

export const getAllAgentActivities = () => getAll<AgentActivity>(STORES.agentActivity);
export const addAgentActivity = (activity: AgentActivity) => add(STORES.agentActivity, activity);
export const updateAgentActivity = (activity: AgentActivity) => update(STORES.agentActivity, activity);

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

export const getArgumentationAnalysis = () => getOne<ArgumentationAnalysis>(STORES.argumentationAnalysis, 1);
export const saveArgumentationAnalysis = (analysis: ArgumentationAnalysis) => {
    // A defensive check to ensure we are saving a valid object.
    if (!analysis || typeof analysis.supportingArguments === 'undefined' || typeof analysis.opponentArguments === 'undefined') {
        console.warn("Attempted to save invalid ArgumentationAnalysis", analysis);
        return Promise.resolve(); // Do nothing if analysis is malformed
    }
    return update(STORES.argumentationAnalysis, { 
        id: 1, 
        supportingArguments: analysis.supportingArguments, 
        opponentArguments: analysis.opponentArguments,
        adversarialAnalysis: analysis.adversarialAnalysis
    });
};

export const saveAllTasks = async (items: Task[]) => { await clearStore(STORES.tasks); await addMultiple(STORES.tasks, items); };

export const getAllSuggestedEntities = () => getAll<SuggestedEntity>(STORES.suggestedEntities);
export const addMultipleSuggestedEntities = (items: SuggestedEntity[]) => addMultiple(STORES.suggestedEntities, items);
export const deleteSuggestedEntity = (id: string) => deleteItem(STORES.suggestedEntities, id);


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
    let state: { [key: string]: any };

    try {
        state = JSON.parse(json);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        throw new Error("Die Datei ist keine gültige JSON-Datei.");
    }

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
        let dataToImport = state[storeName];

        if (dataToImport === undefined || dataToImport === null) {
            continue;
        }

        // Special handling for legacy documentAnalysisResults format (object map)
        if (storeName === STORES.documentAnalysisResults && !Array.isArray(dataToImport) && typeof dataToImport === 'object') {
            dataToImport = Object.entries(dataToImport)
                .filter(([, result]) => result != null) // Filter out null/undefined results
                .map(([docId, result]) => ({
                    docId: docId,
                    result: result as DocumentAnalysisResult
                }));
        }

        const store = transaction.objectStore(storeName);

        if (SINGLE_RECORD_STORES.has(storeName)) {
            // Expects an array with 0 or 1 item from export
            if (Array.isArray(dataToImport) && dataToImport.length > 0) {
                const record = dataToImport[0];
                if (record && typeof record === 'object') {
                    // Ensure the single record has the fixed ID of 1
                    const recordWithId = { ...record, id: 1 };
                    allPromises.push(promisifyRequest(store.put(recordWithId)));
                }
            }
        } else {
            // Handle multi-record stores
            if (Array.isArray(dataToImport)) {
                dataToImport.forEach(item => {
                    // Ensure item is a valid object before putting to prevent errors
                    if (item && typeof item === 'object') {
                        allPromises.push(promisifyRequest(store.put(item)));
                    }
                });
            } else {
                console.warn(`Invalid data format for multi-record store "${storeName}" in import file: expected an array. Skipping.`);
            }
        }
    }

    try {
        await Promise.all(allPromises);
    } catch (error) {
        console.error("Error adding data during import transaction:", error);
        transaction.abort();
        throw new Error("Fehler beim Schreiben der Daten in die Datenbank.");
    }
};