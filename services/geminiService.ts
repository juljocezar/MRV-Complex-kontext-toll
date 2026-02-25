
import { GoogleGenAI, GenerateContentResponse, Schema, Part, Tool } from "@google/genai";
import { AISettings } from '../types';

// Robust API Key Retrieval
const getApiKey = (): string | undefined => {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    try {
        if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
            return (import.meta as any).env.VITE_API_KEY;
        }
    } catch (e) {}
    return undefined;
};

const API_KEY = getApiKey();

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY environment variable not set. AI features will not work.");
}

export class GeminiService {
  
  /**
   * Wrapper for API calls to handle Rate Limits (429) with exponential backoff.
   */
  private static async retryOperation<T>(operation: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
      try {
          return await operation();
      } catch (error: any) {
          const isRateLimit = error?.status === 429 || error?.code === 429 || 
                              (error?.message && (
                                  error.message.includes('429') || 
                                  error.message.includes('quota') || 
                                  error.message.includes('RESOURCE_EXHAUSTED')
                              ));
          
          if (isRateLimit && retries > 0) {
              console.warn(`Gemini API Rate Limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return this.retryOperation(operation, retries - 1, delay * 2);
          }
          throw error;
      }
  }

  // Standard non-streaming call
  static async callAI(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings,
    model: string = 'gemini-3-flash-preview',
    tools?: Tool[],
    systemInstruction?: string
  ): Promise<string> {
      if (!ai) throw new Error("AI not initialized");
      
      return this.retryOperation(async () => {
          const response = await ai!.models.generateContent({
              model,
              contents: contents as any,
              config: {
                  temperature: settings.temperature,
                  topP: settings.topP,
                  systemInstruction,
                  ...(jsonSchema && {
                      responseMimeType: "application/json",
                      responseSchema: jsonSchema,
                  }),
                  tools
              }
          });
          return response.text || "";
      });
  }

  // Streaming call
  static async *callAIStream(
    contents: string | (string | Part)[],
    settings: AISettings,
    model: string = 'gemini-3-flash-preview',
    systemInstruction?: string
  ): AsyncGenerator<string, void, unknown> {
      if (!ai) throw new Error("AI not initialized");

      // We retry the initial connection. 
      // If the stream breaks mid-way, it will throw, but we can't easily resume.
      const result = await this.retryOperation(async () => {
          return await ai!.models.generateContentStream({
              model,
              contents: contents as any,
              config: {
                  temperature: settings.temperature,
                  topP: settings.topP,
                  systemInstruction
              }
          });
      });

      for await (const chunk of result) {
          const c = chunk as GenerateContentResponse;
          if (c.text) {
              yield c.text;
          }
      }
  }

  static async callAIWithSchema<T>(
    contents: string | (string | Part)[],
    jsonSchema: object,
    settings: AISettings,
    model: string = 'gemini-3-flash-preview'
  ): Promise<T> {
      const text = await this.callAI(contents, jsonSchema as Schema, settings, model);
      try {
          const sanitizedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(sanitizedText) as T;
      } catch (e) {
          console.error("JSON Parse Error", text);
          return {} as T;
      }
  }

  static async callAgent(
      contents: (string | Part)[],
      settings: AISettings,
      tools: Tool[],
      systemInstruction?: string
  ): Promise<GenerateContentResponse> {
      if (!ai) throw new Error("AI not initialized");
      
      return this.retryOperation(async () => {
          return await ai!.models.generateContent({
              model: 'gemini-3-pro-preview',
              contents: contents as any,
              config: {
                  temperature: settings.temperature,
                  topP: settings.topP,
                  tools,
                  systemInstruction,
                  thinkingConfig: { thinkingBudget: 32768 } // Enable thinking for agent
              }
          });
      });
  }

  static async getEmbedding(
    text: string, 
    taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'
  ): Promise<number[] | undefined> {
      if (!ai) return undefined;
      try {
          return await this.retryOperation(async () => {
              const response = await ai!.models.embedContent({
                  model: 'text-embedding-004',
                  contents: text,
                  config: { taskType }
              });
              // Fixed: Use embeddings array instead of deprecated embedding property
              return response.embeddings?.[0]?.values;
          });
      } catch (e) {
          return undefined;
      }
  }

  static async batchGetEmbeddings(
      texts: string[],
      taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT'
  ): Promise<(number[] | undefined)[]> {
      const embeddings: (number[] | undefined)[] = [];
      for (const text of texts) {
          if(!text.trim()) { embeddings.push(undefined); continue; }
          embeddings.push(await this.getEmbedding(text, taskType));
          // Throttle slightly to be nice to the API even with retry logic
          await new Promise(r => setTimeout(r, 200)); 
      }
      return embeddings;
  }
}
