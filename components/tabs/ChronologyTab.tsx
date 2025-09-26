import React, { useState, useMemo } from 'react';
import type { TimelineEvent, Document, AppState } from '../../types';

/**
 * @interface ChronologyTabProps
 * @description Props for the ChronologyTab component.
 * @property {AppState} appState - The current state of the application, containing timeline events, analysis results, and documents.
 * @property {(events: TimelineEvent[]) => void} onUpdateTimelineEvents - Callback to update the list of timeline events.
 * @property {(docId: string) => void} onViewDocument - Callback to open and view a specific document.
 */
interface ChronologyTabProps {
    appState: AppState;
    onUpdateTimelineEvents: (events: TimelineEvent[]) => void;
    onViewDocument: (docId: string) => void;
}

/**
 * @component ChronologyTab
 * @description A tab that displays a chronological timeline of all documented events in the case.
 * It allows for manual creation of events and displays detailed, structured information (like acts and participants)
 * extracted from associated documents.
 * @param {ChronologyTabProps} props The props for the component.
 * @returns {React.FC<ChronologyTabProps>} The rendered chronology tab.
 */
const ChronologyTab: React.FC<ChronologyTabProps> = ({ appState, onUpdateTimelineEvents, onViewDocument }) => {
    const { timelineEvents, documentAnalysisResults, documents } = appState;
    const [newEvent, setNewEvent] = useState({ date: '', title: '', description: '', documentIds: [] as string[] });
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    const sortedEvents = useMemo(() => 
        [...timelineEvents].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [timelineEvents]
    );

    const handleAddEvent = () => {
        if (newEvent.date && newEvent.title) {
            onUpdateTimelineEvents([...timelineEvents, { ...newEvent, id: crypto.randomUUID() }]);
            setNewEvent({ date: '', title: '', description: '', documentIds: [] });
        }
    };
    
    const getStructuredDataForEvent = (event: TimelineEvent) => {
        const relatedAnalysis = event.documentIds
            .map(docId => documentAnalysisResults[docId])
            .filter(Boolean);

        const acts = relatedAnalysis.flatMap(analysis => analysis?.structuredActs || []);
        const participants = relatedAnalysis.flatMap(analysis => analysis?.structuredParticipants || []);
        
        return { acts, participants };
    };

    const toggleEventDetails = (eventId: string) => {
        setExpandedEventId(prevId => (prevId === eventId ? null : eventId));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Ereignisprotokoll</h1>
            <p className="text-gray-400">Eine chronologische Auflistung aller im Fall dokumentierten Ereignisse und der darin enthaltenen, spezifischen Handlungen.</p>

             <div className="bg-gray-800 p-6 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                 <div className="col-span-3 md:col-span-1">
                     <label className="block text-sm font-medium text-gray-300">Datum</label>
                     <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                 </div>
                 <div className="col-span-3 md:col-span-2">
                     <label className="block text-sm font-medium text-gray-300">Titel</label>
                     <input type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                 </div>
                 <div className="col-span-3">
                     <label className="block text-sm font-medium text-gray-300">Beschreibung</label>
                     <textarea value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} className="mt-1 w-full bg-gray-700 p-2 rounded-md"/>
                 </div>
                 <div className="col-span-3">
                    <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Manuelles Ereignis hinzufügen</button>
                 </div>
             </div>

            <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="space-y-2 p-4">
                    {sortedEvents.map((event) => {
                         const { acts, participants } = getStructuredDataForEvent(event);
                         const isExpanded = expandedEventId === event.id;
                         return (
                            <div key={event.id} className="bg-gray-700/50 rounded-lg">
                                <button onClick={() => toggleEventDetails(event.id)} className="w-full text-left p-4 hover:bg-gray-700 focus:outline-none">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-400">{new Date(event.date).toLocaleDateString()}</p>
                                            <h3 className="font-semibold text-white">{event.title}</h3>
                                        </div>
                                        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                                </button>
                                {isExpanded && (
                                    <div className="p-4 border-t border-gray-600 animate-fade-in">
                                        <h4 className="font-semibold text-gray-300 mb-2">Detaillierte Handlungen (Akte)</h4>
                                        {acts.length > 0 ? (
                                            <table className="w-full text-xs text-left">
                                                <thead className="text-gray-400">
                                                    <tr>
                                                        <th className="py-1">Verletzung</th>
                                                        <th className="py-1">Opfer</th>
                                                        <th className="py-1">Konsequenzen</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-gray-200">
                                                {acts.map((act, index) => (
                                                    <tr key={index}>
                                                        <td className="py-1">{act.actType}</td>
                                                        <td className="py-1">{act.victimName}</td>
                                                        <td className="py-1">{act.consequences || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <p className="text-xs text-gray-500">Keine spezifischen Handlungen für dieses Ereignis extrahiert.</p>
                                        )}
                                         <style>{`
                                            @keyframes fade-in {
                                                0% { opacity: 0; transform: translateY(-10px); }
                                                100% { opacity: 1; transform: translateY(0); }
                                            }
                                            .animate-fade-in { animation: fade-in 0.3s ease-out; }
                                        `}</style>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {sortedEvents.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Keine Ereignisse in der Chronologie. Analysieren Sie Dokumente, um automatisch Ereignisse zu erstellen.</p>
                )}
            </div>
        </div>
    );
};

export default ChronologyTab;
