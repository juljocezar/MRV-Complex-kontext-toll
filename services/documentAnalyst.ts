import { GeminiService } from './geminiService';
import type { Document, DocumentAnalysisResult, AISettings } from '../types';

/**
 * Service for analyzing individual documents to extract key information.
 * This includes generating a summary, identifying entities, and classifying the document.
 */
export class DocumentAnalystService {
    /**
     * @private
     * @static
     * @readonly
     * @description The JSON schema for the structured response from the AI after document analysis.
     * It defines the expected format for the summary, entities, and classification.
     */
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "A concise summary of the document in 3-5 sentences." },
            entities: {
                type: 'array',
                description: "A list of all relevant entities (persons, organizations, locations) found in the document.",
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: "The name of the entity." },
                        type: { type: 'string', enum: ['Person', 'Organization', 'Location', 'Unknown'], description: "The type of the entity." },
                        description: {type: 'string', description: "A brief description of the entity and its role in the document."}
                    },
                    required: ['name', 'type', 'description']
                }
            },
            classification: { type: 'string', description: 'Classification of the document according to HURIDOCS standards (e.g., Victim Report, Witness Testimony).' },
        },
        required: ['summary', 'entities', 'classification']
    };

    /**
     * Analyzes a single document to extract its summary, entities, and classification.
     * @param {Document} document - The document object to be analyzed.
     * @param {AISettings} settings - The AI settings for the analysis.
     * @returns {Promise<DocumentAnalysisResult>} A promise that resolves to the analysis results.
     * @throws {Error} Throws an error if the document analysis fails.
     */
    static async analyzeDocument(document: Document, settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = document.textContent || document.content;

        // The prompt is in German, as requested by the original user.
        // An English translation is provided in comments for clarity.
        const prompt = `
            You are an expert in legal document analysis. Analyze the following document.
            
            Document Content (Excerpt):
            ---
            ${content.substring(0, 15000)}
            ---

            Tasks:
            1. Create a concise summary.
            2. Extract all relevant entities (persons, organizations, locations).
            3. Classify the document according to HURIDOCS standards (e.g., Victim Report, Witness Testimony, Police Report, Court Decision).

            Return the result in the required JSON format.
        `;

        try {
            const result = await GeminiService.callAIWithSchema<any>(prompt, this.ANALYSIS_SCHEMA, settings);
            
            return {
                docId: document.id,
                summary: result.summary,
                entities: (result.entities || []).map((e: any) => ({...e, id: crypto.randomUUID(), sourceDocumentId: document.id, sourceDocumentName: document.name })),
                classification: result.classification,
            };

        } catch (error) {
            console.error(`Error analyzing document ${document.id}:`, error);
            throw new Error('Document analysis failed');
        }
    }
}
