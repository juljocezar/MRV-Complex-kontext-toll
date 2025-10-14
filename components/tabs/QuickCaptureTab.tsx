import React, { useState } from 'react';
import { AppState, SnippetAnalysisResult } from '../../types';
import { CaseAnalyzerService } from '../../services/caseAnalyzerService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface QuickCaptureTabProps {
    appState: AppState;
    onSaveSnippet: (snippetText: string, analysis: SnippetAnalysisResult) => Promise<void>;
}

const QuickCaptureTab: React.FC<QuickCaptureTabProps> = ({ appState, onSaveSnippet }) => {
    const [inputText, setInputText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<SnippetAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await CaseAnalyzerService.analyzeTextSnippet(inputText, appState.settings.ai);
            setAnalysisResult(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!analysisResult) return;
        onSaveSnippet(inputText, analysisResult);
        // Reset form
        setInputText('');
        setAnalysisResult(null);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Schnellerfassung</h1>
            <p className="text-gray-400">
                Fügen Sie hier unstrukturierten Text (z.B. aus E-Mails, Notizen oder Webseiten) ein. Die KI analysiert den Inhalt und schlägt vor, wie er in die Wissensbasis integriert werden kann.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">1. Text einfügen</h2>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={15}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Kopieren Sie hier einen Textausschnitt hinein..."
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !inputText.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500 flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner className="h-5 w-5 mr-3" />}
                        Analysieren
                    </button>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">2. Analyse & Speichern</h2>
                    {isLoading && (
                        <div className="text-center py-12 text-gray-500">
                            <LoadingSpinner className="h-8 w-8 mx-auto mb-4" />
                            <p>Text wird analysiert...</p>
                        </div>
                    )}
                    {error && <p className="text-red-400">Fehler: {error}</p>}
                    {analysisResult && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-bold text-gray-400">Vorgeschlagener Titel</h3>
                                <p className="bg-gray-700 p-2 rounded-md text-white">{analysisResult.suggestedTitle}</p>
                            </div>
                             <div>
                                <h3 className="text-sm font-bold text-gray-400">Vorgeschlagene Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.suggestedTags.map(tag => (
                                        <span key={tag} className="bg-gray-600 px-2 py-1 rounded text-xs text-gray-200">{tag}</span>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-sm font-bold text-gray-400">Gefundene Entitäten</h3>
                                <div className="space-y-2">
                                    {analysisResult.suggestedEntities.map(entity => (
                                        <div key={entity.name} className="bg-gray-700 p-2 rounded-md">
                                            <p className="font-semibold text-white">{entity.name} <span className="text-xs text-gray-400">({entity.type})</span></p>
                                            <p className="text-xs text-gray-300">{entity.description}</p>
                                        </div>
                                    ))}
                                    {analysisResult.suggestedEntities.length === 0 && <p className="text-xs text-gray-500">Keine neuen Entitäten gefunden.</p>}
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md disabled:bg-gray-500"
                            >
                                Als Wissenseintrag speichern
                            </button>
                        </div>
                    )}
                     {!isLoading && !analysisResult && !error && (
                        <div className="text-center py-12 text-gray-500">
                            Hier erscheinen die Analyse-Ergebnisse.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuickCaptureTab;