import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

const getApiKey = () => {
    // In Vite, import.meta.env is used for environment variables
    return import.meta.env.VITE_GEMINI_API_KEY;
};

// We will initialize the AI instance when it's needed, not statically.
// This avoids issues with environment variables not being loaded at module import time.
let ai: GoogleGenAI | null = null;

const getAiInstance = () => {
    if (!ai) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("VITE_GEMINI_API_KEY environment variable not set. Please set it in your .env.local file.");
        }
        ai = new GoogleGenAI(apiKey);
    }
    return ai;
};

// A more robust queue that handles tasks and their corresponding promises
const callQueue: {
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}[] = [];

let isProcessing = false;
const THROTTLE_DELAY = 2000; // Increased delay to 2 seconds to be safer with the free tier limits

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
}
