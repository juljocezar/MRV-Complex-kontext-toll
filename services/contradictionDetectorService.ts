import { GeminiService } from './geminiService';
import { Contradiction, AppState } from '../types';

export class ContradictionDetectorService {
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                source1DocId: { type: 'string' },
                statement1: { type: 'string' },
                source2DocId: { type: 'string' },
                statement2: { type: 'string' },
                explanation: { type: 'string' },
            },
            // Fix: Completed the required array
            required: ['id', 'source1DocId', 'statement1', 'source2DocId', 'statement2', 'explanation'],
        }
    };

    // Fix: Added the missing findContradictions method
    static async findContradictions(appState: AppState): Promise<Contradiction[]> {
        const documentsText = appState.documents
            .filter(doc => doc.classificationStatus === 'classified' && (doc.summary || doc.textContent || doc.content))
            .map(doc => `--- DOKUMENT (ID: ${doc.id}, Name: ${doc.name}) ---\n${doc.summary || (doc.textContent || doc.content).substring(0, 2000)}\n--- ENDE ---`)
            .join('\n\n');

        if (appState.documents.filter(doc => doc.classificationStatus === 'classified').length < 2) {
            return []; // Not enough documents to compare
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
            // Add a fallback in case the AI doesn't generate an ID
            return results.map(c => ({ ...c, id: c.id || crypto.randomUUID() }));
        } catch (error) {
            console.error('Contradiction detection failed:', error);
            return [];
        }
    }
}
