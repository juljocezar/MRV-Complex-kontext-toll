import React from 'react';
import type { ActiveTab } from '../../types';
import Icon from './Icon';

interface SidebarNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

// FIX: Use 'as const' to infer literal types for item.id, making it assignable to ActiveTab.
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'documents', label: 'Dokumente', icon: 'documents' },
    { id: 'entities', label: 'Stammdaten', icon: 'entities' },
    { id: 'chronology', label: 'Chronologie', icon: 'chronology' },
    { id: 'knowledge', label: 'Wissensbasis', icon: 'knowledge' },
    { id: 'graph', label: 'Beziehungs-Graph', icon: 'graph' },
    { id: 'analysis', label: 'Analyse', icon: 'analysis' },
    { id: 'reports', label: 'Berichte', icon: 'reports' },
    { id: 'generation', label: 'Generierung', icon: 'generation' },
    { id: 'library', label: 'Bibliothek', icon: 'library' },
    { id: 'dispatch', label: 'Versand', icon: 'dispatch' },
    { id: 'strategy', label: 'Strategie', icon: 'strategy' },
    { id: 'kpis', label: 'KPIs', icon: 'kpis' },
    { id: 'un-submissions', label: 'UN Einreichungen', icon: 'un' },
    { id: 'hrd-support', label: 'HRD Support', icon: 'hrd' },
    { id: 'legal-basis', label: 'Rechtsgrundlagen', icon: 'legal' },
    { id: 'ethics', label: 'Ethik-Analyse', icon: 'ethics' },
    { id: 'contradictions', label: 'Widersprüche', icon: 'contradictions' },
    { id: 'agents', label: 'Agenten', icon: 'agents' },
    { id: 'audit', label: 'Audit Log', icon: 'audit' },
    { id: 'settings', label: 'Einstellungen', icon: 'settings' },
] as const;

const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-64 bg-gray-800 p-2 flex flex-col flex-shrink-0">
            <div className="p-2 mb-2">
                <h2 className="text-lg font-bold text-white">MRV-Assistent</h2>
            </div>
            <ul className="space-y-1 overflow-y-auto">
                {navItems.map(item => (
                    <li key={item.id}>
                        <button 
                            onClick={() => setActiveTab(item.id)} 
                            className={`w-full text-left flex items-center p-2 rounded text-sm transition-colors ${
                                activeTab === item.id 
                                ? 'bg-blue-600 text-white' 
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                           <Icon name={item.icon} className="mr-3 h-5 w-5" />
                           {item.label}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SidebarNav;
