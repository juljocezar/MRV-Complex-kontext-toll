import React, { useState } from 'react';
/**
 * Props for the KpisTab component.
 */
interface KpisTabProps {
    /** An array of Key Performance Indicators. */
    kpis: KPI[];
    /** Function to update the list of KPIs. */
    setKpis: React.Dispatch<React.SetStateAction<KPI[]>>;
    /** Callback function to trigger AI-powered KPI suggestions. */
    onSuggestKpis: () => void;
    /** A boolean indicating if a suggestion process is currently running. */
    isLoading: boolean;
}

/**
 * A UI component for managing and tracking Key Performance Indicators (KPIs).
 * It displays KPIs with progress bars, allows manual updates and additions,
 * and can trigger AI to suggest relevant KPIs.
 * @param {KpisTabProps} props - The props for the component.
 */
const KpisTab: React.FC<KpisTabProps> = ({ kpis, setKpis, onSuggestKpis, isLoading }) => {
    const [newKpi, setNewKpi] = useState({ name: '', target: '' });
    
    const handleProgressChange = (id: string, progress: number) => {
        setKpis(kpis.map(kpi => kpi.id === id ? { ...kpi, progress: Math.max(0, Math.min(100, progress)) } : kpi));
    };

    const handleAddKpi = (e: React.FormEvent) => {
        e.preventDefault();
        if (newKpi.name && newKpi.target) {
            setKpis(prev => [...prev, { ...newKpi, id: crypto.randomUUID(), progress: 0 }]);
            setNewKpi({ name: '', target: '' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Key Performance Indicators (KPIs)</h1>
                <button 
                    onClick={onSuggestKpis}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Loading...' : 'Suggest KPIs'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map(kpi => (
                    <div key={kpi.id} className="bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="font-semibold text-lg text-white">{kpi.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">Target: {kpi.target}</p>
                        
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
                    <h3 className="font-semibold text-lg text-white text-center mb-4">Add New KPI</h3>
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
                            placeholder="Target Description"
                            value={newKpi.target}
                            onChange={(e) => setNewKpi(prev => ({ ...prev, target: e.target.value }))}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                        <button type="submit" className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Add</button>
                    </form>
                </div>
            </div>
            
            {kpis.length === 0 && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">No KPIs defined.</p>
                </div>
            )}
        </div>
    );
};

export default KpisTab;
