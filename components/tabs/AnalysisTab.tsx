
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import type { AppState, AnalysisChatMessage } from '../../types';
import Tooltip from '../ui/Tooltip';
import { SearchService } from '../../services/searchService';
import { AgentLoopService } from '../../services/agent/agentLoop';

interface AnalysisTabProps {
    appState: AppState;
    onPerformAnalysis: (prompt: string, isGrounded: boolean) => Promise<string>;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ appState, onPerformAnalysis }) => {
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useAgent, setUseAgent] = useState(true);
    const [useGrounding, setUseGrounding] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const searchService = useMemo(() => {
        const s = new SearchService();
        s.buildIndex(appState);
        return s;
    }, [appState.documents, appState.caseEntities]);

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
            let responseText = "";
            
            if (useAgent) {
                // Use the new Agent Loop
                responseText = await AgentLoopService.runAgent(
                    message,
                    appState,
                    searchService,
                    useGrounding
                );
            } else {
                // Legacy simple analysis
                responseText = await onPerformAnalysis(message, false); // isGrounded logic handled inside legacy service
            }

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
            <div className="flex-shrink-0 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analyse-Zentrum (Agent V2)</h1>
                    <p className="text-gray-400 mt-1">
                        Interaktive Fallanalyse. Aktivieren Sie den Agenten-Modus, damit die KI aktiv in Ihrer Datenbank suchen kann.
                    </p>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-grow bg-gray-800 rounded-lg p-4 overflow-y-auto space-y-4 border border-gray-700">
                {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        Beginnen Sie die Analyse, indem Sie eine Frage stellen.
                        <br/>
                        z.B. "Gibt es Verbindungen zwischen den Vorfällen im Mai und den Polizeiberichten?"
                    </div>
                )}
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl px-4 py-2 rounded-lg ${chat.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 border border-gray-600'}`}>
                            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: chat.text }}></div>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                     <div className="flex justify-start">
                         <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600">
                             <div className="flex items-center space-x-2">
                                 <span className="text-xs text-gray-400 mr-2">Agent denkt & sucht...</span>
                                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-75"></div>
                                 <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-150"></div>
                             </div>
                         </div>
                     </div>
                )}
            </div>
            
            <div className="flex-shrink-0 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Fragen Sie etwas über den Fall..."
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:text-gray-400">
                        {isLoading ? '...' : 'Senden'}
                    </button>
                </div>
                 <div className="mt-3 flex gap-6">
                    <Tooltip text="Aktiviert den autonomen Agenten-Modus. Die KI kann selbstständig entscheiden, die Datenbank zu durchsuchen (Tool-Call).">
                        <label className="flex items-center space-x-2 cursor-pointer w-fit">
                            <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="agent-toggle" checked={useAgent} onChange={(e) => setUseAgent(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600"/>
                                <label htmlFor="agent-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${useAgent ? 'bg-indigo-600' : 'bg-gray-600'}`}></label>
                            </div>
                            <span className={`text-xs font-bold ${useAgent ? 'text-indigo-400' : 'text-gray-400'}`}>Agenten-Modus (Auto-Suche)</span>
                        </label>
                    </Tooltip>

                    <Tooltip text="Verbindet die Analyse mit aktueller Google-Suche für externe Fakten (News, Gesetze).">
                        <label className="flex items-center space-x-2 cursor-pointer w-fit">
                             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="grounding-toggle" checked={useGrounding} onChange={(e) => setUseGrounding(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-500"/>
                                <label htmlFor="grounding-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${useGrounding ? 'bg-blue-500' : 'bg-gray-600'}`}></label>
                            </div>
                            <span className={`text-xs font-bold ${useGrounding ? 'text-blue-400' : 'text-gray-400'}`}>Google Search Grounding</span>
                        </label>
                    </Tooltip>
                </div>
            </div>
             <style>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #68D391;
                }
                .toggle-checkbox:checked + .toggle-label {
                    background-color: #68D391;
                }
            `}</style>
        </div>
    );
};

export default AnalysisTab;
