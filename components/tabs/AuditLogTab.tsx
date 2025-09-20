import React from 'react';
import type { AuditLogEntry, AgentActivity } from '../../types';

/**
 * @interface AuditLogTabProps
 * @description Represents the props for the AuditLogTab component.
 * @description Stellt die Props für die AuditLogTab-Komponente dar.
 * @property {AuditLogEntry[]} auditLog - The log of user actions. / Das Protokoll der Benutzeraktionen.
 * @property {AgentActivity[]} agentActivityLog - The log of agent activities. / Das Protokoll der Agentenaktivitäten.
 */
interface AuditLogTabProps {
    auditLog: AuditLogEntry[];
    agentActivityLog: AgentActivity[];
}

/**
 * @component AuditLogTab
 * @description A tab component that displays a combined, immutable log of all important user and system actions.
 * @description Eine Tab-Komponente, die ein kombiniertes, unveränderliches Protokoll aller wichtigen Benutzer- und Systemaktionen anzeigt.
 * @param {AuditLogTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered audit log tab. / Der gerenderte Audit-Log-Tab.
 */
const AuditLogTab: React.FC<AuditLogTabProps> = ({ auditLog, agentActivityLog }) => {
    const combinedLog = [
        ...auditLog.map(log => ({ ...log, type: 'user' })),
        ...agentActivityLog.map(log => ({ 
            ...log, 
            type: 'agent', 
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
