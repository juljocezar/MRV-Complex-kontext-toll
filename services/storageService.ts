import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult,
    ArgumentationAnalysis,
    SuggestedEntity
} from '../types';

/** @const {string} DB_NAME - The name of the IndexedDB database. */
const DB_NAME = 'MRVAssistantDB';
/** @const {number} DB_VERSION - The current version of the database schema. */
const DB_VERSION = 1;
/** @let {IDBDatabase} db - The global instance of the opened IndexedDB database. */
let db: IDBDatabase;

/**
 * @const {object} STORES
 * @description An object containing the names of all object stores used in the database.
 * This provides a single source of truth for store names.
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
    argumentationAnalysis: 'argumentationAnalysis',
    suggestedEntities: 'suggestedEntities',
};

/**
 * @const {Set<string>} SINGLE_RECORD_STORES
 * @description A Set containing the names of stores that are designed to hold only a single record.
 * This is used for special handling during data import/export.
 */
const SINGLE_RECORD_STORES = new Set([
    STORES.caseContext, STORES.risks, STORES.caseSummary, 
    STORES.settings, STORES.ethicsAnalysis, STORES.mitigationStrategies,
    STORES.argumentationAnalysis
]);

/**
 * @function initDB
 * @description Initializes the IndexedDB database. This function opens the database and creates the
 * object stores if they don't exist (onupgradeneeded). It ensures that there is a single,
 * shared database connection for the application.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance once it's successfully opened.
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
/**
 * @private
 * @function getStore
 * @description Helper function to get an object store from the database within a new transaction.
 * @param {string} storeName - The name of the object store.
 * @param {IDBTransactionMode} mode - The transaction mode ('readonly' or 'readwrite').
 * @returns {IDBObjectStore} The requested object store.
 */
const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

/**
 * @private
 * @function add
 * @description Generic function to add a single item to a store.
 * @template T - The type of the item being added.
 * @param {string} storeName - The name of the store.
 * @param {T} item - The item to add.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
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
 * @private
 * @function getAll
 * @description Generic function to retrieve all items from a store.
 * @template T - The expected type of the items in the store.
 * @param {string} storeName - The name of the store.
 * @returns {Promise<T[]>} A promise that resolves with an array of all items.
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
 * @private
 * @function getOne
 * @description Generic function to retrieve a single item from a store by its key.
 * @template T - The expected type of the item.
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
 * @private
 * @function update
 * @description Generic function to update/insert a single item in a store.
 * @template T - The type of the item.
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
 * @function deleteItem
 * @description Deletes a single item from a store by its ID.
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
 * @private
 * @function clearStore
 * @description Deletes all items from a store.
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
 * @function addMultiple
 * @description Adds multiple items to a store in a single transaction. Uses `put` for robustness.
 * @template T - The type of items being added.
 * @param {string} storeName - The name of the store.
 * @param {T[]} items - An array of items to add.
 * @returns {Promise<void>} A promise that resolves when the transaction is complete.
 */
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
/** @description Adds a single Document record. */
export const addDocument = (doc: Document) => add(STORES.documents, doc);
/** @description Retrieves all Document records. */
export const getAllDocuments = () => getAll<Document>(STORES.documents);
/** @description Updates a single Document record. */
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

/** @description Adds a single GeneratedDocument record. */
export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
/** @description Retrieves all GeneratedDocument records. */
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);

/** @description Adds a single CaseEntity record. Corresponds to the HURIDOCS "Person" format. */
export const addEntity = (entity: CaseEntity) => add(STORES.entities, entity);
/** @description Retrieves all CaseEntity records. */
export const getAllEntities = () => getAll<CaseEntity>(STORES.entities);
/** @description Adds multiple CaseEntity records in a single transaction. */
export const addMultipleEntities = (items: CaseEntity[]) => addMultiple(STORES.entities, items);

