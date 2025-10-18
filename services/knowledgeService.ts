import { GeminiService } from './geminiService';
import { Document, KnowledgeItem, AISettings } from '../types';
import { selectAgentForTask } from '../utils/agentSelection';


export class KnowledgeService {
    private static readonly CHUNKING_SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                title: { type: 'string', description: "Ein kurzer, prägnanter Titel für den Wissensbaustein." },
                summary: { type: 'string', description: "Der in sich geschlossene, zusammenfassende Text des Wissensbausteins." }
            },
            required: ['title', 'summary']
        }
    };

    static async suggestChunksFromDocument(
        document: Document,
        settings: AISettings
    ): Promise<Omit<KnowledgeItem, 'id' | 'createdAt' | 'sourceDocId' | 'tags'>[]> {
        
        const agent = selectAgentForTask('knowledge_chunking');
        const content = document.textContent || document.content;

        const prompt = `
            ${agent.systemPrompt}

            **Dokumenteninhalt:**
            ---
            ${content.substring(0, 50000)}
            ---

            **Deine Aufgabe:**
            Lies den gesamten Dokumenteninhalt. Identifiziere und extrahiere alle unterscheidbaren, in sich geschlossenen Wissensbausteine (Fakten, Aussagen, Ereignisbeschreibungen, Schlussfolgerungen). Jeder Baustein sollte für sich allein verständlich sein. Formuliere für jeden Baustein einen kurzen, prägnanten Titel.

            Gib das Ergebnis als JSON-Array von Objekten zurück, die jeweils einen 'title' und einen 'summary' enthalten. Wenn das Dokument keine sinnvollen Bausteine enthält, gib ein leeres Array zurück.
        `;

        try {
            const result = await GeminiService.callAIWithSchema<Omit<KnowledgeItem, 'id' | 'createdAt' | 'sourceDocId' | 'tags'>[]>(
                prompt,
                this.CHUNKING_SCHEMA,
                settings
            );
            return result;
        } catch (error) {
            console.error(`Error chunking document ${document.id}:`, error);
            throw new Error('Document chunking failed');
        }
    }
}