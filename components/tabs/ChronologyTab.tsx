
import React, { useState, useMemo } from 'react';
import type { TimelineEvent, AppState, StructuredEvent, StructuredAct, StructuredParticipant, DocumentAnalysisResult } from '../../types';
import Icon from '../ui/Icon';

interface ChronologyTabProps {
    appState: AppState;
    onUpdateTimelineEvents: (events: TimelineEvent[]) => void;
    onViewDocument: (docId: string) => void;
}

// Internal unified type for display purposes
interface UnifiedEvent {
    id: string;
    date: string;
    title: string;
    description: string;
    source: 'manual' | 'ai';
    documentIds: string[]; // For manual events
    sourceDocId?: string;  // For AI events
    sourceDocName?: string; // For AI events
    // Context data from the analysis result for AI events
    relatedActs?: StructuredAct[];
    relatedParticipants?: StructuredParticipant[];
}

const ChronologyTab: React.FC<ChronologyTabProps> = ({ appState, onUpdateTimelineEvents, onViewDocument }) => {
    const { timelineEvents, documentAnalysisResults, documents } = appState;
    const [newEvent, setNewEvent] = useState({ date: '', title: '', description: '', documentIds: [] as string[] });
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'manual' | 'ai'>('all');

    // Combine manual events and AI extracted events into one timeline
    const unifiedEvents: UnifiedEvent[] = useMemo(() => {
        const events: UnifiedEvent[] = [];

        // 1. Add Manual Events
        timelineEvents.forEach(evt => {
            events.push({
                id: evt.id,
                date: evt.date,
                title: evt.title,
                description: evt.description,
                source: 'manual',
                documentIds: evt.documentIds
            });
        });

        // 2. Add AI Extracted Events
        Object.entries(documentAnalysisResults).forEach(([docId, result]) => {
            // Explicit cast to handle possible unknown type inference from Object.entries
            const analysisResult = result as DocumentAnalysisResult | undefined;

            if (!analysisResult || !analysisResult.structuredEvents) return;
            
            const docName = documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

            analysisResult.structuredEvents.forEach((evt, index) => {
                events.push({
                    id: `ai-${docId}-${index}`, // Unique synthetic ID
                    date: evt.startDate, // structuredEvent uses startDate
                    title: evt.title,
                    description: evt.description,
                    source: 'ai',
                    documentIds: [],
                    sourceDocId: docId,
                    sourceDocName: docName,
                    relatedActs: analysisResult.structuredActs,
                    relatedParticipants: analysisResult.structuredParticipants
                });
            });
        });

        // Sort by date descending (newest first)
        return events.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA;
        });
    }, [timelineEvents, documentAnalysisResults, documents]);

    const filteredEvents = unifiedEvents.filter(e => filter === 'all' || e.source === filter);

    const handleAddEvent = () => {
        if (newEvent.date && newEvent.title) {
            onUpdateTimelineEvents([...timelineEvents, { ...newEvent, id: crypto.randomUUID() }]);
            setNewEvent({ date: '', title: '', description: '', documentIds: [] });
        }
    };
    
    const toggleEventDetails = (eventId: string) => {
        setExpandedEventId(prevId => (prevId === eventId ? null : eventId));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Ereignisprotokoll</h1>
                    <p className="text-gray-400">Chronologische Zusammenführung manueller Einträge und KI-extrahierter Daten.</p>
                </div>
                
                {/* Filter Controls */}
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Alle
                    </button>
                    <button 
                        onClick={() => setFilter('manual')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Manuell
                    </button>
                    <button 
                        onClick={() => setFilter('ai')}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === 'ai' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        KI-Extrahiert
                    </button>
                </div>
            </div>

             {/* Manual Entry Form */}
             <div className="bg-gray-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end border border-gray-700">
                 <div className="col-span-3 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-300">Datum</label>
                     <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="mt-1 w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-blue-500"/>
                 </div>
                 <div className="col-span-3 md:col-span-2">
                     <label className="block text-sm font-medium text-gray-300">Titel</label>
                     <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="mt-1 w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-blue-500" placeholder="Kurze Beschreibung des Ereignisses"/>
                 </div>
                 <div className="col-span-3">
                     <label className="block text-sm font-medium text-gray-300">Beschreibung</label>
                     <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={2} className="mt-1 w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-blue-500" placeholder="Details..."/>
                 </div>
                 <div className="col-span-3">
                    <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md w-full md:w-auto">Ereignis hinzufügen</button>
                 </div>
             </div>

            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="space-y-4 p-4">
                    {filteredEvents.map((event) => {
                         const isExpanded = expandedEventId === event.id;
                         const isAi = event.source === 'ai';
                         const acts = event.relatedActs || [];
                         const participants = event.relatedParticipants || [];

                         return (
                            <div key={event.id} className={`rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-gray-700/30' : 'bg-gray-800'}`}>
                                <div className="p-4 cursor-pointer hover:bg-gray-700/50" onClick={() => toggleEventDetails(event.id)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4 items-start">
                                            <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg flex-shrink-0 ${isAi ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                                <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString('de-DE', { month: 'short' })}</span>
                                                <span className="text-xl font-bold">{new Date(event.date).getDate() || '?'}</span>
                                                <span className="text-[10px] opacity-70">{new Date(event.date).getFullYear()}</span>
                                            </div>
                                            
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAi ? 'bg-purple-900/50 text-purple-200' : 'bg-blue-900/50 text-blue-200'}`}>
                                                        {isAi ? 'KI-ANALYSE' : 'MANUELL'}
                                                    </span>
                                                    {event.sourceDocName && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <span>📄</span> {event.sourceDocName}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-lg text-white">{event.title}</h3>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                                            </div>
                                        </div>
                                        
                                        <button className={`transform transition-transform duration-200 text-gray-400 p-2 ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-6 pt-0 border-t border-gray-700/50">
                                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                            
                                            {/* Full Description */}
                                            <div className="lg:col-span-12 bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                                                <h4 className="text-xs uppercase font-bold text-gray-500 mb-2 tracking-wider">Kontext & Details</h4>
                                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                                {isAi && (
                                                    <div className="mt-3 flex justify-end">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onViewDocument(event.sourceDocId!); }} 
                                                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                                        >
                                                            Originaldokument öffnen →
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Forensische Details (Acts & Participants) */}
                                            {isAi && (acts.length > 0 || participants.length > 0) && (
                                                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    
                                                    {/* Acts */}
                                                    {acts.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs uppercase font-bold text-red-400/80 tracking-wider flex items-center gap-2">
                                                                <span>⚠️</span> Dokumentierte Handlungen
                                                            </h4>
                                                            {acts.map((act, idx) => (
                                                                <div key={idx} className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold text-red-200 text-sm">{act.actType}</span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 space-y-1">
                                                                        <p><span className="text-gray-500">Opfer:</span> {act.victimName}</p>
                                                                        {act.method && <p><span className="text-gray-500">Methode:</span> {act.method}</p>}
                                                                        {act.consequences && <p><span className="text-gray-500">Folgen:</span> {act.consequences}</p>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Participants */}
                                                    {participants.length > 0 && (
                                                        <div className="space-y-3">
                                                            <h4 className="text-xs uppercase font-bold text-blue-400/80 tracking-wider flex items-center gap-2">
                                                                <span>👥</span> Identifizierte Akteure
                                                            </h4>
                                                            {participants.map((p, idx) => (
                                                                <div key={idx} className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg flex items-start justify-between">
                                                                    <div>
                                                                        <span className="font-bold text-blue-200 text-sm block">{p.name}</span>
                                                                        <span className="text-xs text-gray-500 uppercase tracking-wide">{p.type}</span>
                                                                    </div>
                                                                    <span className="text-xs font-medium px-2 py-1 rounded bg-gray-700 text-gray-300 border border-gray-600">
                                                                        {p.role}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {filteredEvents.length === 0 && (
                    <div className="text-center text-gray-500 py-16">
                        <div className="text-4xl mb-4">📅</div>
                        <p className="mb-2 font-medium">Keine Ereignisse in dieser Ansicht.</p>
                        {filter === 'ai' && <p className="text-sm text-gray-400 max-w-md mx-auto">Analysieren Sie Dokumente im Tab "Archiv", um hier automatisch extrahierte Ereignisse, Handlungen und Beteiligte zu sehen.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChronologyTab;
