import React, { useState } from 'react';
import { AppState } from '../../types';
import { HRDRiskAssessment, SecureCommunicationPlan } from '../../types/hrdResources';
import { HRDSupportService } from '../../services/hrdSupportService';
import { HRD_RESOURCES } from '../../constants/hrdResources';

/**
 * @interface HRDSupportTabProps
 * @description Props for the HRDSupportTab component.
 * @property {AppState} appState - The current state of the application.
 * @property {boolean} isLoading - Flag indicating if an analysis is in progress.
 * @property {(loading: boolean) => void} setIsLoading - Callback to set the loading state.
 */
interface HRDSupportTabProps {
    appState: AppState;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

/**
 * @component HRDSupportTab
 * @description A specialized tab offering tools to support Human Rights Defenders (HRDs).
 * It includes AI-powered risk assessment, secure communication planning, and a curated list of external resources.
 * @param {HRDSupportTabProps} props The props for the component.
 * @returns {React.FC<HRDSupportTabProps>} The rendered HRD support tab.
 */
const HRDSupportTab: React.FC<HRDSupportTabProps> = ({ appState, isLoading, setIsLoading }) => {
    const [riskAssessment, setRiskAssessment] = useState<HRDRiskAssessment | null>(null);
    const [commPlan, setCommPlan] = useState<SecureCommunicationPlan | null>(null);
    const [activeTool, setActiveTool] = useState<'risk' | 'comms' | 'resources'>('risk');

    const handlePerformRiskAssessment = async () => {
        setIsLoading(true);
        setRiskAssessment(null);
        try {
            const result = await HRDSupportService.performRiskAssessment(appState);
            setRiskAssessment(result);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const handleGenerateCommPlan = async () => {
        setIsLoading(true);
        setCommPlan(null);
         try {
            const result = await HRDSupportService.generateSecureCommunicationPlan(appState);
            setCommPlan(result);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const riskLevelColor = (level?: string) => {
        switch (level) {
            case 'Critical': return 'text-red-400';
            case 'High': return 'text-orange-400';
            case 'Medium': return 'text-yellow-400';
            case 'Low': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">HRD Support-Werkzeuge</h1>
            <p className="text-gray-400">Tools zur Unterstützung von Menschenrechtsverteidigern (HRDs) in den Bereichen Sicherheit und Wohlbefinden.</p>
            
            <div className="flex space-x-2 border-b border-gray-700">
                <button onClick={() => setActiveTool('risk')} className={`px-4 py-2 text-sm font-medium ${activeTool === 'risk' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Risiko-Analyse</button>
                <button onClick={() => setActiveTool('comms')} className={`px-4 py-2 text-sm font-medium ${activeTool === 'comms' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Kommunikationsplan</button>
                <button onClick={() => setActiveTool('resources')} className={`px-4 py-2 text-sm font-medium ${activeTool === 'resources' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Ressourcen</button>
            </div>

            {activeTool === 'risk' && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Fallbasierte Risiko-Analyse</h2>
                        <button onClick={handlePerformRiskAssessment} disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500">
                            {isLoading ? 'Analysiere...' : 'Analyse durchführen'}
                        </button>
                    </div>
                    {isLoading && !riskAssessment ? <p className="text-gray-400">Analyse läuft...</p> : riskAssessment ? (
                        <div className="space-y-4">
                            <p><strong>Gesamtrisikostufe: </strong><span className={`font-bold ${riskLevelColor(riskAssessment.overallRiskLevel)}`}>{riskAssessment.overallRiskLevel}</span></p>
                            <div>
                                <h3 className="font-semibold text-gray-300">Identifizierte Risiken & Maßnahmen:</h3>
                                <ul className="list-disc list-inside space-y-2 mt-2 text-gray-400">
                                    {(riskAssessment?.identifiedRisks || []).map((r, i) => <li key={i}><strong>{r.risk}:</strong> {r.mitigation}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-300">Allgemeine Empfehlungen:</h3>
                                <p className="text-gray-400 mt-1">{riskAssessment.recommendations}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Klicken Sie auf "Analyse durchführen", um eine Risikobewertung zu starten.</p>
                    )}
                </div>
            )}
            
            {activeTool === 'comms' && (
                 <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Sicherer Kommunikationsplan</h2>
                        <button onClick={handleGenerateCommPlan} disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500">
                            {isLoading ? 'Generiere...' : 'Plan generieren'}
                        </button>
                    </div>
                     {isLoading && !commPlan ? <p className="text-gray-400">Plan wird generiert...</p> : commPlan ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <h3 className="font-semibold text-gray-300 mb-2">Empfohlene Apps:</h3>
                                <ul className="space-y-1 text-gray-400">
                                    {(commPlan?.recommendedApps || []).map((app, i) => <li key={i}><strong>{app.for}:</strong> {app.name}</li>)}
                                </ul>
                            </div>
                             <div>
                                <h3 className="font-semibold text-gray-300 mb-2">Best Practices:</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-400">
                                    {(commPlan?.bestPractices || []).map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Klicken Sie auf "Plan generieren", um Vorschläge für eine sichere Kommunikation zu erhalten.</p>
                    )}
                </div>
            )}
            
            {activeTool === 'resources' && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Externe Unterstützungs-Ressourcen</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {HRD_RESOURCES.map(res => (
                            <div key={res.name} className="bg-gray-700/50 p-4 rounded-md">
                                <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-400 hover:underline">{res.name}</a>
                                <p className="text-sm text-gray-400 mt-1">{res.description}</p>
                                <span className="text-xs mt-2 inline-block bg-gray-600 px-2 py-1 rounded">{res.category}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default HRDSupportTab;
