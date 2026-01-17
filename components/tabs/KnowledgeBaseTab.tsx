
import React, { useState } from 'react';
import type { KnowledgeItem, Document } from '../../types';

interface KnowledgeBaseTabProps {
    knowledgeItems: KnowledgeItem[];
    onUpdateKnowledgeItems: (items: KnowledgeItem[]) => void;
    documents: Document[];
    onViewDocument: (docId: string) => void;
}

const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({ knowledgeItems, onUpdateKnowledgeItems, documents, onViewDocument }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name || 'Unbekanntes Dokument';

    const filteredItems = knowledgeItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Wissensbasis</h1>
            <p className="text-gray-400">Eine kuratierte Sammlung von Fakten, Beweisen und wichtigen Informationen, die aus den Dokumenten extrahiert wurden.</p>

            <div className="bg-gray-800 p-4 rounded-lg">
                <input
                    type="text"
                    placeholder="Wissensbasis durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-gray-800 p-6 rounded-lg shadow flex flex-col">
                        <h3 className="font-semibold text-lg text-white mb-2">{item.title}</h3>
                        <p className="text-gray-300 flex-grow">{item.summary}</p>
                        <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                            <p>Quelle: <button onClick={() => onViewDocument(item.sourceDocId)} className="text-blue-400 hover:underline">{getDocName(item.sourceDocId)}</button></p>
                            <p>Erstellt am: {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                 {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
                        <p className="text-gray-500">Keine Wissenseinträge gefunden.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseTab;
