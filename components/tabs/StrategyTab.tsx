import React from 'react';
// Fix: Corrected import path for types.
import type { Risks } from '../../types';

/**
 * Props for the StrategyTab component.
 */
interface StrategyTabProps {
    /** An object representing the currently selected risks. */
    risks: Risks;
    /** Function to update the selected risks state. */
    setRisks: React.Dispatch<React.SetStateAction<Risks>>;
    /** An HTML string containing the AI-generated mitigation strategies. */
    mitigationStrategies: string;
    /** Callback to trigger the generation of mitigation strategies. */
    onGenerateMitigationStrategies: () => void;
    /** A boolean indicating if the strategy generation is in progress. */
    isLoading: boolean;
}

/**
 * A predefined list of common risks relevant to human rights cases.
 */
const riskOptions = [
    { id: 'physical', label: 'Physical Security' },
    { id: 'legal', label: 'Legal Risks' },
    { id: 'digital', label: 'Digital Security' },
    { id: 'intimidation', label: 'Intimidation/Threats' },
    { id: 'evidenceManipulation', label: 'Evidence Manipulation' },
    { id: 'secondaryTrauma', label: 'Secondary Trauma' },
    { id: 'burnout', label: 'Team Burnout' },
    { id: 'psychologicalBurden', label: 'Psychological Burden on Client' },
];

/**
 * A UI component for managing case strategy and risks. It allows users to select
 * relevant risks and then generate mitigation strategies based on those selections.
 * @param {StrategyTabProps} props - The props for the component.
 */
const StrategyTab: React.FC<StrategyTabProps> = ({ risks, setRisks, mitigationStrategies, onGenerateMitigationStrategies, isLoading }) => {
    
    const handleRiskChange = (riskId: keyof Risks) => {
        setRisks(prev => ({ ...prev, [riskId]: !prev[riskId] }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Strategy & Risk Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Risk Assessment</h2>
                    <p className="text-sm text-gray-400 mb-4">Select the risks relevant to this case.</p>
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
                        <h2 className="text-xl font-semibold text-white">Mitigation Strategies</h2>
                         <button 
                            onClick={onGenerateMitigationStrategies}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Generating...' : 'Suggest Strategy'}
                        </button>
                    </div>
                    <div className="flex-grow bg-gray-700 text-gray-200 p-3 rounded-md border border-gray-600 overflow-y-auto">
                         {isLoading ? (
                            <p>Generating strategies...</p>
                         ) : mitigationStrategies ? (
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: mitigationStrategies }}></div>
                         ) : (
                            <p className="text-gray-400">No strategies generated. Select risks and click "Suggest Strategy".</p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyTab;
