// Fix: Use relative path for types
import { Document, GeneratedDocument, CaseEntity, KnowledgeItem, TimelineEvent, Tag, DocEntity, KnowledgeTag, Contradiction, CaseContext, Task, Risks, KPI, AppState } from './types';

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 1;
let db: IDBDatabase;

const STORES = {
    documents: 'documents',
    generatedDocuments: 'generatedDocuments',
    entities: 'entities',
    knowledgeItems: 'knowledgeItems',
    timelineEvents: 'timelineEvents',
    tags: 'tags',
    docEntities: 'docEntities',
    knowledgeTags: 'knowledgeTags',
    contradictions: 'contradictions',
    caseContext: 'caseContext',
    tasks: 'tasks',
    kpis: 'kpis',
};


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
            if (!tempDb.objectStoreNames.contains(STORES.documents)) {
                tempDb.createObjectStore(STORES.documents, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.generatedDocuments)) {
                tempDb.createObjectStore(STORES.generatedDocuments, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.entities)) {
                const entityStore = tempDb.createObjectStore(STORES.entities, { keyPath: 'id' });
                entityStore.createIndex('name', 'name', { unique: false });
            }
            if (!tempDb.objectStoreNames.contains(STORES.knowledgeItems)) {
                tempDb.createObjectStore(STORES.knowledgeItems, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.timelineEvents)) {
                const timelineStore = tempDb.createObjectStore(STORES.timelineEvents, { keyPath: 'id' });
                timelineStore.createIndex('date', 'date', { unique: false });
            }
            if (!tempDb.objectStoreNames.contains(STORES.tags)) {
                 const tagStore = tempDb.createObjectStore(STORES.tags, { keyPath: 'id' });
                 tagStore.createIndex('name', 'name', { unique: true });
            }
             if (!tempDb.objectStoreNames.contains(STORES.docEntities)) {
                tempDb.createObjectStore(STORES.docEntities, { autoIncrement: true });
            }
             if (!tempDb.objectStoreNames.contains(STORES.knowledgeTags)) {
                tempDb.createObjectStore(STORES.knowledgeTags, { autoIncrement: true });
            }
            if (!tempDb.objectStoreNames.contains(STORES.contradictions)) {
                tempDb.createObjectStore(STORES.contradictions, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.caseContext)) {
                tempDb.createObjectStore(STORES.caseContext, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.tasks)) {
                tempDb.createObjectStore(STORES.tasks, { keyPath: 'id' });
            }
             if (!tempDb.objectStoreNames.contains(STORES.kpis)) {
                tempDb.createObjectStore(STORES.kpis, { keyPath: 'id' });
            }
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

const update = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
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

// --- Documents ---
export const addDocument = (doc: Document) => add(STORES.documents, doc);
export const getAllDocuments = () => getAll<Document>(STORES.documents);
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

// --- GeneratedDocuments ---
export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);
export const updateGeneratedDocument = (doc: GeneratedDocument) => update(STORES.generatedDocuments, doc);


// --- Entities ---
// Fix: Use CaseEntity type which is defined and used throughout the app
export const addEntity = (entity: CaseEntity) => add(STORES.entities, entity);
export const getAllEntities = () => getAll<CaseEntity>(STORES.entities);

// --- KnowledgeItems ---
export const addKnowledgeItem = (item: KnowledgeItem) => add(STORES.knowledgeItems, item);
export const getAllKnowledgeItems = () => getAll<KnowledgeItem>(STORES.knowledgeItems);

// --- TimelineEvents ---
export const addTimelineEvent = (event: TimelineEvent) => add(STORES.timelineEvents, event);
export const getAllTimelineEvents = () => getAll<TimelineEvent>(STORES.timelineEvents);

// --- Contradictions ---
export const addContradiction = (contradiction: Contradiction) => add(STORES.contradictions, contradiction);
export const getAllContradictions = () => getAll<Contradiction>(STORES.contradictions);
export const clearContradictions = () => clearStore(STORES.contradictions);

// --- CaseContext ---
export const getCaseContext = (): Promise<CaseContext | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(STORES.caseContext, 'readonly');
        const request = store.get(1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};
export const saveCaseContext = (context: CaseContext) => update(STORES.caseContext, { ...context, id: 1 });

// --- KPIs ---
export const getAllKpis = () => getAll<KPI>(STORES.kpis);
export const saveAllKpis = async (kpis: KPI[]) => {
    await clearStore(STORES.kpis);
    const transaction = db.transaction(STORES.kpis, 'readwrite');
    const store = transaction.objectStore(STORES.kpis);
    kpis.forEach(kpi => store.add(kpi));
};

// --- Tags and Links ---
export const findTagByName = (name: string): Promise<Tag | undefined> => {
     return new Promise((resolve, reject) => {
        const store = getStore(STORES.tags, 'readonly');
        const index = store.index('name');
        const request = index.get(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
}
export const addTag = (tag: Tag) => add(STORES.tags, tag);
export const addKnowledgeTag = (link: KnowledgeTag) => add(STORES.knowledgeTags, link);
export const getTagsForKnowledgeItem = (knowledgeId: string): Promise<Tag[]> => {
    // This is complex with raw IndexedDB. A library like Dexie would simplify this join.
    // For now, we'll fetch all links, then all tags, and filter in-memory.
    return new Promise(async (resolve, reject) => {
        try {
            const allLinks = await getAll<KnowledgeTag>(STORES.knowledgeTags);
            const allTags = await getAll<Tag>(STORES.tags);
            const relevantTagIds = allLinks.filter(link => link.knowledgeId === knowledgeId).map(link => link.tagId);
            const relevantTags = allTags.filter(tag => relevantTagIds.includes(tag.id));
            resolve(relevantTags);
        } catch (error) {
            reject(error);
        }
    });
};


// --- DB Management ---

export const clearDB = async (): Promise<void> => {
    await initDB();
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    for (const storeName of Object.values(STORES)) {
        transaction.objectStore(storeName).clear();
    }
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

export const exportDB = async (): Promise<string> => {
    await initDB();
    const exportObject: { [key: string]: any[] } = {};
    for (const storeName of Object.values(STORES)) {
        exportObject[storeName] = await getAll(storeName);
    }
    return JSON.stringify(exportObject);
};

export const importDB = async (json: string): Promise<void> => {
    await clearDB();
    const importObject = JSON.parse(json);
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    for (const storeName of Object.values(STORES)) {
        if (importObject[storeName]) {
            const store = transaction.objectStore(storeName);
            importObject[storeName].forEach((item: any) => store.add(item));
        }
    }
     return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject((e.target as IDBRequest).error);
    });
};

// --- LocalStorage State Management ---
const LOCAL_STORAGE_KEY = 'mrvAssistantState';

export const saveState = (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (e) {
        console.error("Could not save state", e);
    }
};

export const loadState = (): AppState | undefined => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.error("Could not load state", e);
        return undefined;
    }
};

export const clearState = () => {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.error("Could not clear state", e);
    }
};
