import React from 'react';
import type { ActiveTab } from '../../types';
import Icon from './Icon';

/**
 * Props for the SidebarNav component.
 */
interface SidebarNavProps {
    /** The currently active tab, which should be one of the IDs from `navItems`. */
    activeTab: ActiveTab;
    /** Function to set the active tab. */
    setActiveTab: (tab: ActiveTab) => void;
}

/**
 * An array of navigation item objects that define the structure of the sidebar.
 * The `as const` assertion is used to infer the literal types for `item.id`,
 * ensuring type safety when using it with the `ActiveTab` type.
 */
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'documents', label: 'Documents', icon: 'documents' },
    { id: 'entities', label: 'Entities', icon: 'entities' },
    { id: 'chronology', label: 'Chronology', icon: 'chronology' },
    { id: 'knowledge', label: 'Knowledge Base', icon: 'knowledge' },
    { id: 'graph', label: 'Relationship Graph', icon: 'graph' },
    { id: 'analysis', label: 'Analysis', icon: 'analysis' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'generation', label: 'Generation', icon: 'generation' },
    { id: 'library', label: 'Library', icon: 'library' },
    { id: 'dispatch', label: 'Dispatch', icon: 'dispatch' },
    { id: 'strategy', label: 'Strategy', icon: 'strategy' },
    { id: 'kpis', label: 'KPIs', icon: 'kpis' },
    { id: 'un-submissions', label: 'UN Submissions', icon: 'un' },
    { id: 'hrd-support', label: 'HRD Support', icon: 'hrd' },
    { id: 'legal-basis', label: 'Legal Basis', icon: 'legal' },
    { id: 'ethics', label: 'Ethics Analysis', icon: 'ethics' },
    { id: 'contradictions', label: 'Contradictions', icon: 'contradictions' },
    { id: 'agents', label: 'Agents', icon: 'agents' },
    { id: 'audit', label: 'Audit Log', icon: 'audit' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
] as const;

/**
 * The main sidebar navigation component for the application.
 * It displays a list of clickable tabs to switch between different views.
 * @param {SidebarNavProps} props - The props for the component.
 */
const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="w-64 bg-gray-800 p-2 flex flex-col flex-shrink-0">
            <div className="p-2 mb-2">
                <h2 className="text-lg font-bold text-white">MRV Assistant</h2>
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
