import React from 'react';
// Fix: Corrected import path for types.
import type { AuditLogEntry, AgentActivity } from '../../types';

/**
 * @interface AuditLogTabProps
 * @description Props for the AuditLogTab component.
 * @property {AuditLogEntry[]} auditLog - An array of user audit log entries.
 * @property {AgentActivity[]} agentActivityLog - An array of agent activity log entries.
 */
interface AuditLogTabProps {
    auditLog: AuditLogEntry[];
    agentActivityLog: AgentActivity[];
}

/**
 * @component AuditLogTab
 * @description A tab that displays a combined, chronological log of all important user and system (agent) actions.
 * @param {AuditLogTabProps} props The props for the component.
 * @returns {React.FC<AuditLogTabProps>} The rendered audit log tab.
 */
const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditLog, agentActivityLog }) => {
    const combinedLog = [
        ...auditLog.map(log => ({ ...log, type: 'user' as const })),
        ...agentActivityLog.map(log => ({ 
            id: log.id,
            timestamp: log.timestamp,
            type: 'agent' as const, 
            action: log.agentName, 
            details: `${log.action} (${log.result})` 
        }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Audit Log</h1>
            <p className="text-gray-400">Ein unveränderliches Protokoll aller wichtigen Benutzer- und Systemaktionen zur Gewährleistung von Transparenz und Nachvollziehbarkeit.</p>
            
            <div className="bg-gray-800 rounded-lg shadow">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Zeitstempel</th>
                            <th scope="col" className="px-6 py-3">Typ</th>
                            <th scope="col" className="px-6 py-3">Akteur/Aktion</th>
                            <th scope="col" className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinedLog.map(log => (
                            <tr key={log.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${log.type === 'user' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                        {log.type === 'user' ? 'Benutzer' : 'Agent'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                                <td className="px-6 py-4 text-gray-400">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {combinedLog.length === 0 && (
                    <p className="text-center py-8 text-gray-500">Noch keine Aktivitäten protokolliert.</p>
                )}
            </div>
        </div>
    );
};

export default AuditLogTab;