/** @description Adds a single KnowledgeItem record. */
export const addKnowledgeItem = (item: KnowledgeItem) => add(STORES.knowledgeItems, item);
/** @description Retrieves all KnowledgeItem records. */
export const getAllKnowledgeItems = () => getAll<KnowledgeItem>(STORES.knowledgeItems);
/** @description Adds multiple KnowledgeItem records in a single transaction. */
export const addMultipleKnowledgeItems = (items: KnowledgeItem[]) => addMultiple(STORES.knowledgeItems, items);
/** @description Updates a single KnowledgeItem record. */
export const updateKnowledgeItem = (item: KnowledgeItem) => update(STORES.knowledgeItems, item);

/** @description Retrieves all TimelineEvent records. These correspond to the HURIDOCS "Event" format. */
export const getAllTimelineEvents = () => getAll<TimelineEvent>(STORES.timelineEvents);
/** @description Adds multiple TimelineEvent records in a single transaction. */
export const addMultipleTimelineEvents = (items: TimelineEvent[]) => addMultiple(STORES.timelineEvents, items);

/** @description Adds multiple Contradiction records in a single transaction. */
export const addMultipleContradictions = (items: Contradiction[]) => addMultiple(STORES.contradictions, items);
/** @description Replaces all Contradiction records with a new set. */
export const saveAllContradictions = async (items: Contradiction[]) => { await clearStore(STORES.contradictions); await addMultiple(STORES.contradictions, items); };
/** @description Retrieves all Contradiction records. */
export const getAllContradictions = () => getAll<Contradiction>(STORES.contradictions);

/** @description Retrieves the single CaseContext record. */
export const getCaseContext = () => getOne<CaseContext>(STORES.caseContext, 1);
/** @description Saves the single CaseContext record. */
export const saveCaseContext = (context: CaseContext) => update(STORES.caseContext, { ...context, id: 1 });

/** @description Retrieves all KPI records. */
export const getAllKpis = () => getAll<KPI>(STORES.kpis);
/** @description Adds multiple KPI records in a single transaction. */
export const addMultipleKpis = (items: KPI[]) => addMultiple(STORES.kpis, items);

/** @description Adds a single Tag record. */
export const addTag = (tag: Tag) => add(STORES.tags, tag);
/** @description Adds multiple Tag records in a single transaction. */
export const addMultipleTags = (tags: Tag[]) => addMultiple(STORES.tags, tags);
/** @description Retrieves all Tag records. */
export const getAllTags = () => getAll<Tag>(STORES.tags);
/** @description Deletes a single Tag record by its ID. */
export const deleteTag = (tagId: string) => deleteItem(STORES.tags, tagId);

// saveAll functions are useful for bulk updates or imports, but should not be used for frequent state saving
/** @description Replaces all Document records with a new set. */
export const saveAllDocuments = async (items: Document[]) => { await clearStore(STORES.documents); await addMultiple(STORES.documents, items); };
/** @description Replaces all GeneratedDocument records with a new set. */
export const saveAllGeneratedDocuments = async (items: GeneratedDocument[]) => { await clearStore(STORES.generatedDocuments); await addMultiple(STORES.generatedDocuments, items); };
/** @description Replaces all CaseEntity records with a new set. */
export const saveAllEntities = async (items: CaseEntity[]) => { await clearStore(STORES.entities); await addMultiple(STORES.entities, items); };
/** @description Replaces all KnowledgeItem records with a new set. */
export const saveAllKnowledgeItems = async (items: KnowledgeItem[]) => { await clearStore(STORES.knowledgeItems); await addMultiple(STORES.knowledgeItems, items); };
/** @description Replaces all TimelineEvent records with a new set. */
export const saveAllTimelineEvents = async (items: TimelineEvent[]) => { await clearStore(STORES.timelineEvents); await addMultiple(STORES.timelineEvents, items); };
/** @description Replaces all Tag records with a new set. */
export const saveAllTags = async (items: Tag[]) => { await clearStore(STORES.tags); await addMultiple(STORES.tags, items); };
/** @description Replaces all KPI records with a new set. */
export const saveAllKpis = async (items: KPI[]) => { await clearStore(STORES.kpis); await addMultiple(STORES.kpis, items); };


