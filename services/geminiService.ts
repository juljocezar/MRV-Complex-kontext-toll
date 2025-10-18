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