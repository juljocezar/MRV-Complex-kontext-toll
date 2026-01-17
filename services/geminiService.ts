
import { GoogleGenAI, GenerateContentResponse, Schema, Part, Tool } from "@google/genai";
import { AISettings } from '../types';

// Robust API Key Retrieval for both Node/AI Studio (process.env) and Vite/Browser (import.meta.env)
const getApiKey = (): string | undefined => {
    // Check if process is defined (Node-like environment or AI Studio injection)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // Check for Vite environment variable
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
        return (import.meta as any).env.VITE_API_KEY;
    }
    return undefined;
};

const API_KEY = getApiKey();

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY environment variable not set. AI features will not work. Please check .env file.");
}


// A more robust queue that handles tasks, retries, and their corresponding promises
const callQueue: {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    retries: number;
}[] = [];

let isProcessing = false;
// Increased delay to > 4 seconds to stay safely within a 15 RPM limit.
const THROTTLE_DELAY = 4100;
const MAX_RETRIES = 3;

async function processQueue() {
    if (isProcessing || callQueue.length === 0) {
        return;
    }
    isProcessing = true;
    
    const queueItem = callQueue.shift()!;
    const { task, resolve, reject, retries } = queueItem;
    
    try {
        const result = await task();
        resolve(result);
        
        // On success, wait for the standard delay before processing the next item
        setTimeout(() => {
            isProcessing = false;
            processQueue();
        }, THROTTLE_DELAY);

    } catch (error: any) {
        console.error("Gemini API Task failed:", error);

        const isRateLimitError = (e: any): boolean => {
            // Check common places for rate limit indicators
            const errorMessage = (typeof e?.message === 'string') ? e.message : '';
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                return true;
            }
            // Fallback for unknown error structures by stringifying
            try {
                const errorString = JSON.stringify(e);
                return errorString.includes('"code":429') || errorString.includes('RESOURCE_EXHAUSTED');
            } catch {
                return false;
            }
        };

        if (isRateLimitError(error) && retries < MAX_RETRIES) {
            // It's a rate limit error, re-queue the task with backoff.
            // Increased the base backoff delay to be more patient.
            const backoffDelay = Math.pow(2, retries) * 2000 + Math.random() * 1000;
            console.warn(`Rate limit hit. Retrying in ${Math.round(backoffDelay / 1000)}s... (Attempt ${retries + 1}/${MAX_RETRIES})`);
            
            // Re-queue the task at the front with an increased retry count
            callQueue.unshift({ ...queueItem, retries: retries + 1 });

            setTimeout(() => {
                isProcessing = false;
                processQueue();
            }, backoffDelay);
        } else {
             // It's a different error or max retries reached, reject the promise
            if (isRateLimitError(error)) {
                console.error(`Max retries reached. Failing task.`);
                reject(new Error("API rate limit exceeded after multiple retries."));
            } else {
                reject(error);
            }
            
            // Move to the next task after the standard delay
            setTimeout(() => {
                isProcessing = false;
                processQueue();
            }, THROTTLE_DELAY);
        }
    }
}


const callGeminiAPIThrottled = <T>(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings,
    model: string,
    tools?: Tool[], // New: Support for Tools
    systemInstruction?: string // New: Support for System Instruction override
): Promise<T | GenerateContentResponse> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
            if (!ai) {
                throw new Error("Gemini AI client is not initialized. Please check if the API_KEY is correctly set.");
            }
            
            // Configure thinking budget for gemini-3-pro-preview
            // Increased logic to only apply if no tools are used or if explicitly required
            let thinkingConfig = undefined;
            if (model === 'gemini-3-pro-preview') {
                thinkingConfig = { thinkingBudget: 32768 };
            }

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: model,
                contents: contents as any,
                config: {
                    temperature: settings.temperature,
                    topP: settings.topP,
                    thinkingConfig: thinkingConfig,
                    systemInstruction: systemInstruction,
                    ...(jsonSchema && {
                        responseMimeType: "application/json",
                        responseSchema: jsonSchema,
                    }),
                    tools: tools // Pass tools if present
                }
            });
            
            // If tools are used, we might need the full response object to handle function calls
            if (tools && tools.length > 0) {
                return response as unknown as T;
            }

            const text = response.text;
            if (!text) {
                // Return an empty object/string for JSON/text to prevent downstream crashes
                if (jsonSchema) return JSON.parse('{}') as T;
                return "" as T;
            }

            if (jsonSchema) {
                try {
                    // Sanitize response before parsing
                    const sanitizedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(sanitizedText) as T;
                } catch (e) {
                    console.error('Failed to parse JSON response from AI:', text);
                    // Return a valid empty object on parse failure
                    return {} as T;
                }
            }
            return text as T;
        };

        callQueue.push({ task: task as any, resolve, reject, retries: 0 });
        
        if (!isProcessing) {
            processQueue();
        }
    });
};


export class GeminiService {
  static async callAI(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings,
    model: string = 'gemini-3-flash-preview',
    tools?: Tool[],
    systemInstruction?: string
  ): Promise<string> {
    return callGeminiAPIThrottled<string>(contents, jsonSchema, settings, model, tools, systemInstruction) as Promise<string>;
  }

  static async callAIWithSchema<T>(
    contents: string | (string | Part)[],
    jsonSchema: object,
    settings: AISettings,
    model: string = 'gemini-3-flash-preview'
  ): Promise<T> {
    return callGeminiAPIThrottled<T>(
      contents,
      jsonSchema as Schema,
      settings,
      model
    );
  }

  // New: Method to call AI specifically for Agentic workflows expecting full response (Function Calls)
  static async callAgent(
      contents: (string | Part)[],
      settings: AISettings,
      tools: Tool[],
      systemInstruction?: string
  ): Promise<GenerateContentResponse> {
      return callGeminiAPIThrottled<GenerateContentResponse>(
          contents,
          null,
          settings,
          'gemini-3-pro-preview', // Force Pro for better tool use
          tools,
          systemInstruction
      ) as Promise<GenerateContentResponse>;
  }

  // Embed a single text
  static async getEmbedding(
    text: string, 
    taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING' = 'RETRIEVAL_DOCUMENT'
  ): Promise<number[] | undefined> {
      if (!ai) return undefined;
      
      try {
          const response = await ai.models.embedContent({
              model: 'text-embedding-004',
              contents: text,
              config: {
                  taskType: taskType,
              }
          });
          return response.embedding?.values;
      } catch (e) {
          console.error("Embedding failed", e);
          return undefined;
      }
  }

  // Batch embed multiple texts
  static async batchGetEmbeddings(
      texts: string[],
      taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING' = 'RETRIEVAL_DOCUMENT'
  ): Promise<(number[] | undefined)[]> {
      if (!ai || texts.length === 0) return [];

      const embeddings: (number[] | undefined)[] = [];
      
      // Fallback: Sequential processing because batchEmbedContents is not available in this SDK version
      for (const text of texts) {
          try {
              // Ensure we don't send empty strings which might cause API errors
              if (!text || text.trim() === "") {
                  embeddings.push(undefined);
                  continue;
              }
              
              const result = await this.getEmbedding(text, taskType);
              embeddings.push(result);
              
              // Small delay to mitigate rate limits (approx 5 requests per second max)
              await new Promise(resolve => setTimeout(resolve, 200)); 
          } catch (e) {
              console.error("Single embedding in batch failed", e);
              embeddings.push(undefined);
          }
      }
      return embeddings;
  }
}
