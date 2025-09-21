import React from 'react';
import type { EthicsAnalysis } from '../../types';

/**
 * Props for the EthicsAnalysisTab component.
 */
interface EthicsAnalysisTabProps {
    /** The result of the ethics analysis, or null if not yet performed. */
    analysisResult: EthicsAnalysis | null;
    /** Callback function to trigger the ethics analysis. */
    onPerformAnalysis: () => void;
    /** A boolean indicating if the analysis is currently in progress. */
    isLoading: boolean;
}

/**
 * A UI component that displays the results of an AI-powered ethics analysis.
 * It shows assessments of bias, privacy concerns, and actionable recommendations.
 * @param {EthicsAnalysisTabProps} props - The props for the component.
 */
const EthicsAnalysisTab: React.FC<EthicsAnalysisTabProps> = ({ analysisResult, onPerformAnalysis, isLoading }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Ethics Analysis</h1>
                <button
                    onClick={onPerformAnalysis}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Analyzing...' : 'Perform Analysis'}
                </button>
            </div>
            <p className="text-gray-400">
                This section performs an AI-powered analysis of the case for ethical concerns,
                such as bias in the data, privacy aspects, or "Do-No-Harm" principles.
            </p>

            {isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Performing ethics analysis. This may take a moment...</p>
                </div>
            )}

            {!isLoading && analysisResult ? (
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">Bias Assessment</h2>
                        <p className="text-gray-300">{analysisResult.biasAssessment}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                        <h2 className="text-xl font-semibold text-white mb-2">Privacy Concerns</h2>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {(analysisResult?.privacyConcerns || []).map((concern, index) => (
                                <li key={index}>{concern}</li>
                            ))}
                        </ul>
                    </div>
                     <div className="border-t border-gray-700 pt-4">
                        <h2 className="text-xl font-semibold text-white mb-2">Recommendations</h2>
                         <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {(analysisResult?.recommendations || []).map((rec, index) => (
                                <li key={index}>{rec}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : !isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">No ethics analysis has been performed yet.</p>
                </div>
            )}
        </div>
    );
};

export default EthicsAnalysisTab;
