import React from 'react';
import type { AgentActivity, Insight } from '../../types';

/**
 * Props for the AssistantSidebar component.
 */
interface AssistantSidebarProps {
    /** A log of recent agent activities. */
    agentActivityLog: AgentActivity[];
    /** A list of generated strategic insights. */
    insights: Insight[];
    /** Callback function to trigger the generation of new insights. */
    onGenerateInsights: () => void;
    /** A boolean indicating if a process is currently loading. */
    isLoading: boolean;
    /** A string to identify which section is currently loading (e.g., 'insights'). */
    loadingSection: string;
}

/**
 * A small component that displays an icon corresponding to an insight type.
 * @param {object} props - The component props.
 * @param {Insight['type']} props.type - The type of the insight.
 */
const InsightIcon = ({ type }: { type: Insight['type'] }) => {
    switch (type) {
        case 'recommendation': return <span title="Recommendation">💡</span>;
        case 'risk': return <span title="Risk">⚠️</span>;
        case 'observation': return <span title="Observation">👀</span>;
        default: return null;
    }
};

/**
 * The AssistantSidebar component displays strategic insights and a log of agent activities.
 * It provides a way for the user to see high-level information and track the system's actions.
 * @param {AssistantSidebarProps} props - The props for the component.
 */
const AssistantSidebar: React.FC<AssistantSidebarProps> = ({ agentActivityLog, insights, onGenerateInsights, isLoading, loadingSection }) => {
    return (
        <aside className="w-72 bg-gray-800 flex-shrink-0 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">Assistant</h3>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {/* Insights Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold text-gray-300">Strategic Insights</h4>
                        <button 
                            onClick={onGenerateInsights}
                            disabled={isLoading && loadingSection === 'insights'}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs disabled:bg-gray-500"
                            title="Generate new insights"
                        >
                            {isLoading && loadingSection === 'insights' ? '...' : 'New'}
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
                        {insights.length === 0 && !isLoading && (
                            <div className="text-center text-gray-500 text-xs py-4">
                                No insights generated.
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Log Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Agent Activity</h4>
                     <div className="space-y-2">
                        {agentActivityLog.slice(0, 10).reverse().map(log => (
                            <div key={log.id} className="text-xs p-2 rounded-md bg-gray-700/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-gray-200">{log.agentName}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${log.result === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {log.result}
                                    </span>
                                </div>
                                <p className="text-gray-400">{log.action}</p>
                                <p className="text-right text-gray-500 mt-1">{new Date(log.timestamp).toLocaleTimeString()}</p>
                            </div>
                        ))}
                        {agentActivityLog.length === 0 && (
                            <div className="text-center text-gray-500 text-xs py-4">
                                No agent activity yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default AssistantSidebar;
