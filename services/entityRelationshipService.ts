import { GeminiService } from './geminiService';
import { CaseEntity, AISettings, EntityRelationship } from '../types';

interface RelationshipAnalysisResult {
    entityId: string;
    relationships: EntityRelationship[];
}

export class EntityRelationshipService {
    private static readonly SCHEMA = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                entityId: { type: 'string' },
                relationships: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            targetEntityId: { type: 'string' },
                            targetEntityName: { type: 'string' },
                            description: { type: 'string' }
                        },
                        required: ['targetEntityId', 'targetEntityName', 'description']
                    }
                }
            },
            required: ['entityId', 'relationships']
        }
    };

    static async analyzeRelationships(
        entities: CaseEntity[],
        caseContext: string,
        settings: AISettings
    ): Promise<RelationshipAnalysisResult[]> {
        const entityList = entities.map(e => `- ${e.name} (ID: ${e.id}, Type: ${e.type})`).join('\n');

        const prompt = `
            Du bist ein Experte für die Analyse von Beziehungsgeflechten in komplexen Fällen.
            Analysiere die folgende Liste von Entitäten und den Fallkontext, um die Beziehungen zwischen ihnen zu identifizieren.

            Fallkontext:
            ---
            ${caseContext}
            ---

            Entitäten:
            ---
            ${entityList}
            ---

            Deine Aufgabe:
            1. Identifiziere direkte und indirekte Beziehungen zwischen den Entitäten.
            2. Beschreibe jede Beziehung kurz und prägnant (z.B. "ist angestellt bei", "hat bedroht", "ist verwandt mit").
            3. Gib das Ergebnis als JSON-Array zurück. Jedes Objekt im Array soll eine 'entityId' enthalten und ein 'relationships'-Array mit den Beziehungen dieser Entität zu anderen. Beziehe dich bei 'targetEntityId' immer auf die IDs aus der bereitgestellten Entitätenliste.

            Beispiel für ein Beziehungsobjekt:
            { "targetEntityId": "uuid-der-ziel-entität", "targetEntityName": "Name der Ziel-Entität", "description": "ist der Anwalt von" }
        `;

        try {
            return await GeminiService.callAIWithSchema<RelationshipAnalysisResult[]>(
                prompt,
                this.SCHEMA,
                settings
            );
        } catch (error) {
            console.error('Entity relationship analysis failed:', error);
            throw new Error('Entity relationship analysis failed.');
        }
    }
}
