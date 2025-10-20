import { GeminiService } from './geminiService';
import { Document, ContentCreationParams, GeneratedContent, AISettings } from '../types';
import { marked } from 'marked';

export class ContentCreatorService {
  static async createContent(params: ContentCreationParams, settings: AISettings): Promise<GeneratedContent> {
    
    const documentsContext = (params.sourceDocuments || []).map(doc => 
        `--- DOKUMENT START: ${doc.name} ---\nINHALT (Auszug):\n${doc.content.substring(0, 2000)}...\n--- DOKUMENT ENDE ---\n`
    ).join('\n');
    
    const argumentsContext = (params.selectedArguments && params.selectedArguments.length > 0)
        ? `**WICHTIGE ARGUMENTE ZUM INTEGRIEREN:**\n${params.selectedArguments.map(arg => `- ${arg.point} (Beweis: ${arg.evidence.join(', ')})`).join('\n')}\nStelle sicher, dass diese Argumente prominent und überzeugend in den Text eingearbeitet werden.\n`
        : '';

    const prompt = `
Du bist ein Spezialist für die Erstellung hochwertiger, strukturierter Dokumente im Bereich Menschenrechte.

${params.template ? `TEMPLATE/STRUKTUR:\n${params.template}\n` : ''}

FALLKONTEXT:
${params.caseContext}

${documentsContext ? `QUELLDOKUMENTE:\n${documentsContext}\n` : ''}

${argumentsContext}

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

  static async createContentStream(params: ContentCreationParams, settings: AISettings, onChunk: (chunk: string) => void): Promise<string> {
    const documentsContext = (params.sourceDocuments || []).map(doc => 
        `--- DOCUMENT START: ${doc.name} ---\nCONTENT (Excerpt):\n${(doc.textContent || doc.content).substring(0, 2000)}...\n--- DOCUMENT END ---\n`
    ).join('\n');
    
    const argumentsContext = (params.selectedArguments && params.selectedArguments.length > 0)
        ? `**KEY ARGUMENTS TO INTEGRATE:**\n${params.selectedArguments.map(arg => `- ${arg.point} (Evidence: ${arg.evidence.join(', ')})`).join('\n')}\nEnsure these arguments are integrated prominently and persuasively into the text.\n`
        : '';

    let basePrompt: string;
    let languageInstruction: string;
    let missingInfoInstruction: string;
    let mainTaskInstruction: string;

    if (params.language === 'en') {
        basePrompt = `You are a specialist in creating high-quality, structured documents in the field of human rights.`;
        mainTaskInstruction = `
Create a professional, complete document based on the instructions, case context, and source documents.
${params.template ? 'Follow the provided template structure exactly and fill in all sections.' : ''}
${documentsContext ? 'Primarily use information from the source documents, citing them where appropriate (e.g., "according to [filename]"). Supplement with information from the general case context.' : ''}
Format your response in Markdown.`;
        missingInfoInstruction = `
If information is missing:
- Use "[Information not available]"
- Point out information gaps
- Suggest where further research is needed`;
        languageInstruction = 'Write in professional, precise English.';
    } else {
        basePrompt = `Du bist ein Spezialist für die Erstellung hochwertiger, strukturierter Dokumente im Bereich Menschenrechte.`;
        mainTaskInstruction = `
Erstelle ein professionelles, vollständiges Dokument basierend auf den Anweisungen, dem Fallkontext und den Quelldokumenten.
${params.template ? 'Folge genau der bereitgestellten Template-Struktur und fülle alle Abschnitte aus.' : ''}
${documentsContext ? 'Nutze primär die Informationen aus den Quelldokumenten und zitiere sie ggf. ("laut [Dateiname]"). Ergänze mit Informationen aus dem allgemeinen Fallkontext.' : ''}
Formatiere deine Antwort in Markdown.`;
        missingInfoInstruction = `
Bei fehlenden Informationen:
- Verwende "[Information nicht verfügbar]"
- Weise auf Informationslücken hin
- Schlage vor, wo weitere Recherchen nötig sind`;
        languageInstruction = 'Schreibe in professionellem, präzisem Deutsch.';
    }


    const prompt = `
${basePrompt}

${params.template ? `TEMPLATE/STRUCTURE:\n${params.template}\n` : ''}

CASE CONTEXT:
${params.caseContext}

${documentsContext ? `SOURCE DOCUMENTS:\n${documentsContext}\n` : ''}

${argumentsContext}

INSTRUCTIONS:
${params.instructions}

${mainTaskInstruction}

${missingInfoInstruction}

${languageInstruction}
    `;

    try {
        return await GeminiService.generateContentStream(prompt, settings, onChunk);
    } catch (error) {
        console.error('Content creation stream failed:', error);
        throw new Error(`Content creation stream failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async proofreadText(text: string, settings: AISettings): Promise<string> {
    const prompt = `
Du bist ein professioneller Lektor. Korrigiere den folgenden Text auf Grammatik, Rechtschreibung, Klarheit und Stil.
Gib NUR den verbesserten Text im Markdown-Format zurück. Behalte die ursprüngliche Bedeutung bei.

Zu korrigierender Text:
---
${text}
---
`;

    try {
        return await GeminiService.callAI(prompt, null, settings);
    } catch (error) {
        console.error('Proofreading failed:', error);
        throw new Error(`Proofreading failed: ${error instanceof Error ? error.message : String(error)}`);
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