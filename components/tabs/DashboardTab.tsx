
import React, { useMemo, useRef, useState } from 'react';
import { AppState, Document, GeneratedDocument, DocumentAnalysisResults, CaseSummary, ActiveTab, DocumentAnalysisResult, CaseEntity, Notification, StructuredEvent, StructuredAct, StructuredParticipant } from '../../types';
import SimpleDonutChart from '../ui/charts/SimpleDonutChart';
import SimpleBarChart from '../ui/charts/SimpleBarChart';
import Tooltip from '../ui/Tooltip';
import LoadingSpinner from '../ui/LoadingSpinner';
import { ExportService } from '../../services/exportService';

interface DashboardTabProps {
    appState: AppState;
    setCaseDescription: (desc: string) => void;
    setActiveTab: (tab: ActiveTab) => void;
    onResetCase: () => void;
    onExportCase: () => void;
    onImportCase: (file: File) => void;
    onPerformOverallAnalysis: () => void;
    addNotification: (message: string, type?: Notification['type'], duration?: number, details?: string) => void;
    onViewDocumentDetails: (docId: string) => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
    appState, setCaseDescription, setActiveTab,
    onResetCase, onExportCase, onImportCase, onPerformOverallAnalysis, addNotification,
    onViewDocumentDetails
}) => {
    const { 
        documents, generatedDocuments, documentAnalysisResults, caseContext, 
        caseSummary, isLoading, loadingSection, caseEntities, timelineEvents 
    } = appState;
    const { caseDescription } = caseContext;

    const importInputRef = useRef<HTMLInputElement>(null);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);


    const handleImportClick = () => {
        importInputRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onImportCase(file);
        }
    };

    const docStatusData = useMemo(() => {
        const classified = documents.filter(d => d.classificationStatus === 'classified').length;
        const unclassified = documents.filter(d => d.classificationStatus === 'unclassified').length;
        const error = documents.filter(d => d.classificationStatus === 'error').length;
        return [
            { label: 'Analysiert', value: classified, color: '#3b82f6' },
            { label: 'Unanalysiert', value: unclassified, color: '#6b7280' },
            { label: 'Fehler', value: error, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [documents]);

    const entityTypeData = useMemo(() => {
        const counts = caseEntities.reduce((acc, entity) => {
            acc[entity.type] = (acc[entity.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }, [caseEntities]);

    const structuredData = useMemo(() => {
        const allEvents: (StructuredEvent & { docId: string, docName: string })[] = [];
        const actTypeCounts: Record<string, number> = {};
        const participantCounts: Record<string, { count: number, roles: Set<string> }> = {};

        Object.values(documentAnalysisResults).forEach(result => {
            if (!result) return;
            
            // Fix: Explicitly cast 'result' to 'DocumentAnalysisResult' to resolve type inference issues where 'result' was being treated as 'unknown'.
            const analysisResult = result as DocumentAnalysisResult;

            const doc = documents.find(d => d.id === analysisResult.docId);
            if (!doc) return;

            (analysisResult.structuredEvents || []).forEach(event => {
                allEvents.push({ ...event, docId: doc.id, docName: doc.name });
            });
            (analysisResult.structuredActs || []).forEach(act => {
                actTypeCounts[act.actType] = (actTypeCounts[act.actType] || 0) + 1;
            });
            (analysisResult.structuredParticipants || []).forEach(p => {
                if (!participantCounts[p.name]) {
                    participantCounts[p.name] = { count: 0, roles: new Set() };
                }
                participantCounts[p.name].count++;
                participantCounts[p.name].roles.add(p.role);
            });
        });

        const recentEvents = allEvents.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).slice(0, 5);
        const topActs = Object.entries(actTypeCounts).sort(([,a],[,b]) => b - a).slice(0, 5);
        const topParticipants = Object.entries(participantCounts).sort(([,a],[,b]) => b.count - a.count).slice(0, 5);

        return { recentEvents, topActs, topParticipants };
    }, [documentAnalysisResults, documents]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Dokumente</h3>
                    <p className="text-4xl font-bold text-white">{documents.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Entitäten</h3>
                    <p className="text-4xl font-bold text-white">{caseEntities.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-300">Generierte Dokumente</h3>
                    <p className="text-4xl font-bold text-white">{generatedDocuments.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                     <h3 className="text-lg font-semibold text-gray-300">Fall-Verwaltung</h3>
                     <div className="mt-4 flex flex-wrap gap-2">
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
                         <Tooltip text="Importiert einen Fall aus einer JSON-Datei. Achtung: Der aktuelle Fall wird überschrieben.">
                           <button onClick={handleImportClick} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md text-sm">Import</button>
                        </Tooltip>
                         <div className="relative inline-block text-left">
                            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-sm">
                                Exportieren...
                            </button>
                            {isExportMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" onClick={(e) => { e.preventDefault(); onExportCase(); setIsExportMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" role="menuitem">Gesamten Fall (.json)</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); ExportService.exportEntitiesToCSV(caseEntities); setIsExportMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" role="menuitem">Entitäten (.csv)</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); ExportService.exportTimelineToCSV(timelineEvents, documents); setIsExportMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" role="menuitem">Chronologie (.csv)</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); ExportService.exportStructuredDataToCSV(documents, documentAnalysisResults); setIsExportMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" role="menuitem">Strukturierte Daten (.csv)</a>
                                    </div>
                                </div>
                            )}
                        </div>
                         <Tooltip text="Löscht alle Daten des aktuellen Falls unwiderruflich.">
                            <button onClick={onResetCase} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm">Reset</button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-white">Dokumenten-Status</h3>
                     {documents.length > 0 ? <SimpleDonutChart data={docStatusData} /> : <p className="text-center text-gray-500 pt-16">Keine Dokumente</p>}
                </div>
                 <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                     <h3 className="text-xl font-semibold mb-3 text-white">Entitäten-Übersicht</h3>
                     {caseEntities.length > 0 ? <SimpleBarChart data={entityTypeData} /> : <p className="text-center text-gray-500 pt-16">Keine Entitäten</p>}
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Neueste extrahierte Ereignisse</h3>
                    <div className="space-y-3">
                        {structuredData.recentEvents.length > 0 ? structuredData.recentEvents.map((event, i) => (
                             <div key={i} className="p-2 bg-gray-700/50 rounded-md">
                                <p className="text-sm font-semibold text-gray-200 truncate">{event.title}</p>
                                <div className="text-xs text-gray-400 flex justify-between items-center mt-1">
                                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                    <button onClick={() => onViewDocumentDetails(event.docId)} className="hover:underline text-blue-400">Quelle</button>
                                </div>
                             </div>
                        )) : <p className="text-center text-gray-500 pt-8">Keine Ereignisse extrahiert.</p>}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Extrahierte Handlungen (Typen)</h3>
                     <div className="space-y-2">
                         {structuredData.topActs.length > 0 ? structuredData.topActs.map(([type, count], i) => (
                             <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-700/50 rounded-md">
                                <span className="text-gray-300">{type}</span>
                                <span className="font-bold text-white bg-gray-600 px-2 py-0.5 rounded-full text-xs">{count}</span>
                             </div>
                         )) : <p className="text-center text-gray-500 pt-8">Keine Handlungen extrahiert.</p>}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-white">Schlüsselbeteiligte</h3>
                     <div className="space-y-2">
                        {structuredData.topParticipants.length > 0 ? structuredData.topParticipants.map(([name, data], i) => (
                            <div key={i} className="p-2 bg-gray-700/50 rounded-md">
                                <p className="text-sm font-semibold text-gray-200 truncate">{name}</p>
                                <p className="text-xs text-gray-400 capitalize">{Array.from(data.roles).join(', ')}</p>
                            </div>
                        )) : <p className="text-center text-gray-500 pt-8">Keine Beteiligten extrahiert.</p>}
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
                         <Tooltip text="Führt eine KI-basierte Gesamtanalyse des Falls durch, um eine Zusammenfassung, Risiken und nächste Schritte zu identifizieren.">
                            <button
                                onClick={onPerformOverallAnalysis}
                                disabled={isLoading && loadingSection === 'case_analysis'}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isLoading && loadingSection === 'case_analysis' && <LoadingSpinner className="h-4 w-4 mr-2" />}
                                {isLoading && loadingSection === 'case_analysis' ? 'Analysiere...' : 'Analyse durchführen'}
                            </button>
                        </Tooltip>
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
                                    {(caseSummary?.identifiedRisks || []).map((r, i) => <li key={i}><strong>{r.risk}:</strong> {r.description}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-300">Vorgeschlagene nächste Schritte</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {(caseSummary?.suggestedNextSteps || []).map((s, i) => <li key={i}><strong>{s.step}:</strong> {s.justification}</li>)}
                                </ul>
                            </div>
                            <p className="text-xs text-gray-500 text-right pt-2">Generiert am: {new Date(caseSummary.generatedAt).toLocaleString()}</p>
                        </div>
                    ) : (
                         <div className="text-center py-8 text-gray-500">
                             {isLoading && loadingSection === 'case_analysis' 
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
