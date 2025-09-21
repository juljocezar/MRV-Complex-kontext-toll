import React, { useState } from 'react';
import type { KnowledgeItem, Document } from '../../types';

/**
 * Props for the KnowledgeBaseTab component.
 */
interface KnowledgeBaseTabProps {
    /** An array of all knowledge items in the database. */
    knowledgeItems: KnowledgeItem[];
    /** Function to update the list of knowledge items. */
    setKnowledgeItems: React.Dispatch<React.SetStateAction<KnowledgeItem[]>>;
    /** The list of all documents, used to find document names for sources. */
    documents: Document[];
}

/**
 * A UI component that displays a searchable, curated collection of facts, evidence,
 * and key information extracted from documents.
 * @param {KnowledgeBaseTabProps} props - The props for the component.
 */
const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({ knowledgeItems, setKnowledgeItems, documents }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name || 'Unknown Document';

    const filteredItems = knowledgeItems.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
            <p className="text-gray-400">A curated collection of facts, evidence, and important information extracted from the documents.</p>

            <div className="bg-gray-800 p-4 rounded-lg">
                <input
                    type="text"
                    placeholder="Search knowledge base..."
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
                            <p>Source: {getDocName(item.sourceDocId)}</p>
                            <p>Created at: {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
                 {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
                        <p className="text-gray-500">No knowledge items found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseTab;
