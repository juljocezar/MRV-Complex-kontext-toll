import { GeminiService } from './geminiService';
import { Document, ContentCreationParams, GeneratedContent, AISettings } from '../types';
import { marked } from 'marked';

/**
 * A service responsible for generating structured content based on templates,
 * case context, source documents, and specific instructions.
 */
export class ContentCreatorService {

  /**
   * Generates a document using the AI based on provided parameters.
   * It constructs a detailed prompt, calls the AI, processes the Markdown response into HTML,
   * and returns the generated content along with metadata.
   * @param {ContentCreationParams} params - The parameters for content creation, including context, documents, and instructions.
   * @param {AISettings} settings - The AI settings for the generation task.
   * @returns {Promise<GeneratedContent>} A promise that resolves to the generated content object,
   * which includes the raw markdown, HTML version, and metadata.
   * @throws {Error} Throws an error if the content creation process fails.
   */
  static async createContent(params: ContentCreationParams, settings: AISettings): Promise<GeneratedContent> {
    
    // Context from source documents is built in German.
    const documentsContext = (params.sourceDocuments || []).map(doc => 
        `--- DOCUMENT START: ${doc.name} ---\nCONTENT (Excerpt):\n${doc.content.substring(0, 2000)}...\n--- DOCUMENT END ---\n`
    ).join('\n');
    
    // The prompt is in German, as requested by the original user.
    // An English translation is provided in comments for clarity.
    const prompt = `
You are a specialist in creating high-quality, structured documents in the human rights field.

${params.template ? `TEMPLATE/STRUCTURE:\n${params.template}\n` : ''}

CASE CONTEXT:
${params.caseContext}

${documentsContext ? `SOURCE DOCUMENTS:\n${documentsContext}\n` : ''}

INSTRUCTIONS:
${params.instructions}

Create a professional, complete document based on the instructions, case context, and source documents.
${params.template ? 'Follow the provided template structure exactly and fill in all sections.' : ''}
${documentsContext ? 'Primarily use information from the source documents and cite them if necessary ("according to [filename]"). Supplement with information from the general case context.' : ''}
Format your response in Markdown.

In case of missing information:
- Use "[Information not available]"
- Point out information gaps
- Suggest where further research is needed

Write in professional, precise German.
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
   * Counts the number of words in a given string.
   * @private
   * @param {string} text - The text to count words from.
   * @returns {number} The total number of words.
   */
  private static countWords(text: string): number {
    if(!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Calculates the estimated reading time for a given text.
   * @private
   * @param {string} text - The text for which to calculate reading time.
   * @returns {number} The estimated reading time in minutes.
   */
  private static calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }
}
