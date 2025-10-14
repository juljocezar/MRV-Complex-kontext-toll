import React, { useState, useRef, useCallback } from 'react';
import type { AppState, Document, Tag, AnalysisChatMessage, AgentActivity, KnowledgeItem, ActiveTab, Notification } from '../../types';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { GeminiService } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Tooltip from '../ui/Tooltip';


interface DocumentsTabProps {
    appState: AppState;
    onAddNewDocument: (file: File) => Promise<void>;
    onAnalyzeDocument: (docId: string) => Promise<void>;
    onDecomposeDocument: (docId: string) => Promise<void>;
    onUpdateDocument: (doc: Document) => void;
    onUpdateTags: (tags: Tag[]) => void;
    addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
    setActiveTab: (tab: ActiveTab) => void;
    addNotification: (message: string, type?: Notification['type']) => void;
    onViewDocumentDetails: (docId: string) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
    appState, onAddNewDocument, onAnalyzeDocument, onDecomposeDocument, onUpdateDocument, onUpdateTags,
    addKnowledgeItem, setActiveTab, addNotification, onViewDocumentDetails
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const selectedDoc = appState.documents.find(d => d.id === selectedDocId) || null;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = [...event.target.files];
            for (const file of files) {
                await onAddNewDocument(file);
            }
            // Clear the input value to allow re-uploading the same file
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleSaveTags = (newTags: string[]) => {
        if (selectedDoc) {
            const updatedDoc = { ...selectedDoc, tags: newTags };
            onUpdateDocument(updatedDoc);
            setSelectedDocId(updatedDoc.id);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!selectedDoc) return;

        const newHistory: AnalysisChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        try {
            const conversationContext = newHistory.map(m => `${m.role}: ${m.text}`).join('\n');
            const docContent = selectedDoc.textContent || selectedDoc.content;

            const prompt = `
                Du bist ein KI-Assistent, der Fragen zu einem spezifischen Dokument beantwortet.
                Sei präzise und beziehe dich nur auf die Informationen im Dokument.

                **Dokumenteninhalt (Auszug):**
                ---
                ${docContent.substring(0, 15000)}
                ---

                **Bisherige Konversation:**
                ---
                ${conversationContext}
                ---

                **Neue Frage vom Benutzer:**
                ${message}

                **Deine Antwort:**
            `;
            
            setChatHistory(h => [...h, { role: 'assistant', text: '' }]);
            
            let accumulatedText = "";
            await GeminiService.generateContentStream(prompt, appState.settings.ai, (chunk) => {
                accumulatedText += chunk;
                setChatHistory(h => {
                    const newH = [...h];
                    newH[newH.length - 1] = { role: 'assistant', text: accumulatedText };
                    return newH;
                });
            });

        } catch (error) {
            console.error("Chat API call failed:", error);
            setChatHistory(h => [...h, { role: 'assistant', text: "Entschuldigung, bei der Beantwortung Ihrer Frage ist ein Fehler aufgetreten." }]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    const handleAddKnowledgeFromChat = (title: string, summary: string, sourceDocId: string) => {
        addKnowledgeItem({
            title,
            summary,
            sourceDocId,
            tags: [] // Default to empty tags array
        });
        setActiveTab('knowledge');
        setIsChatModalOpen(false);
    };

    const getStatusBadge = (status: Document['classificationStatus']) => {
        switch(status) {
            case 'classified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">Analysiert</span>;
            case 'unclassified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300">Unanalysiert</span>;
            case 'error': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300">Fehler</span>;
            default: return null;
        }
    }

    const getContentTypeBadge = (type: Document['contentType']) => {
        switch(type) {
            case 'case-specific': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300">Fallbezogen</span>;
            case 'contextual-report': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300">Kontextbezogen</span>;
            default: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">Unbekannt</span>;
        }
    }


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
                            <th scope="col" className="px-6 py-3">Inhaltstyp</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appState.documents.map(doc => {
                            const isAnalyzing = appState.isLoading && appState.analyzingDocId === doc.id;
                            const isChunking = appState.isLoading && appState.loadingSection === 'knowledge_chunking' && appState.analyzingDocId === doc.id;
                            return (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</td>
                                <td className="px-6 py-4">{getStatusBadge(doc.classificationStatus)}</td>
                                <td className="px-6 py-4">{getContentTypeBadge(doc.contentType)}</td>
                                <td className="px-6 py-4">{(doc.tags || []).join(', ')}</td>
                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                    {isAnalyzing || isChunking ? (
                                        <div className="flex items-center text-yellow-400">
                                            <LoadingSpinner className="h-4 w-4 mr-2" />
                                            <span>{isChunking ? 'Zerlege...' : 'Analysiere...'}</span>
                                        </div>
                                    ) : (
                                        <>
                                            {doc.classificationStatus === 'unclassified' && (
                                                <button onClick={() => onAnalyzeDocument(doc.id)} className="text-purple-400 hover:underline">Analysieren</button>
                                            )}
                                            {doc.classificationStatus === 'classified' && (
                                                <Tooltip text="Dokument von KI in Wissensbausteine zerlegen lassen">
                                                    <button onClick={() => onDecomposeDocument(doc.id)} className="text-teal-400 hover:underline">In Wissen zerlegen</button>
                                                </Tooltip>
                                            )}
                                            <button onClick={() => onViewDocumentDetails(doc.id)} className="text-blue-400 hover:underline">Details</button>
                                            <button onClick={() => { setSelectedDocId(doc.id); setIsTagModalOpen(true); }} className="text-green-400 hover:underline">Tags</button>
                                            <button onClick={() => { setSelectedDocId(doc.id); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            
            {isTagModalOpen && selectedDoc && (
                <TagManagementModal
                    isOpen={isTagModalOpen}
                    onClose={() => setIsTagModalOpen(false)}
                    availableTags={appState.tags}
                    assignedTags={selectedDoc.tags}
                    onSave={handleSaveTags}
                    itemName={selectedDoc.name}
                    onCreateTag={(name) => onUpdateTags([...appState.tags, {id: crypto.randomUUID(), name}])}
                />
            )}
            
             {isChatModalOpen && selectedDoc && (
                <AnalysisChatModal
                    documents={[selectedDoc]}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClose={() => setIsChatModalOpen(false)}
                    isLoading={isChatLoading}
                    onAddKnowledge={handleAddKnowledgeFromChat}
                />
            )}
        </div>
    );
};

export default DocumentsTab;