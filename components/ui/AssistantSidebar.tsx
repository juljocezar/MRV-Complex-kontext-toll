import React from 'react';
import type { AgentActivity, Insight } from '../../types';

interface AssistantSidebarProps {
    agentActivityLog: AgentActivity[];
    insights: Insight[];
    onGenerateInsights: () => void;
    isLoading: boolean;
    loadingSection: string;
}

const InsightIcon = ({ type }: { type: Insight['type'] }) => {
    switch (type) {
        case 'recommendation': return <span title="Empfehlung">💡</span>;
        case 'risk': return <span title="Risiko">⚠️</span>;
        case 'observation': return <span title="Beobachtung">👀</span>;
        default: return null;
    }
};

const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ agentActivityLog, insights, onGenerateInsights, isLoading, loadingSection }) => {
    return (
        <aside className="w-72 bg-gray-800 flex-shrink-0 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">Assistent</h3>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {/* Insights Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-gray-300">Strategische Einblicke</h4>
                        <button 
                            onClick={onGenerateInsights}
                            disabled={isLoading && loadingSection === 'insights'}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs disabled:bg-gray-500"
                            title="Neue Einblicke generieren"
                        >
                            {isLoading && loadingSection === 'insights' ? '...' : 'Neu'}
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
                        {insights.length === 0 && (
                            <div className="text-center text-gray-500 text-xs py-4">
                                Keine Einblicke generiert.
                            </div>
                        )}
                    </div>
                </div>


                {/* Activity Log Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Agenten-Aktivität</h4>
                     <div className="space-y-2">
                        {agentActivityLog.slice(0, 10).reverse().map(log => (
                            <div key={log.id} className="text-xs p-2 rounded-md bg-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-200">{log.agentName}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${log.result === 'erfolg' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {log.result}
                                    </span>
                                </div>
                                <p className="text-gray-400">{log.action}</p>
                                <p className="text-right text-gray-500 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                        ))}
                        {agentActivityLog.length === 0 && (
                            <div className="text-center text-gray-500 text-xs py-4">
                                Noch keine Agenten-Aktivität.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AssistantSidebar;