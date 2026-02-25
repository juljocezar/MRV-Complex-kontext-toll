
import { Document, KnowledgeItem, CaseEntity, SearchResult } from '../types';

export class VectorSearchService {
    private static sqrtNormCache = new WeakMap<number[], number>();

    /**
     * Gets or calculates the square root of the norm (magnitude) of a vector.
     * Caches the result to avoid redundant calculations.
     */
    static getOrCalculateSqrtNorm(vec: number[]): number {
        let sqrtNorm = this.sqrtNormCache.get(vec);
        if (sqrtNorm === undefined) {
            let norm = 0;
            const len = vec.length;
            for (let i = 0; i < len; i++) {
                norm += vec[i] * vec[i];
            }
            sqrtNorm = Math.sqrt(norm);
            this.sqrtNormCache.set(vec, sqrtNorm);
        }
        return sqrtNorm;
    }
    
    // Calculates Cosine Similarity between two vectors
    // Returns a value between -1 and 1. 1 means identical direction.
    static cosineSimilarity(vecA: number[], vecB: number[], sqrtNormA?: number, sqrtNormB?: number): number {
        const len = vecA.length;
        if (len !== vecB.length) return 0;
        
        let dotProduct = 0;
        for (let i = 0; i < len; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        
        const finalSqrtNormA = sqrtNormA ?? this.getOrCalculateSqrtNorm(vecA);
        const finalSqrtNormB = sqrtNormB ?? this.getOrCalculateSqrtNorm(vecB);

        if (finalSqrtNormA === 0 || finalSqrtNormB === 0) return 0;
        
        return dotProduct / (finalSqrtNormA * finalSqrtNormB);
    }

    static search<T extends { id: string, name?: string, title?: string, summary?: string, description?: string, textContent?: string, embedding?: number[] }>(
        queryEmbedding: number[],
        items: T[],
        type: SearchResult['type'],
        threshold: number = 0.65 // Minimum similarity to return
    ): SearchResult[] {
        const results: SearchResult[] = [];
        const querySqrtNorm = this.getOrCalculateSqrtNorm(queryEmbedding);

        // Optimization: Use a regular for loop for performance
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const embedding = item.embedding;
            if (embedding) {
                const itemSqrtNorm = this.getOrCalculateSqrtNorm(embedding);
                const score = this.cosineSimilarity(queryEmbedding, embedding, querySqrtNorm, itemSqrtNorm);
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
        }

        return results.sort((a, b) => b.score - a.score);
    }
}
