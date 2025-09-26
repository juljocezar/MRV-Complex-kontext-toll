import { GeminiService } from './geminiService';
import { Document, ContentCreationParams, GeneratedContent, AISettings } from '../types';
import { marked } from 'marked';

/**
 * @class ContentCreatorService
 * @description A service dedicated to generating new, structured document content using AI.
 * It combines case context, source documents, and user instructions to produce professional documents.
 */
export class ContentCreatorService {
  /**
   * @static
   * @async
   * @function createContent
   * @description Generates new document content based on a set of parameters.
   * @param {ContentCreationParams} params - The parameters for content creation, including context, instructions, and source documents.
   * @param {AISettings} settings - The AI settings to use for the generation.
   * @returns {Promise<GeneratedContent>} A promise that resolves to the generated content, including raw text, HTML, and metadata.
   * @throws {Error} If the AI call fails.
   */
  static async createContent(params: ContentCreationParams, settings: AISettings): Promise<GeneratedContent> {
    
    const documentsContext = (params.sourceDocuments || []).map(doc => 
        `--- DOKUMENT START: ${doc.name} ---\nINHALT (Auszug):\n${doc.content.substring(0, 2000)}...\n--- DOKUMENT ENDE ---\n`
    ).join('\n');
    
    const prompt = `
Du bist ein Spezialist für die Erstellung hochwertiger, strukturierter Dokumente im Bereich Menschenrechte.

${params.template ? `TEMPLATE/STRUKTUR:\n${params.template}\n` : ''}

FALLKONTEXT:
${params.caseContext}

${documentsContext ? `QUELLDOKUMENTE:\n${documentsContext}\n` : ''}

ANWEISUNGEN:
${params.instructions}

Erstelle ein professionelles, vollständiges Dokument basierend auf den Anweisungen, dem Fallkontext und den Quelldokumenten.
${params.template ? 'Folge genau der bereitgestellten Template-Struktur und fülle alle Abschnitte aus.' : ''}
${documentsContext ? 'Nutze primär die Informationen aus den Quelldokumenten und zitiere sie ggf. ("laut [Dateiname]"). Ergänze mit Informationen aus dem allgemeinen Fallkontext.' : ''}
Formatiere deine Antwort in Markdown.

Bei fehlenden Informationen:
- Verwende "[Information nicht verfügbar]"
- Weise auf Informationslücken hin
- Schlage vor, wo weitere Recherchen nötig sind

Schreibe in professionellem, präzisem Deutsch.
    `;

    try {
      const content = await GeminiService.callAI(prompt, null, settings);

      const htmlContent = await marked.parse(content);

      return {
        content,
        htmlContent: htmlContent,
        metadata: {
          template_used: params.templateName, // Use templateName for display
          word_count: this.countWords(content),
          estimated_reading_time: this.calculateReadingTime(content),
          creation_timestamp: new Date().toISOString(),
          source_documents: params.sourceDocuments?.map(d => d.id) || [],
        }
      };
    } catch (error) {
      console.error('Content creation failed:', error);
      throw new Error(`Content creation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * @private
   * @static
   * @function countWords
   * @description Counts the number of words in a given string.
   * @param {string} text - The text to count words in.
   * @returns {number} The total word count.
   */
  private static countWords(text: string): number {
    if(!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * @private
   * @static
   * @function calculateReadingTime
   * @description Estimates the reading time in minutes for a given text.
   * @param {string} text - The text to calculate the reading time for.
   * @returns {number} The estimated reading time in minutes.
   */
  private static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
