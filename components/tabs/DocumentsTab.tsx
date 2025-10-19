import React, { useState, useRef, useCallback } from 'react';
import type { AppState, Document, Tag } from '../../types';
import { extractFileContent } from '../../utils/fileUtils';
import { hashText } from '../../utils/cryptoUtils';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { useAgentDispatcher } from '../../hooks/useAgentDispatcher';
import { AgentActivity } from '../../types';

interface DocumentsTabProps {
    appState: AppState;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ appState, setAppState, addAgentActivity }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<any[]>([]);

    const { dispatchAgentTask, isLoading: isDispatcherLoading, error: dispatcherError, result: dispatcherResult } = useAgentDispatcher(appState, addAgentActivity);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const newDocuments: Document[] = [];
            for (const file of files) {
                const { text, base64, mimeType } = await extractFileContent(file);
                const content = text || base64 || '';
                const newDoc: Document = {
                    id: await hashText(file.name + file.size + content),
                    name: file.name,
                    content: content,
                    textContent: text,
                    base64Content: base64,
                    mimeType: mimeType,
                    classificationStatus: 'unclassified',
                    tags: [],
                    createdAt: new Date().toISOString(),
                };
                newDocuments.push(newDoc);
            }
            setAppState(s => s ? { ...s, documents: [...s.documents, ...newDocuments] } : null);
        }
    };

    const [classifyingDocId, setClassifyingDocId] = useState<string | null>(null);

    const handleClassifyDocument = useCallback(async (doc: Document) => {
        if (!doc.content) {
            alert("Document has no content to classify.");
            return;
        }
        setClassifyingDocId(doc.id);
        try {
            const prompt = `Please classify the following document content according to HURIDOCS standards. Return only the single, most appropriate category name. Document content: """${doc.content.substring(0, 4000)}"""`;
            const result = await dispatchAgentTask(prompt, 'document_classification');

            if (typeof result === 'string' && result.trim() !== '') {
                setAppState(s => {
                    if (!s) return null;
                    const newDocs = s.documents.map((d): Document => {
                        if (d.id === doc.id) {
                            return { ...d, classificationStatus: 'classified', type: result.trim() };
                        }
                        return d;
                    });
                    return { ...s, documents: newDocs };
                });
            } else {
                throw new Error("Received an invalid classification from the AI.");
            }
        } catch (error) {
            console.error("Classification failed for doc:", doc.name, error);
            alert(`Classification failed for document ${doc.name}.`);
        } finally {
            setClassifyingDocId(null);
        }
    }, [dispatchAgentTask, setAppState]);

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
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">
                    Dokumente hochladen
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
                                    <button
                                        onClick={() => handleClassifyDocument(doc)}
                                        disabled={isDispatcherLoading && classifyingDocId === doc.id}
                                        className="text-purple-400 hover:underline disabled:text-gray-500 disabled:cursor-not-allowed"
                                    >
                                        {isDispatcherLoading && classifyingDocId === doc.id ? 'Klassifiziere...' : 'Klassifizieren'}
                                    </button>
                                    <button onClick={() => { setSelectedDoc(doc); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
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
