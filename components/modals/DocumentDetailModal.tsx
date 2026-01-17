
import React, { useState, useRef } from 'react';
import type { Document, DocumentAnalysisResult, KnowledgeItem, ActiveTab, StructuredEvent, StructuredAct, StructuredParticipant } from '../../types';

interface DocumentDetailModalProps {
    document: Document;
    analysisResult: DocumentAnalysisResult | null;
    onClose: () => void;
    onAddKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
    setActiveTab: (tab: ActiveTab) => void;
}

const StructuredDataDisplay: React.FC<{ analysis: DocumentAnalysisResult }> = ({ analysis }) => {
    const { structuredEvents, structuredActs, structuredParticipants } = analysis;

    if (!structuredEvents?.length && !structuredActs?.length && !structuredParticipants?.length) {
        return null;
    }

    return (
        <div className="bg-gray-700/50 p-3 rounded-md">
            <h3 className="font-semibold text-gray-300 text-sm mb-2">Extrahierte Strukturdaten</h3>
            <div className="space-y-3">
                {structuredEvents && structuredEvents.length > 0 && (
                    <div>
                        <h4 className="font-bold text-xs text-gray-400">Ereignisse</h4>
                        {structuredEvents.map((event, i) => (
                            <div key={i} className="text-xs text-gray-300 mt-1 p-2 bg-gray-800/50 rounded">
                                <p><strong>Titel:</strong> {event.title}</p>
                                <p><strong>Datum:</strong> {event.startDate}</p>
                                <p><strong>Ort:</strong> {event.location}</p>
                            </div>
                        ))}
                    </div>
                )}
                 {structuredActs && structuredActs.length > 0 && (
                    <div>
                        <h4 className="font-bold text-xs text-gray-400">Handlungen (Akte)</h4>
                        {structuredActs.map((act, i) => (
                             <div key={i} className="text-xs text-gray-300 mt-1 p-2 bg-gray-800/50 rounded">
                                <p><strong>Opfer:</strong> {act.victimName}</p>
                                <p><strong>Verletzung:</strong> {act.actType}</p>
                            </div>
                        ))}
                    </div>
                )}
                 {structuredParticipants && structuredParticipants.length > 0 && (
                    <div>
                        <h4 className="font-bold text-xs text-gray-400">Beteiligte</h4>
                         {structuredParticipants.map((p, i) => (
                             <div key={i} className="text-xs text-gray-300 mt-1 p-2 bg-gray-800/50 rounded">
                                <p><strong>Name:</strong> {p.name}</p>
                                <p><strong>Rolle:</strong> {p.role}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, analysisResult, onClose, onAddKnowledgeItem, setActiveTab }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, text: string } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 10) {
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                text: selectedText
            });
        } else {
            setContextMenu(null);
        }
    };
    
    const handleCreateKnowledgeItem = () => {
        if (!contextMenu) return;
        const title = prompt("Titel für den neuen Wissenseintrag:", contextMenu.text.substring(0, 50) + "...");
        if (title) {
            onAddKnowledgeItem({
                title: title,
                summary: contextMenu.text,
                sourceDocId: document.id,
                tags: []
            });
            setActiveTab('knowledge');
            onClose();
        }
        setContextMenu(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setContextMenu(null)}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-gray-700" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white truncate pr-4">Dokumentendetails: {document.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="flex-grow p-6 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Metadata & Analysis */}
                    <div className="md:col-span-1 space-y-4 overflow-y-auto custom-scrollbar">
                        <div className="bg-gray-700/50 p-3 rounded-md">
                            <h3 className="font-semibold text-gray-300 text-sm mb-2">Metadaten</h3>
                            <p className="text-xs text-gray-400"><strong>MIME-Typ:</strong> {document.mimeType}</p>
                            <p className="text-xs text-gray-400"><strong>Erstellt am:</strong> {new Date(document.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-gray-400"><strong>Status:</strong> {document.classificationStatus}</p>
                            <p className="text-xs text-gray-400"><strong>Arbeitskategorie:</strong> {analysisResult?.classification || 'N/A'}</p>
                        </div>

                        {analysisResult && <StructuredDataDisplay analysis={analysisResult} />}

                        {analysisResult && (
                             <div className="bg-gray-700/50 p-3 rounded-md">
                                <h3 className="font-semibold text-gray-300 text-sm mb-2">Analyse-Ergebnisse</h3>
                                 
                                {analysisResult.causalityMap && (
                                    <div className={`mb-3 p-3 rounded border ${analysisResult.causalityMap.zersetzungDetected ? 'bg-red-900/30 border-red-500/50' : 'bg-green-900/30 border-green-500/50'}`}>
                                        <h4 className={`font-bold text-xs uppercase ${analysisResult.causalityMap.zersetzungDetected ? 'text-red-400' : 'text-green-400'}`}>
                                            {analysisResult.causalityMap.zersetzungDetected ? '⚠️ Zersetzung erkannt' : '✅ Kausalität unauffällig'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Logic-Engine Check (Modul 2): {analysisResult.causalityMap.nodes.length} Knoten geprüft.
                                        </p>
                                    </div>
                                )}

                                 <div>
                                    <h4 className="font-bold text-xs text-gray-400">Zusammenfassung</h4>
                                    <p className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">{analysisResult.summary}</p>
                                </div>
                                {analysisResult.workloadEstimate && (
                                    <div className="mt-3">
                                        <h4 className="font-bold text-xs text-gray-400">Aufwandsschätzung</h4>
                                        <p className="text-xs text-gray-300 mt-1">
                                            <strong>Gesamtstunden:</strong> {analysisResult.workloadEstimate.totalHours}h
                                        </p>
                                        <p className="text-xs text-gray-300">
                                            <strong>Komplexität:</strong> {analysisResult.workloadEstimate.complexity}
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-gray-400 mt-1 space-y-1">
                                            {analysisResult.workloadEstimate.breakdown.map((item, i) => (
                                                <li key={i}>{item.task}: {item.hours}h</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysisResult.costEstimate && (
                                    <div className="mt-3">
                                        <h4 className="font-bold text-xs text-gray-400">Kostenschätzung (nach JVEG/RVG)</h4>
                                         <p className="text-xs text-gray-300 mt-1">
                                            <strong>Empfohlen:</strong> {analysisResult.costEstimate.recommended.toFixed(2)} €
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            (Min: {analysisResult.costEstimate.min.toFixed(2)} € - Max: {analysisResult.costEstimate.max.toFixed(2)} €)
                                        </p>
                                        <ul className="list-disc list-inside text-xs text-gray-400 mt-1 space-y-1">
                                            {analysisResult.costEstimate.details.map((item, i) => (
                                                <li key={i}>{item.item}: {item.cost.toFixed(2)} €</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Content */}
                    <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-md border border-gray-700 overflow-hidden flex flex-col">
                         <h3 className="font-semibold text-gray-300 text-sm mb-2">Inhalt</h3>
                        <div 
                            ref={contentRef}
                            onMouseUp={handleMouseUp}
                            className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap overflow-y-auto flex-grow custom-scrollbar"
                         >
                           {document.textContent || "Vorschau für diesen Dateityp nicht verfügbar."}
                        </div>
                    </div>
                </div>
                 <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Schließen</button>
                </footer>
            </div>
             {contextMenu && (
                <div 
                    style={{ top: `${contextMenu.y + 5}px`, left: `${contextMenu.x}px` }} 
                    className="fixed bg-gray-900 border border-gray-600 rounded-md shadow-lg z-50 py-1"
                >
                    <button 
                        onClick={handleCreateKnowledgeItem} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-blue-600"
                    >
                        Als Wissen speichern
                    </button>
                </div>
            )}
        </div>
    );
};

export default DocumentDetailModal;
