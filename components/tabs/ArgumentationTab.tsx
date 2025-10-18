


import React from 'react';
import type { ArgumentationAnalysis } from '../../types';
import Icon from '../ui/Icon';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ArgumentationTabProps {
    analysis: ArgumentationAnalysis | null;
    onGenerate: () => void;
    onRunAdversarial: () => void;
    isLoading: boolean;
    loadingSection: string;
}

const ArgumentationTab: React.FC<ArgumentationTabProps> = ({ analysis, onGenerate, onRunAdversarial, isLoading, loadingSection }) => {
    const isGenerating = isLoading && loadingSection === 'argumentation';
    const isAdversarialLoading = isLoading && loadingSection === 'adversarial_analysis';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Argumentationshilfe</h1>
                <div className="flex space-x-2">
                    <Tooltip text="Analysiert den gesamten Fallkontext, um schlüssige Argumente für Ihre Seite und wahrscheinliche Gegenargumente der Gegenseite zu identifizieren.">
                        <button
                            onClick={onGenerate}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:bg-gray-500 flex items-center gap-2 justify-center"
                        >
                            {isGenerating ? <LoadingSpinner className="h-5 w-5 text-white" /> : <Icon name="argumentation" />}
                            {isGenerating ? 'Analysiere...' : 'Argumente generieren'}
                        </button>
                    </Tooltip>
                     <Tooltip text="Startet eine 'Red Team'-Simulation. Ein KI-Agent agiert als gegnerischer Anwalt, um Schwachstellen in Ihrem Fall aufzudecken.">
                        <button
                            onClick={onRunAdversarial}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md disabled:bg-gray-500 flex items-center gap-2 justify-center"
                        >
                            {isAdversarialLoading ? <LoadingSpinner className="h-5 w-5 text-white" /> : '🛡️'}
                            {isAdversarialLoading ? 'Simuliere...' : 'Stresstest'}
                        </button>
                    </Tooltip>
                </div>
            </div>
            <p className="text-gray-400">
                Diese Funktion agiert als Ihr strategischer Verbündeter. Sie entwickelt schlagkräftige Argumente für Ihre Position und analysiert die voraussichtlichen, fehlerhaften Argumentationslinien der Gegenseite, um Sie optimal auf die Widerlegung vorzubereiten.
            </p>

            {(isGenerating || isAdversarialLoading) && !analysis && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Analyse wird durchgeführt. Dies kann einen Moment dauern...</p>
                </div>
            )}

            {!isLoading && !analysis ? (
                 <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Noch keine Analyse durchgeführt. Klicken Sie oben, um die Argumentationshilfe zu starten.</p>
                </div>
            ) : analysis && (
                <>
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
                            <h2 className="text-xl font-semibold text-orange-400 mb-4">Analyse gegnerischer Argumente (Zur Vorbereitung der Widerlegung)</h2>
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
                    {isAdversarialLoading && (
                        <div className="text-center py-8 text-gray-400">Führe 'Red Team'-Analyse durch...</div>
                    )}
                    {analysis.adversarialAnalysis && (
                         <div className="bg-gray-800 border-2 border-red-500/50 p-6 rounded-lg mt-6">
                            <h2 className="text-2xl font-bold text-red-400 mb-4">🛡️ Ergebnisse des "Red Team" Stresstests</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200">Identifizierte Hauptschwachstellen & Angriffsstrategien</h3>
                                    <div className="space-y-4 mt-2">
                                        {analysis.adversarialAnalysis.mainWeaknesses.map((item, index) => (
                                            <div key={index} className="bg-red-900/30 p-4 rounded-md">
                                                <p className="font-semibold text-red-300">Schwachstelle: {item.weakness}</p>
                                                <p className="mt-1 text-sm text-gray-300"><strong>Mögliche Angriffsstrategie der Gegenseite:</strong> {item.attackStrategy}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-200">Mögliches alternatives Narrativ der Gegenseite</h3>
                                    <p className="mt-2 text-gray-300 bg-red-900/30 p-4 rounded-md italic">"{analysis.adversarialAnalysis.alternativeNarrative}"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ArgumentationTab;
