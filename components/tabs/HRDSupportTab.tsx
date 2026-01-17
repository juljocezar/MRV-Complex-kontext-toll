
import React, { useState, useMemo } from 'react';
import { AppState, HrdResourceType } from '../../types';
import { HRDRiskAssessment, SecureCommunicationPlan } from '../../types/hrdResources';
import { HRDSupportService } from '../../services/hrdSupportService';
import { HRD_RESOURCES } from '../../constants/hrdResources';
import LoadingSpinner from '../ui/LoadingSpinner';

interface HRDSupportTabProps {
    appState: AppState;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const HRDSupportTab: React.FC<HRDSupportTabProps> = ({ appState, isLoading, setIsLoading }) => {
    const [riskAssessment, setRiskAssessment] = useState<HRDRiskAssessment | null>(null);
    const [commPlan, setCommPlan] = useState<SecureCommunicationPlan | null>(null);
    const [activeTool, setActiveTool] = useState<'risk' | 'comms' | 'resources'>('risk');
    const [resourceFilter, setResourceFilter] = useState<HrdResourceType | 'ALL'>('ALL');

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

    const filteredResources = useMemo(() => {
        return HRD_RESOURCES.filter(res => resourceFilter === 'ALL' || res.type === resourceFilter);
    }, [resourceFilter]);

    const getResourceBadge = (type: HrdResourceType) => {
        const classes = "text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ";
        switch (type) {
            case 'SECURITY': return classes + "bg-red-900/30 text-red-300 border-red-800";
            case 'LEARNING_MODULE': return classes + "bg-blue-900/30 text-blue-300 border-blue-800";
            case 'SUBMISSION_PORTAL': return classes + "bg-purple-900/30 text-purple-300 border-purple-800";
            case 'ADVOCACY_TOOL': return classes + "bg-orange-900/30 text-orange-300 border-orange-800";
            default: return classes + "bg-gray-700 text-gray-300 border-gray-600";
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">HRD Support-Werkzeuge</h1>
            <p className="text-gray-400">Tools zur Unterstützung von Menschenrechtsverteidigern (HRDs) in den Bereichen Sicherheit und Wohlbefinden.</p>
            
            <div className="flex space-x-2 border-b border-gray-700">
                <button onClick={() => setActiveTool('risk')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTool === 'risk' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Risiko-Analyse</button>
                <button onClick={() => setActiveTool('comms')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTool === 'comms' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Kommunikationsplan</button>
                <button onClick={() => setActiveTool('resources')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTool === 'resources' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Ressourcen-Bibliothek</button>
            </div>

            {activeTool === 'risk' && (
                <div className="bg-gray-800 p-6 rounded-lg animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Fallbasierte Risiko-Analyse</h2>
                        <button onClick={handlePerformRiskAssessment} disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 flex items-center gap-2">
                            {isLoading && <LoadingSpinner className="w-4 h-4"/>}
                            {isLoading ? 'Analysiere...' : 'Analyse durchführen'}
                        </button>
                    </div>
                    {isLoading && !riskAssessment ? <p className="text-gray-400 py-8 text-center">KI-Agent analysiert Fallkontext auf Risiken...</p> : riskAssessment ? (
                        <div className="space-y-4">
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                <p className="text-lg"><strong>Gesamtrisikostufe: </strong><span className={`font-bold ${riskLevelColor(riskAssessment.overallRiskLevel)}`}>{riskAssessment.overallRiskLevel}</span></p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-300 mb-2">Identifizierte Risiken & Maßnahmen:</h3>
                                <ul className="space-y-3">
                                    {(riskAssessment?.identifiedRisks || []).map((r, i) => (
                                        <li key={i} className="bg-gray-700/30 p-3 rounded border-l-4 border-red-500/50">
                                            <div className="font-bold text-red-200 mb-1">{r.risk}</div>
                                            <div className="text-gray-400 text-sm">→ {r.mitigation}</div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-300 mb-1">Allgemeine Empfehlungen:</h3>
                                <div className="text-gray-400 text-sm bg-gray-700/20 p-3 rounded">{riskAssessment.recommendations}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                            <span className="text-4xl block mb-2">🛡️</span>
                            Klicken Sie auf "Analyse durchführen", um eine Risikobewertung zu starten.
                        </div>
                    )}
                </div>
            )}
            
            {activeTool === 'comms' && (
                 <div className="bg-gray-800 p-6 rounded-lg animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Sicherer Kommunikationsplan</h2>
                        <button onClick={handleGenerateCommPlan} disabled={isLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500 flex items-center gap-2">
                            {isLoading && <LoadingSpinner className="w-4 h-4"/>}
                            {isLoading ? 'Generiere...' : 'Plan generieren'}
                        </button>
                    </div>
                     {isLoading && !commPlan ? <p className="text-gray-400 py-8 text-center">Erstelle maßgeschneiderten Sicherheitsplan...</p> : commPlan ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                <h3 className="font-bold text-blue-300 mb-3 border-b border-gray-600 pb-2">Empfohlene Apps</h3>
                                <ul className="space-y-3">
                                    {(commPlan?.recommendedApps || []).map((app, i) => (
                                        <li key={i} className="flex justify-between items-center">
                                            <span className="text-gray-300 font-medium">{app.name}</span>
                                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{app.for}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                <h3 className="font-bold text-green-300 mb-3 border-b border-gray-600 pb-2">Best Practices</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                                    {(commPlan?.bestPractices || []).map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                            <span className="text-4xl block mb-2">🔐</span>
                            Klicken Sie auf "Plan generieren", um Vorschläge für eine sichere Kommunikation zu erhalten.
                        </div>
                    )}
                </div>
            )}
            
            {activeTool === 'resources' && (
                <div className="space-y-4 animate-in fade-in">
                    
                    {/* Filter Tabs */}
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                        {['ALL', 'SECURITY', 'LEARNING_MODULE', 'SUBMISSION_PORTAL', 'ADVOCACY_TOOL', 'GUIDE'].map(type => (
                            <button
                                key={type}
                                onClick={() => setResourceFilter(type as any)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                                    resourceFilter === type 
                                    ? 'bg-blue-600 text-white border-blue-500' 
                                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                }`}
                            >
                                {type === 'ALL' ? 'Alle' : type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map(res => (
                            <div key={res.id} className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 shadow-lg flex flex-col h-full group transition-all">
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={getResourceBadge(res.type)}>
                                            {res.type.replace('_', ' ')}
                                        </span>
                                        {/* Target Group Icons could go here */}
                                    </div>
                                    
                                    <h3 className="font-bold text-white text-lg mb-2 group-hover:text-blue-400 transition-colors">
                                        <a href={res.baseUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                            {res.title}
                                            <span className="opacity-0 group-hover:opacity-100 text-sm transition-opacity">↗</span>
                                        </a>
                                    </h3>
                                    
                                    <p className="text-sm text-gray-400 mb-4">
                                        {res.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 mt-auto">
                                        {res.targetGroup.map(tg => (
                                            <span key={tg} className="text-[10px] bg-gray-900 text-gray-500 px-1.5 py-0.5 rounded border border-gray-800">
                                                {tg}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-700/30 p-3 border-t border-gray-700 flex justify-end">
                                    <a href={res.baseUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1">
                                        Ressource öffnen ›
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default HRDSupportTab;
