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

/**
 * @function processQueue
 * @description Processes the queue of API calls one by one with a delay, to avoid hitting rate limits.
 * @description Verarbeitet die Warteschlange der API-Aufrufe einzeln mit einer Verzögerung, um Ratenbegrenzungen zu vermeiden.
 * @returns {Promise<void>}
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
 * @function callGeminiAPIThrottled
 * @description Makes a call to the Gemini API, but throttles the requests to avoid rate limiting.
 * @description Führt einen Aufruf an die Gemini-API durch, drosselt jedoch die Anfragen, um Ratenbegrenzungen zu vermeiden.
 * @param {string | (string | Part)[]} contents - The content to be sent to the API. / Der an die API zu sendende Inhalt.
 * @param {T | null} jsonSchema - The JSON schema for the expected response, if any. / Das JSON-Schema für die erwartete Antwort, falls vorhanden.
 * @param {AISettings} settings - The AI settings to use for the call. / Die für den Aufruf zu verwendenden KI-Einstellungen.
 * @returns {Promise<string>} A promise that resolves with the text response from the API. / Ein Promise, das mit der Textantwort von der API aufgelöst wird.
 */
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