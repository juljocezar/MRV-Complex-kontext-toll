import React from 'react';
import type { EthicsAnalysis } from '../../types';

interface EthicsAnalysisTabProps {
    analysisResult: EthicsAnalysis | null;
    onPerformAnalysis: () => void;
    isLoading: boolean;
}

const EthicsAnalysisTab: React.FC<EthicsAnalysisTabProps> = ({ analysisResult, onPerformAnalysis, isLoading }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Ethik-Analyse</h1>
                <button
                    onClick={onPerformAnalysis}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Analysiere...' : 'Analyse durchführen'}
                </button>
            </div>
            <p className="text-gray-400">
                Dieser Bereich führt eine KI-gestützte Analyse des Falles auf ethische Bedenken,
                wie z.B. Voreingenommenheit (Bias) in den Daten, Datenschutzaspekte oder
                "Do-No-Harm"-Prinzipien durch.
            </p>

            {isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Ethische Analyse wird durchgeführt. Dies kann einen Moment dauern...</p>
                </div>
            )}

            {!isLoading && analysisResult ? (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">Bewertung der Voreingenommenheit (Bias)</h2>
                        <p className="text-gray-300">{analysisResult.biasAssessment}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <h2 className="text-xl font-semibold text-white mb-2">Datenschutzbedenken</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {(analysisResult?.privacyConcerns || []).map((concern, index) => (
                                <li key={index}>{concern}</li>
                            ))}
                        </ul>
                    </div>
                     <div className="border-t border-gray-700 pt-4">
                        <h2 className="text-xl font-semibold text-white mb-2">Handlungsempfehlungen</h2>
                         <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {(analysisResult?.recommendations || []).map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : !isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Noch keine Ethik-Analyse durchgeführt.</p>
                </div>
            )}
        </div>
    );
};

export default EthicsAnalysisTab;
