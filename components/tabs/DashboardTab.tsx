import React, { useMemo, useRef } from 'react';
import { Document, GeneratedDocument, DocumentAnalysisResults, CaseSummary, ActiveTab } from '../../types';

/**
 * Props for the DashboardTab component.
 */
interface DashboardTabProps {
    /** An array of all documents in the case. */
    documents: Document[];
    /** An array of all AI-generated documents. */
    generatedDocuments: GeneratedDocument[];
    /** An object containing analysis results for documents. */
    documentAnalysisResults: DocumentAnalysisResults;
    /** The user-editable description of the case. */
    caseDescription: string;
    /** Callback to update the case description. */
    setCaseDescription: (desc: string) => void;
    /** Callback to change the active application tab. */
    setActiveTab: (tab: ActiveTab) => void;
    /** Callback to reset the entire case state. */
    onResetCase: () => void;
    /** Callback to export the current case state to a JSON file. */
    onExportCase: () => void;
    /** Callback to import case state from a JSON file. */
    onImportCase: (file: File) => void;
    /** The AI-generated summary of the case, or null if not generated. */
    caseSummary: CaseSummary | null;
    /** Callback to trigger the overall case analysis. */
    onPerformOverallAnalysis: () => void;
    /** A boolean indicating if a process is currently loading. */
    isLoading: boolean;
    /** A string to identify which section is currently loading. */
    loadingSection: string;
}

/**
 * The main dashboard component, providing a high-level overview of the case.
 * It displays key statistics, case management actions, and an AI-generated summary.
 * @param {DashboardTabProps} props - The props for the component.
 */
const DashboardTab: React.FC<DashboardTabProps> = ({
    documents, generatedDocuments, documentAnalysisResults, caseDescription, setCaseDescription, setActiveTab,
    onResetCase, onExportCase, onImportCase, caseSummary, onPerformOverallAnalysis, isLoading, loadingSection
}) => {

    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportCase(file);
        }
    };


    const { totalWorkload, totalCost } = useMemo(() => {
        return Object.values(documentAnalysisResults).reduce((acc, analysis) => {
            if (analysis) {
                acc.totalWorkload += analysis.workloadEstimate?.totalHours || 0;
                acc.totalCost += analysis.costEstimate?.recommended || 0;
            }
            return acc;
        }, { totalWorkload: 0, totalCost: 0 }); 
    }, [documentAnalysisResults]);

    const classifiedCount = documents.filter(d => d.classificationStatus === 'classified').length;
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Documents</h3>
                    <p className="text-4xl font-bold text-white">{documents.length}</p>
                    <div className="mt-2 text-sm text-gray-400">
                        <p>Analyzed: {classifiedCount}</p>
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Estimated Workload</h3>
                    <p className="text-4xl font-bold text-white">{totalWorkload.toFixed(1)} <span className="text-2xl text-gray-400">hours</span></p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Estimated Costs</h3>
                    <p className="text-4xl font-bold text-white">{totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300">Case Management</h3>
                     <div className="mt-4 flex flex-wrap gap-2">
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                        <button onClick={onExportCase} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Export</button>
                        <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm">Import</button>
                        <button onClick={onResetCase} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm">Reset</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Case Description</h3>
                    <textarea
                        value={caseDescription}
                        onChange={(e) => setCaseDescription(e.target.value)}
                        rows={8}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xl font-semibold text-white">AI Case Summary</h3>
                        <button
                            onClick={onPerformOverallAnalysis}
                            disabled={isLoading && loadingSection === 'case_analysis'}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isLoading && loadingSection === 'case_analysis' ? 'Analyzing...' : 'Perform Analysis'}
                        </button>
                    </div>
                    {caseSummary ? (
                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-bold text-gray-300">Summary</h4>
                                <p className="text-gray-400">{caseSummary.summary}</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Identified Risks</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {(caseSummary?.identifiedRisks || []).map((r, i) => <li key={i}><strong>{r.risk}:</strong> {r.description}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Suggested Next Steps</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {(caseSummary?.suggestedNextSteps || []).map((s, i) => <li key={i}><strong>{s.step}:</strong> {s.justification}</li>)}
                                </ul>
                            </div>
                            <p className="text-xs text-gray-500 text-right pt-2">Generated at: {new Date(caseSummary.generatedAt).toLocaleString()}</p>
                        </div>
                    ) : (
                         <div className="text-center py-8 text-gray-500">
                             {isLoading && loadingSection === 'case_analysis' 
                                ? <p>Analysis in progress...</p>
                                : <p>No summary generated yet. Click "Perform Analysis".</p>
                             }
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DashboardTab;
