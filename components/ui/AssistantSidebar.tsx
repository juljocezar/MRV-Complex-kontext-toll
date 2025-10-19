import React, { useState, useEffect, useRef } from 'react';
import { useCopilot, CopilotMessage } from '../../hooks/useCopilot';
import { ASTRAEA_ZERO_PROMPT } from '../../constants';
import type { AppState, AgentActivity, Insight } from '../../types';

// Co-Pilot Chat Component
const CopilotChat: React.FC<{ appState: AppState; onAddTask: (description: string, priority: 'low' | 'medium' | 'high') => void; }> = ({ appState, onAddTask }) => {
    const handleToolCall = (toolName: string, parameters: any) => {
        switch (toolName) {
            case 'addTask':
                if (parameters.description) {
                    onAddTask(parameters.description, parameters.priority || 'medium');
                }
                break;
            default:
                console.warn(`Unknown tool called: ${toolName}`);
        }
    };

    const { isConnected, isLoading, chatHistory, connect, disconnect, sendMessage } = useCopilot(appState, handleToolCall);
    const [message, setMessage] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom of chat
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = () => {
        if (message.trim()) {
            sendMessage(message);
            setMessage('');
        }
    };

    const handleConnect = () => {
        if (appState.settings.ai.apiKey) {
            connect(appState.settings.ai.apiKey, ASTRAEA_ZERO_PROMPT);
        } else {
            alert("Bitte geben Sie zuerst Ihren Gemini API Schlüssel in den Einstellungen ein.");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2" ref={chatContainerRef}>
                <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                         <div className="flex justify-start">
                             <div className="max-w-xs lg:max-w-sm px-3 py-2 rounded-lg bg-gray-700 text-gray-200 animate-pulse">
                                ...
                             </div>
                         </div>
                    )}
                </div>
            </div>
            <div className="mt-4 flex-shrink-0">
                {isConnected ? (
                    <>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                placeholder="Nachricht an Astraea..."
                                className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md disabled:bg-gray-500">Senden</button>
                        </div>
                         <button onClick={disconnect} className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-2">Verbindung trennen</button>
                    </>
                ) : (
                    <button onClick={handleConnect} disabled={isLoading} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md disabled:bg-gray-500">
                        {isLoading ? 'Verbinde...' : 'Co-Pilot verbinden'}
                    </button>
                )}
            </div>
        </div>
    );
};


const InsightIcon = ({ type }: { type: Insight['type'] }) => {
    switch (type) {
        case 'recommendation': return <span title="Empfehlung">💡</span>;
        case 'risk': return <span title="Risiko">⚠️</span>;
        case 'observation': return <span title="Beobachtung">👀</span>;
        default: return null;
    }
};

interface AssistantSidebarProps {
    appState: AppState;
    agentActivityLog: AgentActivity[];
    insights: Insight[];
    onGenerateInsights: () => void;
    onAddTask: (description: string, priority: 'low' | 'medium' | 'high') => void;
}

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ appState, agentActivityLog, insights, onGenerateInsights, onAddTask }) => {
    const [mode, setMode] = useState<'insights' | 'copilot'>('insights');

    return (
        <aside className="w-80 bg-gray-800 flex-shrink-0 border-l border-gray-700 flex flex-col">
            <div className="p-2 border-b border-gray-700">
                <div className="flex justify-center rounded-md bg-gray-900/50 p-1">
                    <button onClick={() => setMode('insights')} className={`w-full px-3 py-1 text-sm font-semibold rounded-md ${mode === 'insights' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Einblicke</button>
                    <button onClick={() => setMode('copilot')} className={`w-full px-3 py-1 text-sm font-semibold rounded-md ${mode === 'copilot' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Co-Pilot</button>
                </div>
            </div>

            <div className={`flex-grow overflow-y-auto p-4 ${mode === 'insights' ? 'space-y-4' : ''}`}>
                {mode === 'insights' && (
                    <>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold text-gray-300">Strategische Einblicke</h4>
                                <button onClick={onGenerateInsights} disabled={appState.isLoading && appState.loadingSection === 'insights'} className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs disabled:bg-gray-500" title="Neue Einblicke generieren">
                                    {appState.isLoading && appState.loadingSection === 'insights' ? '...' : 'Neu'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {insights.slice(0, 5).map(insight => (
                                     <div key={insight.id} className="text-xs p-2 rounded-md bg-indigo-900/40 border border-indigo-700/50">
                                       <div className="flex items-start">
                                            <span className="mr-2 pt-0.5"><InsightIcon type={insight.type} /></span>
                                            <p className="text-gray-300">{insight.text}</p>
                                       </div>
                                     </div>
                                ))}
                                {insights.length === 0 && <div className="text-center text-gray-500 text-xs py-4">Keine Einblicke generiert.</div>}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Agenten-Aktivität</h4>
                             <div className="space-y-2">
                                {agentActivityLog.slice(0, 10).reverse().map(log => (
                                    <div key={log.id} className="text-xs p-2 rounded-md bg-gray-700/50">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-200">{log.agentName}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${log.result === 'erfolg' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{log.result}</span>
                                        </div>
                                        <p className="text-gray-400">{log.action}</p>
                                        <p className="text-right text-gray-500 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                ))}
                                {agentActivityLog.length === 0 && <div className="text-center text-gray-500 text-xs py-4">Noch keine Agenten-Aktivität.</div>}
                            </div>
                        </div>
                    </>
                )}
                {mode === 'copilot' && (
                    <CopilotChat appState={appState} onAddTask={onAddTask} />
                )}
            </div>
        </aside>
    );
};

export default AssistantSidebar;