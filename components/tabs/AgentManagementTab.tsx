import React from 'react';
import { MRV_AGENTS } from '../../constants';
import type { AgentProfile, AgentActivity } from '../../types';

/**
 * Props for the AgentManagementTab component.
 */
interface AgentManagementTabProps {
    /** A log of all agent activities performed in the session. */
    agentActivityLog: AgentActivity[];
}

/**
 * A UI component that serves as the "Agent Management" tab.
 * It displays profiles for all available AI agents and a detailed log of their activities.
 * @param {AgentManagementTabProps} props - The props for the component.
 */
const AgentManagementTab: React.FC<AgentManagementTabProps> = ({ agentActivityLog }) => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Agent Management</h1>
            
            <h2 className="text-2xl font-semibold text-gray-300">Available Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(MRV_AGENTS).map((agent: AgentProfile) => (
                    <div key={agent.name} className="bg-gray-800 p-6 rounded-lg shadow flex flex-col">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <span className="text-2xl mr-3">{agent.icon}</span>
                                {agent.name}
                            </h3>
                            <p className="text-sm text-blue-400 font-semibold">{agent.role}</p>
                            <p className="text-gray-400 mt-2 text-sm">{agent.description}</p>
                        </div>
                        <div className="mt-4 border-t border-gray-700 pt-4">
                            <h4 className="text-xs uppercase text-gray-500 font-bold">System Prompt</h4>
                            <p className="text-xs italic text-gray-400 mt-1">"{agent.systemPrompt}"</p>
                        </div>
                        <div className="mt-4 flex-grow flex flex-col justify-end">
                            <h4 className="text-xs uppercase text-gray-500 font-bold">Capabilities</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {agent.capabilities.map(cap => (
                                    <span key={cap} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">{cap}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-300 mt-8">Activity Log</h2>
             <div className="bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Agent</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                            <th scope="col" className="px-6 py-3">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agentActivityLog.slice().reverse().map(log => (
                            <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 font-medium text-white">{log.agentName}</td>
                                <td className="px-6 py-4">{log.action}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.result === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {log.result}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {agentActivityLog.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No agent activity has been logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default AgentManagementTab;
