
import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import type { AppState, AnalysisChatMessage } from '../../types';
import Tooltip from '../ui/Tooltip';

interface AnalysisTabProps {
    appState: AppState;
    onPerformAnalysis: (prompt: string, isGrounded: boolean) => Promise<string>;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ appState, onPerformAnalysis }) => {
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

        const newHistory: AnalysisChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newHistory);
        setMessage('');
        setIsLoading(true);

        try {
            const responseText = await onPerformAnalysis(message, isGrounded);
            const htmlResponse = await marked.parse(responseText);
            setChatHistory(h => [...h, { role: 'assistant', text: htmlResponse }]);
        } catch (error) {
            console.error("Analysis API call failed:", error);
            const errorMessage = "Entschuldigung, bei der Analyse ist ein Fehler aufgetreten.";
            setChatHistory(h => [...h, { role: 'assistant', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-white">Analyse-Zentrum</h1>
                <p className="text-gray-400 mt-1">
                    Stellen Sie komplexe Fragen an den gesamten Fallkontext. Die KI wird versuchen, basierend auf allen verfügbaren Informationen zu antworten.
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
                 {isLoading && (
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
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Fragen Sie etwas über den Fall..."
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500">
                        {isLoading ? '...' : 'Senden'}
                    </button>
                </div>
                 <div className="mt-2">
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
                </div>
            </div>
        </div>
    );
};

export default AnalysisTab;
