import React, { useState } from 'react';
// Fix: Imported AppState type to resolve missing module member error.
import { AppState } from '../../types';
import { buildCaseContext } from '../../utils/contextUtils';

/**
 * @interface ReportsTabProps
 * @description Represents the props for the ReportsTab component.
 * @description Stellt die Props für die ReportsTab-Komponente dar.
 * @property {(prompt: string, schema: object | null) => Promise<string>} onGenerateReport - Function to generate a report based on a prompt. / Funktion zum Generieren eines Berichts basierend auf einem Prompt.
 * @property {AppState} appState - The entire state of the application, used for context. / Der gesamte Zustand der Anwendung, der für den Kontext verwendet wird.
 */
interface ReportsTabProps {
    onGenerateReport: (prompt: string, schema: object | null) => Promise<string>;
    appState: AppState;
}

/**
 * @component ReportsTab
 * @description A tab for generating various types of reports based on the overall case context.
 * @description Ein Tab zum Generieren verschiedener Arten von Berichten basierend auf dem gesamten Fallkontext.
 * @param {ReportsTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered reports tab. / Der gerenderte Berichts-Tab.
 */
const ReportsTab: React.FC<ReportsTabProps> = ({ onGenerateReport, appState }) => {
    const [reportType, setReportType] = useState('summary');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedReport('');
        
// Fix: Corrected call to buildCaseContext to pass appState as an argument.
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