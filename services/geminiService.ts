

import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY environment variable not set. AI features will not work.");
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
    settings: AISettings
): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
            if (!ai) {
                throw new Error("Gemini AI client is not initialized. Please check if the API_KEY is correctly set.");
            }
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents as any,
                config: {
                    temperature: settings.temperature,
                    topP: settings.topP,
                    ...(jsonSchema && {
                        responseMimeType: "application/json",
                        responseSchema: jsonSchema,
                    }),
                }
            });
            
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

const streamGeminiAPIThrottled = (
    contents: string | (string | Part)[],
    settings: AISettings,
    onChunk: (chunk: string) => void
): Promise<string> => { // Returns the full text on completion
    return new Promise((resolve, reject) => {
        const task = async () => {
            if (!ai) {
                throw new Error("Gemini AI client is not initialized.");
            }
            const response = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: contents as any,
                config: {
                    temperature: settings.temperature,
                    topP: settings.topP,
                }
            });

            let fullText = "";
            for await (const chunk of response) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    onChunk(chunkText);
                }
            }
            return fullText;
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
    settings: AISettings
  ): Promise<string> {
    return callGeminiAPIThrottled<string>(contents, jsonSchema, settings);
  }

  static async callAIWithSchema<T>(
    contents: string | (string | Part)[],
    jsonSchema: object,
    settings: AISettings
  ): Promise<T> {
    return callGeminiAPIThrottled<T>(
      contents,
      jsonSchema as Schema,
      settings
    );
  }

  static async generateContentStream(
    contents: string | (string | Part)[],
    settings: AISettings,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return streamGeminiAPIThrottled(contents, settings, onChunk);
  }
}