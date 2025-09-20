import React from 'react';
import type { Risks } from '../../types';

/**
 * @interface StrategyTabProps
 * @description Represents the props for the StrategyTab component.
 * @description Stellt die Props für die StrategyTab-Komponente dar.
 * @property {Risks} risks - An object representing the selected risks for the case. / Ein Objekt, das die ausgewählten Risiken für den Fall darstellt.
 * @property {React.Dispatch<React.SetStateAction<Risks>>} setRisks - Function to update the selected risks. / Funktion zum Aktualisieren der ausgewählten Risiken.
 * @property {string} mitigationStrategies - The AI-generated strategies to mitigate the selected risks. / Die KI-generierten Strategien zur Minderung der ausgewählten Risiken.
 * @property {() => void} onGenerateMitigationStrategies - Function to trigger the generation of mitigation strategies. / Funktion zum Auslösen der Generierung von Minderungsstrategien.
 * @property {boolean} isLoading - Flag indicating if strategies are being generated. / Flag, das anzeigt, ob Strategien generiert werden.
 */
interface StrategyTabProps {
    risks: Risks;
    setRisks: React.Dispatch<React.SetStateAction<Risks>>;
    mitigationStrategies: string;
    onGenerateMitigationStrategies: () => void;
    isLoading: boolean;
}

/**
 * @constant riskOptions
 * @description An array of predefined risk options for selection in the UI.
 * @description Ein Array vordefinierter Risikooptionen zur Auswahl in der Benutzeroberfläche.
 */
const riskOptions = [
    { id: 'physical', label: 'Physische Sicherheit' },
    { id: 'legal', label: 'Rechtliche Risiken' },
    { id: 'digital', label: 'Digitale Sicherheit' },
    { id: 'intimidation', label: 'Einschüchterung/Bedrohung' },
    { id: 'evidenceManipulation', label: 'Beweismanipulation' },
    { id: 'secondaryTrauma', label: 'Sekundärtraumatisierung' },
    { id: 'burnout', label: 'Burnout des Teams' },
    { id: 'psychologicalBurden', label: 'Psychische Belastung des Mandanten' },
];

/**
 * @component StrategyTab
 * @description A tab for assessing risks and generating mitigation strategies for the case.
 * @description Ein Tab zur Bewertung von Risiken und zur Generierung von Minderungsstrategien für den Fall.
 * @param {StrategyTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered strategy tab. / Der gerenderte Strategie-Tab.
 */
const StrategyTab: React.FC<StrategyTabProps> = ({ risks, setRisks, mitigationStrategies, onGenerateMitigationStrategies, isLoading }) => {
    
    const handleRiskChange = (riskId: keyof Risks) => {
        setRisks(prev => ({ ...prev, [riskId]: !prev[riskId] }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Strategie & Risikomanagement</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Risikobewertung</h2>
                    <p className="text-sm text-gray-400 mb-4">Wählen Sie die für diesen Fall relevanten Risiken aus.</p>
                    <div className="space-y-3">
                        {riskOptions.map(option => (
                            <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={risks[option.id as keyof Risks]}
                                    onChange={() => handleRiskChange(option.id as keyof Risks)}
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-300">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Minderungsstrategien</h2>
                         <button 
                            onClick={onGenerateMitigationStrategies}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generiere...' : 'Strategie vorschlagen'}
                        </button>
                    </div>
                    <div className="flex-grow bg-gray-700 text-gray-200 p-3 rounded-md border border-gray-600 overflow-y-auto">
                         {isLoading ? (
                            <p>Strategien werden generiert...</p>
                         ) : mitigationStrategies ? (
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: mitigationStrategies }}></div>
                         ) : (
                            <p className="text-gray-400">Keine Strategien generiert. Wählen Sie Risiken aus und klicken Sie auf "Strategie vorschlagen".</p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyTab;