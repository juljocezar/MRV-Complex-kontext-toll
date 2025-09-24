import { GeminiService } from './geminiService';
import { Contradiction, AppState } from '../types';

/**
 * The ContradictionDetectorService is responsible for identifying logical and factual
 * contradictions between different documents in the case file. It uses the AI to
 * compare document contents and flag conflicting statements.
 */
export class ContradictionDetectorService {
    /**
     * Defines the JSON schema for the expected output from the AI.
     * The AI should return an array of contradiction objects. Each object must contain
     * the IDs of the two source documents, the conflicting statements themselves,
     * and an explanation of the contradiction.
     */
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string', description: "Eine einzigartige UUID für den Widerspruch." },
                source1DocId: { type: 'string', description: "Die ID des ersten Dokuments." },
                statement1: { type: 'string', description: "Die widersprüchliche Aussage aus dem ersten Dokument." },
                source2DocId: { type: 'string', description: "Die ID des zweiten Dokuments." },
                statement2: { type: 'string', description: "Die widersprüchliche Aussage aus dem zweiten Dokument." },
                explanation: { type: 'string', description: "Eine kurze Erklärung, warum diese Aussagen widersprüchlich sind." },
            },
            required: ['id', 'source1DocId', 'statement1', 'source2DocId', 'statement2', 'explanation'],
        }
    };

    /**
     * Scans classified documents in the app state to find contradictions.
     * @param appState The current state of the application.
     * @returns A promise that resolves to an array of `Contradiction` objects. Returns an empty array if no contradictions are found or if an error occurs.
     */
    static async findContradictions(appState: AppState): Promise<Contradiction[]> {
        // Create a concatenated string of document summaries or content for the AI context.
        const documentsText = appState.documents
            .filter(doc => doc.classificationStatus === 'classified' && (doc.summary || doc.textContent || doc.content))
            .map(doc => `--- DOKUMENT (ID: ${doc.id}, Name: ${doc.name}) ---\n${doc.summary || (doc.textContent || doc.content).substring(0, 2000)}\n--- ENDE ---`)
            .join('\n\n');

        // There's no need to call the AI if there are fewer than two documents to compare.
        if (appState.documents.filter(doc => doc.classificationStatus === 'classified').length < 2) {
            return [];
        }

        const prompt = `
Du bist ein akribischer Analyst mit einem außergewöhnlichen Auge für Details. Deine einzige Aufgabe ist es, sachliche Widersprüche zwischen verschiedenen Informationen in der Akte zu finden.

Analysiere die folgenden Dokumentenzusammenfassungen. Identifiziere alle Paare von Aussagen, die sich direkt widersprechen.

Dokumente:
${documentsText}

Gib für jeden gefundenen Widerspruch die folgenden Informationen im geforderten JSON-Format zurück:
- id: Eine neue, einzigartige UUID, die du generierst.
- source1DocId: Die ID des ersten Dokuments.
- statement1: Die widersprüchliche Aussage aus dem ersten Dokument.
- source2DocId: Die ID des zweiten Dokuments.
- statement2: Die widersprüchliche Aussage aus dem zweiten Dokument.
- explanation: Eine kurze Erklärung, warum diese Aussagen widersprüchlich sind.

Wenn keine Widersprüche gefunden werden, gib ein leeres Array zurück.
        `;

        try {
            const results = await GeminiService.callAIWithSchema<Contradiction[]>(prompt, this.SCHEMA, appState.settings.ai);
            // Fallback: Ensure each contradiction has a unique ID, even if the AI fails to generate one.
            return results.map(c => ({ ...c, id: c.id || crypto.randomUUID() }));
        } catch (error) {
            console.error('Contradiction detection failed:', error);
            return []; // Return an empty array on failure to prevent crashes.
        }
    }
}
