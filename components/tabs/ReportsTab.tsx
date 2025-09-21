import React, { useState } from 'react';
// Fix: Corrected import path for types and utils.
import { AppState } from '../../types';
import { buildCaseContext } from '../../utils/contextUtils';

/**
 * Props for the ReportsTab component.
 */
interface ReportsTabProps {
    /** The callback function to trigger the report generation in the parent component. */
    onGenerateReport: (prompt: string, schema: object | null) => Promise<string>;
    /** The global state of the application, used to build the context for the report. */
    appState: AppState;
}

/**
 * A UI component for generating various types of narrative reports based on the case data.
 * The user can select a report type, and the component constructs a detailed prompt for the AI.
 * @param {ReportsTabProps} props - The props for the component.
 */
const ReportsTab: React.FC<ReportsTabProps> = ({ onGenerateReport, appState }) => {
    const [reportType, setReportType] = useState('summary');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedReport('');
        
        const context = buildCaseContext(appState);
        let prompt = `Based on the following case context, create a report. Context:\n${context}\n\n`;

        switch (reportType) {
            case 'summary':
                prompt += "Create a comprehensive summary report of the entire case. Structure the report into: Introduction, Key Actors, Chronology of Events, Current Legal Situation, and Recommendations.";
                break;
            case 'risk':
                prompt += "Create a detailed risk analysis report. Identify all potential risks for the client and the organization. Assess the probability and potential impact of each risk and propose concrete mitigation measures.";
                break;
            case 'chronology':
                prompt += "Create a report that consists solely of a detailed, chronological list of all known events. For each item, provide the date, a description, and the sources.";
                break;
        }

        try {
            const report = await onGenerateReport(prompt, null);
            setGeneratedReport(report);
        } catch (error) {
            setGeneratedReport("Error during report generation.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Report Generation</h1>

            <div className="bg-gray-800 p-6 rounded-lg flex items-center space-x-6">
                <div>
                    <label htmlFor="reportType" className="block text-sm font-medium text-gray-300 mb-1">Select Report Type</label>
                    <select
                        id="reportType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    >
                        <option value="summary">Summary Report</option>
                        <option value="risk">Risk Analysis Report</option>
                        <option value="chronology">Chronology Report</option>
                    </select>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="self-end px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Generating...' : 'Create Report'}
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg min-h-[400px]">
                <h2 className="text-xl font-semibold text-white mb-4">Generated Report</h2>
                {isLoading && <p className="text-gray-400">Generating report, please wait...</p>}
                <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                    {generatedReport}
                </div>
            </div>
        </div>
    );
};

export default ReportsTab;
