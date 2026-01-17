
import { 
    Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, 
    Contradiction, CaseContext, Task, Risks, KPI, AppState, Insight, 
    AgentActivity, AuditLogEntry, AppSettings, EthicsAnalysis, CaseSummary, DocumentAnalysisResult,
    ArgumentationAnalysis,
    SuggestedEntity,
    ForensicDossier
} from '../types';
import { EsfEventRecord, EsfPersonRecord, EsfActLink, EsfInvolvementLink } from '../types/esf';

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 5; // Bump to version 5 for Clean ESF Stores
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
    dossiers: 'dossiers',
    // HURIDOCS ESF Clean Stores
    esfEvents: 'events',
    esfPersons: 'persons',
    esfActLinks: 'actLinks',
    esfInvolvementLinks: 'involvementLinks'
};

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
                    let keyPath = 'id';
                    // Special key paths for ESF
                    if (storeName === STORES.esfEvents) keyPath = 'eventRecordNumber';
                    if (storeName === STORES.esfPersons) keyPath = 'personRecordNumber';
                    if (storeName === STORES.documentAnalysisResults) keyPath = 'docId';
                    
                    const store = tempDb.createObjectStore(storeName, { keyPath });
                    
                    // Standard Indexes
                    if (storeName === STORES.tags) store.createIndex('name', 'name', { unique: true });
                    if (storeName === STORES.timelineEvents) store.createIndex('date', 'date', { unique: false });
                    
                    // ESF Indexes
                    if (storeName === STORES.esfEvents) {
                        store.createIndex('by-violationStatus', 'violationStatus', { unique: false });
                        store.createIndex('by-geoTerm', 'geoTerm', { unique: false });
                        store.createIndex('by-startDate', 'startDate', { unique: false });
                    }
                    if (storeName === STORES.esfPersons) {
                        store.createIndex('by-name', 'fullNameOrGroupName', { unique: false });
                        store.createIndex('by-role', 'roles', { multiEntry: true });
                    }
                    if (storeName === STORES.esfActLinks) {
                        store.createIndex('by-from', 'fromRecordId', { unique: false });
                        store.createIndex('by-to', 'toRecordId', { unique: false });
                    }
                    if (storeName === STORES.esfInvolvementLinks) {
                        store.createIndex('by-from', 'fromRecordId', { unique: false });
                        store.createIndex('by-to', 'toRecordId', { unique: false });
                    }
                }
            });
        };
    });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
    // Defensive check: If DB init failed, we might not have a DB instance
    if (!db) throw new Error("Database not initialized");
    
    // Defensive check: Ensure store exists before transaction
    if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(`Store '${storeName}' not found in database version ${db.version}`);
    }
    
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

// Generic CRUD helpers
const add = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(storeName, 'readwrite');
            const request = store.add(item);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch (e) {
            reject(e);
        }
    });
};

const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        try {
            // Safety: if store doesn't exist, return empty array instead of crashing app
            if (!db || !db.objectStoreNames.contains(storeName)) {
                console.warn(`Safe getAll: Store '${storeName}' missing. Returning empty array.`);
                return resolve([]);
            }
            const store = getStore(storeName, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch (e) {
            console.error(`Error in getAll for ${storeName}`, e);
            resolve([]); // Fallback to empty array on critical error
        }
    });
};

const getOne = <T>(storeName: string, key: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        try {
            if (!db || !db.objectStoreNames.contains(storeName)) {
                return resolve(undefined);
            }
            const store = getStore(storeName, 'readonly');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch (e) {
            resolve(undefined);
        }
    });
};

const update = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(storeName, 'readwrite');
            const request = store.put(item);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch(e) {
            reject(e);
        }
    });
};

export const deleteItem = (storeName: string, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const store = getStore(storeName, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch(e) {
            reject(e);
        }
    });
};

const clearStore = (storeName: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        try {
            const store = getStore(storeName, 'readwrite');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as IDBRequest).error);
        } catch(e) {
            reject(e);
        }
    });
};

export const addMultiple = <T extends { id?: any }>(storeName: string, items: T[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!items || items.length === 0) return resolve();
        try {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            items.forEach(item => store.put(item as any));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        } catch (e) {
            reject(e);
        }
    });
}

// --- STANDARD ENTITIES ---
export const addDocument = (doc: Document) => add(STORES.documents, doc);
export const getAllDocuments = () => getAll<Document>(STORES.documents);
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);

export const addEntity = (entity: CaseEntity) => add(STORES.entities, entity);
export const updateEntity = (entity: CaseEntity) => update(STORES.entities, entity);
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

// --- ESF CRUD ---
export const saveEsfEvent = (event: EsfEventRecord) => update(STORES.esfEvents, event);
export const getAllEsfEvents = () => getAll<EsfEventRecord>(STORES.esfEvents);
export const addMultipleEsfEvents = (items: EsfEventRecord[]) => addMultiple(STORES.esfEvents, items);

export const saveEsfPerson = (person: EsfPersonRecord) => update(STORES.esfPersons, person);
export const getAllEsfPersons = () => getAll<EsfPersonRecord>(STORES.esfPersons);
export const addMultipleEsfPersons = (items: EsfPersonRecord[]) => addMultiple(STORES.esfPersons, items);

