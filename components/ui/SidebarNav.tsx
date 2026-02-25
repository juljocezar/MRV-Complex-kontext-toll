
import React from 'react';
import type { ActiveTab } from '../../types';
import Icon from './Icon';

interface SidebarNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

const navGroups = [
    {
        title: 'Kern-System',
        items: [
            { id: 'dashboard', label: 'Zentrale', icon: 'dashboard' },
            { id: 'documents', label: 'Archiv', icon: 'documents' },
            { id: 'entities', label: 'Entitäten', icon: 'entities' },
            { id: 'knowledge', label: 'Wissen', icon: 'knowledge' },
            { id: 'chronology', label: 'Zeitachse', icon: 'chronology' },
            { id: 'graph', label: 'Netzwerk-Graph', icon: 'graph' },
        ]
    },
    {
        title: 'Forensik & Analyse',
        items: [
            { id: 'radbruch-check', label: 'Radbruch 4D', icon: 'audit' },
            { id: 'forensic-dossier', label: 'Beweis-Dossier', icon: 'audit' },
            { id: 'system-analysis', label: 'Systemdynamik', icon: 'graph' },
            { id: 'analysis', label: 'KI-Labor', icon: 'analysis' },
            { id: 'contradictions', label: 'Anomalien', icon: 'contradictions' },
        ]
    },
    {
        title: 'Strategie & Schutz',
        items: [
            { id: 'strategy', label: 'Risiko-Matrix', icon: 'strategy' },
            { id: 'hrd-support', label: 'HRD Sicherheit', icon: 'hrd' },
            { id: 'argumentation', label: 'Beweisführung', icon: 'argumentation' },
            { id: 'ethics', label: 'Ethik-Audit', icon: 'ethics' },
            { id: 'kpis', label: 'Erfolgs-KPIs', icon: 'kpis' },
        ]
    },
    {
        title: 'Output & Ressourcen',
        items: [
            { id: 'un-submissions', label: 'UN-Beschwerden', icon: 'un' },
            { id: 'generation', label: 'Generator', icon: 'generation' },
            { id: 'reports', label: 'Berichte', icon: 'reports' },
            { id: 'dispatch', label: 'Transfer', icon: 'dispatch' },
            { id: 'library', label: 'Bibliothek', icon: 'library' },
            { id: 'legal-basis', label: 'Rechtsquellen', icon: 'legal' },
        ]
    },
    {
        title: 'System & Meta',
        items: [
            { id: 'agents', label: 'KI-Agenten', icon: 'agents' },
            { id: 'audit', label: 'Audit Log', icon: 'audit' },
        ]
    }
] as const;

const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-white text-xl">🛡️</span>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-tight">MRV ASSISTANT</h2>
                        <span className="text-[10px] text-slate-500 font-mono">v2.6.0 PRO</span>
                    </div>
                </div>
            </div>

            <ul className="flex-grow px-4 pb-6 space-y-8 overflow-y-auto custom-scrollbar">
                {navGroups.map(group => (
                    <li key={group.title}>
                        <h3 className="px-3 mb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    data-testid={`nav-${item.id}`}
                                    onClick={() => setActiveTab(item.id as ActiveTab)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                                        activeTab === item.id
                                        ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }`}
                                >
                                    <Icon 
                                        name={item.icon} 
                                        className={`h-4 w-4 transition-colors ${
                                            activeTab === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                                        }`} 
                                    />
                                    {item.label}
                                    {activeTab === item.id && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                        activeTab === 'settings' 
                        ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                    <Icon name="settings" className="h-4 w-4" />
                    Einstellungen
                </button>
            </div>
        </nav>
    );
};

export default SidebarNav;
