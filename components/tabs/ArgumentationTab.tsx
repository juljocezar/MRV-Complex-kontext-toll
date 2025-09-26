
import React from 'react';
import type { ArgumentationAnalysis } from '../../types';
import Icon from '../ui/Icon';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * @interface ArgumentationTabProps
 * @description Props for the ArgumentationTab component.
 * @property {ArgumentationAnalysis | null} analysis - The result of the argumentation analysis, or null if not yet run.
 * @property {() => void} onGenerate - Callback function to trigger the generation of the analysis.
 * @property {boolean} isLoading - Flag indicating if the analysis is currently in progress.
 */
interface ArgumentationTabProps {
    analysis: ArgumentationAnalysis | null;
    onGenerate: () => void;
    isLoading: boolean;
}

/**
 * @component ArgumentationTab
 * @description A tab that provides AI-powered assistance for developing legal arguments.
 * It generates potential supporting arguments and anticipates counter-arguments based on the case context.
 * @param {ArgumentationTabProps} props The props for the component.
 * @returns {React.FC<ArgumentationTabProps>} The rendered argumentation tab.
 */
const ArgumentationTab: React.FC<ArgumentationTabProps> = ({ analysis, onGenerate, isLoading }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Argumentationshilfe</h1>
                <Tooltip text="Analysiert den gesamten Fallkontext, um schlüssige Argumente für Ihre Seite und wahrscheinliche Gegenargumente der Gegenseite zu identifizieren.">
                    <button
                        onClick={onGenerate}
                        disabled={isLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 flex items-center gap-2 justify-center"
                    >
                        {isLoading ? <LoadingSpinner className="h-5 w-5 text-white" /> : <Icon name="argumentation" />}
                        {isLoading ? 'Analysiere...' : 'Argumente generieren'}
                    </button>
                </Tooltip>
            </div>
            <p className="text-gray-400">
                Nutzen Sie diese KI-gestützte Funktion, um basierend auf dem gesamten Fallkontext mögliche Argumentationsstränge und potenzielle Gegenargumente zu identifizieren und Ihre Fallstrategie zu schärfen.
            </p>

            {isLoading && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Argumentationsstrategie wird analysiert. Dies kann einen Moment dauern...</p>
                </div>
            )}

            {!isLoading && analysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Supporting Arguments */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-green-400 mb-4">Argumentationsstränge (Ihre Position)</h2>
                        <div className="space-y-4">
                            {analysis.supportingArguments.map((arg, argIndex) => (
                                <div key={`sup-arg-${argIndex}`} className="bg-gray-700/50 p-4 rounded-md">
                                    <p className="font-semibold text-gray-200">{arg.point}</p>
                                    {arg.evidence.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-sm text-gray-400 space-y-1">
                                            {arg.evidence.map((ev, evIndex) => <li key={`sup-ev-${argIndex}-${evIndex}`}>{ev}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                             {analysis.supportingArguments.length === 0 && <p className="text-gray-500">Keine spezifischen Argumente gefunden.</p>}
                        </div>
                    </div>

                    {/* Counter Arguments */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-red-400 mb-4">Mögliche Gegenargumente (Gegenseite)</h2>
                        <div className="space-y-4">
                            {analysis.counterArguments.map((arg, argIndex) => (
                                <div key={`con-arg-${argIndex}`} className="bg-gray-700/50 p-4 rounded-md">
                                    <p className="font-semibold text-gray-200">{arg.point}</p>
                                     {arg.evidence.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-sm text-gray-400 space-y-1">
                                            {arg.evidence.map((ev, evIndex) => <li key={`con-ev-${argIndex}-${evIndex}`}>{ev}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {analysis.counterArguments.length === 0 && <p className="text-gray-500">Keine spezifischen Gegenargumente gefunden.</p>}
                        </div>
                    </div>
                </div>
            ) : !isLoading && (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Noch keine Analyse durchgeführt. Klicken Sie oben, um die Argumentationshilfe zu starten.</p>
                </div>
            )}
        </div>
    );
};

export default ArgumentationTab;
