import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
import { AISettings } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callQueue: (() => Promise<void>)[] = [];
let isProcessing = false;
const THROTTLE_DELAY = 1500; // 1.5 seconds delay between calls

async function processQueue() {
    if (isProcessing || callQueue.length === 0) {
        return;
    }
    isProcessing = true;
    const task = callQueue.shift();
    if (task) {
        await task();
    }
    setTimeout(() => {
        isProcessing = false;
        processQueue();
    }, THROTTLE_DELAY);
}

export const callGeminiAPIThrottled = <T,>(
    contents: string | (string | Part)[],
    jsonSchema: T | null,
    settings: AISettings
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const task = async () => {
            try {
                const response: GenerateContentResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: {
                        temperature: settings.temperature,
                        topP: settings.topP,
                        ...(jsonSchema && {
                            responseMimeType: "application/json",
                            responseSchema: jsonSchema as Schema,
                        }),
                    }
                });
                
                const text = response.text;
                if (!text) {
                    throw new Error("Empty response from API");
                }
                resolve(text);
            } catch (error) {
                console.error("Error calling Gemini API:", error);
                reject(error);
            }
        };

        callQueue.push(task);
        processQueue();
    });
};