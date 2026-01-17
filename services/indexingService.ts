
import { AppState, Document, CaseEntity, KnowledgeItem } from '../types';
import { GeminiService } from './geminiService';
import { updateDocument, updateEntity, updateKnowledgeItem } from './storageService';

export class IndexingService {
    
    // Estimates cost tokens approx. This is a rough heuristic.
    private static countTokens(text: string): number {
        return Math.ceil(text.length / 4); 
    }

    static async indexContent(
        appState: AppState, 
        onProgress: (progress: number, status: string) => void
    ): Promise<{ updatedDocs: Document[], updatedEntities: CaseEntity[], updatedKnowledge: KnowledgeItem[] }> {
        
        const docsToIndex = appState.documents.filter(d => !d.embedding && (d.textContent || d.content));
        const entitiesToIndex = appState.caseEntities.filter(e => !e.embedding && e.description);
        const knowledgeToIndex = appState.knowledgeItems.filter(k => !k.embedding && k.summary);

        const totalItems = docsToIndex.length + entitiesToIndex.length + knowledgeToIndex.length;
        let processedCount = 0;

        const updatedDocs: Document[] = [];
        const updatedEntities: CaseEntity[] = [];
        const updatedKnowledge: KnowledgeItem[] = [];

        if (totalItems === 0) {
            onProgress(100, "Indexierung abgeschlossen (Keine neuen Elemente).");
            return { updatedDocs, updatedEntities, updatedKnowledge };
        }

        // 1. Process Documents (Batched)
        if (docsToIndex.length > 0) {
            onProgress(Math.floor((processedCount / totalItems) * 100), `Indexiere ${docsToIndex.length} Dokumente...`);
            
            // Prepare texts (truncate if huge, though batchEmbed supports 2048 dims, content limit exists)
            // Limit text content to reasonable chunk for embedding (e.g., first 8000 chars for summary vector)
            const texts = docsToIndex.map(d => (d.textContent || d.content).substring(0, 8000));
            const embeddings = await GeminiService.batchGetEmbeddings(texts, 'RETRIEVAL_DOCUMENT');

            for (let i = 0; i < docsToIndex.length; i++) {
                if (embeddings[i]) {
                    const updated = { ...docsToIndex[i], embedding: embeddings[i] };
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
        return { updatedDocs, updatedEntities, updatedKnowledge };
    }
}
