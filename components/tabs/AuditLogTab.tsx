import React from 'react';
import React from 'react';
import type { AuditLogEntry, AgentActivity } from '../../types';

/**
 * Props for the AuditLogTab component.
 */
interface AuditLogTabProps {
    /** A log of user-initiated actions. */
    auditLog: AuditLogEntry[];
    /** A log of AI agent-initiated actions. */
    agentActivityLog: AgentActivity[];
}

/**
 * A UI component that displays a combined, time-sorted log of all user and system actions.
 * This provides a comprehensive and immutable record for transparency and traceability.
 * @param {AuditLogTabProps} props - The props for the component.
 */
const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditLog, agentActivityLog }) => {
    // Combine user and agent logs into a single feed, adding a 'type' property to distinguish them.
    const combinedLog = [
        ...auditLog.map(log => ({ ...log, type: 'user' as const })),
        ...agentActivityLog.map(log => ({ 
            id: log.id,
            timestamp: log.timestamp,
            type: 'agent' as const, 
            action: log.agentName, // The "actor" is the agent's name
            details: `${log.action} (${log.result})` // The details describe what the agent did
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Audit Log</h1>
            <p className="text-gray-400">An immutable log of all important user and system actions to ensure transparency and traceability.</p>
            
            <div className="bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Timestamp</th>
                            <th scope="col" className="px-6 py-3">Type</th>
                            <th scope="col" className="px-6 py-3">Actor/Action</th>
                            <th scope="col" className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedLog.map(log => (
                            <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.type === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                        {log.type === 'user' ? 'User' : 'Agent'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                                <td className="px-6 py-4 text-gray-400">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {combinedLog.length === 0 && (
                    <p className="text-center py-8 text-gray-500">No activities have been logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default AuditLogTab;
