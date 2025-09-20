import React, { useState } from 'react';
import type { TimelineEvent, Document } from '../../types';

interface ChronologyTabProps {
    timelineEvents: TimelineEvent[];
    setTimelineEvents: React.Dispatch<React.SetStateAction<TimelineEvent[]>>;
    documents: Document[];
}

const ChronologyTab: React.FC<ChronologyTabProps> = ({ timelineEvents, setTimelineEvents, documents }) => {
    // Fix: Updated state shape for a new event to match the 'TimelineEvent' type, using 'documentIds' instead of 'sourceDocId' and removing 'type'.
    const [newEvent, setNewEvent] = useState({ date: '', title: '', description: '', documentIds: [] as string[] });

    const handleAddEvent = () => {
        if (newEvent.date && newEvent.title) {
            // Fix: Ensured the new event object conforms to the 'TimelineEvent' type before updating state.
            setTimelineEvents(prev => [...prev, { ...newEvent, id: crypto.randomUUID() }].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setNewEvent({ date: '', title: '', description: '', documentIds: [] });
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Chronologie des Falls</h1>

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
                    <button onClick={handleAddEvent} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Ereignis hinzufügen</button>
                 </div>
             </div>

            <div className="relative border-l-2 border-gray-700 ml-4">
                {timelineEvents.map((event) => {
                    // Fix: Changed logic to find source documents using 'documentIds' array instead of the non-existent 'sourceDocId'.
                    const sourceDocs = documents.filter(d => event.documentIds.includes(d.id));
                    return (
                        <div key={event.id} className="mb-8 ml-8">
                            <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full -left-3 ring-8 ring-gray-900">
                                🗓️
                            </span>
                            <div className="p-4 bg-gray-800 rounded-lg shadow-sm">
                                <time className="mb-1 text-sm font-normal leading-none text-gray-400">{new Date(event.date).toLocaleDateString()}</time>
                                <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                                <p className="text-base font-normal text-gray-300">{event.description}</p>
                                {/* Fix: Updated to display names of all source documents. */}
                                {sourceDocs.length > 0 && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Quelle: {sourceDocs.map(doc => doc.name).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {timelineEvents.length === 0 && <p className="text-center text-gray-500 py-8">Keine Ereignisse in der Chronologie.</p>}
        </div>
    );
};

export default ChronologyTab;