export const saveEsfActLink = (link: EsfActLink) => update(STORES.esfActLinks, link);
export const getAllEsfActLinks = () => getAll<EsfActLink>(STORES.esfActLinks);
export const addMultipleEsfActLinks = (items: EsfActLink[]) => addMultiple(STORES.esfActLinks, items);

export const saveEsfInvolvementLink = (link: EsfInvolvementLink) => update(STORES.esfInvolvementLinks, link);
export const getAllEsfInvolvementLinks = () => getAll<EsfInvolvementLink>(STORES.esfInvolvementLinks);
export const addMultipleEsfInvolvementLinks = (items: EsfInvolvementLink[]) => addMultiple(STORES.esfInvolvementLinks, items);


// --- FULL SAVE/RESTORE ---
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
    if (!analysis || typeof analysis.supportingArguments === 'undefined' || typeof analysis.opponentArguments === 'undefined') {
        return Promise.resolve();
    }
    return update(STORES.argumentationAnalysis, { 
        id: 1, 
        supportingArguments: analysis.supportingArguments, 
        opponentArguments: analysis.opponentArguments 
    });
};

export const saveAllTasks = async (items: Task[]) => { await clearStore(STORES.tasks); await addMultiple(STORES.tasks, items); };

export const getAllSuggestedEntities = () => getAll<SuggestedEntity>(STORES.suggestedEntities);
export const addMultipleSuggestedEntities = (items: SuggestedEntity[]) => addMultiple(STORES.suggestedEntities, items);
export const deleteSuggestedEntity = (id: string) => deleteItem(STORES.suggestedEntities, id);

// Forensic Dossiers
export const saveDossier = (dossier: ForensicDossier) => update(STORES.dossiers, dossier);
export const getAllDossiers = () => getAll<ForensicDossier>(STORES.dossiers);

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
    await initDB(); // Ensure DB is open and up to date
    await clearDB(); // Wipe existing data first

    let state: Partial<AppState> & { [key: string]: any };

    try {
        state = JSON.parse(json);
    } catch (error) {
        throw new Error("Die Datei ist keine gültige JSON-Datei.");
    }

    // Helper to perform a safe PUT operation that doesn't abort the transaction on individual failure
    const safePut = (store: IDBObjectStore, item: any) => {
        return new Promise<void>((resolve) => {
            try {
                const request = store.put(item);
                request.onsuccess = () => resolve();
                request.onerror = (event) => {
                    // Crucial: Prevent transaction abort on individual item error (e.g. key constraint)
                    event.preventDefault();
                    event.stopPropagation();
                    console.warn(`Import skipped item in store "${store.name}" due to error:`, request.error, item);
                    resolve(); // Resolve anyway to continue the Promise.all
                };
            } catch (e) {
                console.error(`Exception during put in store "${store.name}":`, e);
                resolve();
            }
        });
    };

    // We use isolated transactions per store to prevent a single failure (e.g. keyPath mismatch in new features)
    // from rolling back the entire restore process.
    for (const storeName of Object.values(STORES)) {
        let dataToImport = state[storeName];

        if (!dataToImport) {
            continue;
        }

        try {
            // Normalize documentAnalysisResults:
            // 1. Handle Object format (Legacy export) -> Convert to Array
            // 2. Handle Unwrapped Array items (Legacy storage) -> Wrap in { docId, result }
            if (storeName === STORES.documentAnalysisResults) {
                if (!Array.isArray(dataToImport) && typeof dataToImport === 'object') {
                    dataToImport = Object.entries(dataToImport).map(([docId, result]) => ({
                        docId: docId,
                        result: result as DocumentAnalysisResult
                    }));
                } else if (Array.isArray(dataToImport)) {
                    // Check if items are unwrapped DocumentAnalysisResult objects
                    dataToImport = dataToImport.map((item: any) => {
                        // Heuristic: If it has docId but NO result property, and has analysis fields, it's likely unwrapped.
                        if (item.docId && !item.result && (item.summary || item.classification)) {
                            return { docId: item.docId, result: item };
                        }
                        return item;
                    });
                }
            }

            // Safe store access: Only try to import if store exists in current schema
            if (!db.objectStoreNames.contains(storeName)) {
                console.warn(`Skipping import for store '${storeName}' as it does not exist in current DB version.`);
                continue;
            }

            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const storePromises: Promise<void>[] = [];

            if (SINGLE_RECORD_STORES.has(storeName)) {
                const record = Array.isArray(dataToImport) ? dataToImport[0] : dataToImport;
                if (record && typeof record === 'object' && !Array.isArray(record)) {
                    const recordWithId = { ...record, id: 1 };
                    storePromises.push(safePut(store, recordWithId));
                }
            } else {
                if (Array.isArray(dataToImport)) {
                    dataToImport.forEach(item => {
                        // Safety check for critical ESF keys to avoid hard crashes before DB logic
                        if (storeName === STORES.esfEvents && !item.eventRecordNumber) return;
                        if (storeName === STORES.esfPersons && !item.personRecordNumber) return;
                        
                        storePromises.push(safePut(store, item));
                    });
                }
            }

            await Promise.all(storePromises);
            
            // Wait for transaction to complete
            await new Promise<void>((resolve, reject) => {
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(new Error('Transaction aborted'));
            });

        } catch (err) {
            console.warn(`Failed to import store "${storeName}". Skipping this section.`, err);
            // We continue to the next store instead of throwing, so partially compatible backups still work.
        }
    }
};
