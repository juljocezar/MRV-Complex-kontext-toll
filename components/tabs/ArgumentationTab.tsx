

import React from 'react';
import type { ArgumentationAnalysis } from '../../types';
import Icon from '../ui/Icon';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ArgumentationTabProps {
    analysis: ArgumentationAnalysis | null;
    onGenerate: () => void;
    isLoading: boolean;
}

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
                Diese Funktion agiert als Ihr strategischer Verbündeter. Sie entwickelt schlagkräftige Argumente für Ihre Position und analysiert die voraussichtlichen, fehlerhaften Argumentationslinien der Gegenseite, um Sie optimal auf die Widerlegung vorzubereiten.
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
                        <h2 className="text-xl font-semibold text-green-400 mb-4">Schlagkräftige Argumente für Ihre Position</h2>
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

                    {/* Opponent Arguments */}
                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold text-red-400 mb-4">Analyse gegnerischer Argumente (Zur Vorbereitung der Widerlegung)</h2>
                        <div className="space-y-4">
                            {analysis.opponentArguments.map((arg, argIndex) => (
                                <div key={`con-arg-${argIndex}`} className="bg-gray-700/50 p-4 rounded-md">
                                    <p className="font-semibold text-gray-200">{arg.point}</p>
                                     {arg.evidence.length > 0 && (
                                        <ul className="mt-2 list-disc list-inside text-sm text-gray-400 space-y-1">
                                            {arg.evidence.map((ev, evIndex) => <li key={`con-ev-${argIndex}-${evIndex}`}>{ev}</li>)}
                                        </ul>
                                    )}
                                </div>
                            ))}
                            {analysis.opponentArguments.length === 0 && <p className="text-gray-500">Keine spezifischen gegnerischen Argumente gefunden.</p>}
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