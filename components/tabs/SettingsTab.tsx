
import React, { useState, useEffect } from 'react';
import type { AppState, AppSettings, Tag } from '../../types';
import { IndexingService } from '../../services/indexingService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { marked } from 'marked';

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
    const [statusDoc, setStatusDoc] = useState<string>('');
    const [showStatus, setShowStatus] = useState(false);
    
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

    useEffect(() => {
        if(showStatus && !statusDoc) {
            fetch('/STATUS.md').then(r => r.text()).then(t => marked.parse(t)).then(h => setStatusDoc(h));
        }
    }, [showStatus, statusDoc]);

    const docsEmbedded = appState.documents.filter(d => !!d.embedding).length;
    const totalDocs = appState.documents.length;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <h1 className="text-3xl font-bold text-white">Einstellungen</h1>

            {/* Semantic Indexing Section */}
            <div className="bg-indigo-900/30 border border-indigo-500/30 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">🧠</span> Semantischer Index (Embeddings)
                </h2>
                <p className="text-sm text-gray-300 mb-4">
                    Erstellen Sie Vektor-Embeddings für Dokumente, um Funktionen wie 
                    <b> RAG</b> und <b>semantische Suche</b> zu aktivieren.
                </p>
                
                <div className="flex gap-4 mb-4 text-sm bg-gray-800/50 p-3 rounded">
                    <div>
                        <span className="text-gray-400">Dokumente indexiert:</span>
                        <div className="font-bold text-white">{docsEmbedded} / {totalDocs}</div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">KI-Parameter</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">
                                Temperatur (Kreativität): {settings.ai.temperature}
                            </label>
                            <input
                                type="range"
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
                            <label className="block text-sm font-medium text-gray-300">
                                Top-P (Präzision): {settings.ai.topP}
                            </label>
                             <input
                                type="range"
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
                    <h2 className="text-xl font-semibold text-white mb-4">Tags</h2>
                    <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            placeholder="Neuer Tag..."
                            className="flex-grow bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 text-sm"
                        />
                        <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">OK</button>
                    </form>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex justify-between items-center bg-gray-700 p-2 rounded text-sm">
                                <span className="text-gray-200">{tag.name}</span>
                                <button onClick={() => onDeleteTag(tag.id)} className="text-red-400 hover:text-red-300 font-bold">×</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Developer Section */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowStatus(!showStatus)}>
                    <h2 className="text-xl font-semibold text-gray-400">System & Entwickler-Status</h2>
                    <span className="text-gray-500">{showStatus ? '▼' : '▶'}</span>
                </div>
                
                {showStatus && (
                    <div className="mt-4 animate-in fade-in">
                        <div className="bg-black/30 p-4 rounded border border-gray-800 text-gray-400 text-xs font-mono mb-4">
                            <p>App Version: 2.6.0 PRO</p>
                            <p>Build Environment: VITE</p>
                            <p>Local Storage: IndexedDB (Active)</p>
                        </div>
                        <h3 className="font-bold text-white mb-2">Projekt-Status (STATUS.md)</h3>
                        <div className="prose prose-invert prose-sm max-w-none bg-gray-800/50 p-4 rounded" dangerouslySetInnerHTML={{ __html: statusDoc || 'Lade...' }} />
                        
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <a href="/ANALYSE.md" target="_blank" className="text-blue-400 hover:underline text-sm mr-4">Architektur-Analyse öffnen ↗</a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsTab;
