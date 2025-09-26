
import React from 'react';
import type { EthicsAnalysis } from '../../types';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * @interface EthicsAnalysisTabProps
 * @description Props for the EthicsAnalysisTab component.
 * @property {EthicsAnalysis | null} analysisResult - The result of the ethics analysis, or null if not yet run.
 * @property {() => void} onPerformAnalysis - Callback function to trigger the ethics analysis.
 * @property {boolean} isLoading - Flag indicating if the analysis is currently in progress.
 */
interface EthicsAnalysisTabProps {
    analysisResult: EthicsAnalysis | null;
    onPerformAnalysis: () => void;
    isLoading: boolean;
}

/**
 * @component EthicsAnalysisTab
 * @description A tab for performing and displaying an AI-powered ethical analysis of the case.
 * It assesses potential biases, privacy concerns, and provides recommendations.
 * @param {EthicsAnalysisTabProps} props The props for the component.
 * @returns {React.FC<EthicsAnalysisTabProps>} The rendered ethics analysis tab.
 */
const EthicsAnalysisTab: React.FC<EthicsAnalysisTabProps> = ({ analysisResult, onPerformAnalysis, isLoading }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Ethik-Analyse</h1>
                <Tooltip text="Analysiert den gesamten Fall auf potenzielle Voreingenommenheit, Datenschutzbedenken und die Einhaltung von 'Do-No-Harm'-Prinzipien.">
                    <button
                        onClick={onPerformAnalysis}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner className="h-4 w-4 mr-2" />}
                        {isLoading ? 'Analysiere...' : 'Analyse durchführen'}
                    </button>
                </Tooltip>
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
