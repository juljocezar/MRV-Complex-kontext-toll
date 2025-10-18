import React, { useState } from 'react';
// Fix: Corrected import path for types and utils.
import { AppState } from '../../types';
import { buildCaseContext } from '../../utils/contextUtils';

interface ReportsTabProps {
    onGenerateReport: (prompt: string, schema: object | null) => Promise<string>;
    appState: AppState;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ onGenerateReport, appState }) => {
    const [reportType, setReportType] = useState('summary');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedReport('');
        
        const context = buildCaseContext(appState);
        let prompt = `Basierend auf dem folgenden Fallkontext, erstelle einen Bericht. Kontext:\n${context}\n\n`;

        switch (reportType) {
            case 'summary':
                prompt += "Erstelle einen umfassenden zusammenfassenden Bericht des gesamten Falls. Gliedere den Bericht in: Einleitung, Hauptakteure, Chronologie der Ereignisse, aktuelle rechtliche Situation, und Empfehlungen.";
                break;
            case 'risk':
                prompt += "Erstelle einen detaillierten Risikoanalysebericht. Identifiziere alle potenziellen Risiken für den Mandanten und die Organisation. Bewerte die Wahrscheinlichkeit und das Schadenspotenzial für jedes Risiko und schlage konkrete Minderungsmaßnahmen vor.";
                break;
            case 'chronology':
                prompt += "Erstelle einen Bericht, der ausschließlich eine detaillierte, chronologische Auflistung aller bekannten Ereignisse enthält. Gib zu jedem Punkt das Datum, eine Beschreibung und die Quellen an.";
                break;
        }

        try {
            const report = await onGenerateReport(prompt, null);
            setGeneratedReport(report);
        } catch (error) {
            setGeneratedReport("Fehler bei der Berichterstellung.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Berichterstellung</h1>

            <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-6">
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-300 mb-1">Berichtstyp auswählen</label>
                    <select
                        id="reportType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    >
                        <option value="summary">Zusammenfassender Bericht</option>
                        <option value="risk">Risikoanalyse-Bericht</option>
                        <option value="chronology">Chronologie-Bericht</option>
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="self-end px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Generiere...' : 'Bericht erstellen'}
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg min-h-[400px]">
                <h2 className="text-xl font-semibold text-white mb-4">Generierter Bericht</h2>
                {isLoading && <p className="text-gray-400">Bericht wird generiert, bitte warten...</p>}
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                    {generatedReport}
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;