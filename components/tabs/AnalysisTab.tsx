import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import type { AppState, AnalysisChatMessage } from '../../types';
import Tooltip from '../ui/Tooltip';

interface AnalysisTabProps {
    appState: AppState;
    onPerformAnalysisStream: (prompt: string, isGrounded: boolean, onChunk: (chunk: string) => void) => Promise<string>;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ appState, onPerformAnalysisStream }) => {
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGrounded, setIsGrounded] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessageText = message;
        // User message is kept as plain text, will be parsed to HTML for display
        const userMessageHtml = await marked.parse(userMessageText);
        
        setChatHistory(prev => [...prev, 
            { role: 'user', text: userMessageHtml },
            { role: 'assistant', text: '' } // Add empty assistant message
        ]);
        setMessage('');
        setIsLoading(true);

        let accumulatedMd = "";
        const onChunk = async (chunk: string) => {
            accumulatedMd += chunk;
            // Parse the accumulated markdown to HTML for rendering
            const html = await marked.parse(accumulatedMd);
            setChatHistory(prev => {
                const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    updatedHistory[updatedHistory.length - 1] = { ...lastMessage, text: html };
                }
                return updatedHistory;
            });
        };
        
        try {
            // The promise resolves when the stream is done. We can use the final text for any post-processing.
            const fullResponse = await onPerformAnalysisStream(userMessageText, isGrounded, onChunk);
            // Final update just to be sure it's consistent
            const finalHtml = await marked.parse(fullResponse);
            setChatHistory(prev => {
                 const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    updatedHistory[updatedHistory.length - 1] = { ...lastMessage, text: finalHtml };
                }
                return updatedHistory;
            });

        } catch (error) {
            console.error("Analysis API call failed:", error);
            const errorMessage = "Entschuldigung, bei der Analyse ist ein Fehler aufgetreten.";
            // Replace the last (empty) assistant message with the error message
            setChatHistory(h => [...h.slice(0, -1), { role: 'assistant', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQuickAction = (promptTemplate: string) => {
        setMessage(promptTemplate);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-white">Analyse-Zentrum</h1>
                <p className="text-gray-400 mt-1">
                    Stellen Sie komplexe Fragen an den gesamten Fallkontext. Die KI nutzt eine interne Suche, um die relevantesten Informationen für eine präzise Antwort zu finden.
                </p>
            </div>

            <div ref={chatContainerRef} className="flex-grow bg-gray-800 rounded-lg p-4 overflow-y-auto space-y-4">
                {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        Beginnen Sie die Analyse, indem Sie eine Frage stellen.
                        <br/>
                        z.B. "Welche Verbindungen gibt es zwischen Person A und Organisation B?"
                    </div>
                )}
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl px-4 py-2 rounded-lg ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: chat.text }}></div>
                        </div>
                    </div>
                ))}
                 {isLoading && chatHistory[chatHistory.length -1]?.role === 'assistant' && !chatHistory[chatHistory.length -1]?.text && (
                     <div className="flex justify-start">
                         <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                             <div className="flex items-center space-x-2">
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                             </div>
                         </div>
                     </div>
                )}
            </div>
            
            <div className="flex-shrink-0 bg-gray-800 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                     <div className="flex-grow">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                            placeholder="Fragen Sie etwas über den Fall..."
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                         <div className="mt-2 flex items-center justify-between">
                            <Tooltip text="Weist die KI an, ihre Antworten primär auf den im Tab 'Rechtsgrundlagen' hinterlegten juristischen Texten zu basieren. Dies kann die Antwortqualität erhöhen, dauert aber länger.">
                                <label className="flex items-center space-x-2 cursor-pointer w-fit">
                                    <input
                                        type="checkbox"
                                        checked={isGrounded}
                                        onChange={(e) => setIsGrounded(e.target.checked)}
                                        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-400">Antwort auf Rechtsgrundlagen stützen</span>
                                </label>
                            </Tooltip>
                             <button 
                                onClick={() => handleQuickAction("Basierend auf den vorhandenen Dokumenten, erkläre mir die Kriterien für die Klassifizierung 'Fallbezogen' vs. 'Kontextbezogen'. Gib mir Beispiele aus den Dokumenten und hilf mir zu entscheiden, wie ich ein neues Dokument über [THEMA HIER EINFÜGEN] einordnen sollte.")}
                                className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                disabled={isLoading}
                            >
                                Schnellaktion: Hilfe bei Klassifizierung
                            </button>
                        </div>
                    </div>
                    <button onClick={handleSendMessage} disabled={isLoading || !message.trim()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 self-stretch">
                        {isLoading ? '...' : 'Senden'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisTab;