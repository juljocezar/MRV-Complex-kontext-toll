
import React, { useState } from 'react';
import type { AppState, AppSettings, Tag } from '../../types';
import { IndexingService } from '../../services/indexingService';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SettingsTabProps {
    settings: AppSettings;
    setSettings: (settings: AppSettings) => void;
    tags: Tag[];
    onCreateTag: (name: string) => void;
    onDeleteTag: (tagId: string) => void;
    appState: AppState;
    onUpdateAppState: (updates: Partial<AppState>) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ settings, setSettings, tags, onCreateTag, onDeleteTag, appState, onUpdateAppState }) => {
    const [newTagName, setNewTagName] = useState('');
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexProgress, setIndexProgress] = useState(0);
    const [indexStatus, setIndexStatus] = useState('');
    
    const handleAIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings({
            ...settings,
            ai: { ...settings.ai, [name]: parseFloat(value) }
        });
    };

    const handleComplexityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings({
            ...settings,
            complexity: { ...settings.complexity, [name]: parseInt(value) }
        });
    };

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if(newTagName.trim()) {
            onCreateTag(newTagName.trim());
            setNewTagName('');
        }
    };

    const handleStartIndexing = async () => {
        setIsIndexing(true);
        setIndexProgress(0);
        setIndexStatus('Starte Indexierung...');
        
        try {
            const { updatedDocs, updatedEntities, updatedKnowledge } = await IndexingService.indexContent(appState, (prog, status) => {
                setIndexProgress(prog);
                setIndexStatus(status);
            });

            // Update app state with new embeddings
            // This is a bit heavy, strictly speaking we should merge, but for this demo:
            const newDocuments = appState.documents.map(d => updatedDocs.find(u => u.id === d.id) || d);
            const newEntities = appState.caseEntities.map(e => updatedEntities.find(u => u.id === e.id) || e);
            const newKnowledge = appState.knowledgeItems.map(k => updatedKnowledge.find(u => u.id === k.id) || k);

            onUpdateAppState({
                documents: newDocuments,
                caseEntities: newEntities,
                knowledgeItems: newKnowledge
            });

        } catch (e) {
            setIndexStatus('Fehler bei der Indexierung.');
            console.error(e);
        } finally {
            setIsIndexing(false);
        }
    };

    // Stats
    const docsEmbedded = appState.documents.filter(d => !!d.embedding).length;
    const entitiesEmbedded = appState.caseEntities.filter(e => !!e.embedding).length;
    const totalDocs = appState.documents.length;
    const totalEntities = appState.caseEntities.length;

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Einstellungen</h1>

            {/* Semantic Indexing Section */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">🧠</span> Semantischer Index (Embeddings)
                </h2>
                <p className="text-sm text-gray-300 mb-4">
                    Erstellen Sie Vektor-Embeddings für Dokumente, Entitäten und Wissen, um Funktionen wie 
                    <b> RAG (verbesserte Antworten)</b>, <b>semantische Suche</b> und <b>Cluster-Analyse</b> zu aktivieren.
                    Nutzt die Gemini Batch API (bis zu 100 Elemente pro Anfrage).
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-gray-800/50 p-3 rounded">
                    <div>
                        <span className="text-gray-400">Dokumente indexiert:</span>
                        <div className="font-bold text-white">{docsEmbedded} / {totalDocs}</div>
                    </div>
                    <div>
                        <span className="text-gray-400">Entitäten indexiert:</span>
                        <div className="font-bold text-white">{entitiesEmbedded} / {totalEntities}</div>
                    </div>
                </div>

                <div className="space-y-2">
                    {isIndexing && (
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                            <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${indexProgress}%` }}></div>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleStartIndexing}
                        disabled={isIndexing}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isIndexing ? <LoadingSpinner /> : 'Indexierung starten'}
                        {isIndexing ? indexStatus : 'Index aktualisieren'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">KI-Einstellungen</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-gray-300">
                            Temperatur (Kreativität): {settings.ai.temperature}
                        </label>
                        <input
                            type="range"
                            id="temperature"
                            name="temperature"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.ai.temperature}
                            onChange={handleAIChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor="topP" className="block text-sm font-medium text-gray-300">
                            Top-P (Wortauswahl-Präzision): {settings.ai.topP}
                        </label>
                         <input
                            type="range"
                            id="topP"
                            name="topP"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.ai.topP}
                            onChange={handleAIChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Tag-Verwaltung</h2>
                <p className="text-sm text-gray-400 mb-4">Verwalten Sie hier die global verfügbaren Tags.</p>
                <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Neuen Tag-Namen eingeben"
                        className="flex-grow bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Erstellen</button>
                </form>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span className="text-gray-200">{tag.name}</span>
                            <button onClick={() => onDeleteTag(tag.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">Löschen</button>
                        </div>
                    ))}
                     {tags.length === 0 && <p className="text-center text-gray-500 py-4">Keine Tags vorhanden.</p>}
                </div>
            </div>

             <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Aufwandskalkulation</h2>
                 <p className="text-sm text-gray-400 mb-4">Definieren Sie die Stundengrenzen für die Komplexitätsbewertung.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="low" className="block text-sm font-medium text-gray-300">Grenze "Niedrig" (Stunden)</label>
                        <input
                            type="number"
                            id="low"
                            name="low"
                            value={settings.complexity.low}
                            onChange={handleComplexityChange}
                            className="mt-1 w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                     <div>
                        <label htmlFor="medium" className="block text-sm font-medium text-gray-300">Grenze "Mittel" (Stunden)</label>
                        <input
                            type="number"
                            id="medium"
                            name="medium"
                            value={settings.complexity.medium}
                            onChange={handleComplexityChange}
                            className="mt-1 w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default SettingsTab;
