
import React, { useState } from 'react';
import type { SystemAnalysisResult } from '../../types';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SystemAnalysisTabProps {
    analysisResult: SystemAnalysisResult | null | undefined;
    onPerformAnalysis: (focusArea: string) => void;
    isLoading: boolean;
}

const SystemAnalysisTab: React.FC<SystemAnalysisTabProps> = ({ analysisResult, onPerformAnalysis, isLoading }) => {
    const [focusArea, setFocusArea] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <span className="text-4xl">🌐</span> System- & Gesellschaftsanalyse
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Untersuchen Sie die tiefenwirksame Systemdynamik und deren Auswirkungen auf das gesellschaftliche Gefüge basierend auf der Aktenlage.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Fokus der Systemanalyse setzen</h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={focusArea}
                        onChange={(e) => setFocusArea(e.target.value)}
                        placeholder="Optional: Fokus z.B. 'Ökonomische Abhängigkeiten', 'Auswirkung auf Bildung', 'Langzeitfolgen'..."
                        className="flex-grow bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Tooltip text="Startet den System-Dynamik-Forscher (Agent). Dieser Prozess nutzt maximale KI-Denkleistung (Reasoning) zur Mustererkennung.">
                        <button
                            onClick={() => onPerformAnalysis(focusArea)}
                            disabled={isLoading}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md disabled:bg-gray-500 flex items-center justify-center min-w-[220px]"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="h-5 w-5 mr-2" />
                                    Analysiere Dynamik...
                                </>
                            ) : 'Systemdynamik analysieren'}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-20 bg-gray-800 rounded-lg animate-pulse border border-indigo-900/30">
                    <div className="text-6xl mb-4">🔮</div>
                    <h3 className="text-xl text-indigo-300 font-semibold">Der System-Dynamik-Forscher arbeitet...</h3>
                    <p className="text-gray-400 mt-2">Verknüpfe Dokumenteninhalte, identifiziere Rückkopplungsschleifen und berechne gesellschaftliche Folgen.</p>
                    <p className="text-sm text-gray-500 mt-4">Bitte haben Sie Geduld, dies ist eine rechenintensive "Thinking"-Aufgabe.</p>
                </div>
            )}

            {!isLoading && analysisResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                    
                    {/* Systemische Mechanismen */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-blue-500">
                        <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                            ⚙️ Systemdynamik & Mechanismen
                        </h2>
                        <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {analysisResult.systemicMechanisms}
                        </div>
                    </div>

                    {/* Verborgene Aspekte */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-purple-500">
                        <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                            👁️ Verborgene Strukturen
                        </h2>
                        <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {analysisResult.hiddenAspects}
                        </div>
                    </div>

                    {/* Gesellschaftliche Auswirkungen (Full Width) */}
                    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-yellow-500">
                        <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                            👥 Gesellschaftliche Auswirkungen
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600/50">
                                <h3 className="font-semibold text-white mb-3 border-b border-gray-600 pb-2">Auswirkungen auf den Alltag</h3>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{analysisResult.societalImpact.dailyLife}</p>
                            </div>
                            <div className="bg-gray-700/30 p-5 rounded-lg border border-gray-600/50">
                                <h3 className="font-semibold text-white mb-3 border-b border-gray-600 pb-2">Strukturelle Folgen & Gruppen</h3>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{analysisResult.societalImpact.impactOnGroups}</p>
                            </div>
                        </div>
                    </div>

                    {/* Lösungen & Strategien (Full Width) */}
                    <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg border-t-4 border-green-500">
                        <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                            🚀 Systemische Lösungsansätze
                        </h2>
                        <div className="space-y-4">
                            {analysisResult.solutions.map((sol, idx) => (
                                <div key={idx} className="bg-gray-700/50 p-5 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                                    <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Vorschlag {idx + 1}</span>
                                        {sol.proposal.substring(0, 60)}...
                                    </h3>
                                    <p className="text-gray-300 mb-4 leading-relaxed">{sol.proposal}</p>
                                    <div className="bg-gray-900/50 p-3 rounded text-sm border-l-2 border-red-400/50">
                                        <span className="font-bold text-red-300/80 uppercase text-xs tracking-wider">Herausforderungen & Strategie</span>
                                        <p className="text-gray-400 mt-1">{sol.challenges}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !analysisResult && (
                <div className="text-center py-24 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg">
                    <div className="text-gray-600 text-5xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">Keine Systemanalyse vorhanden.</p>
                    <p className="text-gray-500 text-sm mt-2">Klicken Sie oben auf "Systemdynamik analysieren", um die KI-gestützte Auswertung zu starten.</p>
                </div>
            )}
        </div>
    );
};

export default SystemAnalysisTab;
