
import { GeminiService } from './geminiService';
import { AISettings, Document } from '../types';
import { HUMAN_RIGHTS_CASE_SCHEMA } from '../schema/humanRightsCaseSchema';
import { buildHumanRightsEsfPrompt } from '../utils/contextUtils';

export class StructuredAIService {
    
    /**
     * Extrahiert tiefe HURIDOCS-Strukturen aus einem einzelnen Textkontext.
     * Nutzt das spezialisierte `HUMAN_RIGHTS_CASE_SCHEMA` für eine 1:1 Abbildung der ESF-Felder.
     */
    static async extractESFData(context: string, settings: AISettings): Promise<any> {
        // Fallback-Aufruf für einzelnen Kontext, falls benötigt. 
        // Baut ein virtuelles Dokumenten-Objekt für den Prompt-Builder.
        const fakeDocInput = [{
            id: 'context_input',
            title: 'Eingabekontext',
            text: context.substring(0, 40000)
        }];
        
        return this.analyzeCaseDocuments(fakeDocInput, settings);
    }

    /**
     * Führt eine strukturierte HURIDOCS-Analyse über mehrere Dokumente durch.
     * Dies ist die Hauptmethode für den ForensicDossierTab oder Massen-Ingestion.
     */
    static async analyzeCaseDocuments(
        documents: Array<{ id: string; title: string; text: string }>, 
        settings: AISettings
    ): Promise<any> {
        
        const prompt = buildHumanRightsEsfPrompt(documents);

        try {
            return await GeminiService.callAIWithSchema(
                prompt,
                HUMAN_RIGHTS_CASE_SCHEMA,
                settings,
                'gemini-3-pro-preview' // Pro-Modell für komplexe Schema-Einhaltung empfohlen
            );
        } catch (error) {
            console.error("Structured AI Analysis failed:", error);
            throw new Error("Fehler bei der strukturierten ESF-Analyse.");
        }
    }
}
