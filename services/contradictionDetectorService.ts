import { GeminiService } from './geminiService';
import { Contradiction, AppState } from '../types';

/**
 * A service dedicated to identifying factual contradictions between different documents
 * within the application state.
 */
export class ContradictionDetectorService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema that defines the structure for the AI's response.
     * It ensures that any identified contradictions are returned in a consistent,
     * machine-readable format.
     */
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', description: "A unique identifier for the contradiction." },
                source1DocId: { type: 'string', description: "The ID of the first source document." },
                statement1: { type: 'string', description: "The contradictory statement from the first document." },
                source2DocId: { type: 'string', description: "The ID of the second source document." },
                statement2: { type: 'string', description: "The contradictory statement from the second document." },
                explanation: { type: 'string', description: "An explanation of why the statements are contradictory." },
            },
            required: ['id', 'source1DocId', 'statement1', 'source2DocId', 'statement2', 'explanation'],
        }
    };

    /**
     * Analyzes documents in the application state to find contradictions.
     * It filters for classified documents, constructs a prompt for the AI,
     * and processes the structured response.
     * @param {AppState} appState - The current state of the application, containing all documents.
     * @returns {Promise<Contradiction[]>} A promise that resolves to an array of identified
     * contradictions. Returns an empty array if no contradictions are found or if there
     * are not enough documents to compare.
     */
    static async findContradictions(appState: AppState): Promise<Contradiction[]> {
        const documentsText = appState.documents
            .filter(doc => doc.classificationStatus === 'classified' && (doc.summary || doc.textContent || doc.content))
            .map(doc => `--- DOCUMENT (ID: ${doc.id}, Name: ${doc.name}) ---\n${doc.summary || (doc.textContent || doc.content).substring(0, 2000)}\n--- END ---`)
            .join('\n\n');

        if (appState.documents.filter(doc => doc.classificationStatus === 'classified').length < 2) {
            return []; // Not enough documents to compare
        }

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
You are a meticulous analyst with an exceptional eye for detail. Your sole task is to find factual contradictions between different pieces of information in the case file.

Analyze the following document summaries. Identify all pairs of statements that directly contradict each other.

Documents:
${documentsText}

For each contradiction found, return the following information in the required JSON format:
- id: A new, unique UUID that you generate.
- source1DocId: The ID of the first document.
- statement1: The contradictory statement from the first document.
- source2DocId: The ID of the second document.
- statement2: The contradictory statement from the second document.
- explanation: A brief explanation of why these statements are contradictory.

If no contradictions are found, return an empty array.
        `;

        try {
            const results = await GeminiService.callAIWithSchema<Contradiction[]>(prompt, this.SCHEMA, appState.settings.ai);
            // Add a fallback in case the AI doesn't generate an ID
            return results.map(c => ({ ...c, id: c.id || crypto.randomUUID() }));
        } catch (error) {
            console.error('Contradiction detection failed:', error);
            return []; // Return an empty array on error to prevent crashes
        }
    }
}
