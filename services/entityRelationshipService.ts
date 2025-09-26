import { GeminiService } from './geminiService';
import { CaseEntity, AISettings, EntityRelationship } from '../types';

/**
 * @interface RelationshipAnalysisResult
 * @description Represents the output for a single entity from the relationship analysis,
 * containing the entity's ID and a list of its identified relationships.
 */
interface RelationshipAnalysisResult {
    entityId: string;
    relationships: EntityRelationship[];
}

/**
 * @class EntityRelationshipService
 * @description A service for analyzing and identifying relationships between case entities based on the case context.
 */
export class EntityRelationshipService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the AI's response, ensuring it returns a structured list of entities and their relationships.
     */
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

    /**
     * @static
     * @async
     * @function analyzeRelationships
     * @description Analyzes the relationships between a list of entities within a given case context.
     * @param {CaseEntity[]} entities - The list of entities to analyze.
     * @param {string} caseContext - The full text context of the case.
     * @param {AISettings} settings - The AI settings to use for the analysis.
     * @returns {Promise<RelationshipAnalysisResult[]>} A promise that resolves to an array of relationship analysis results.
     * @throws {Error} If the AI call fails.
     */
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
