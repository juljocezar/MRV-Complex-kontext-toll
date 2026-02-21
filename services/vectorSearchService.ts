
import { Document, KnowledgeItem, CaseEntity, SearchResult, DocumentChunk } from '../types';

export class VectorSearchService {
    
    // Calculates Cosine Similarity between two vectors
    // Returns a value between -1 and 1. 1 means identical direction.
    static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        if (normA === 0 || normB === 0) return 0;
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    static search<T extends { id: string, name?: string, title?: string, summary?: string, description?: string, textContent?: string, text?: string, embedding?: number[] }>(
        queryEmbedding: number[],
        items: T[],
        type: SearchResult['type'],
        threshold: number = 0.65 // Minimum similarity to return
    ): SearchResult[] {
        const results: SearchResult[] = [];

        items.forEach(item => {
            if (item.embedding) {
                const score = this.cosineSimilarity(queryEmbedding, item.embedding);
                if (score >= threshold) {
                    // Generic mapping based on type
                    let title = 'Unbenannt';
                    if (type === 'Document') title = item.name || item.title || 'Unbenannt'; // Regular Document
                    if (type === 'Entity') title = item.name || 'Unbenannt';
                    if (type === 'Knowledge') title = item.title || 'Unbenannt';
                    
                    // Special handling for Chunks (which are technically parts of Documents)
                    // We return them as 'Document' matches but with specific text preview
                    let preview = (item.summary || item.description || item.textContent || item.text || '').substring(0, 150) + '...';

                    results.push({
                        id: item.id,
                        type: type,
                        title: title,
                        preview: preview,
                        score: score,
                        isSemantic: true
                    });
                }
            }
        });

        return results.sort((a, b) => b.score - a.score);
    }
}
