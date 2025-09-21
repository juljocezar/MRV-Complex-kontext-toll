import { GeminiService } from './geminiService';
import { Document, ContentCreationParams, GeneratedContent, AISettings } from '../types';
import { marked } from 'marked';

export class ContentCreatorService {
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

  private static countWords(text: string): number {
    if(!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
