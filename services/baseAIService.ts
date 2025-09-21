import { GoogleGenAI, GenerateContentResponse, Schema, Part } from "@google/genai";
// Fix: Corrected import path for types.
import { AISettings } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const callQueue: (() => Promise<void>)[] = [];
let isProcessing = false;
const THROTTLE_DELAY = 1500; // 1.5 seconds delay between calls

/**
 * Processes the API call queue one by one with a delay.
 * This prevents hitting rate limits of the external API.
 * @async
 */
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

/**
 * Base class for interacting with the AI model.
 * Provides a throttled method to call the Gemini API.
 */
export class BaseAIService {
    /**
     * Makes a call to the Google Gemini API with throttling.
     * The call is added to a queue and executed sequentially to avoid rate-limiting.
     * @param {string | (string | Part)[]} contents - The content to be sent to the model.
     * @param {Schema | null} jsonSchema - The JSON schema for structured responses. If null, a standard text response is expected.
     * @param {AISettings} settings - The AI model settings (e.g., temperature, topP).
     * @returns {Promise<string>} A promise that resolves with the text response from the AI.
     */
    static callAI(
        contents: string | (string | Part)[],
        jsonSchema: Schema | null,
        settings: AISettings
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const task = async () => {
                try {
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
    }
}

/**
 * Defines the options for an AI call.
 * @deprecated This interface is not actively used. Use AISettings from '../types' instead.
 */
export interface AICallOptions {
    /** The creativity of the response. */
    temperature?: number;
    /** The maximum number of tokens in the response. */
    maxTokens?: number;
    /** The nucleus sampling probability. */
    topP?: number;
}
