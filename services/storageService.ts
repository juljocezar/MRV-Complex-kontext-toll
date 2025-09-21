import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult
} from '../types';

/** The name of the IndexedDB database. */
const DB_NAME = 'MRVAssistantDB';
/** The version of the IndexedDB database schema. */
const DB_VERSION = 1;
/** The singleton instance of the IDBDatabase. */
let db: IDBDatabase;

/**
 * An enumeration of all object store names used in the database.
 */
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
};

/**
 * A set of store names that are expected to contain only a single record.
 * These stores are handled specially during data import.
 */
const SINGLE_RECORD_STORES = new Set([
    STORES.caseContext, STORES.risks, STORES.caseSummary, 
    STORES.settings, STORES.ethicsAnalysis, STORES.mitigationStrategies
]);


/**
 * Initializes the IndexedDB database.
 * If the database is already initialized, it returns the existing instance.
 * Handles the creation and upgrading of object stores.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
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

// --- Generic CRUD Helpers ---

/**
 * Gets an object store from the database within a new transaction.
 * @param {string} storeName - The name of the store to access.
 * @param {IDBTransactionMode} mode - The transaction mode ('readonly' or 'readwrite').
 * @returns {IDBObjectStore} The requested object store.
 */
const getStore = (storeName: string, mode: IDBTransactionMode): IDBObjectStore => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

/**
 * Adds a single item to a specified store.
 * @template T
 * @param {string} storeName - The name of the store.
 * @param {T} item - The item to add.
 * @returns {Promise<void>} A promise that resolves when the item is added.
 */
const add = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

/**
 * Retrieves all items from a specified store.
 * @template T
 * @param {string} storeName - The name of the store.
 * @returns {Promise<T[]>} A promise that resolves with an array of all items in the store.
 */
const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

/**
 * Retrieves a single item from a store by its key.
 * @template T
 * @param {string} storeName - The name of the store.
 * @param {IDBValidKey} key - The key of the item to retrieve.
 * @returns {Promise<T | undefined>} A promise that resolves with the item, or undefined if not found.
 */
const getOne = <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};


/**
 * Updates an existing item or adds it if it doesn't exist (upsert).
 * @template T
 * @param {string} storeName - The name of the store.
 * @param {T} item - The item to update or insert.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
const update = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

/**
 * Deletes an item from a store by its ID.
 * @param {string} storeName - The name of the store.
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise<void>} A promise that resolves when the item is deleted.
 */
export const deleteItem = (storeName: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};


/**
 * Clears all items from a specified store.
 * @param {string} storeName - The name of the store to clear.
 * @returns {Promise<void>} A promise that resolves when the store is cleared.
 */
const clearStore = (storeName: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

/**
 * Adds multiple items to a store in a single transaction.
 * @template T
 * @param {string} storeName - The name of the store.
 * @param {T[]} items - An array of items to add.
 * @returns {Promise<void>} A promise that resolves when all items are added.
 */
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

// --- Specific Implementations for each data type ---

export const addDocument = (doc: Document) => add(STORES.documents, doc);
export const getAllDocuments = () => getAll<Document>(STORES.documents);
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);

export const getAllEntities = () => getAll<CaseEntity>(STORES.entities);
export const addMultipleEntities = (items: CaseEntity[]) => addMultiple(STORES.entities, items);

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

// --- "Save All" functions that clear and then add multiple items ---
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

/**
 * Clears all data from all object stores in the database.
 * @returns {Promise<void>} A promise that resolves when the database is cleared.
 */
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

/**
 * Exports the entire state of the database to a JSON string.
 * @returns {Promise<string>} A promise that resolves with the JSON string representation of the state.
 */
export const exportStateToJSON = async (): Promise<string> => {
    const state: any = {};
    for (const storeName of Object.values(STORES)) {
        const storeData = await getAll(storeName);
        state[storeName] = storeData;
    }
    return JSON.stringify(state, null, 2);
};

/**
 * Imports application state from a JSON string, overwriting all existing data.
 * Includes migration logic for older case file formats.
 * @param {string} json - The JSON string representing the application state.
 * @returns {Promise<void>} A promise that resolves when the import is complete.
 * @throws {Error} If the import transaction fails.
 */
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
            if (dataToImport.length > 0) {
                const record = { ...dataToImport[0], id: 1 };
                allPromises.push(promisifyRequest(store.put(record)));
            }
        } else {
            dataToImport.forEach(item => {
                const keyPath = store.keyPath as string;
                if (item && typeof item === 'object' && keyPath in item && item[keyPath] !== undefined) {
                    allPromises.push(promisifyRequest(store.add(item)));
                } else if (storeName === STORES.documentAnalysisResults && item && typeof item === 'object' && 'docId' in item) {
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