/** @description Retrieves the single Risks record. */
export const getRisks = () => getOne<Risks>(STORES.risks, 1);
/** @description Saves the single Risks record. */
export const saveRisks = (risks: Risks) => update(STORES.risks, { ...risks, id: 1 });

/** @description Retrieves the single CaseSummary record. */
export const getCaseSummary = () => getOne<CaseSummary>(STORES.caseSummary, 1);
/** @description Saves the single CaseSummary record. */
export const saveCaseSummary = (summary: CaseSummary) => update(STORES.caseSummary, { ...summary, id: 1 });

/** @description Retrieves all Task records. */
export const getAllTasks = () => getAll<Task>(STORES.tasks);
/** @description Adds multiple Insight records in a single transaction. */
export const addMultipleInsights = (items: Insight[]) => addMultiple(STORES.insights, items);
/** @description Retrieves all Insight records. */
export const getAllInsights = () => getAll<Insight>(STORES.insights);
/** @description Replaces all Insight records with a new set. */
export const saveAllInsights = async (items: Insight[]) => { await clearStore(STORES.insights); await addMultiple(STORES.insights, items); };

/** @description Retrieves all AgentActivity records. */
export const getAllAgentActivities = () => getAll<AgentActivity>(STORES.agentActivity);
/** @description Adds a single AgentActivity record. */
export const addAgentActivity = (activity: AgentActivity) => add(STORES.agentActivity, activity);
/** @description Updates a single AgentActivity record. */
export const updateAgentActivity = (activity: AgentActivity) => update(STORES.agentActivity, activity);

/** @description Retrieves all AuditLogEntry records. */
export const getAllAuditLogEntries = () => getAll<AuditLogEntry>(STORES.auditLog);
/** @description Adds a single AuditLogEntry record. */
export const addAuditLogEntry = (entry: AuditLogEntry) => add(STORES.auditLog, entry);

/** @description Retrieves the single AppSettings record. */
export const getSettings = () => getOne<AppSettings>(STORES.settings, 1);
/** @description Saves the single AppSettings record. */
export const saveSettings = (settings: AppSettings) => update(STORES.settings, { ...settings, id: 1 });

/** @description Retrieves the single EthicsAnalysis record. */
export const getEthicsAnalysis = () => getOne<EthicsAnalysis>(STORES.ethicsAnalysis, 1);
/** @description Saves the single EthicsAnalysis record. */
export const saveEthicsAnalysis = (analysis: EthicsAnalysis) => update(STORES.ethicsAnalysis, { ...analysis, id: 1 });

/** @description Saves a single DocumentAnalysisResult. */
export const saveDocumentAnalysisResult = (docId: string, result: DocumentAnalysisResult) => update(STORES.documentAnalysisResults, { docId, result });
/** @description Updates a single DocumentAnalysisResult with partial data. */
export const updateDocumentAnalysisResult = async (docId: string, partialResult: Partial<DocumentAnalysisResult>) => {
    const existing = await getOne<{docId: string, result: DocumentAnalysisResult}>(STORES.documentAnalysisResults, docId);
    const newResult = { ...existing?.result, ...partialResult };
    await update(STORES.documentAnalysisResults, { docId, result: newResult });
}
/** @description Retrieves all DocumentAnalysisResult records. */
export const getAllDocumentAnalysisResults = () => getAll<{docId: string, result: DocumentAnalysisResult}>(STORES.documentAnalysisResults);

/** @description Retrieves the single record for mitigation strategies. */
export const getMitigationStrategies = () => getOne<{id: number, content: string}>(STORES.mitigationStrategies, 1);
/** @description Saves the single record for mitigation strategies. */
export const saveMitigationStrategies = (content: string) => update(STORES.mitigationStrategies, { id: 1, content });

