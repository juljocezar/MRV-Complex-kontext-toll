
import React, { useState, useMemo } from 'react';
import type { TimelineEvent, AppState, DocumentAnalysisResult } from '../../types';

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
}

const ChronologyTab: React.FC<ChronologyTabProps> = ({ appState, onUpdateTimelineEvents, onViewDocument }) => {
    const { timelineEvents, documentAnalysisResults, documents } = appState;
    const [newEvent, setNewEvent] = useState({ date: '', title: '', description: '', documentIds: [] as string[] });
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
            const analysisResult = result as DocumentAnalysisResult | undefined;
            if (!analysisResult || !analysisResult.structuredEvents) return;
            
            const docName = documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

            analysisResult.structuredEvents.forEach((evt, index) => {
                events.push({
                    id: `ai-${docId}-${index}`,
                    date: evt.startDate,
                    title: evt.title,
                    description: evt.description,
                    source: 'ai',
                    documentIds: [],
                    sourceDocId: docId,
                    sourceDocName: docName
                });
            });
        });

        // Sort by date descending
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

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <span className="text-4xl">⏳</span> Zeitachse
                    </h1>
                    <p className="text-gray-400 mt-2 max-w-xl">
                        Die chronologische Rekonstruktion des Falls. Kombiniert manuell erfasste Ereignisse mit automatisch aus Dokumenten extrahierten Datenpunkten.
                    </p>
                </div>
                
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    {['all', 'manual', 'ai'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                filter === f 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {f === 'all' ? 'Alle' : f === 'manual' ? 'Manuell' : 'KI-Extrahiert'}
                        </button>
                    ))}
                </div>
            </div>

             {/* Manual Entry Form (Collapsible or always visible based on UX preference, sticking to visible for quick entry) */}
             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Neues Ereignis erfassen</h3>
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                     <div className="md:col-span-3">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Datum (YYYY-MM-DD)</label>
                         <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-gray-700 text-white p-2.5 rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"/>
                     </div>
                     <div className="md:col-span-4">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Titel</label>
                         <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-gray-700 text-white p-2.5 rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="Was ist passiert?"/>
                     </div>
                     <div className="md:col-span-5">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Beschreibung</label>
                         <div className="flex gap-2">
                            <input type="text" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="flex-grow bg-gray-700 text-white p-2.5 rounded border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="Details..."/>
                            <button onClick={handleAddEvent} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold transition-colors shadow-lg">
                                +
                            </button>
                         </div>
                     </div>
                 </div>
             </div>

            {/* Vertical Timeline */}
            <div className="relative py-8">
                {/* Vertical Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-700 transform -translate-x-1/2"></div>

                {filteredEvents.map((event, index) => {
                    const isLeft = index % 2 === 0;
                    const isAi = event.source === 'ai';
                    
                    return (
                        <div key={event.id} className={`relative flex items-center justify-between mb-8 md:mb-12 ${isLeft ? 'flex-row-reverse' : ''}`}>
                            
                            {/* Empty space for alignment */}
                            <div className="hidden md:block w-5/12"></div>

                            {/* Center Dot */}
                            <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full border-4 border-gray-900 z-10 flex items-center justify-center bg-gray-800 shadow-xl">
                                <div className={`w-3 h-3 rounded-full ${isAi ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                            </div>

                            {/* Content Card */}
                            <div className={`w-full md:w-5/12 pl-12 md:pl-0 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
                                <div className={`p-5 rounded-lg border shadow-lg transition-all hover:shadow-2xl hover:scale-[1.01] group ${
                                    isAi 
                                    ? 'bg-purple-900/10 border-purple-500/30 hover:border-purple-500/50' 
                                    : 'bg-blue-900/10 border-blue-500/30 hover:border-blue-500/50'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                                            isAi ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                                        }`}>
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                        {event.sourceDocId && (
                                            <button 
                                                onClick={() => onViewDocument(event.sourceDocId!)}
                                                className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                                                title="Zum Dokument springen"
                                            >
                                                📄 {event.sourceDocName?.substring(0, 15)}...
                                            </button>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{event.title}</h3>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                                    
                                    {isAi && (
                                        <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center gap-2 text-xs text-purple-400/70">
                                            <span>🤖 Automatisch extrahiert</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredEvents.length === 0 && (
                    <div className="text-center py-20 bg-gray-800/50 rounded-lg border border-dashed border-gray-700 mx-auto max-w-2xl relative z-10">
                        <div className="text-6xl mb-4 opacity-50">📅</div>
                        <h3 className="text-lg font-semibold text-gray-300">Noch keine Ereignisse</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                            Die Zeitachse füllt sich automatisch durch die KI-Analyse Ihrer Dokumente. 
                            Alternativ können Sie oben manuell Ereignisse hinzufügen.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChronologyTab;
