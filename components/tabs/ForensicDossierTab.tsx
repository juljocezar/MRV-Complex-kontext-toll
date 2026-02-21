
import React, { useState, useMemo } from 'react';
import { AppState, ForensicDossier } from '../../types';
import { EsfActRecord, EsfInvolvementRecord, EsfPersonRecord } from '../../types/esf';
import LoadingSpinner from '../ui/LoadingSpinner';
import Icon from '../ui/Icon';

interface ForensicDossierTabProps {
    appState: AppState;
    onSaveDossier: (dossier: ForensicDossier) => void;
}

const ForensicDossierTab: React.FC<ForensicDossierTabProps> = ({ appState, onSaveDossier }) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // --- Data Selectors ---
    const activeEvent = useMemo(() => {
        if (!selectedEventId) return null;
        return appState.esfEvents.find(e => e.recordNumber === selectedEventId);
    }, [selectedEventId, appState.esfEvents]);

    const eventActs = useMemo(() => {
        if (!selectedEventId) return [];
        return appState.esfActLinks.filter(a => a.eventId === selectedEventId);
    }, [selectedEventId, appState.esfActLinks]);

    const eventInformations = useMemo(() => {
        if (!selectedEventId) return [];
        return appState.esfInformationLinks.filter(i => i.eventId === selectedEventId);
    }, [selectedEventId, appState.esfInformationLinks]);

    const eventInterventions = useMemo(() => {
        if (!selectedEventId) return [];
        return appState.esfInterventionLinks.filter(i => i.eventId === selectedEventId);
    }, [selectedEventId, appState.esfInterventionLinks]);

    // Helper to find Person details
    const getPerson = (recordNumber: string): EsfPersonRecord | undefined => {
        return appState.esfPersons.find(p => p.recordNumber === recordNumber);
    };

    // Helper to find Perpetrators involved in a specific Act
    const getPerpetratorsForAct = (actId: string): { involvement: EsfInvolvementRecord, person?: EsfPersonRecord }[] => {
        return appState.esfInvolvementLinks
            .filter(inv => inv.actId === actId)
            .map(inv => ({
                involvement: inv,
                person: getPerson(inv.perpetratorId)
            }));
    };

    const handleExport = () => {
        setIsExporting(true);
        // Simulation of export process
        setTimeout(() => {
            const newDossier: ForensicDossier = {
                id: crypto.randomUUID(),
                title: activeEvent ? `Dossier: ${activeEvent.eventTitle}` : 'Fall Dossier',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                selectedDocIds: [], 
                analysis: null,
                remediation: null
            };
            onSaveDossier(newDossier);
            setIsExporting(false);
        }, 800);
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            
            {/* LEFT COLUMN: Event Navigator */}
            <div className="w-1/4 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50 rounded-t-lg">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <Icon name="chronology" className="w-4 h-4 text-indigo-400"/>
                        Ereignisse (100er)
                    </h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                    {appState.esfEvents.length === 0 && <p className="text-gray-500 text-sm p-4 text-center">Keine Ereignisse extrahiert.</p>}
                    {appState.esfEvents.map(evt => (
                        <button
                            key={evt.recordNumber}
                            onClick={() => setSelectedEventId(evt.recordNumber)}
                            className={`w-full text-left p-3 rounded-md border transition-all ${
                                selectedEventId === evt.recordNumber 
                                ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                                : 'bg-gray-700/30 border-gray-700 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-sm truncate pr-2">{evt.eventTitle}</span>
                                <span className="text-[10px] font-mono opacity-50">{evt.recordNumber}</span>
                            </div>
                            <div className="text-xs opacity-70 flex justify-between">
                                <span>{evt.startDate || 'Datum unbekannt'}</span>
                                {evt.violationStatus && <span className="uppercase font-bold tracking-wider text-[10px]">{evt.violationStatus}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: The Matrix (Details) */}
            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
                {!activeEvent ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <Icon name="audit" className="w-16 h-16 mb-4 opacity-20"/>
                        <p>Wählen Sie ein Ereignis aus, um die forensische Matrix zu laden.</p>
                    </div>
                ) : (
                    <>
                        {/* Event Header */}
                        <div className="p-6 border-b border-gray-700 bg-gray-900/30 flex-shrink-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-2">{activeEvent.eventTitle}</h1>
                                    <div className="flex gap-4 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">📍 {activeEvent.geoTerm} {activeEvent.localGeoArea ? `/ ${activeEvent.localGeoArea}` : ''}</span>
                                        <span className="flex items-center gap-1">📅 {activeEvent.startDate} {activeEvent.endDate ? `- ${activeEvent.endDate}` : ''}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isExporting ? <LoadingSpinner className="w-3 h-3"/> : '💾'} Dossier speichern
                                </button>
                            </div>
                            {activeEvent.description && (
                                <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700 text-gray-300 text-sm leading-relaxed">
                                    {activeEvent.description}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            
                            {/* SECTION: ACTS (The core violations) */}
                            <div>
                                <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                                    <span>⚡</span> Handlungen / Acts (2100er)
                                </h3>
                                
                                {eventActs.length === 0 ? (
                                    <p className="text-gray-500 italic text-sm">Keine spezifischen Handlungen verknüpft.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {eventActs.map(act => {
                                            const victim = getPerson(act.victimId);
                                            const perps = getPerpetratorsForAct(act.recordNumber);

                                            return (
                                                <div key={act.id} className="bg-gray-700/20 border border-gray-700 rounded-lg overflow-hidden">
                                                    {/* Act Header */}
                                                    <div className="bg-gray-700/40 p-3 flex justify-between items-center border-b border-gray-700">
                                                        <span className="font-bold text-orange-200">{act.actType}</span>
                                                        <span className="text-xs text-gray-500 font-mono">{act.recordNumber}</span>
                                                    </div>
                                                    
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Act Details */}
                                                        <div className="space-y-2 text-sm text-gray-300">
                                                            <p><strong className="text-gray-500">Methode:</strong> {act.method || '-'}</p>
                                                            <p><strong className="text-gray-500">Ort:</strong> {act.location || '-'}</p>
                                                            <p><strong className="text-gray-500">Folgen:</strong> {act.physicalConsequences || act.psychologicalConsequences || '-'}</p>
                                                            
                                                            {/* Nested Details (Torture/Detention) */}
                                                            {act.tortureDetails && (
                                                                <div className="mt-2 p-2 bg-red-900/10 border border-red-900/30 rounded text-xs">
                                                                    <p className="font-bold text-red-400 mb-1">Details zu Folter (3300)</p>
                                                                    <p>Absicht: {act.tortureDetails.intent}</p>
                                                                </div>
                                                            )}
                                                            {act.detentionDetails && (
                                                                <div className="mt-2 p-2 bg-blue-900/10 border border-blue-900/30 rounded text-xs">
                                                                    <p className="font-bold text-blue-400 mb-1">Details zu Haft (3100)</p>
                                                                    <p>Haftart: {act.detentionDetails.custodyType}</p>
                                                                    <p>Ort: {act.detentionDetails.conditions}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* People Involved (Victim & Perps) */}
                                                        <div className="space-y-3">
                                                            {/* Victim */}
                                                            <div className="flex items-center gap-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">O</div>
                                                                <div>
                                                                    <p className="text-xs text-blue-300 uppercase font-bold">Opfer</p>
                                                                    <p className="text-sm font-semibold text-white">{victim?.fullNameOrGroupName || act.victimId}</p>
                                                                </div>
                                                            </div>

                                                            {/* Perpetrators */}
                                                            {perps.length > 0 ? (
                                                                perps.map((p, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3 p-2 bg-red-500/10 rounded border border-red-500/20 ml-4 border-l-2 border-l-red-500">
                                                                        <div className="w-6 h-6 rounded-full bg-red-700 flex items-center justify-center text-white text-[10px]">T</div>
                                                                        <div>
                                                                            <p className="text-xs text-red-300 uppercase font-bold">Täter ({p.involvement.involvementRole || 'Beteiligt'})</p>
                                                                            <p className="text-sm text-gray-200">{p.person?.fullNameOrGroupName || p.involvement.perpetratorId}</p>
                                                                            {p.involvement.perpetratorType && <p className="text-xs text-gray-500">{p.involvement.perpetratorType}</p>}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="ml-4 p-2 text-xs text-gray-500 italic border-l-2 border-gray-700 pl-4">Keine Täter verknüpft (Unbekannt).</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* SECTION: SOURCES (Evidence) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2 border-b border-gray-700 pb-1">
                                        <span>📂</span> Quellen / Informationen (2500er)
                                    </h3>
                                    <div className="space-y-2">
                                        {eventInformations.map(info => {
                                            const source = getPerson(info.sourceId);
                                            return (
                                                <div key={info.id} className="p-3 bg-gray-900/30 rounded border border-gray-700 text-sm">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-green-200">{source?.fullNameOrGroupName || 'Unbekannte Quelle'}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                                            info.reliability === 'High' ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-500'
                                                        }`}>{info.reliability || 'Rel: Unbekannt'}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-xs mb-1">{info.sourceType} • {info.dateOfSource}</p>
                                                    {info.notes && <p className="text-gray-300 italic text-xs">"{info.notes}"</p>}
                                                </div>
                                            );
                                        })}
                                        {eventInformations.length === 0 && <p className="text-xs text-gray-500">Keine Quellen verknüpft.</p>}
                                    </div>
                                </div>

                                {/* SECTION: INTERVENTIONS (Responses) */}
                                <div>
                                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2 border-b border-gray-700 pb-1">
                                        <span>🛡️</span> Interventionen (2600er)
                                    </h3>
                                    <div className="space-y-2">
                                        {eventInterventions.map(int => {
                                            const actor = getPerson(int.intervenorId);
                                            return (
                                                <div key={int.id} className="p-3 bg-gray-900/30 rounded border border-gray-700 text-sm">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="font-bold text-purple-200">{actor?.fullNameOrGroupName || 'Akteur'}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">{int.date}</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-300 text-xs">{int.interventionType}</p>
                                                    <p className="text-gray-400 text-xs mt-1">Status: {int.status || 'Offen'}</p>
                                                    {int.response && <p className="text-gray-400 text-xs mt-1 border-t border-gray-700 pt-1">Antwort: {int.response}</p>}
                                                </div>
                                            );
                                        })}
                                        {eventInterventions.length === 0 && <p className="text-xs text-gray-500">Keine Interventionen verzeichnet.</p>}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForensicDossierTab;
