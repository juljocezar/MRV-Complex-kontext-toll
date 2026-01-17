
import { Document, KnowledgeItem, CaseEntity, SearchResult } from '../types';

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

    static search<T extends { id: string, name?: string, title?: string, summary?: string, description?: string, textContent?: string, embedding?: number[] }>(
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
                    results.push({
                        id: item.id,
                        type: type,
                        title: item.name || item.title || 'Unbenannt',
                        preview: (item.summary || item.description || item.textContent || '').substring(0, 150) + '...',
                        score: score,
                        isSemantic: true
                    });
                }
            }
        });

        return results.sort((a, b) => b.score - a.score);
    }
}
