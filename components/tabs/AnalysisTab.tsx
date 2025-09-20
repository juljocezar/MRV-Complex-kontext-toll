import React from 'react';
import { Document, DocumentAnalysisResults, DetailedAnalysisResults } from '../../types';

interface AnalysisTabProps {
    documents: Document[];
    documentAnalysisResults: DocumentAnalysisResults;
    detailedAnalysisResults: DetailedAnalysisResults;
    onPerformDetailedAnalysis: (docId: string) => void;
    onAnalyzeCorrespondence: (docId: string) => void;
    isLoading: boolean;
    loadingSection: string;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({
    documents,
    documentAnalysisResults,
    detailedAnalysisResults,
    onPerformDetailedAnalysis,
    onAnalyzeCorrespondence,
    isLoading,
    loadingSection
}) => {
    const classifiedDocuments = documents.filter(doc => doc.classificationStatus === 'classified');

    const renderWorkloadAnalysis = (docId: string) => {
        const analysis = documentAnalysisResults[docId];
        if (!analysis) return <p className="text-gray-500">Keine Aufwandsanalyse verfügbar.</p>;

        return (
            <div className="space-y-2 text-sm">
                <p><strong>Komplexität:</strong> <span className="capitalize">{analysis.complexity}</span> ({analysis.complexityJustification})</p>
                <p><strong>Geschätzter Aufwand:</strong> {analysis.workloadEstimate.total} Stunden</p>
                <p><strong>Dokumententyp:</strong> {analysis.documentType}</p>
                 <div>
                    <strong>Empfehlungen:</strong>
                    <ul className="list-disc list-inside pl-4 text-gray-400">
                        {analysis.recommendations.map((rec, i) => <li key={i}>{rec.text} (Dringlichkeit: {rec.urgency})</li>)}
                    </ul>
                </div>
                {analysis.suggestedActions && analysis.suggestedActions.length > 0 && (
                    <div className="mt-2">
                        <strong>Vorgeschlagene nächste Schritte:</strong>
                        <ul className="list-disc list-inside pl-4 text-gray-400">
                            {analysis.suggestedActions.map((action, i) => <li key={i}>{action}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderDetailedAnalysis = (docId: string) => {
        const analysis = detailedAnalysisResults[docId];
        const correspondenceAnalysis = analysis?.correspondenceAnalysis;

        return (
            <div className="mt-4">
                {!analysis ? (
                     <div className="text-center py-4">
                        <button 
                           onClick={() => onPerformDetailedAnalysis(docId)}
                           disabled={isLoading && loadingSection === `detailed-${docId}`}
                           className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed"
                       >
                           {isLoading && loadingSection === `detailed-${docId}` ? 'Analysiere...' : 'Detaillierte Analyse starten'}
                       </button>
                   </div>
                ) : (
                    <div className="space-y-3 text-sm">
                        <p><strong>Sentiment:</strong> <span className="capitalize">{analysis.sentiment}</span></p>
                        <div>
                            <strong>Schlüsselwörter:</strong>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(analysis.schlüsselwörter || []).map(kw => <span key={kw} className="bg-gray-600 px-2 py-1 rounded text-xs">{kw}</span>)}
                            </div>
                        </div>
                        <div>
                            <strong>Zentrale Fakten:</strong>
                            <ul className="list-disc list-inside pl-4 text-gray-400">{(analysis.zentrale_fakten || []).map((fact, i) => <li key={i}>{fact}</li>)}</ul>
                        </div>
                         <div>
                            <strong>Beteiligte Parteien:</strong>
                            <ul className="list-disc list-inside pl-4 text-gray-400">{(analysis.beteiligte_parteien || []).map((p, i) => <li key={i}>{p.name} ({p.type})</li>)}</ul>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-600 pt-3 mt-4">
                    <h5 className="font-semibold text-gray-300 mb-2">Spezialanalyse: Behördenschreiben</h5>
                    {correspondenceAnalysis ? (
                        <div className="space-y-2 text-xs text-gray-400">
                             <p><strong>Absicht:</strong> {correspondenceAnalysis.intent}</p>
                             <p><strong>Risiko:</strong> {correspondenceAnalysis.riskAssessment}</p>
                             <div>
                                <strong>Erkenntnisse:</strong>
                                <ul className="list-disc list-inside pl-4">{correspondenceAnalysis.findings.map((f, i) => <li key={i}>{f}</li>)}</ul>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => onAnalyzeCorrespondence(docId)}
                            disabled={isLoading && loadingSection === `correspondence-${docId}`}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-xs disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                             {isLoading && loadingSection === `correspondence-${docId}` ? '...' : 'Kritisch prüfen'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Analyse-Zentrum</h1>
            <p className="text-gray-400">Hier sehen Sie die Ergebnisse der KI-gestützten Dokumentenanalyse.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {classifiedDocuments.map(doc => (
                    <div key={doc.id} className="bg-gray-800 p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-blue-400 mb-3">{doc.name}</h3>
                        
                        <div className="border-b border-gray-700 pb-4">
                            <h4 className="font-bold text-gray-300 mb-2">Aufwandsanalyse</h4>
                            {renderWorkloadAnalysis(doc.id)}
                        </div>

                        <div className="pt-4">
                             <h4 className="font-bold text-gray-300 mb-2">Inhaltsanalyse</h4>
                             {renderDetailedAnalysis(doc.id)}
                        </div>
                    </div>
                ))}
            </div>

            {classifiedDocuments.length === 0 && (
                <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <p className="text-gray-500">Keine Dokumente zur Analyse verfügbar.</p>
                    <p className="text-gray-500 text-sm mt-1">Bitte laden Sie Dokumente hoch und starten Sie die Analyse im "Dokumente"-Tab.</p>
                </div>
            )}
        </div>
    );
};

export default AnalysisTab;