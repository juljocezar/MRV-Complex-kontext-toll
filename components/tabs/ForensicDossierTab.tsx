
import React, { useState, useMemo } from 'react';
import { AppState, ForensicDossier, KnowledgeItem } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import Icon from '../ui/Icon';

interface ForensicDossierTabProps {
    appState: AppState;
    onSaveDossier: (dossier: ForensicDossier) => void;
}

const parseViolationItem = (item: KnowledgeItem) => {
    const lines = item.summary.split('\n');
    const getVal = (key: string) => lines.find(l => l.startsWith(key))?.split(': ')[1] || '-';
    
    return {
        id: item.id,
        type: item.title.replace('Verstoß: ', ''),
        date: getVal('Datum'),
        location: getVal('Ort'),
        details: getVal('Details'),
        victims: getVal('Betroffen'),
        sourceDocId: item.sourceDocId
    };
};

const ForensicDossierTab: React.FC<ForensicDossierTabProps> = ({ appState, onSaveDossier }) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedViolationId, setSelectedViolationId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const violations = useMemo(() => {
        return appState.knowledgeItems
            .filter(k => k.tags.includes('ESF-Violation'))
            .map(parseViolationItem);
    }, [appState.knowledgeItems]);

    const activeEvent = useMemo(() => {
        if (!selectedEventId) return null;
        return appState.esfEvents.find(e => e.eventRecordNumber === selectedEventId);
    }, [selectedEventId, appState.esfEvents]);

    const relatedActs = useMemo(() => {
        if (!selectedEventId) return [];
        return appState.esfActLinks.filter(a => a.eventId === selectedEventId);
    }, [selectedEventId, appState.esfActLinks]);

    const relatedInvolvements = useMemo(() => {
        if (!selectedEventId) return [];
        // Map involvements to this event context
        return appState.esfInvolvementLinks.filter(inv => 
            inv.toRecordId === selectedEventId || 
            relatedActs.some(act => act.fromRecordId === inv.toRecordId) // Assuming To -> Act
        );
    }, [selectedEventId, appState.esfInvolvementLinks, relatedActs]);

    const getPersonName = (id: string) => {
        const p = appState.esfPersons.find(person => person.personRecordNumber === id);
        return p ? p.fullNameOrGroupName : id;
    };

    const getDocName = (id: string) => appState.documents.find(d => d.id === id)?.name || 'Unbekannt';

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            const newDossier: ForensicDossier = {
                id: crypto.randomUUID(),
                title: activeEvent ? `Dossier: ${activeEvent.eventTitle}` : 'Gesamtfall Dossier',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                selectedDocIds: [], 
                analysis: {
                    rootCause: 'Generiert aus ESF-Datenbank.',
                    incidentTimeline: 'Siehe strukturierte Daten.',
                    systemImpact: 'Zu prüfen.',
                    causalChain: []
                },
                remediation: null
            };
            onSaveDossier(newDossier);
            setIsExporting(false);
        }, 800);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex-shrink-0 bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Icon name="audit" className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Forensische Beweis-Matrix</h2>
                        <p className="text-xs text-gray-400">Verknüpfung von Fakten (Links) und Strukturdaten (Rechts)</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 uppercase font-bold tracking-wider">Fokus-Event:</span>
                    <select 
                        value={selectedEventId || ''} 
                        onChange={e => setSelectedEventId(e.target.value || null)}
                        className="bg-gray-700 text-white text-sm p-2 rounded border border-gray-600 focus:ring-2 focus:ring-indigo-500 min-w-[300px]"
                    >
                        <option value="">-- Übersicht / Alle --</option>
                        {appState.esfEvents.map(evt => (
                            <option key={evt.eventRecordNumber} value={evt.eventRecordNumber}>
                                {evt.eventTitle || `Event ${evt.eventRecordNumber}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
                
                {/* Left: Violations List */}
                <div className="lg:w-1/2 flex flex-col bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                    <div className="p-3 border-b border-gray-700 bg-gray-700/30 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-200 text-sm">Faktentabelle (Violations)</h3>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">{violations.length}</span>
                    </div>
                    <div className="flex-grow overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700/50 text-xs uppercase font-medium text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
                                <tr>
                                    <th className="px-4 py-3">Verstoß</th>
                                    <th className="px-4 py-3">Datum / Ort</th>
                                    <th className="px-4 py-3">Betroffen</th>
                                    <th className="px-4 py-3 text-right">Quelle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {violations.map(v => (
                                    <tr 
                                        key={v.id} 
                                        onClick={() => setSelectedViolationId(v.id)}
                                        className={`cursor-pointer hover:bg-gray-700/50 transition-colors ${selectedViolationId === v.id ? 'bg-indigo-900/30 border-l-2 border-indigo-500' : ''}`}
                                    >
                                        <td className="px-4 py-3 font-medium text-white">{v.type}</td>
                                        <td className="px-4 py-3 text-xs">
                                            <div className="text-gray-200">{v.date}</div>
                                            <div className="text-gray-500">{v.location}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs truncate max-w-[150px]" title={v.victims}>{v.victims}</td>
                                        <td className="px-4 py-3 text-right text-xs text-blue-400 truncate max-w-[100px]" title={getDocName(v.sourceDocId)}>{getDocName(v.sourceDocId)}</td>
                                    </tr>
                                ))}
                                {violations.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                                            Keine Verstöße extrahiert.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Matrix / Details */}
                <div className="lg:w-1/2 flex flex-col bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
                    <div className="p-3 border-b border-gray-700 bg-gray-700/30">
                        <h3 className="font-semibold text-gray-200 text-sm">ESF Struktur-Matrix</h3>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar bg-gray-900/20">
                        {activeEvent ? (
                            <>
                                {/* Event Card */}
                                <div className="space-y-1">
                                    <div className="flex items-baseline justify-between">
                                        <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">HURIDOCS Event (100er)</h4>
                                        <span className="text-[10px] font-mono text-gray-600">{activeEvent.eventRecordNumber}</span>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500 shadow">
                                        <h3 className="text-lg font-bold text-white mb-1">{activeEvent.eventTitle}</h3>
                                        <div className="flex gap-4 text-xs text-gray-400 mb-3">
                                            <span>📅 {activeEvent.startDate}</span>
                                            <span>📍 {activeEvent.localGeoArea || activeEvent.geoTerm || 'Unbekannt'}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{activeEvent.description}</p>
                                    </div>
                                </div>

                                {/* Acts Timeline */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                        <span>⚡</span> Handlungen / Acts (2100er)
                                    </h4>
                                    {relatedActs.length > 0 ? (
                                        <div className="space-y-3 pl-2 border-l border-gray-700">
                                            {relatedActs.map(act => (
                                                <div key={act.id} className="relative pl-4">
                                                    <div className="absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full bg-orange-500 border border-gray-900"></div>
                                                    <div className="bg-gray-800 p-3 rounded border border-gray-700 hover:border-orange-500/50 transition-colors">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-bold text-orange-200 text-sm">{act.actClassification}</span>
                                                            <span className="text-[10px] font-mono text-gray-500">{act.fromRecordId}</span>
                                                        </div>
                                                        <div className="text-xs space-y-1 text-gray-300">
                                                            <p><span className="text-gray-500">Methode:</span> {act.actMethod || '-'}</p>
                                                            <p><span className="text-gray-500">Opfer:</span> <span className="text-indigo-300">{getPersonName(act.toRecordId)}</span></p>
                                                            {act.actDescription && <p className="italic text-gray-400 mt-2 border-t border-gray-700 pt-1">"{act.actDescription}"</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic p-3 border border-dashed border-gray-700 rounded text-center">Keine spezifischen Acts verknüpft.</p>
                                    )}
                                </div>

                                {/* Involvements */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-2">
                                        <span>👥</span> Beteiligte / Involvements
                                    </h4>
                                    {relatedInvolvements.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {relatedInvolvements.map(inv => (
                                                <div key={inv.id} className="bg-gray-800 px-3 py-2 rounded border-l-2 border-blue-500 flex justify-between items-center shadow-sm">
                                                    <div>
                                                        <span className="font-bold text-gray-200 text-sm block">{getPersonName(inv.fromRecordId)}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{inv.involvementRole || 'Beteiligter'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded">
                                                        {inv.toRecordId === activeEvent.eventRecordNumber ? 'Direkt Event' : 'Via Act'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 italic">Keine weiteren Beteiligten.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <Icon name="audit" className="h-16 w-16 mb-4 text-gray-600" />
                                <p>Wählen Sie ein Event aus,</p>
                                <p className="text-xs">um die Beweis-Matrix zu laden.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 pt-2 flex justify-end gap-4 border-t border-gray-800">
                <button 
                    onClick={handleExport}
                    disabled={isExporting || !activeEvent}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow-lg shadow-indigo-500/20 disabled:bg-gray-700 disabled:text-gray-500 transition-all flex items-center gap-2"
                >
                    {isExporting ? <LoadingSpinner className="h-4 w-4" /> : <span>💾</span>}
                    {isExporting ? 'Erstelle Dossier...' : 'In Dossier übernehmen'}
                </button>
            </div>
        </div>
    );
};

export default ForensicDossierTab;
