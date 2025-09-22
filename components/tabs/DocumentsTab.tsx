import React, { useState, useRef, useCallback } from 'react';
import type { AppState, Document, Tag } from '../../types';
import * as storage from '../../services/storageService';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { DocumentAnalystService } from '../../services/documentAnalyst';

interface DocumentsTabProps {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ appState, setAppState }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setIsUploading(true);
            try {
                const files = Array.from(event.target.files);
                const uploadedDocuments: Document[] = [];
                for (const file of files) {
                    const newDoc = await storage.uploadDocument(file);
                    uploadedDocuments.push(newDoc);
                }
                setAppState(s => s ? { ...s, documents: [...s.documents, ...uploadedDocuments] } : null);
            } catch (error) {
                console.error("File upload failed:", error);
                // Here you might want to show an error message to the user
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            try {
                await storage.deleteDocument(docId);
                setAppState(s => s ? { ...s, documents: s.documents.filter(d => d.id !== docId) } : null);
            } catch (error) {
                console.error("Failed to delete document:", error);
            }
        }
    };

    const handleAnalyzeDocument = useCallback(async (docId: string) => {
        if (!appState) return;
        const doc = appState.documents.find(d => d.id === docId);
        if (!doc) return;

        setAppState(s => s ? { ...s, isLoading: true, loadingSection: `doc-${docId}` } : null);
        try {
            const result = await DocumentAnalystService.analyzeDocument(doc, appState.settings.ai);
            setAppState(s => {
                if (!s) return null;
                // FIX: Explicitly type the updated document object to prevent type inference issues with AppState.
                const newDocs = s.documents.map((d): Document => {
                    if (d.id === docId) {
                        return { 
                            ...d, 
                            summary: result.summary, 
                            classificationStatus: 'classified', 
                            workCategory: result.classification 
                        };
                    }
                    return d;
                });
                const newResults = { ...s.documentAnalysisResults, [docId]: result };
                return { ...s, documents: newDocs, documentAnalysisResults: newResults };
            });
        } catch (e) {
            console.error(e);
        } finally {
            setAppState(s => s ? { ...s, isLoading: false, loadingSection: '' } : null);
        }
    }, [appState, setAppState]);

    const handleSaveTags = (newTags: string[]) => {
        if (selectedDoc) {
            const updatedDoc = { ...selectedDoc, tags: newTags };
            setAppState(s => s ? { ...s, documents: s.documents.map(d => d.id === selectedDoc.id ? updatedDoc : d) } : s);
            setSelectedDoc(updatedDoc);
        }
    };

    const handleSendMessage = async (message: string) => {
        // Mock chat response
        setChatHistory(h => [...h, { role: 'user', text: message }, { role: 'assistant', text: "Analyzing..." }]);
        setTimeout(() => {
             setChatHistory(h => [...h.slice(0, -1), { role: 'assistant', text: "This is a mocked response based on your question." }]);
        }, 1000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Dokumentenverwaltung</h1>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isUploading} />
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:bg-gray-500" disabled={isUploading}>
                    {isUploading ? 'Wird hochgeladen...' : 'Dokumente hochladen'}
                </button>
            </div>
            
             <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appState.documents.map(doc => (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</td>
                                <td className="px-6 py-4">{doc.classificationStatus}</td>
                                <td className="px-6 py-4">{doc.tags.join(', ')}</td>
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => setSelectedDoc(doc)} className="text-blue-400 hover:underline">Details</button>
                                    <button onClick={() => { setSelectedDoc(doc); setIsTagModalOpen(true); }} className="text-green-400 hover:underline">Tags</button>
                                    <button onClick={() => handleAnalyzeDocument(doc.id)} disabled={appState.isLoading && appState.loadingSection === `doc-${doc.id}`} className="text-purple-400 hover:underline disabled:text-gray-500">Analysieren</button>
                                    <button onClick={() => { setSelectedDoc(doc); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
                                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-400 hover:underline">Löschen</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedDoc && <DocumentDetailModal document={selectedDoc} analysisResult={appState.documentAnalysisResults[selectedDoc.id] || null} onClose={() => setSelectedDoc(null)} />}
            
            {isTagModalOpen && selectedDoc && (
                <TagManagementModal
                    isOpen={isTagModalOpen}
                    onClose={() => setIsTagModalOpen(false)}
                    availableTags={appState.tags}
                    assignedTags={selectedDoc.tags}
                    onSave={handleSaveTags}
                    itemName={selectedDoc.name}
                    onCreateTag={(name) => setAppState(s => s ? { ...s, tags: [...s.tags, {id: crypto.randomUUID(), name}]} : null)}
                />
            )}
            
             {isChatModalOpen && selectedDoc && (
                <AnalysisChatModal
                    documents={[selectedDoc]}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClose={() => setIsChatModalOpen(false)}
                    isLoading={false}
                    onAddKnowledge={() => {}}
                />
            )}
        </div>
    );
};

export default DocumentsTab;
