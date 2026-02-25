
import React, { useMemo, useRef, useState } from 'react';
import { AppState, ActiveTab, Notification } from '../../types';
import { DashboardService } from '../../services/dashboardService';
import SimpleDonutChart from '../ui/charts/SimpleDonutChart';
import RadarChart from '../ui/charts/RadarChart'; // NEU
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';
import Icon from '../ui/Icon';
import { ExportService } from '../../services/exportService';

interface DashboardTabProps {
    appState: AppState;
    setCaseDescription: (desc: string) => void;
    setActiveTab: (tab: ActiveTab) => void;
    onResetCase: () => void;
    onExportCase: () => void;
    onImportCase: (file: File) => void;
    onPerformOverallAnalysis: () => void;
    addNotification: (message: string, type?: Notification['type'], duration?: number, details?: string) => void;
    onViewDocumentDetails: (docId: string) => void;
    onAddTasks?: (tasks: string[]) => void;
}

const MetricCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtext?: string; 
    icon?: string; 
    colorClass?: string; 
    trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtext, icon, colorClass = "text-white", trend }) => (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-sm flex items-start justify-between relative overflow-hidden group">
        <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <h3 className={`text-2xl font-black ${colorClass}`}>{value}</h3>
            {subtext && <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>}
        </div>
        {icon && (
            <div className={`text-2xl opacity-20 group-hover:opacity-40 transition-opacity ${colorClass}`}>
                <Icon name={icon} />
            </div>
        )}
        {trend && (
            <div className={`absolute bottom-2 right-2 text-xs font-bold ${trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                {trend === 'up' ? '▲' : '▼'}
            </div>
        )}
    </div>
);

const DashboardTab: React.FC<DashboardTabProps> = ({
    appState, setCaseDescription, setActiveTab,
    onResetCase, onExportCase, onImportCase, onPerformOverallAnalysis, addNotification,
    onViewDocumentDetails, onAddTasks
}) => {
    const { documents, caseSummary, isLoading, loadingSection, caseEntities } = appState;
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // --- CALCULATE LIVE METRICS ---
    const metrics = useMemo(() => DashboardService.calculateMetrics(appState), [appState]);

    const handleImportClick = () => importInputRef.current?.click();
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onImportCase(file);
    };

    // --- ZERO STATE ---
    if (documents.length === 0 && caseEntities.length === 0) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Willkommen im MRV-Assistent</h1>
                    <div className="flex gap-2">
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                        <button onClick={handleImportClick} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm border border-gray-600">
                            Vorhandenen Fall importieren
                        </button>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-2xl p-12 text-center shadow-2xl">
                    <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <span className="text-5xl">📂</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Fallakte anlegen</h2>
                    <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg">
                        Laden Sie Prozessakten, Berichte oder Korrespondenz hoch. Die KI extrahiert automatisch forensische Daten gemäß HURIDOCS ESF-Standard.
                    </p>
                    <button onClick={() => setActiveTab('documents')} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 text-lg flex items-center mx-auto gap-3">
                        <span>Erstes Dokument hochladen</span> <span>→</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- MISSION CONTROL DASHBOARD ---
    return (
        <div className="space-y-6">
            
            {/* Header Area */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Mission Control</h1>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                        Zuletzt aktualisiert: {new Date().toLocaleTimeString()} | Fall-ID: {appState.caseContext.caseDescription.substring(0, 8) || 'NEU'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="relative inline-block text-left">
                        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-bold border border-gray-700 flex items-center gap-2">
                            <span>📤 Export</span>
                        </button>
                        {isExportMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-20 border border-gray-700">
                                <div className="py-1">
                                    <button onClick={() => { onExportCase(); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700">Gesamten Fall (.json)</button>
                                    <button onClick={() => { ExportService.exportEntitiesToCSV(caseEntities); setIsExportMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-700">Entitäten (.csv)</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={onResetCase} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-xs font-bold border border-red-900/50">
                        Reset
                    </button>
                </div>
            </div>

            {/* LEVEL 1: HEAD-UP DISPLAY (KPIs) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Bedrohungslage" 
                    value={metrics.hrdThreatLevel} 
                    icon="hrd" 
                    colorClass={metrics.hrdThreatLevel === 'Critical' ? 'text-red-500' : metrics.hrdThreatLevel === 'High' ? 'text-orange-500' : 'text-green-500'}
                    subtext="HRD Risk Assessment"
                />
                <MetricCard 
                    title="Phantom Index Ø" 
                    value={metrics.avgPhantomIndex} 
                    icon="audit" 
                    colorClass={metrics.avgPhantomIndex > 50 ? 'text-red-400' : 'text-blue-400'}
                    subtext="Staatliche Willkür (Radbruch)"
                />
                <MetricCard 
                    title="Kritische Events" 
                    value={metrics.criticalOpenEvents} 
                    icon="contradictions" 
                    colorClass="text-yellow-400"
                    trend={metrics.criticalOpenEvents > 0 ? 'up' : 'neutral'}
                    subtext="Offene Eskalationen"
                />
                <MetricCard 
                    title="Beweisdichte" 
                    value={`${metrics.evidenceCompleteness}%`} 
                    icon="documents" 
                    colorClass={metrics.evidenceCompleteness < 50 ? 'text-red-400' : 'text-green-400'}
                    subtext="Acts mit Quellen belegt"
                />
            </div>

            {/* LEVEL 2: ANALYSIS & PATTERNS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[420px]">
                
                {/* 2A: Geo & Temporal Hotspots (Main View) */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex justify-between">
                        <span>Fokus: Zeit & Raum</span>
                        <span className="text-xs text-blue-400 cursor-pointer hover:underline" onClick={() => setActiveTab('chronology')}>Zur Zeitachse →</span>
                    </h3>
                    
                    <div className="flex-grow grid grid-cols-2 gap-6">
                        {/* Geo Hotspots List (Pseudo-Map) */}
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 text-6xl">🌍</div>
                            <h4 className="text-gray-300 font-bold mb-3 text-xs uppercase">Geo-Hotspots (Impunity Heatmap)</h4>
                            <div className="space-y-2">
                                {metrics.geoHotspots.map((geo, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-800/80 rounded border-l-2 border-red-500">
                                        <span className="text-gray-200 font-medium">{geo.location}</span>
                                        <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{geo.count} Events</span>
                                    </div>
                                ))}
                                {metrics.geoHotspots.length === 0 && <p className="text-xs text-gray-500 italic">Keine Geodaten verfügbar.</p>}
                            </div>
                        </div>

                        {/* Top Violations Chart */}
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                            <h4 className="text-gray-300 font-bold mb-3 text-xs uppercase">Häufigste Verletzungen (ESF)</h4>
                            <div className="space-y-3">
                                {metrics.topViolatedRights.map((r, i) => (
                                    <div key={i} className="relative pt-1">
                                        <div className="flex mb-2 items-center justify-between">
                                            <span className="text-xs font-semibold inline-block text-gray-300 truncate max-w-[150px]">{r.rightName}</span>
                                            <span className="text-xs font-semibold inline-block text-gray-400">{r.count}</span>
                                        </div>
                                        <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded bg-gray-700">
                                            <div style={{ width: `${(r.count / Math.max(...metrics.topViolatedRights.map(x=>x.count))) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                                        </div>
                                    </div>
                                ))}
                                {metrics.topViolatedRights.length === 0 && <p className="text-xs text-gray-500 italic">Keine Acts klassifiziert.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2B: Radbruch Radar (Forensic) */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center justify-center relative">
                    <h3 className="absolute top-6 left-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
                        Rechtsstaatlichkeits-Radar
                    </h3>
                    <div className="mt-8">
                        <RadarChart 
                            data={[
                                { label: 'Transparenz (D1)', value: metrics.radbruchDimensions.d1, fullMark: 10 },
                                { label: 'Haftung (D2)', value: metrics.radbruchDimensions.d2, fullMark: 10 },
                                { label: 'Datenqualität (D3)', value: metrics.radbruchDimensions.d3, fullMark: 10 },
                                { label: 'Wahrheitsrecht (D4)', value: metrics.radbruchDimensions.d4, fullMark: 10 },
                            ]}
                            size={240}
                            color="#818cf8"
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500">Niedrige Werte deuten auf systemische Willkür hin.</p>
                        <button onClick={() => setActiveTab('radbruch-check')} className="mt-2 text-xs text-indigo-400 hover:underline">Zum Forensik-Check →</button>
                    </div>
                </div>
            </div>

            {/* LEVEL 3: OPERATIVE & LISTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* AI Summary Section */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-white">KI-Fallzusammenfassung</h3>
                         <Tooltip text="Führt eine KI-basierte Gesamtanalyse des Falls durch.">
                            <button
                                onClick={onPerformOverallAnalysis}
                                disabled={isLoading && loadingSection === 'case_analysis'}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs disabled:bg-gray-600 flex items-center justify-center font-bold"
                            >
                                {isLoading && loadingSection === 'case_analysis' ? <LoadingSpinner className="h-3 w-3 mr-2" /> : '🔄 Update'}
                            </button>
                        </Tooltip>
                    </div>
                    <div className="flex-grow bg-gray-900/50 rounded-md p-4 max-h-[200px] overflow-y-auto custom-scrollbar border border-gray-600/30">
                        {caseSummary ? (
                            <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
                                <p>{caseSummary.summary}</p>
                                <div className="mt-2 pt-2 border-t border-gray-700/50">
                                    <span className="text-xs font-bold text-red-400">Identifizierte Risiken:</span>
                                    <ul className="list-disc list-inside text-xs text-gray-400 mt-1">
                                        {(caseSummary?.identifiedRisks || []).slice(0, 3).map((r, i) => <li key={i}>{r.risk}</li>)}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                 <p className="text-sm">Keine Zusammenfassung verfügbar.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Evidence Gap / To-Do */}
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-3">Dossier-Status & Aufgaben</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Dossier-Reife</span>
                                <span>{metrics.dossierStatus.final > 0 ? 'Bereit' : 'In Arbeit'}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${metrics.evidenceCompleteness}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">{metrics.evidenceCompleteness}% der Acts sind mit Quellen belegt.</p>
                        </div>

                        <div className="bg-gray-900/30 rounded p-3 border border-gray-700/50">
                            <h4 className="text-xs font-bold text-blue-300 mb-2">Nächste Schritte</h4>
                            <ul className="space-y-2">
                                {metrics.criticalOpenEvents > 0 && (
                                    <li className="flex items-center gap-2 text-xs text-red-300">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        {metrics.criticalOpenEvents} kritische Events priorisieren
                                    </li>
                                )}
                                {metrics.evidenceCompleteness < 80 && (
                                    <li className="flex items-center gap-2 text-xs text-orange-300">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                        Beweislücken schließen (Informationen verknüpfen)
                                    </li>
                                )}
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                    {metrics.openTasksCount} offene Aufgaben im Task-Manager
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardTab;
