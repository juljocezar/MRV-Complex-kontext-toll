import { Document, KnowledgeItem, CaseEntity, SearchResult } from "../types";

export class VectorSearchService {
  // Calculates Cosine Similarity between two vectors
  // Returns a value between -1 and 1. 1 means identical direction.
  // normA can be precalculated for performance if vecA is reused
  static cosineSimilarity(
    vecA: number[],
    vecB: number[],
    normA?: number,
  ): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let nA = normA ?? 0;
    let nB = 0;

    if (normA !== undefined) {
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        nB += vecB[i] * vecB[i];
      }
    } else {
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        nA += vecA[i] * vecA[i];
        nB += vecB[i] * vecB[i];
      }
    }

    if (nA === 0 || nB === 0) return 0;

    return dotProduct / (Math.sqrt(nA) * Math.sqrt(nB));
  }

  static calculateNorm(vec: number[]): number {
    let norm = 0;
    for (let i = 0; i < vec.length; i++) {
      norm += vec[i] * vec[i];
    }
    return norm;
  }

  static search<
    T extends {
      id: string;
      name?: string;
      title?: string;
      summary?: string;
      description?: string;
      textContent?: string;
      embedding?: number[];
    },
  >(
    queryEmbedding: number[],
    items: T[],
    type: SearchResult["type"],
    threshold: number = 0.65, // Minimum similarity to return
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const queryNorm = this.calculateNorm(queryEmbedding);

    items.forEach((item) => {
      if (item.embedding) {
        const score = this.cosineSimilarity(
          queryEmbedding,
          item.embedding,
          queryNorm,
        );
        if (score >= threshold) {
          results.push({
            id: item.id,
            type: type,
            title: item.name || item.title || "Unbenannt",
            preview:
              (
                item.summary ||
                item.description ||
                item.textContent ||
                ""
              ).substring(0, 150) + "...",
            score: score,
            isSemantic: true,
          });
        }
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }
}