/** @description Retrieves the single ArgumentationAnalysis record. */
export const getArgumentationAnalysis = () => getOne<ArgumentationAnalysis>(STORES.argumentationAnalysis, 1);
/** @description Saves the single ArgumentationAnalysis record, with a defensive check for validity. */
export const saveArgumentationAnalysis = (analysis: ArgumentationAnalysis) => {
    // A defensive check to ensure we are saving a valid object.
    if (!analysis || typeof analysis.supportingArguments === 'undefined' || typeof analysis.counterArguments === 'undefined') {
        console.warn("Attempted to save invalid ArgumentationAnalysis", analysis);
        return Promise.resolve(); // Do nothing if analysis is malformed
    }
    return update(STORES.argumentationAnalysis, { 
        id: 1, 
        supportingArguments: analysis.supportingArguments, 
        counterArguments: analysis.counterArguments 
    });
};

/** @description Replaces all Task records with a new set. */
export const saveAllTasks = async (items: Task[]) => { await clearStore(STORES.tasks); await addMultiple(STORES.tasks, items); };

/** @description Retrieves all SuggestedEntity records. */
export const getAllSuggestedEntities = () => getAll<SuggestedEntity>(STORES.suggestedEntities);
/** @description Adds multiple SuggestedEntity records in a single transaction. */
export const addMultipleSuggestedEntities = (items: SuggestedEntity[]) => addMultiple(STORES.suggestedEntities, items);
/** @description Deletes a single SuggestedEntity record by its ID. */
export const deleteSuggestedEntity = (id: string) => deleteItem(STORES.suggestedEntities, id);


// --- DB Management ---
/**
 * @async
 * @function clearDB
 * @description Clears all data from all object stores in the database. This is a destructive operation.
 * @returns {Promise<void>} A promise that resolves when all stores have been cleared.
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
 * @async
 * @function exportStateToJSON
 * @description Exports the entire state of the database into a single JSON string.
 * It iterates through all stores, retrieves their data, and compiles it into a single object.
 * @returns {Promise<string>} A promise that resolves with the JSON string representing the database state.
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
 * @async
 * @function importStateFromJSON
 * @description Imports application state from a JSON string. It first clears the existing database,
 * then populates all stores with the data from the JSON file. It includes special handling
 * for single-record stores and performs data validation.
 * @param {string} json - The JSON string containing the application state to import.
 * @returns {Promise<void>} A promise that resolves when the import is complete.
 * @throws {Error} If the JSON is invalid or if there's an error writing to the database.
 */
export const importStateFromJSON = async (json: string): Promise<void> => {
    await clearDB();
    let state: Partial<AppState> & { [key: string]: any };

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

        if (!dataToImport) {
            continue;
        }
        
        if (storeName === STORES.documentAnalysisResults && !Array.isArray(dataToImport) && typeof dataToImport === 'object') {
            dataToImport = Object.entries(dataToImport).map(([docId, result]) => ({
                docId: docId,
                result: result as DocumentAnalysisResult
            }));
        }

        const store = transaction.objectStore(storeName);

        if (SINGLE_RECORD_STORES.has(storeName)) {
            const record = Array.isArray(dataToImport) ? dataToImport[0] : dataToImport;
            if (record && typeof record === 'object' && !Array.isArray(record)) {
                const recordWithId = { ...record, id: 1 };
                allPromises.push(promisifyRequest(store.put(recordWithId)));
            }
        } else {
            if (!Array.isArray(dataToImport)) {
                 console.warn(`Invalid data format for multi-record store "${storeName}" in import file: expected an array. Skipping.`);
                 continue;
            }

            dataToImport.forEach(item => {
                // Using put() is more robust than add() as it overwrites, which is fine after clearing the store.
                allPromises.push(promisifyRequest(store.put(item)));
            });
        }
    }

    try {
        await Promise.all(allPromises);
    } catch(error) {
        console.error("Error adding data during import transaction:", error);
        transaction.abort();
        throw new Error("Fehler beim Schreiben der Daten in die Datenbank.");
    }
};