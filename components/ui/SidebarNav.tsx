import React from 'react';
import type { ActiveTab } from '../../types';
import Icon from './Icon';

/**
 * @interface SidebarNavProps
 * @description Represents the props for the SidebarNav component.
 * @description Stellt die Props für die SidebarNav-Komponente dar.
 * @property {ActiveTab} activeTab - The currently active tab. / Der aktuell aktive Tab.
 * @property {(tab: ActiveTab) => void} setActiveTab - Function to set the active tab. / Funktion zum Setzen des aktiven Tabs.
 */
interface SidebarNavProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}

/**
 * @constant navItems
 * @description An array of navigation items for the sidebar.
 * @description Ein Array von Navigationselementen für die Seitenleiste.
 */
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { id: 'documents', label: 'Dokumente', icon: 'File' },
    { id: 'analysis', label: 'Analyse', icon: 'BarChart2' },
    { id: 'generation', label: 'Generator', icon: 'Zap' },
    { id: 'dispatch', label: 'Versand', icon: 'Send' },
    { id: 'chronology', label: 'Chronologie', icon: 'List' },
    { id: 'entities', label: 'Stammdaten', icon: 'Users' },
    { id: 'graph', label: 'Graph', icon: 'GitMerge' },
    { id: 'knowledge', label: 'Wissensbasis', icon: 'BrainCircuit' },
    { id: 'contradictions', label: 'Widersprüche', icon: 'AlertTriangle' },
    { id: 'strategy', label: 'Strategie', icon: 'HeartHandshake' },
    { id: 'kpis', label: 'KPIs', icon: 'Target' },
    { id: 'legal', label: 'Rechtsgrundlagen', icon: 'Gavel' },
    { id: 'un-submissions', label: 'UN-Eingaben', icon: 'Mail' },
    { id: 'ethics', label: 'Ethik-Analyse', icon: 'ShieldQuestion' },
    { id: 'library', label: 'Bibliothek', icon: 'Library' },
    { id: 'audit', label: 'Protokoll', icon: 'History' },
    { id: 'agents', label: 'Agenten', icon: 'Bot' },
    { id: 'settings', label: 'Einstellungen', icon: 'Settings' },
];

/**
 * @component SidebarNav
 * @description A navigation sidebar component for the application.
 * @description Eine Navigations-Seitenleisten-Komponente für die Anwendung.
 * @param {SidebarNavProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered sidebar navigation. / Die gerenderte Seitenleisten-Navigation.
 */
const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-64 bg-gray-800 flex-shrink-0 flex flex-col border-r border-gray-700">
            <div className="flex items-center justify-center h-16 border-b border-gray-700">
                <span className="text-white text-2xl font-bold">MRV</span>
            </div>
            <ul className="flex-grow overflow-y-auto">
                {navItems.map(item => (
                    <li key={item.id}>
                        <button
                            onClick={() => setActiveTab(item.id as ActiveTab)}
                            className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ${
                                activeTab === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            <Icon name={item.icon} className="mr-3 h-5 w-5" />
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default SidebarNav;