import { GeminiService } from './geminiService';
import { Contradiction, AppState } from '../types';

export class ContradictionDetectorService {
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                source1DocId: { type: 'string' },
                statement1: { type: 'string' },
                source2DocId: { type: 'string' },
                statement2: { type: 'string' },
                explanation: { type: 'string' },
            },
            required: ['source1DocId', 'statement1', 'source2DocId', 'statement2', 'explanation'],
        }
    };

    static async findContradictions(appState: AppState, newDocContext?: string): Promise<Contradiction[]> {
        const documentsText = appState.documents
            .filter(doc => doc.classificationStatus === 'classified' && (doc.summary || doc.textContent || doc.content))
            .map(doc => `--- DOKUMENT (ID: ${doc.id}, Name: ${doc.name}) ---\n${doc.summary || (doc.textContent || doc.content).substring(0, 2000)}\n--- ENDE ---`)
            .join('\n\n');

        if (appState.documents.filter(doc => doc.classificationStatus === 'classified').length < 2 && !newDocContext) {
            return []; // Not enough documents to compare
        }
        
        const prompt = `
Du bist ein extrem präziser und logisch denkender Analyst. Deine Aufgabe ist es, **echte, unvereinbare sachliche Widersprüche** zwischen Dokumenten zu finden. Ein Widerspruch liegt nur dann vor, wenn zwei Aussagen **nicht gleichzeitig wahr sein können**.

**WICHTIGE REGELN:**
- **KEIN WIDERSPRUCH** ist es, wenn ein Dokument lediglich detailliertere oder ergänzende Informationen zu einem anderen liefert. (Beispiel: "Der Mann trug eine Jacke" vs. "Der Mann trug eine blaue Nylonjacke" ist KEIN Widerspruch).
- **KEIN WIDERSPRUCH** ist es, wenn ein Ereignis aus einer anderen Perspektive beschrieben wird, solange die Kernfakten nicht unvereinbar sind.
- **KEIN WIDERSPRUCH** ist eine Korrektur oder Aktualisierung von Informationen (z.B. eine neue Adresse in einem neueren Dokument).
- **EIN ECHTER WIDERSPRUCH** ist eine klare, unvereinbare Aussage über einen Fakt. (Beispiel: "Das Treffen fand am Montag statt" vs. "Das Treffen fand am Dienstag statt").

Analysiere die folgenden Dokumentenzusammenfassungen und identifiziere NUR echte, unvereinbare Widersprüche gemäß den oben genannten Regeln.

${newDocContext ? 
`Fokus der Analyse: Vergleiche die folgende NEUE Information mit den bereits existierenden Dokumenten.
NEUE INFORMATION:
${newDocContext}` 
: 
'Analysiere die folgenden Dokumentenzusammenfassungen.'
}

EXISTIERENDE DOKUMENTE:
${documentsText}

Gib für jeden gefundenen, ECHTEN Widerspruch die folgenden Informationen im geforderten JSON-Format zurück:
- source1DocId: Die ID des ersten Dokuments.
- statement1: Die widersprüchliche Aussage aus dem ersten Dokument.
- source2DocId: Die ID des zweiten Dokuments.
- statement2: Die widersprüchliche Aussage aus dem zweiten Dokument.
- explanation: Eine kurze Erklärung, warum diese Aussagen unvereinbar sind und nicht nur eine Ergänzung darstellen.

Wenn keine echten Widersprüche gefunden werden, gib ein leeres Array zurück.
        `;

        try {
            const results = await GeminiService.callAIWithSchema<Omit<Contradiction, 'id'>[]>(prompt, this.SCHEMA, appState.settings.ai);
            return results.map(c => ({ ...c, id: crypto.randomUUID() }));
        } catch (error) {
            console.error('Contradiction detection failed:', error);
            return [];
        }
    }
}