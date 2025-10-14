import React from 'react';
import type { ActiveTab } from '../../types';
import Icon from './Icon';

interface SidebarNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const navGroups = [
    {
        title: 'GRUNDLAGEN',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
            { id: 'documents', label: 'Dokumente', icon: 'documents' },
            { id: 'entities', label: 'Stammdaten', icon: 'entities' },
            { id: 'chronology', label: 'Chronologie', icon: 'chronology' },
        ]
    },
    {
        title: 'ANALYSE',
        items: [
            { id: 'analysis', label: 'Analyse-Zentrum', icon: 'analysis' },
            { id: 'knowledge', label: 'Wissensbasis', icon: 'knowledge' },
            { id: 'graph', label: 'Beziehungs-Graph', icon: 'graph' },
            { id: 'strategy', label: 'Strategie', icon: 'strategy' },
            { id: 'argumentation', label: 'Argumentation', icon: 'argumentation' },
            { id: 'contradictions', label: 'Widersprüche', icon: 'contradictions' },
            { id: 'ethics', label: 'Ethik-Analyse', icon: 'ethics' },
        ]
    },
    {
        title: 'ERSTELLUNG',
        items: [
            { id: 'schnellerfassung', label: 'Schnellerfassung', icon: 'capture' },
            { id: 'generation', label: 'Generierung', icon: 'generation' },
            { id: 'reports', label: 'Berichte', icon: 'reports' },
            { id: 'library', label: 'Bibliothek', icon: 'library' },
            { id: 'dispatch', label: 'Versand', icon: 'dispatch' },
        ]
    },
    {
        title: 'WERKZEUGE',
        items: [
            { id: 'kpis', label: 'KPIs', icon: 'kpis' },
            { id: 'un-submissions', label: 'UN Einreichungen', icon: 'un' },
            { id: 'hrd-support', label: 'HRD Support', icon: 'hrd' },
            { id: 'legal-basis', label: 'Rechtsgrundlagen', icon: 'legal' },
        ]
    },
    {
        title: 'SYSTEM',
        items: [
            { id: 'agents', label: 'Agenten', icon: 'agents' },
            { id: 'audit', label: 'Audit Log', icon: 'audit' },
            { id: 'architecture-analysis', label: 'Architektur-Analyse', icon: 'analysis' },
            { id: 'status', label: 'Status Quo', icon: 'reports' },
            { id: 'settings', label: 'Einstellungen', icon: 'settings' },
        ]
    }
] as const;


const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-64 bg-gray-800 p-2 flex flex-col flex-shrink-0">
            <div className="p-2 mb-2">
                <h2 className="text-lg font-bold text-white">MRV-Assistent</h2>
            </div>
            <ul className="space-y-1 overflow-y-auto">
                {navGroups.map(group => (
                    <React.Fragment key={group.title}>
                        {group.title && (
                             <li className="px-2 pt-4 pb-1">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{group.title}</h3>
                            </li>
                        )}
                        {group.items.map(item => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left flex items-center p-2 rounded text-sm transition-colors ${
                                        activeTab === item.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                <Icon name={item.icon} className="mr-3 h-5 w-5 flex-shrink-0" />
                                <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </React.Fragment>
                ))}
            </ul>
        </nav>
    );
};

export default SidebarNav;