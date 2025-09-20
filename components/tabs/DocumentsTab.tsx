import React, { useState } from 'react';
import { Document, Tag } from '../../types';
import TagManagementModal from '../modals/TagManagementModal';

interface DocumentsTabProps {
    documents: Document[];
    setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
    onFileUpload: (files: File[]) => void;
    onAnalyzeDocumentWorkload: (docId: string, docName: string, docContent: string) => void;
    onOpenChat: (docs: Document[]) => void;
    isLoading: boolean;
    loadingSection: string;
    tags: Tag[];
    onUpdateDocumentTags: (docId: string, newTags: string[]) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({
    documents,
    setDocuments,
    onFileUpload,
    onAnalyzeDocumentWorkload,
    onOpenChat,
    isLoading,
    loadingSection,
    tags,
    onUpdateDocumentTags
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [tagModalState, setTagModalState] = useState<{ isOpen: boolean; doc: Document | null }>({ isOpen: false, doc: null });
    const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileUpload(Array.from(e.dataTransfer.files));
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileUpload(Array.from(e.target.files));
        }
    };

    const handleSelectDoc = (docId: string) => {
        setSelectedDocIds(prev =>
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const handleStartMultiChat = () => {
        const selectedDocs = documents.filter(doc => selectedDocIds.includes(doc.id));
        if (selectedDocs.length > 0) {
            onOpenChat(selectedDocs);
        }
    };

    const StatusIndicator: React.FC<{ status: Document['classificationStatus'] }> = ({ status }) => {
        switch (status) {
            case 'classified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">Klassifiziert</span>;
            case 'unclassified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300">Neu</span>;
            case 'failed': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300">Fehlgeschlagen</span>;
            case 'classifying': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300">Klassifiziere...</span>;
            default: return null;
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dokumentenverwaltung</h1>

            <div 
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${dragActive ? 'border-blue-500 bg-gray-800' : 'border-gray-600 bg-gray-800/50'}`}
            >
                <input type="file" id="file-upload" multiple className="hidden" onChange={handleFileSelect} />
                <label htmlFor="file-upload" className="cursor-pointer">
                    <p className="text-gray-400">Dateien hierher ziehen oder klicken zum Hochladen</p>
                    <p className="text-xs text-gray-500 mt-1">Unterstützt PDF, DOCX, TXT, Bilder, etc. KI-Triage startet automatisch.</p>
                </label>
                {isLoading && loadingSection === 'file-upload' && <p className="mt-4 text-blue-400">Verarbeite Dateien...</p>}
            </div>
            
             {selectedDocIds.length > 1 && (
                <div className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-white font-semibold">{selectedDocIds.length} Dokumente ausgewählt</span>
                    <button
                        onClick={handleStartMultiChat}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm"
                    >
                        Multi-Doc Chat starten
                    </button>
                </div>
            )}

            <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 w-4"><input type="checkbox" className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500" onChange={(e) => setSelectedDocIds(e.target.checked ? documents.map(d => d.id) : [])} /></th>
                            <th scope="col" className="px-6 py-3">Dateiname</th>
                            <th scope="col" className="px-6 py-3">Kategorie</th>
                            <th scope="col" className="px-6 py-3">Datum</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-4 py-4"><input type="checkbox" className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500" checked={selectedDocIds.includes(doc.id)} onChange={() => handleSelectDoc(doc.id)} /></td>
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</td>
                                <td className="px-6 py-4">{doc.workCategory}</td>
                                <td className="px-6 py-4">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {doc.tags.map(tag => <span key={tag} className="bg-gray-600 px-2 py-0.5 rounded-full text-xs">{tag}</span>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4"><StatusIndicator status={doc.classificationStatus} /></td>
                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                    <button 
                                        onClick={() => onAnalyzeDocumentWorkload(doc.id, doc.name, doc.content)}
                                        disabled={isLoading && loadingSection === `workload-${doc.id}`}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs disabled:bg-gray-500 disabled:cursor-not-allowed"
                                        title="Aufwand schätzen"
                                    >
                                        {isLoading && loadingSection === `workload-${doc.id}` ? '...' : 'Aufwand'}
                                    </button>
                                     <button
                                        onClick={() => onOpenChat([doc])}
                                        className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs"
                                    >
                                        Chat
                                    </button>
                                    <button 
                                        onClick={() => setTagModalState({ isOpen: true, doc })}
                                        className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-xs"
                                    >
                                        Tags
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {documents.length === 0 && (
                    <p className="text-center py-8 text-gray-500">Noch keine Dokumente hochgeladen.</p>
                )}
            </div>
            {tagModalState.isOpen && tagModalState.doc && (
                <TagManagementModal
                    isOpen={tagModalState.isOpen}
                    onClose={() => setTagModalState({ isOpen: false, doc: null })}
                    availableTags={tags}
                    assignedTags={tagModalState.doc.tags}
                    onSave={(newTags) => {
                        onUpdateDocumentTags(tagModalState.doc!.id, newTags);
                    }}
                    itemName={tagModalState.doc.name}
                />
            )}
        </div>
    );
};

export default DocumentsTab;