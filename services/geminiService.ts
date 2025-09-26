
import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

const API_KEY = process.env.API_KEY;

/**
 * @const {GoogleGenAI | null} ai
 * @description The initialized GoogleGenAI client instance. Null if the API key is not provided.
 */
let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.error("API_KEY environment variable not set. AI features will not work.");
}

/**
 * @const callQueue
 * @description A queue to manage outgoing API calls to the Gemini service, ensuring they are throttled.
 * Each item in the queue contains the task to execute and its corresponding promise handlers.
 */
const callQueue: {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}[] = [];

/**
 * @let {boolean} isProcessing
 * @description A flag to indicate if the call queue is currently being processed, preventing concurrent processing.
 */
let isProcessing = false;
/**
 * @const {number} THROTTLE_DELAY
 * @description The delay in milliseconds between each API call to prevent rate-limiting.
 */
const THROTTLE_DELAY = 1000; // 1 second delay between API calls

/**
 * @async
 * @function processQueue
 * @description Processes the API call queue. It takes the next task from the queue, executes it,
 * and then waits for a specified delay before allowing the next task to be processed.
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
        console.error("Gemini API Task failed:", error);
        reject(error);
    }
    
    // Wait for the throttle delay before processing the next item
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, THROTTLE_DELAY);
}

/**
 * @function callGeminiAPIThrottled
 * @description Queues a call to the Gemini API and returns a promise that resolves with the result.
 * This function ensures that API calls are made one at a time with a delay, preventing rate limit issues.
 * It handles both standard text generation and structured JSON output based on a provided schema.
 * @template T - The expected type of the response (string for text, or a custom type for JSON).
 * @param {string | (string | Part)[]} contents - The content to send to the AI model.
 * @param {Schema | null} jsonSchema - The JSON schema for the expected response format, or null for plain text.
 * @param {AISettings} settings - The AI settings (temperature, topP) for the call.
 * @returns {Promise<T>} A promise that resolves with the AI's response, cast to the specified type.
 */
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

        callQueue.push({ task: task as any, resolve, reject });
        
        if (!isProcessing) {
            processQueue();
        }
    });
};

/**
 * @class GeminiService
 * @description A static class that serves as the primary interface for interacting with the Gemini AI.
 * It provides simplified methods for making both standard and schema-enforced API calls,
 * utilizing the underlying throttled queue system.
 */
export class GeminiService {
  /**
   * @static
   * @async
   * @function callAI
   * @description A simplified method for making a standard, text-based AI call.
   * @param {string | (string | Part)[]} contents - The content to send to the AI.
   * @param {Schema | null} jsonSchema - A JSON schema if a specific structure is desired (though `callAIWithSchema` is preferred for typed results).
   * @param {AISettings} settings - The AI settings for the call.
   * @returns {Promise<string>} A promise that resolves to the AI's text response.
   */
  static async callAI(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings
  ): Promise<string> {
    return callGeminiAPIThrottled<string>(contents, jsonSchema, settings);
  }

  /**
   * @static
   * @async
   * @template T - The expected interface or type of the JSON response.
   * @function callAIWithSchema
   * @description A method for making an AI call that expects a structured JSON response conforming to a given schema.
   * @param {string | (string | Part)[]} contents - The content to send to the AI.
   * @param {object} jsonSchema - The JSON schema to enforce on the AI's response.
   * @param {AISettings} settings - The AI settings for the call.
   * @returns {Promise<T>} A promise that resolves to the parsed JSON response, cast to the specified type.
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
