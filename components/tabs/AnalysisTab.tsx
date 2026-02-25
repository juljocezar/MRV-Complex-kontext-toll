
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import type { AppState, AnalysisChatMessage } from '../../types';
import Tooltip from '../ui/Tooltip';
import { SearchService } from '../../services/searchService';
import { AgentLoopService } from '../../services/agent/agentLoop';
import { GeminiService } from '../../services/geminiService';
import { buildCaseContext } from '../../utils/contextUtils';

// Declare DOMPurify attached to window in index.html
declare global {
    interface Window {
        DOMPurify: {
            sanitize: (html: string) => string;
        };
    }
}

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
    const [currentStreamText, setCurrentStreamText] = useState('');
    
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
    }, [chatHistory, currentStreamText]);

    const handleSendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMsg = message;
        setMessage('');
        setIsLoading(true);
        setCurrentStreamText(''); // Reset stream buffer

        // Add user message immediately
        setChatHistory(h => [...h, { role: 'user', text: userMsg }]);

        try {
            if (useAgent) {
                // Agent Loop doesn't support streaming yet due to tool calls steps
                // So we fallback to non-streaming for Agent mode for now, or implement complex stream handling
                const responseText = await AgentLoopService.runAgent(
                    userMsg,
                    appState,
                    searchService,
                    useGrounding
                );
                const cleanHtml = await renderMarkdown(responseText);
                setChatHistory(h => [...h, { role: 'assistant', text: cleanHtml }]);
            } else {
                // Standard Chat with Streaming
                const context = buildCaseContext(appState);
                const prompt = `Du bist ein hilfreicher Assistent für Menschenrechts-Fallanalyse.\n\nKONTEXT:\n${context}\n\nFRAGE: ${userMsg}`;
                
                let accumulatedText = "";
                const stream = GeminiService.callAIStream(prompt, appState.settings.ai, 'gemini-3-flash-preview');
                
                for await (const chunk of stream) {
                    accumulatedText += chunk;
                    setCurrentStreamText(accumulatedText); // Update UI in real-time
                }
                
                const cleanHtml = await renderMarkdown(accumulatedText);
                setChatHistory(h => [...h, { role: 'assistant', text: cleanHtml }]);
                setCurrentStreamText(''); // Clear buffer after committing to history
            }
        } catch (error) {
            console.error("Analysis API call failed:", error);
            setChatHistory(h => [...h, { role: 'assistant', text: "Fehler bei der Analyse." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMarkdown = async (text: string) => {
        const rawHtml = await marked.parse(text);
        return window.DOMPurify && window.DOMPurify.sanitize ? window.DOMPurify.sanitize(rawHtml) : rawHtml;
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex-shrink-0 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white">Analyse-Zentrum</h1>
                    <p className="text-gray-400 mt-1">
                        Chatten Sie mit Ihrem Fall. Nutzen Sie den Agenten-Modus für komplexe Recherchen oder deaktivieren Sie ihn für schnellere Antworten.
                    </p>
                </div>
            </div>

            <div ref={chatContainerRef} className="flex-grow bg-gray-800 rounded-lg p-4 overflow-y-auto space-y-4 border border-gray-700">
                {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        Beginnen Sie die Analyse, indem Sie eine Frage stellen.
                    </div>
                )}
                {chatHistory.map((chat, index) => (
                    <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl px-4 py-2 rounded-lg ${chat.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200 border border-gray-600'}`}>
                            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: chat.text }}></div>
                        </div>
                    </div>
                ))}
                
                {/* Streaming Output Display */}
                {isLoading && currentStreamText && (
                    <div className="flex justify-start">
                        <div className="max-w-3xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 border-l-4 border-l-indigo-500">
                            <div className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm">
                                {currentStreamText}
                                <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle"></span>
                            </div>
                        </div>
                    </div>
                )}

                 {isLoading && !currentStreamText && (
                     <div className="flex justify-start">
                         <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600">
                             <div className="flex items-center space-x-2">
                                 <span className="text-xs text-gray-400 mr-2">{useAgent ? 'Agent denkt & sucht...' : 'Warte auf Antwort...'}</span>
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
                    <Tooltip text="Aktiviert den autonomen Agenten-Modus (Langsamer, aber gründlicher durch Datenbank-Suche). Deaktivieren für schnellen Chat.">
                        <label className="flex items-center space-x-2 cursor-pointer w-fit">
                            <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="agent-toggle" checked={useAgent} onChange={(e) => setUseAgent(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600"/>
                                <label htmlFor="agent-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${useAgent ? 'bg-indigo-600' : 'bg-gray-600'}`}></label>
                            </div>
                            <span className={`text-xs font-bold ${useAgent ? 'text-indigo-400' : 'text-gray-400'}`}>Agenten-Modus</span>
                        </label>
                    </Tooltip>

                    <Tooltip text="Google Search für externe Fakten.">
                        <label className="flex items-center space-x-2 cursor-pointer w-fit">
                             <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="grounding-toggle" checked={useGrounding} onChange={(e) => setUseGrounding(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-500"/>
                                <label htmlFor="grounding-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${useGrounding ? 'bg-blue-500' : 'bg-gray-600'}`}></label>
                            </div>
                            <span className={`text-xs font-bold ${useGrounding ? 'text-blue-400' : 'text-gray-400'}`}>Grounding</span>
                        </label>
                    </Tooltip>
                </div>
            </div>
             <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #68D391; }
                .toggle-checkbox:checked + .toggle-label { background-color: #68D391; }
            `}</style>
        </div>
    );
};

export default AnalysisTab;
