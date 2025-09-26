
import React, { useState } from 'react';
// Fix: Corrected import path for types.
import { KPI } from '../../types';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * @interface KpisTabProps
 * @description Props for the KpisTab component.
 * @property {KPI[]} kpis - The list of Key Performance Indicators.
 * @property {(kpis: KPI[]) => void} onUpdateKpis - Callback to update the list of KPIs.
 * @property {() => void} onSuggestKpis - Callback to trigger AI-powered KPI suggestions.
 * @property {boolean} isLoading - Flag indicating if KPI suggestions are being loaded.
 */
interface KpisTabProps {
    kpis: KPI[];
    onUpdateKpis: (kpis: KPI[]) => void;
    onSuggestKpis: () => void;
    isLoading: boolean;
}

/**
 * @component KpisTab
 * @description A tab for defining and tracking Key Performance Indicators (KPIs) for the case.
 * Allows for manual creation, progress tracking, and AI-powered suggestions for relevant KPIs.
 * @param {KpisTabProps} props The props for the component.
 * @returns {React.FC<KpisTabProps>} The rendered KPIs tab.
 */
const KpisTab: React.FC<KpisTabProps> = ({ kpis, onUpdateKpis, onSuggestKpis, isLoading }) => {
    const [newKpi, setNewKpi] = useState({ name: '', target: '' });
    
    const handleProgressChange = (id: string, progress: number) => {
        onUpdateKpis(kpis.map(kpi => kpi.id === id ? { ...kpi, progress: Math.max(0, Math.min(100, progress)) } : kpi));
    };

    const handleAddKpi = (e: React.FormEvent) => {
        e.preventDefault();
        if (newKpi.name && newKpi.target) {
            onUpdateKpis([...kpis, { ...newKpi, id: crypto.randomUUID(), progress: 0 }]);
            setNewKpi({ name: '', target: '' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Key Performance Indicators (KPIs)</h1>
                <Tooltip text="Analysiert den Fallkontext und schlägt messbare Erfolgsindikatoren (KPIs) vor.">
                    <button 
                        onClick={onSuggestKpis}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner className="h-4 w-4 mr-2" />}
                        {isLoading ? 'Lade...' : 'KPIs vorschlagen'}
                    </button>
                </Tooltip>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map(kpi => (
                    <div key={kpi.id} className="bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="font-semibold text-lg text-white">{kpi.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">Ziel: {kpi.target}</p>
                        
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${kpi.progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-400">{kpi.progress}%</span>
                             <input 
                                type="number" 
                                value={kpi.progress}
                                onChange={(e) => handleProgressChange(kpi.id, parseInt(e.target.value))}
                                className="w-20 bg-gray-700 text-right p-1 rounded"
                            />
                        </div>
                    </div>
                ))}

                {/* Add new KPI form */}
                <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 p-6 rounded-lg flex flex-col justify-center">
                    <h3 className="font-semibold text-lg text-white text-center mb-4">Neuen KPI hinzufügen</h3>
                    <form onSubmit={handleAddKpi} className="space-y-3">
                        <input
                            type="text"
                            placeholder="KPI Name"
                            value={newKpi.name}
                            onChange={(e) => setNewKpi(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                         <input
                            type="text"
                            placeholder="Zielbeschreibung"
                            value={newKpi.target}
                            onChange={(e) => setNewKpi(prev => ({ ...prev, target: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                        <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Hinzufügen</button>
                    </form>
                </div>
            </div>
            
            {kpis.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Keine KPIs definiert.</p>
                </div>
            )}
        </div>
    );
};

export default KpisTab;
