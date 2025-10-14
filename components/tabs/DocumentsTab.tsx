import React, { useState, useRef, useCallback, useMemo } from 'react';
// Fix: Corrected import path for types.
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
    onQueueDocumentsForAnalysis: (docIds: string[]) => void;
    onDecomposeDocument: (docId: string) => Promise<void>;
    onUpdateDocument: (doc: Document) => void;
    onUpdateTags: (tags: Tag[]) => void;
    addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
    setActiveTab: (tab: ActiveTab) => void;
    addNotification: (message: string, type?: Notification['type']) => void;
    onViewDocumentDetails: (docId: string) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
    appState, onAddNewDocument, onQueueDocumentsForAnalysis, onDecomposeDocument, onUpdateDocument, onUpdateTags,
    addKnowledgeItem, setActiveTab, addNotification, onViewDocumentDetails
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
    const [taggingDoc, setTaggingDoc] = useState<Document | null>(null);
    const [chatDoc, setChatDoc] = useState<Document | null>(null);
    
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = [...event.target.files];
            for (const file of files) {
                await onAddNewDocument(file);
            }
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleSaveTags = (newTags: string[]) => {
        if (taggingDoc) {
            const updatedDoc = { ...taggingDoc, tags: newTags };
            onUpdateDocument(updatedDoc);
            setTaggingDoc(null);
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!chatDoc) return;

        const newHistory: AnalysisChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        try {
            const conversationContext = newHistory.map(m => `${m.role}: ${m.text}`).join('\n');
            const docContent = chatDoc.textContent || chatDoc.content;

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

    const handleSelectionChange = (docId: string) => {
        setSelectedDocIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const unanalyzedDocs = useMemo(() => appState.documents.filter(d => d.classificationStatus === 'unclassified' || d.classificationStatus === 'error'), [appState.documents]);
    const isAllSelected = unanalyzedDocs.length > 0 && unanalyzedDocs.every(d => selectedDocIds.has(d.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedDocIds(new Set());
        } else {
            setSelectedDocIds(new Set(unanalyzedDocs.map(d => d.id)));
        }
    };

    const handleBatchAnalyze = () => {
        onQueueDocumentsForAnalysis(Array.from(selectedDocIds));
        setSelectedDocIds(new Set());
    };

    const getStatusBadge = (status: Document['classificationStatus']) => {
        switch(status) {
            case 'classified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">Analysiert</span>;
            case 'unclassified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300">Unanalysiert</span>;
            case 'queued': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300">In Warteschlange</span>;
            case 'analyzing': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 flex items-center"><LoadingSpinner className="h-3 w-3 mr-1"/> Analysiere...</span>;
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
                <div className="flex items-center space-x-2">
                    {selectedDocIds.size > 0 && (
                        <button onClick={handleBatchAnalyze} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md">
                            {selectedDocIds.size} Auswahl analysieren
                        </button>
                    )}
                    <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">
                        Dokumente hochladen
                    </button>
                </div>
            </div>
            
             <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="p-4">
                                <div className="flex items-center">
                                    <input 
                                        id="checkbox-all" 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                                </div>
                            </th>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Inhaltstyp</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appState.documents.map(doc => {
                            const isAnalyzing = doc.classificationStatus === 'analyzing';
                            const isQueued = doc.classificationStatus === 'queued';
                            const isSelectable = doc.classificationStatus === 'unclassified' || doc.classificationStatus === 'error';
                            return (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="w-4 p-4">
                                    <div className="flex items-center">
                                        <input 
                                            id={`checkbox-${doc.id}`} 
                                            type="checkbox" 
                                            className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded disabled:cursor-not-allowed disabled:opacity-50"
                                            checked={selectedDocIds.has(doc.id)}
                                            onChange={() => handleSelectionChange(doc.id)}
                                            disabled={!isSelectable}
                                        />
                                        <label htmlFor={`checkbox-${doc.id}`} className="sr-only">checkbox</label>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</td>
                                <td className="px-6 py-4">{getStatusBadge(doc.classificationStatus)}</td>
                                <td className="px-6 py-4">{getContentTypeBadge(doc.contentType)}</td>
                                <td className="px-6 py-4">{(doc.tags || []).join(', ')}</td>
                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                    {isAnalyzing || isQueued ? (
                                        <span className="text-gray-500 italic text-xs">In Bearbeitung...</span>
                                    ) : (
                                        <>
                                            {(doc.classificationStatus === 'unclassified' || doc.classificationStatus === 'error') && (
                                                <button onClick={() => onQueueDocumentsForAnalysis([doc.id])} className="text-purple-400 hover:underline">Analysieren</button>
                                            )}
                                            {doc.classificationStatus === 'classified' && (
                                                <Tooltip text="Dokument von KI in Wissensbausteine zerlegen lassen">
                                                    <button onClick={() => onDecomposeDocument(doc.id)} className="text-teal-400 hover:underline">In Wissen zerlegen</button>
                                                </Tooltip>
                                            )}
                                            <button onClick={() => onViewDocumentDetails(doc.id)} className="text-blue-400 hover:underline">Details</button>
                                            <button onClick={() => { setTaggingDoc(doc); setIsTagModalOpen(true); }} className="text-green-400 hover:underline">Tags</button>
                                            <button onClick={() => { setChatDoc(doc); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
            
            {isTagModalOpen && taggingDoc && (
                <TagManagementModal
                    isOpen={isTagModalOpen}
                    onClose={() => { setIsTagModalOpen(false); setTaggingDoc(null); }}
                    availableTags={appState.tags}
                    assignedTags={taggingDoc.tags}
                    onSave={handleSaveTags}
                    itemName={taggingDoc.name}
                    onCreateTag={(name) => onUpdateTags([...appState.tags, {id: crypto.randomUUID(), name}])}
                />
            )}
            
             {isChatModalOpen && chatDoc && (
                <AnalysisChatModal
                    documents={[chatDoc]}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClose={() => { setIsChatModalOpen(false); setChatDoc(null); }}
                    isLoading={isChatLoading}
                    onAddKnowledge={handleAddKnowledgeFromChat}
                />
            )}
        </div>
    );
};

export default DocumentsTab;