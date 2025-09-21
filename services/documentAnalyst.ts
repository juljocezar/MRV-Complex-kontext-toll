import { GeminiService } from './geminiService';
import type { Document, DocumentAnalysisResult, AISettings } from '../types';

export class DocumentAnalystService {
    private static readonly ANALYSIS_SCHEMA = {
        type: 'object',
        properties: {
            summary: { type: 'string', description: "Eine prägnante Zusammenfassung des Dokuments in 3-5 Sätzen." },
            entities: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string', enum: ['Person', 'Organisation', 'Standort', 'Unbekannt'] },
                        description: {type: 'string', description: "Eine kurze Beschreibung der Entität und ihrer Rolle im Dokument."}
                    },
                    required: ['name', 'type', 'description']
                }
            },
            classification: { type: 'string', description: 'Klassifizierung des Dokuments nach HURIDOCS-Standards (z.B. Opferbericht, Zeugenaussage).' },
        },
        required: ['summary', 'entities', 'classification']
    };

    static async analyzeDocument(document: Document, settings: AISettings): Promise<DocumentAnalysisResult> {
        const content = document.textContent || document.content;

        const prompt = `
            Du bist ein Experte für juristische Dokumentenanalyse. Analysiere das folgende Dokument.
            
            Dokumenteninhalt (Auszug):
            ---
            ${content.substring(0, 15000)}
            ---

            Aufgaben:
            1. Erstelle eine prägnante Zusammenfassung.
            2. Extrahiere alle relevanten Entitäten (Personen, Organisationen, Standorte).
            3. Klassifiziere das Dokument nach HURIDOCS-Standards (z.B. Opferbericht, Zeugenaussage, Polizeibericht, Gerichtsentscheidung).

            Gib das Ergebnis im geforderten JSON-Format zurück.
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
