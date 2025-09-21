import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

/**
 * Retrieves the Gemini API key from Vite's environment variables.
 * @returns {string | undefined} The API key, or undefined if not set.
 */
const getApiKey = (): string | undefined => {
    // In Vite, import.meta.env is used for environment variables
    return import.meta.env.VITE_GEMINI_API_KEY;
};

let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns a singleton instance of the GoogleGenAI client.
 * This avoids issues with environment variables not being loaded at module import time.
 * @throws {Error} If the VITE_GEMINI_API_KEY is not set.
 * @returns {GoogleGenAI} The initialized GoogleGenAI instance.
 */
const getAiInstance = (): GoogleGenAI => {
    if (!ai) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set. Please set it in your .env.local file.");
        }
        ai = new GoogleGenAI(apiKey);
    }
    return ai;
};

/**
 * @typedef {object} QueueTask
 * @property {() => Promise<any>} task - The async function to execute.
 * @property {(value: any) => void} resolve - The resolve function of the promise.
 * @property {(reason?: any) => void} reject - The reject function of the promise.
 */

/** @type {QueueTask[]} */
const callQueue: {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}[] = [];

let isProcessing = false;
const THROTTLE_DELAY = 2000; // Increased delay to 2 seconds to be safer with the free tier limits

/**
 * Processes the API call queue sequentially, with a delay between calls to respect rate limits.
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
        console.error("Gemini API Task failed:", error);
        reject(error);
    }
    
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, THROTTLE_DELAY);
}

/**
 * A generic, throttled function to call the Gemini API.
 * It adds the API call to a queue and processes it sequentially.
 * It also handles JSON response sanitization and parsing.
 * @template T
 * @param {string | (string | Part)[]} contents - The content to send to the model.
 * @param {Schema | null} jsonSchema - The JSON schema for a structured response. If null, a plain text response is expected.
 * @param {AISettings} settings - Configuration for the AI model (temperature, etc.).
 * @returns {Promise<T>} A promise that resolves with the AI's response, parsed as type T.
 */
const callGeminiAPIThrottled = <T>(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings
): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
            const aiInstance = getAiInstance();
            const model = aiInstance.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    temperature: settings.temperature,
                    topP: settings.topP,
                    ...(jsonSchema && {
                        responseMimeType: "application/json",
                        responseSchema: jsonSchema as any,
                    }),
                }
            });

            const result = await model.generateContent(contents as any);
            const response = result.response;
            
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
                    console.error('Failed to parse JSON response from AI:', text);
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
 * The primary service for interacting with the Google Gemini API.
 * Provides throttled methods for making standard and schema-based AI calls.
 */
export class GeminiService {
  /**
   * Makes a standard call to the AI, expecting a string response.
   * @param {string | (string | Part)[]} contents - The content to send to the model.
   * @param {Schema | null} jsonSchema - An optional JSON schema. If provided, the response will be text-formatted JSON.
   * @param {AISettings} settings - Configuration for the AI model.
   * @returns {Promise<string>} A promise that resolves with the AI's text response.
   */
  static async callAI(
    contents: string | (string | Part)[],
    jsonSchema: Schema | null,
    settings: AISettings
  ): Promise<string> {
    return callGeminiAPIThrottled<string>(contents, jsonSchema, settings);
  }

  /**
   * Makes a call to the AI with a specific JSON schema, expecting a typed object response.
   * @template T
   * @param {string | (string | Part)[]} contents - The content to send to the model.
   * @param {object} jsonSchema - The JSON schema to which the response must conform.
   * @param {AISettings} settings - Configuration for the AI model.
   * @returns {Promise<T>} A promise that resolves with the AI's response, parsed into the specified type T.
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
