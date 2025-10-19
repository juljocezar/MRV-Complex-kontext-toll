import { useState, useCallback, useRef } from 'react';
import { GoogleGenerativeAI, ChatSession, FunctionCall } from '@google/generative-ai';
import { AppState } from '../types';

export interface CopilotMessage {
    role: 'user' | 'model' | 'tool';
    text: string;
}

export const useCopilot = (
    appState: AppState,
    handleToolCall: (toolName: string, parameters: any) => void
) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<CopilotMessage[]>([]);
    const chatSessionRef = useRef<ChatSession | null>(null);

    const buildRichContext = useCallback(() => {
        let context = `## Current Case Context\n\n`;
        context += `**Case Description:** ${appState.caseDetails.description}\n\n`;
        if (appState.knowledgeItems.length > 0) {
            context += `**Key Facts from Knowledge Base:**\n${appState.knowledgeItems.map(i => `- ${i.content}`).join('\n')}\n\n`;
        }
        if (appState.timelineEvents.length > 0) {
            context += `**Case Timeline:**\n${appState.timelineEvents.map(e => `- ${e.date}: ${e.title}`).join('\n')}\n\n`;
        }
        if (appState.caseEntities.length > 0) {
            context += `**Involved Parties/Entities:**\n${appState.caseEntities.map(e => `- ${e.name} (${e.type}, ${e.role})`).join('\n')}\n\n`;
        }
        return context;
    }, [appState]);

    const connect = useCallback(async (apiKey: string, systemPrompt: string) => {
        if (!apiKey) {
            console.error("Co-pilot: API Key is missing.");
            return;
        }
        setIsLoading(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const richContext = buildRichContext();

            chatSessionRef.current = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: "Understood. I am Astraea Zero. I have reviewed the case context and am ready to assist." }] },
                    { role: 'user', parts: [{ text: richContext }]},
                    { role: 'model', parts: [{ text: "Context has been loaded. How can I help?" }]},
                ],
            });

            setChatHistory([{ role: 'model', text: "Astraea Zero: Verbunden und bereit." }]);
            setIsConnected(true);
        } catch (error) {
            console.error("Failed to connect Co-pilot:", error);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    }, [buildRichContext]);

    const disconnect = useCallback(() => {
        chatSessionRef.current = null;
        setIsConnected(false);
        setChatHistory([]);
    }, []);

    const sendMessage = useCallback(async (prompt: string) => {
        if (!chatSessionRef.current || !isConnected) return;

        setIsLoading(true);
        setChatHistory(prev => [...prev, { role: 'user', text: prompt }]);

        try {
            const result = await chatSessionRef.current.sendMessageStream(prompt);
            let responseText = "";
            let functionCalls: FunctionCall[] = [];

            // Add a placeholder for the model's response
            setChatHistory(prev => [...prev, { role: 'model', text: "..." }]);

            for await (const chunk of result.stream) {
                // Check for function calls first
                if (chunk.functionCalls) {
                    functionCalls.push(...chunk.functionCalls);
                } else {
                    const chunkText = chunk.text();
                    responseText += chunkText;
                    // Update the last message (the placeholder) with the streamed text
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        newHistory[newHistory.length - 1].text = responseText;
                        return newHistory;
                    });
                }
            }

            if (functionCalls.length > 0) {
                // In a real scenario, you might have multiple function calls.
                // For now, we handle the first one.
                const call = functionCalls[0];
                handleToolCall(call.name, call.args);
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    // Remove the "..." placeholder
                    if (newHistory[newHistory.length - 1].text === "...") {
                        newHistory.pop();
                    }
                    // Add a confirmation message for the tool call
                    return [...newHistory, { role: 'tool', text: `Werkzeug "${call.name}" wurde ausgeführt.` }];
                });
            }

        } catch (error) {
            console.error("Error sending message to Co-pilot:", error);
            setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].text = "Es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.";
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    }, [isConnected, handleToolCall]);

    return { isConnected, isLoading, chatHistory, connect, disconnect, sendMessage };
};