
import { AppState, Document, CaseEntity, KnowledgeItem, DocumentChunk } from '../types';
import { GeminiService } from './geminiService';
import { updateDocument, updateEntity, updateKnowledgeItem, addMultipleChunks } from './storageService';

export class IndexingService {
    
    // Estimates cost tokens approx. This is a rough heuristic.
    private static countTokens(text: string): number {
        return Math.ceil(text.length / 4); 
    }

    /**
     * Splits text into smaller chunks for semantic embedding.
     * Tries to respect sentence boundaries.
     */
    private static splitText(text: string, docId: string, maxLength: number = 1000): DocumentChunk[] {
        if (!text) return [];
        const chunks: DocumentChunk[] = [];
        let start = 0;
        let index = 0;

        while (start < text.length) {
            let end = start + maxLength;
            if (end < text.length) {
                // Try to break at a sentence or newline to preserve meaning
                const lastPeriod = text.lastIndexOf('.', end);
                const lastNewline = text.lastIndexOf('\n', end);
                // Prioritize newline over period if reasonably close to the end, otherwise period
                const breakPoint = Math.max(lastPeriod, lastNewline);
                
                if (breakPoint > start + (maxLength * 0.5)) { // Avoid breaking too early
                    end = breakPoint + 1;
                }
            }
            const chunkText = text.slice(start, end).trim();
            if (chunkText.length > 30) { // Filter out tiny, meaningless chunks
                chunks.push({
                    id: crypto.randomUUID(),
                    docId: docId,
                    text: chunkText,
                    index: index++
                });
            }
            // Simple overlap strategy: start next chunk slightly before end of previous? 
            // For now, strict segmentation for cleaner database storage.
            start = end;
        }
        return chunks;
    }

    static async indexContent(
        appState: AppState, 
        onProgress: (progress: number, status: string) => void
    ): Promise<{ updatedDocs: Document[], updatedEntities: CaseEntity[], updatedKnowledge: KnowledgeItem[], newChunks: DocumentChunk[] }> {
        
        const docsToIndex = appState.documents.filter(d => (d.textContent || d.content) && !d.embedding);
        const entitiesToIndex = appState.caseEntities.filter(e => !e.embedding && e.description);
        const knowledgeToIndex = appState.knowledgeItems.filter(k => !k.embedding && k.summary);

        const totalItems = docsToIndex.length + entitiesToIndex.length + knowledgeToIndex.length;
        let processedCount = 0;

        const updatedDocs: Document[] = [];
        const updatedEntities: CaseEntity[] = [];
        const updatedKnowledge: KnowledgeItem[] = [];
        const newChunks: DocumentChunk[] = [];

        if (totalItems === 0) {
            onProgress(100, "Indexierung abgeschlossen (Keine neuen Elemente).");
            return { updatedDocs, updatedEntities, updatedKnowledge, newChunks };
        }

        // 1. Process Documents (Chunking & Embedding)
        if (docsToIndex.length > 0) {
            onProgress(Math.floor((processedCount / totalItems) * 100), `Indexiere ${docsToIndex.length} Dokumente (Chunking)...`);
            
            // Phase A: Split Documents into Chunks
            const allChunksToEmbed: DocumentChunk[] = [];
            
            for (const doc of docsToIndex) {
                const text = doc.textContent || doc.content;
                const docChunks = this.splitText(text, doc.id);
                allChunksToEmbed.push(...docChunks);
            }

            // Phase B: Embed Chunks (Batched)
            if (allChunksToEmbed.length > 0) {
                const chunkTexts = allChunksToEmbed.map(c => c.text);
                
                // Embed in batches of 100 (API limit usually)
                const BATCH_SIZE = 100;
                for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
                    const batchTexts = chunkTexts.slice(i, i + BATCH_SIZE);
                    onProgress(Math.floor((processedCount / totalItems) * 100), `Generiere Embeddings für Chunks ${i+1}-${Math.min(i+BATCH_SIZE, chunkTexts.length)}...`);
                    
                    const batchEmbeddings = await GeminiService.batchGetEmbeddings(batchTexts, 'RETRIEVAL_DOCUMENT');
                    
                    batchEmbeddings.forEach((emb, batchIdx) => {
                        if (emb) {
                            allChunksToEmbed[i + batchIdx].embedding = emb;
                        }
                    });
                }
                
                // Save embedded chunks
                const validChunks = allChunksToEmbed.filter(c => c.embedding);
                await addMultipleChunks(validChunks);
                newChunks.push(...validChunks);
            }

            // Phase C: Mark Documents as Indexed (Store a representative vector for metadata search)
            // We can embed the summary or the first chunk as the "Document Vector"
            const docTexts = docsToIndex.map(d => `Summary: ${d.summary || (d.textContent || d.content).substring(0, 1000)}`);
            const docEmbeddings = await GeminiService.batchGetEmbeddings(docTexts, 'RETRIEVAL_DOCUMENT');

            for (let i = 0; i < docsToIndex.length; i++) {
                if (docEmbeddings[i]) {
                    const updated = { ...docsToIndex[i], embedding: docEmbeddings[i] };
                    await updateDocument(updated);
                    updatedDocs.push(updated);
                }
            }
            processedCount += docsToIndex.length;
        }

        // 2. Process Entities (Batched)
        if (entitiesToIndex.length > 0) {
            onProgress(Math.floor((processedCount / totalItems) * 100), `Indexiere ${entitiesToIndex.length} Entitäten...`);
            const texts = entitiesToIndex.map(e => `${e.name} (${e.type}): ${e.description}`);
            const embeddings = await GeminiService.batchGetEmbeddings(texts, 'RETRIEVAL_DOCUMENT');

            for (let i = 0; i < entitiesToIndex.length; i++) {
                if (embeddings[i]) {
                    const updated = { ...entitiesToIndex[i], embedding: embeddings[i] };
                    await updateEntity(updated);
                    updatedEntities.push(updated);
                }
            }
            processedCount += entitiesToIndex.length;
        }

        // 3. Process Knowledge Items (Batched)
        if (knowledgeToIndex.length > 0) {
            onProgress(Math.floor((processedCount / totalItems) * 100), `Indexiere ${knowledgeToIndex.length} Wissenseinträge...`);
            const texts = knowledgeToIndex.map(k => `${k.title}: ${k.summary}`);
            const embeddings = await GeminiService.batchGetEmbeddings(texts, 'RETRIEVAL_DOCUMENT');

            for (let i = 0; i < knowledgeToIndex.length; i++) {
                if (embeddings[i]) {
                    const updated = { ...knowledgeToIndex[i], embedding: embeddings[i] };
                    await updateKnowledgeItem(updated);
                    updatedKnowledge.push(updated);
                }
            }
            processedCount += knowledgeToIndex.length;
        }

        onProgress(100, "Indexierung erfolgreich abgeschlossen.");
        return { updatedDocs, updatedEntities, updatedKnowledge, newChunks };
    }
}
