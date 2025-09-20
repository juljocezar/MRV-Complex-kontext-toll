// Fix: Renamed GeneratedDoc to GeneratedDocument for consistency.
import { Document, GeneratedDocument, Entity, KnowledgeItem, TimelineEvent, Tag, DocEntity, KnowledgeTag, Contradiction, CaseContext, Task, Risks, KPI, AppState } from '../types';

const DB_NAME = 'MRVAssistantDB';
const DB_VERSION = 1;
let db: IDBDatabase;

/**
 * @constant STORES
 * @description Defines the names of the object stores used in the IndexedDB database.
 * @description Definiert die Namen der Object Stores, die in der IndexedDB-Datenbank verwendet werden.
 */
const STORES = {
    documents: 'documents',
// Fix: Renamed generatedDocs to generatedDocuments to match type name change.
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

/**
 * @function initDB
 * @description Initializes the IndexedDB database and creates the necessary object stores if they don't exist.
 * @description Initialisiert die IndexedDB-Datenbank und erstellt die notwendigen Object Stores, falls sie nicht existieren.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance. / Ein Promise, das mit der Datenbankinstanz aufgelöst wird.
 */
export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', request.error);
            reject('Database error: ' + request.error);
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = request.result;
            if (!tempDb.objectStoreNames.contains(STORES.documents)) {
                tempDb.createObjectStore(STORES.documents, { keyPath: 'id' });
            }
// Fix: Renamed generatedDocs to generatedDocuments.
            if (!tempDb.objectStoreNames.contains(STORES.generatedDocuments)) {
                tempDb.createObjectStore(STORES.generatedDocuments, { keyPath: 'id' });
            }
            if (!tempDb.objectStoreNames.contains(STORES.entities)) {
                const entityStore = tempDb.createObjectStore(STORES.entities, { keyPath: 'id' });
                entityStore.createIndex('name', 'name', { unique: false });
            }
            if (!tempDb.objectStoreNames.contains(STORES.knowledgeItems)) {
                const knowledgeStore = tempDb.createObjectStore(STORES.knowledgeItems, { keyPath: 'id' });
// Fix: Corrected property name from sourceDocId to sourceDocumentIds. It's an array, so indexing it is not straightforward for simple indexes. Removed for now.
                // knowledgeStore.createIndex('sourceDocumentIds', 'sourceDocumentIds', { unique: false });
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
/**
 * @function getStore
 * @description Gets an object store from the database in the specified mode.
 * @description Holt einen Object Store aus der Datenbank im angegebenen Modus.
 * @param {string} storeName - The name of the store to get. / Der Name des zu holenden Stores.
 * @param {IDBTransactionMode} mode - The transaction mode ('readonly' or 'readwrite'). / Der Transaktionsmodus ('readonly' oder 'readwrite').
 * @returns {IDBObjectStore} The object store. / Der Object Store.
 */
const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

/**
 * @function add
 * @description Adds an item to the specified object store.
 * @description Fügt ein Element zum angegebenen Object Store hinzu.
 * @param {string} storeName - The name of the store. / Der Name des Stores.
 * @param {T} item - The item to add. / Das hinzuzufügende Element.
 * @returns {Promise<void>} A promise that resolves when the item is added. / Ein Promise, das aufgelöst wird, wenn das Element hinzugefügt wurde.
 */
const add = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * @function getAll
 * @description Gets all items from the specified object store.
 * @description Holt alle Elemente aus dem angegebenen Object Store.
 * @param {string} storeName - The name of the store. / Der Name des Stores.
 * @returns {Promise<T[]>} A promise that resolves with an array of items. / Ein Promise, das mit einem Array von Elementen aufgelöst wird.
 */
const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

/**
 * @function update
 * @description Updates an item in the specified object store.
 * @description Aktualisiert ein Element im angegebenen Object Store.
 * @param {string} storeName - The name of the store. / Der Name des Stores.
 * @param {T} item - The item to update. / Das zu aktualisierende Element.
 * @returns {Promise<void>} A promise that resolves when the item is updated. / Ein Promise, das aufgelöst wird, wenn das Element aktualisiert wurde.
 */
const update = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

/**
 * @function clearStore
 * @description Clears all items from the specified object store.
 * @description Leert alle Elemente aus dem angegebenen Object Store.
 * @param {string} storeName - The name of the store. / Der Name des Stores.
 * @returns {Promise<void>} A promise that resolves when the store is cleared. / Ein Promise, das aufgelöst wird, wenn der Store geleert wurde.
 */
const clearStore = (storeName: string): Promise<void> => {
     return new Promise((resolve, reject) => {
        const store = getStore(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- Documents ---
export const addDocument = (doc: Document) => add(STORES.documents, doc);
export const getAllDocuments = () => getAll<Document>(STORES.documents);
export const updateDocument = (doc: Document) => update(STORES.documents, doc);

// --- GeneratedDocuments ---
// Fix: Renamed functions and store names from GeneratedDoc to GeneratedDocument.
export const addGeneratedDocument = (doc: GeneratedDocument) => add(STORES.generatedDocuments, doc);
export const getAllGeneratedDocuments = () => getAll<GeneratedDocument>(STORES.generatedDocuments);
export const updateGeneratedDocument = (doc: GeneratedDocument) => update(STORES.generatedDocuments, doc);


// --- Entities ---
export const addEntity = (entity: Entity) => add(STORES.entities, entity);
export const getAllEntities = () => getAll<Entity>(STORES.entities);

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
/**
 * @function getCaseContext
 * @description Retrieves the case context from the database.
 * @description Ruft den Fallkontext aus der Datenbank ab.
 * @returns {Promise<CaseContext | undefined>} A promise that resolves with the case context, or undefined if not found. / Ein Promise, das mit dem Fallkontext oder undefined aufgelöst wird, falls nicht gefunden.
 */
export const getCaseContext = (): Promise<CaseContext | undefined> => {
    return new Promise((resolve, reject) => {
        const store = getStore(STORES.caseContext, 'readonly');
        const request = store.get(1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};
/**
 * @function saveCaseContext
 * @description Saves the case context to the database.
 * @description Speichert den Fallkontext in der Datenbank.
 * @param {CaseContext} context - The case context to save. / Der zu speichernde Fallkontext.
 * @returns {Promise<void>} A promise that resolves when the context is saved. / Ein Promise, das aufgelöst wird, wenn der Kontext gespeichert wurde.
 */
export const saveCaseContext = (context: CaseContext) => update(STORES.caseContext, { ...context, id: 1 });

// --- KPIs ---
export const getAllKpis = () => getAll<KPI>(STORES.kpis);
/**
 * @function saveAllKpis
 * @description Clears all existing KPIs and saves a new list of KPIs.
 * @description Leert alle vorhandenen KPIs und speichert eine neue Liste von KPIs.
 * @param {KPI[]} kpis - The list of KPIs to save. / Die zu speichernde Liste von KPIs.
 * @returns {Promise<void>} A promise that resolves when the KPIs are saved. / Ein Promise, das aufgelöst wird, wenn die KPIs gespeichert wurden.
 */
export const saveAllKpis = async (kpis: KPI[]) => {
    await clearStore(STORES.kpis);
    const transaction = db.transaction(STORES.kpis, 'readwrite');
    const store = transaction.objectStore(STORES.kpis);
    kpis.forEach(kpi => store.add(kpi));
};

// --- Tags and Links ---
/**
 * @function findTagByName
 * @description Finds a tag by its name.
 * @description Findet ein Tag anhand seines Namens.
 * @param {string} name - The name of the tag to find. / Der Name des zu findenden Tags.
 * @returns {Promise<Tag | undefined>} A promise that resolves with the tag, or undefined if not found. / Ein Promise, das mit dem Tag oder undefined aufgelöst wird, falls nicht gefunden.
 */
export const findTagByName = (name: string): Promise<Tag | undefined> => {
     return new Promise((resolve, reject) => {
        const store = getStore(STORES.tags, 'readonly');
        const index = store.index('name');
        const request = index.get(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
export const addTag = (tag: Tag) => add(STORES.tags, tag);
export const addKnowledgeTag = (link: KnowledgeTag) => add(STORES.knowledgeTags, link);
/**
 * @function getTagsForKnowledgeItem
 * @description Retrieves all tags associated with a specific knowledge item.
 * @description Ruft alle Tags ab, die mit einem bestimmten Wissenselement verknüpft sind.
 * @param {string} knowledgeId - The ID of the knowledge item. / Die ID des Wissenselements.
 * @returns {Promise<Tag[]>} A promise that resolves with an array of tags. / Ein Promise, das mit einem Array von Tags aufgelöst wird.
 */
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

/**
 * @function clearDB
 * @description Clears all data from all object stores in the database.
 * @description Löscht alle Daten aus allen Object Stores in der Datenbank.
 * @returns {Promise<void>} A promise that resolves when the database is cleared. / Ein Promise, das aufgelöst wird, wenn die Datenbank geleert wurde.
 */
export const clearDB = async (): Promise<void> => {
    await initDB();
    const transaction = db.transaction(Object.values(STORES), 'readwrite');
    for (const storeName of Object.values(STORES)) {
        transaction.objectStore(storeName).clear();
    }
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

/**
 * @function exportDB
 * @description Exports the entire database content as a JSON string.
 * @description Exportiert den gesamten Datenbankinhalt als JSON-String.
 * @returns {Promise<string>} A promise that resolves with the JSON string. / Ein Promise, das mit dem JSON-String aufgelöst wird.
 */
export const exportDB = async (): Promise<string> => {
    await initDB();
    const exportObject: { [key: string]: any[] } = {};
    for (const storeName of Object.values(STORES)) {
        exportObject[storeName] = await getAll(storeName);
    }
    return JSON.stringify(exportObject);
};

/**
 * @function importDB
 * @description Imports data from a JSON string into the database, clearing existing data first.
 * @description Importiert Daten aus einem JSON-String in die Datenbank, nachdem die vorhandenen Daten gelöscht wurden.
 * @param {string} json - The JSON string to import. / Der zu importierende JSON-String.
 * @returns {Promise<void>} A promise that resolves when the import is complete. / Ein Promise, das aufgelöst wird, wenn der Import abgeschlossen ist.
 */
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
        transaction.onerror = () => reject(transaction.error);
    });
};

// --- LocalStorage State Management ---
// Fix: Added missing state management functions (saveState, loadState, clearState) for saving/loading the app state to/from localStorage.
const LOCAL_STORAGE_KEY = 'mrvAssistantState';

/**
 * @function saveState
 * @description Saves the entire application state to local storage.
 * @description Speichert den gesamten Anwendungszustand im Local Storage.
 * @param {AppState} state - The application state to save. / Der zu speichernde Anwendungszustand.
 */
export const saveState = (state: AppState) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (e) {
        console.error("Could not save state", e);
    }
};

/**
 * @function loadState
 * @description Loads the application state from local storage.
 * @description Lädt den Anwendungszustand aus dem Local Storage.
 * @returns {AppState | undefined} The loaded application state, or undefined if not found or on error. / Der geladene Anwendungszustand oder undefined, falls nicht gefunden oder bei einem Fehler.
 */
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

/**
 * @function clearState
 * @description Clears the application state from local storage.
 * @description Leert den Anwendungszustand aus dem Local Storage.
 */
export const clearState = () => {
    try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
        console.error("Could not clear state", e);
    }
};