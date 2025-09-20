import React, { useMemo } from 'react';
// Fix: Corrected type name from GeneratedDocument to GeneratedDoc to match type definitions.
import { Document, GeneratedDocument, DocumentAnalysisResults, CaseSummary, ActiveTab } from '../../types';

/**
 * @interface DashboardTabProps
 * @description Represents the props for the DashboardTab component.
 * @description Stellt die Props für die DashboardTab-Komponente dar.
 * @property {Document[]} documents - List of all uploaded documents. / Liste aller hochgeladenen Dokumente.
 * @property {GeneratedDocument[]} generatedDocuments - List of all AI-generated documents. / Liste aller KI-generierten Dokumente.
 * @property {DocumentAnalysisResults} documentAnalysisResults - Results of the workload analysis. / Ergebnisse der Aufwandsanalyse.
 * @property {string} caseDescription - The user-provided description of the case. / Die vom Benutzer bereitgestellte Fallbeschreibung.
 * @property {(desc: string) => void} setCaseDescription - Function to update the case description. / Funktion zur Aktualisierung der Fallbeschreibung.
 * @property {(tab: ActiveTab) => void} setActiveTab - Function to switch to a different tab. / Funktion zum Wechseln zu einem anderen Tab.
 * @property {() => void} onResetCase - Function to reset the entire case. / Funktion zum Zurücksetzen des gesamten Falles.
 * @property {() => void} onExportCase - Function to export the case data. / Funktion zum Exportieren der Falldaten.
 * @property {(file: File) => void} onImportCase - Function to import case data from a file. / Funktion zum Importieren von Falldaten aus einer Datei.
 * @property {CaseSummary | null} caseSummary - The AI-generated summary of the case. / Die KI-generierte Zusammenfassung des Falles.
 * @property {() => void} onPerformOverallAnalysis - Function to trigger the overall case analysis. / Funktion zum Auslösen der gesamten Fallanalyse.
 * @property {boolean} isLoading - Flag indicating if a process is running. / Flag, das anzeigt, ob ein Prozess läuft.
 * @property {string} loadingSection - The section that is currently loading. / Der Bereich, der gerade lädt.
 */
interface DashboardTabProps {
    documents: Document[];
    generatedDocuments: GeneratedDocument[];
    documentAnalysisResults: DocumentAnalysisResults;
    caseDescription: string;
    setCaseDescription: (desc: string) => void;
    setActiveTab: (tab: ActiveTab) => void;
    onResetCase: () => void;
    onExportCase: () => void;
    onImportCase: (file: File) => void;
    caseSummary: CaseSummary | null;
    onPerformOverallAnalysis: () => void;
    isLoading: boolean;
    loadingSection: string;
}

/**
 * @component DashboardTab
 * @description The main dashboard tab, providing an overview of the case, key metrics, and case management functions.
 * @description Der Haupt-Dashboard-Tab, der einen Überblick über den Fall, wichtige Kennzahlen und Fallmanagement-Funktionen bietet.
 * @param {DashboardTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered dashboard tab. / Der gerenderte Dashboard-Tab.
 */
const DashboardTab: React.FC<DashboardTabProps> = ({
    documents, generatedDocuments, documentAnalysisResults, caseDescription, setCaseDescription, setActiveTab,
    onResetCase, onExportCase, onImportCase, caseSummary, onPerformOverallAnalysis, isLoading, loadingSection
}) => {

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                onImportCase(file);
            }
        };
        input.click();
    };

    const { totalWorkload, totalCost } = useMemo(() => {
        return Object.values(documentAnalysisResults).reduce((acc, analysis) => {
            acc.totalWorkload += analysis.workloadEstimate?.total || 0;
            acc.totalCost += analysis.costEstimate?.recommended || 0;
            return acc;
        }, { totalWorkload: 0, totalCost: 0 });
    }, [documentAnalysisResults]);

    const classifiedCount = documents.filter(d => d.classificationStatus === 'classified').length;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Dokumente</h3>
                    <p className="text-4xl font-bold text-white">{documents.length}</p>
                    <div className="mt-2 text-sm text-gray-400">
                        <p>Analysiert: {classifiedCount}</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Geschätzter Aufwand</h3>
                    <p className="text-4xl font-bold text-white">{totalWorkload.toFixed(1)} <span className="text-2xl text-gray-400">Stunden</span></p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Geschätzte Kosten</h3>
                    <p className="text-4xl font-bold text-white">{totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300">Fall-Verwaltung</h3>
                     <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={onExportCase} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Export</button>
                        <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm">Import</button>
                        <button onClick={onResetCase} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm">Reset</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Fallbeschreibung</h3>
                    <textarea
                        value={caseDescription}
                        onChange={(e) => setCaseDescription(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-semibold text-white">KI-Fallzusammenfassung</h3>
                        <button
                            onClick={onPerformOverallAnalysis}
                            disabled={isLoading && loadingSection === 'overall-analysis'}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading && loadingSection === 'overall-analysis' ? 'Analysiere...' : 'Analyse durchführen'}
                        </button>
                    </div>
                    {caseSummary ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-gray-300">Zusammenfassung</h4>
                                <p className="text-gray-400">{caseSummary.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Identifizierte Risiken</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {caseSummary.identifiedRisks.map((r, i) => <li key={i}><strong>{r.risk}:</strong> {r.description}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Vorgeschlagene nächste Schritte</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {caseSummary.suggestedNextSteps.map((s, i) => <li key={i}><strong>{s.step}:</strong> {s.justification}</li>)}
                                </ul>
                            </div>
                            <p className="text-xs text-gray-500 text-right pt-2">Generiert am: {new Date(caseSummary.generatedAt).toLocaleString()}</p>
                        </div>
                    ) : (
                         <div className="text-center py-8 text-gray-500">
                             {isLoading && loadingSection === 'overall-analysis' 
                                ? <p>Analyse wird durchgeführt...</p>
                                : <p>Noch keine Zusammenfassung erstellt. Klicken Sie auf "Analyse durchführen".</p>
                             }
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardTab;