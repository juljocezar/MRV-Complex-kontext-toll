import React, { useState, useEffect } from 'react';
import type { SuggestedKnowledgeChunk } from '../../types';

interface KnowledgeChunkingModalProps {
    isOpen: boolean;
    documentName: string;
    suggestions: SuggestedKnowledgeChunk[];
    onClose: () => void;
    onAccept: (chunks: SuggestedKnowledgeChunk[]) => void;
}

const KnowledgeChunkingModal: React.FC<KnowledgeChunkingModalProps> = ({ isOpen, documentName, suggestions, onClose, onAccept }) => {
    const [chunks, setChunks] = useState<SuggestedKnowledgeChunk[]>([]);

    useEffect(() => {
        if (isOpen) {
            setChunks(suggestions.map(s => ({ ...s, selected: true })));
        }
    }, [isOpen, suggestions]);

    if (!isOpen) return null;

    const handleToggleSelect = (index: number) => {
        setChunks(prev => prev.map((chunk, i) => i === index ? { ...chunk, selected: !chunk.selected } : chunk));
    };
    
    const handleSelectAll = (select: boolean) => {
        setChunks(prev => prev.map(chunk => ({...chunk, selected: select})));
    };

    const handleContentChange = (index: number, field: 'title' | 'summary', value: string) => {
        setChunks(prev => prev.map((chunk, i) => i === index ? { ...chunk, [field]: value } : chunk));
    };

    const selectedCount = chunks.filter(c => c.selected).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Vorgeschlagene Wissensbausteine</h2>
                        <p className="text-sm text-gray-400">Quelle: {documentName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-6 flex-grow overflow-y-auto space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-700">
                        <p className="text-sm text-gray-300">{selectedCount} von {chunks.length} Bausteinen ausgewählt</p>
                        <div className="space-x-2">
                             <button onClick={() => handleSelectAll(true)} className="text-xs text-blue-400 hover:underline">Alle auswählen</button>
                             <button onClick={() => handleSelectAll(false)} className="text-xs text-blue-400 hover:underline">Alle abwählen</button>
                        </div>
                    </div>
                    {chunks.map((chunk, index) => (
                        <div key={index} className="bg-gray-700/50 p-4 rounded-md flex items-start space-x-4">
                             <input 
                                type="checkbox" 
                                checked={chunk.selected} 
                                onChange={() => handleToggleSelect(index)}
                                className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500 mt-1 flex-shrink-0"
                            />
                            <div className="flex-grow space-y-2">
                                <input
                                    type="text"
                                    value={chunk.title}
                                    onChange={(e) => handleContentChange(index, 'title', e.target.value)}
                                    className="w-full bg-gray-800 text-white font-semibold p-2 rounded-md border border-gray-600"
                                />
                                <textarea
                                    rows={4}
                                    value={chunk.summary}
                                    onChange={(e) => handleContentChange(index, 'summary', e.target.value)}
                                    className="w-full bg-gray-800 text-gray-300 p-2 rounded-md border border-gray-600 text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <footer className="p-4 border-t border-gray-700 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Abbrechen</button>
                    <button onClick={() => onAccept(chunks)} disabled={selectedCount === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:bg-gray-500">
                        {selectedCount} Baustein(e) übernehmen
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default KnowledgeChunkingModal;