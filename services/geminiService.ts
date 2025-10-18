import { GoogleGenerativeAI, GenerativeModel, Content } from "@google/generative-ai";
import { AISettings } from '../types';

// Store AI instances in a map, one per API key.
const aiInstances = new Map<string, GoogleGenerativeAI>();
const modelInstances = new Map<string, GenerativeModel>();

const getAiInstance = (apiKey: string): GoogleGenerativeAI => {
    if (!apiKey) {
        throw new Error("Gemini API key is not provided.");
    }
    if (!aiInstances.has(apiKey)) {
        const newInstance = new GoogleGenerativeAI(apiKey);
        aiInstances.set(apiKey, newInstance);
    }
    return aiInstances.get(apiKey)!;
};

const getModelInstance = (apiKey: string, settings: AISettings, jsonSchema: object | null): GenerativeModel => {
    const key = `${apiKey}-${settings.temperature}-${settings.topP}-${jsonSchema ? 'json' : 'text'}`;
    if (!modelInstances.has(key)) {
        const ai = getAiInstance(apiKey);
        const model = ai.getGenerativeModel({
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
        modelInstances.set(key, model);
    }
    return modelInstances.get(key)!;
};

// A simple queue to throttle API calls.
const callQueue: { task: () => Promise<any>; resolve: (value: any) => void; reject: (reason?: any) => void; }[] = [];
let isProcessing = false;
const THROTTLE_DELAY = 1000; // 1 call per second

async function processQueue() {
    if (isProcessing || callQueue.length === 0) return;
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

const callGeminiAPIThrottled = <T>(
    apiKey: string,
    contents: Content,
    jsonSchema: object | null,
    settings: AISettings
): Promise<T> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
            const model = getModelInstance(apiKey, settings, jsonSchema);
            const result = await model.generateContent(contents);
            const response = result.response;
            const text = response.text();

            if (!text) {
                return (jsonSchema ? JSON.parse('{}') : "") as T;
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
        callQueue.push({ task, resolve, reject });
        if (!isProcessing) processQueue();
    });
};

export class GeminiService {
  static async callAI<T>(
    apiKey: string,
    contents: Content,
    jsonSchema: object | null,
    settings: AISettings
  ): Promise<T> {
    return callGeminiAPIThrottled<T>(apiKey, contents, jsonSchema, settings);
  }
}