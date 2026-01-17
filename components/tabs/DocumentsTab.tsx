
import React, { useState, useRef, useMemo } from 'react';
import type { AppState, Document, Tag, AnalysisChatMessage, KnowledgeItem, ActiveTab, Notification } from '../../types';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { GeminiService } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';


interface DocumentsTabProps {
    appState: AppState;
    onAddNewDocument: (file: File) => Promise<void>;
    onAnalyzeDocument: (docId: string) => Promise<void>;
    onUpdateDocument: (doc: Document) => void;
    onUpdateTags: (tags: Tag[]) => void;
    addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void;
    setActiveTab: (tab: ActiveTab) => void;
    addNotification: (message: string, type?: Notification['type']) => void;
    onViewDocumentDetails: (docId: string) => void;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
    appState, onAddNewDocument, onAnalyzeDocument, onUpdateDocument, onUpdateTags,
    addKnowledgeItem, setActiveTab, addNotification, onViewDocumentDetails
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const selectedDoc = appState.documents.find(d => d.id === selectedDocId) || null;

    // Filter Logic
    const filteredDocuments = useMemo(() => {
        if (!filterTag) return appState.documents;
        return appState.documents.filter(doc => doc.tags && doc.tags.includes(filterTag));
    }, [appState.documents, filterTag]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = [...event.target.files];
            let uploadedCount = 0;
            for (const file of files) {
                await onAddNewDocument(file);
                uploadedCount++;
            }
            if (uploadedCount > 0) {
                addNotification(`${uploadedCount} Dokument(e) Upload erfolgreich.`, 'success');
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
            // Keep the doc selected but update local ref if needed in specific flows
            // Note: selectedDoc comes from appState, so updating appState triggers re-render with new tags
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
            
            const responseText = await GeminiService.callAI(prompt, null, appState.settings.ai);
            setChatHistory(h => [...h, { role: 'assistant', text: responseText }]);

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


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Dokumentenverwaltung</h1>
                <div className="flex gap-3">
                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        data-testid="file-input"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center">
                        <span className="mr-2">+</span> Dokumente hochladen
                    </button>
                </div>
            </div>
            
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-center bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <span className="text-sm text-gray-400 mr-2">Filtern nach Tags:</span>
                <button
                    onClick={() => setFilterTag(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                        filterTag === null 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    }`}
                >
                    Alle
                </button>
                {appState.tags.map(tag => (
                    <button
                        key={tag.id}
                        onClick={() => setFilterTag(tag.name === filterTag ? null : tag.name)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                            tag.name === filterTag
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                    >
                        {tag.name}
                    </button>
                ))}
                {appState.tags.length === 0 && <span className="text-xs text-gray-500 italic">Keine Tags verfügbar. Erstellen Sie Tags in den Einstellungen oder via "Tags" Button.</span>}
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
                        {filteredDocuments.map(doc => (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className="text-xl mr-2">📄</span>
                                        {doc.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(doc.classificationStatus)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(doc.tags || []).map(tag => (
                                            <span 
                                                key={tag} 
                                                onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80 ${
                                                    tag === filterTag 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-700 text-gray-300'
                                                }`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {(!doc.tags || doc.tags.length === 0) && <span className="text-gray-500 italic">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 space-x-2 whitespace-nowrap">
                                    {appState.isLoading && appState.analyzingDocId === doc.id ? (
                                        <div className="flex items-center text-yellow-400">
                                            <LoadingSpinner className="h-4 w-4 mr-2" />
                                            <span>Analysiere...</span>
                                        </div>
                                    ) : (
                                        <>
                                            {doc.classificationStatus === 'unclassified' && (
                                                <button onClick={() => onAnalyzeDocument(doc.id)} className="text-purple-400 hover:underline">Analysieren</button>
                                            )}
                                            <button onClick={() => onViewDocumentDetails(doc.id)} className="text-blue-400 hover:underline">Details</button>
                                            <button onClick={() => { setSelectedDocId(doc.id); setIsTagModalOpen(true); }} className="text-green-400 hover:underline">Tags</button>
                                            <button onClick={() => { setSelectedDocId(doc.id); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredDocuments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    {filterTag ? `Keine Dokumente mit dem Tag "${filterTag}" gefunden.` : "Keine Dokumente vorhanden. Laden Sie Dokumente hoch."}
                                </td>
                            </tr>
                        )}
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
