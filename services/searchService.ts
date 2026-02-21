
import lunr from 'lunr';
import { AppState, Document, CaseEntity, KnowledgeItem, SearchResult, DocumentChunk } from '../types';
import { GeminiService } from './geminiService';
import { VectorSearchService } from './vectorSearchService';
import { getAllChunks } from './storageService';

export class SearchService {
    private idx: lunr.Index | null = null;
    private documents: Document[] = [];
    private chunks: DocumentChunk[] = [];
    private entities: CaseEntity[] = [];
    private knowledgeItems: KnowledgeItem[] = [];

    public async buildIndex(appState: AppState): Promise<void> {
        this.documents = appState.documents;
        // PERFORMANCE FIX: Load chunks on demand from DB instead of holding them in global UI State
        this.chunks = await getAllChunks();
        this.entities = appState.caseEntities;
        this.knowledgeItems = appState.knowledgeItems;
        
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

    public async search(query: string): Promise<SearchResult[]> {
        if (!query) return [];

        // 1. Keyword Search (Lunr)
        const keywordResults = this.searchKeywords(query);
        
        // 2. Semantic Search (Vector)
        let vectorResults: SearchResult[] = [];
        try {
            const queryEmbedding = await GeminiService.getEmbedding(query, 'RETRIEVAL_QUERY');
            
            if (queryEmbedding) {
                // Search Chunks first (Most granular)
                // We map chunk results to a special "Document" SearchResult structure
                const chunkMatches = VectorSearchService.search(queryEmbedding, this.chunks, 'Document', 0.62);
                
                // Enhance Chunk Results with Document Names
                chunkMatches.forEach(match => {
                    const chunk = this.chunks.find(c => c.id === match.id);
                    if (chunk) {
                        const parentDoc = this.documents.find(d => d.id === chunk.docId);
                        if (parentDoc) {
                            match.title = `${parentDoc.name} (Auszug)`;
                            match.id = parentDoc.id; // Link to parent doc for navigation
                        }
                    }
                });

                const entityMatches = VectorSearchService.search(queryEmbedding, this.entities, 'Entity', 0.65);
                const knowledgeMatches = VectorSearchService.search(queryEmbedding, this.knowledgeItems, 'Knowledge', 0.65);
                
                vectorResults = [...chunkMatches, ...entityMatches, ...knowledgeMatches];
            }
        } catch (e) {
            console.warn("Semantic search failed, falling back to keywords only", e);
        }

        // 3. Hybrid Merge (Weighted)
        return this.mergeResults(keywordResults, vectorResults);
    }

    private searchKeywords(query: string): SearchResult[] {
        if (!this.idx) return [];
        try {
            // Fuzzy search allowing 1 edit distance
            const results = this.idx.search(`${query}~1`);
            return results.map(result => {
                const [type, id] = result.ref.split('_');
                const score = result.score; // Lunr score (arbitrary positive number)

                let item: any;
                if (type === 'doc') item = this.documents.find(d => d.id === id);
                else if (type === 'entity') item = this.entities.find(e => e.id === id);
                else if (type === 'knowledge') item = this.knowledgeItems.find(k => k.id === id);

                if (!item) return null;

                return {
                    id: id,
                    type: type === 'doc' ? 'Document' : type === 'entity' ? 'Entity' : 'Knowledge',
                    title: item.name || item.title || 'Unbenannt',
                    preview: (item.summary || item.description || item.textContent || '').substring(0, 150) + '...',
                    score: score,
                    isSemantic: false
                } as SearchResult;
            }).filter((r): r is SearchResult => r !== null);
        } catch (e) {
            return [];
        }
    }

    private mergeResults(keywordResults: SearchResult[], vectorResults: SearchResult[]): SearchResult[] {
        const merged = new Map<string, SearchResult>();
        
        // Scaling Factor: Lunr scores can be 10-20+. Cosine similarity is 0-1.
        // We multiply semantic score to make it comparable.
        const SEMANTIC_WEIGHT = 15; 

        // 1. Process Semantic Results
        vectorResults.forEach(res => {
            // Deduplicate: if multiple chunks from same doc appear, take the best one
            const key = `${res.type}_${res.id}`; 
            
            if (merged.has(key)) {
                const existing = merged.get(key)!;
                if (res.score * SEMANTIC_WEIGHT > existing.score) {
                    existing.score = res.score * SEMANTIC_WEIGHT;
                    existing.preview = res.preview; // Show better snippet
                }
            } else {
                merged.set(key, { 
                    ...res, 
                    score: res.score * SEMANTIC_WEIGHT, // Boost score for standalone semantic match
                    title: res.title 
                });
            }
        });

        // 2. Process/Merge Keyword Results
        keywordResults.forEach(res => {
            const key = `${res.type}_${res.id}`;
            if (merged.has(key)) {
                // HYBRID BOOST: Found in both Keyword AND Vector search.
                // This is a very high confidence result.
                const existing = merged.get(key)!;
                existing.score += (res.score * 2); // Add Keyword score
                existing.score *= 1.5; // Multiplier boost for dual-match
                existing.isSemantic = true; // Keep semantic flag for UI
            } else {
                merged.set(key, res);
            }
        });

        // Sort by score descending and return top results
        return Array.from(merged.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 25);
    }
}
