
import lunr from 'lunr';
import { AppState, Document, CaseEntity, KnowledgeItem, SearchResult } from '../types';

export class SearchService {
    private idx: lunr.Index | null = null;
    private documents: { [id: string]: Document } = {};
    private entities: { [id: string]: CaseEntity } = {};
    private knowledgeItems: { [id: string]: KnowledgeItem } = {};

    public buildIndex(appState: AppState): void {
        this.documents = appState.documents.reduce((acc, doc) => ({ ...acc, [doc.id]: doc }), {});
        this.entities = appState.caseEntities.reduce((acc, entity) => ({ ...acc, [entity.id]: entity }), {});
        this.knowledgeItems = appState.knowledgeItems.reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
        
        this.idx = lunr(function () {
            this.ref('id');
            this.field('title', { boost: 10 });
            this.field('content');
            this.field('type');

            appState.documents.forEach(doc => {
                this.add({
                    id: `doc_${doc.id}`,
                    title: doc.name,
                    content: doc.textContent || doc.summary || '',
                    type: 'Document',
                });
            });

            appState.caseEntities.forEach(entity => {
                this.add({
                    id: `entity_${entity.id}`,
                    title: entity.name,
                    content: entity.description,
                    type: 'Entity',
                });
            });

            appState.knowledgeItems.forEach(item => {
                this.add({
                    id: `knowledge_${item.id}`,
                    title: item.title,
                    content: item.summary,
                    type: 'Knowledge',
                });
            });
        });
    }

    public search(query: string): SearchResult[] {
        if (!this.idx || !query) {
            return [];
        }

        try {
            const results = this.idx.search(query);
            return results.map(result => {
                const [type, id] = result.ref.split('_');
                if (type === 'doc') {
                    const doc = this.documents[id];
                    return {
                        id,
                        type: 'Document',
                        title: doc.name,
                        preview: (doc.summary || doc.textContent || '').substring(0, 100) + '...',
                    };
                }
                if (type === 'entity') {
                    const entity = this.entities[id];
                    return {
                        id,
                        type: 'Entity',
                        title: entity.name,
                        preview: entity.description.substring(0, 100) + '...',
                    };
                }
                if (type === 'knowledge') {
                    const item = this.knowledgeItems[id];
                    return {
                        id,
                        type: 'Knowledge',
                        title: item.title,
                        preview: item.summary.substring(0, 100) + '...',
                    };
                }
                return null;
            }).filter((r): r is SearchResult => r !== null);
        } catch (e) {
            console.error("Search failed", e);
            return [];
        }
    }
}
