/**
 * @file This service provides a throttled interface to the Google Gemini API,
 * with a focus on handling structured (JSON schema-based) responses.
 * @note This service appears to be a reimplementation of `geminiService.ts`.
 * In a future refactor, these two services could be consolidated.
 */
import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

// This implementation does not use Vite's `import.meta.env` and may not work correctly
// in a Vite project without further configuration (e.g., using a plugin like vite-plugin-environment).
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callQueue: {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}[] = [];

let isProcessing = false;
const THROTTLE_DELAY = 2000;

/**
 * Processes the API call queue sequentially to manage rate limiting.
 * @async
 */
async function processQueue() {
    if (isProcessing || callQueue.length === 0) {
        return;
    }
    isProcessing = true;
    
    const { task, resolve, reject } = callQueue.shift()!;
    
    try {
        const result = await task();
        resolve(result);
    } catch (error) {
        console.error("Gemini API Task failed in StructuredAIService:", error);
        reject(error);
    }
    
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, THROTTLE_DELAY);
}

/**
 * A generic, throttled function to call the Gemini API.
 * It queues the request and handles JSON response sanitization.
 * @template T
 * @param {string | (string | Part)[]} contents - The content for the AI model.
 * @param {Schema | null} jsonSchema - The schema for a structured JSON response.
 * @param {AISettings} settings - Configuration for the AI model.
 * @returns {Promise<T>} A promise resolving with the AI's response, parsed as type T.
 */
const callGeminiAPIThrottled = <T>(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings
): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
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
            
            const text = response.text();
            if (!text) {
                if (jsonSchema) return JSON.parse('{}') as T;
                return "" as T;
            }

            if (jsonSchema) {
                try {
                    const sanitizedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(sanitizedText) as T;
                } catch (e) {
                    console.error('Failed to parse JSON response from AI in StructuredAIService:', text);
                    return {} as T;
                }
            }
            return text as T;
        };

        callQueue.push({ task: task as any, resolve, reject });
        
        if (!isProcessing) {
            processQueue();
        }
    });
};

/**
 * Provides a throttled interface to the Google Gemini API, primarily for structured data.
 * @note This service is very similar to `GeminiService` and could likely be merged.
 */
export class StructuredAIService {
  /**
   * Makes a standard call to the AI, expecting a string response.
   * @param {string | (string | Part)[]} contents - The content for the AI model.
   * @param {Schema | null} jsonSchema - An optional JSON schema.
   * @param {AISettings} settings - Configuration for the AI model.
   * @returns {Promise<string>} A promise resolving with the AI's text response.
   */
  static async callAI(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings
  ): Promise<string> {
    return callGeminiAPIThrottled<string>(contents, jsonSchema, settings);
  }

  /**
   * Makes a call to the AI with a JSON schema, expecting a typed object response.
   * @template T
   * @param {string | (string | Part)[]} contents - The content for the AI model.
   * @param {object} jsonSchema - The JSON schema for the response.
   * @param {AISettings} settings - Configuration for the AI model.
   * @returns {Promise<T>} A promise resolving with the AI's response, parsed as type T.
   */
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
}
