
import React, { useState, useRef, useMemo } from 'react';
import type { AppState, Document, Tag, AnalysisChatMessage, KnowledgeItem, ActiveTab, Notification, AnalysisMode } from '../../types';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { GeminiService } from '../../services/geminiService';
import LoadingSpinner from '../ui/LoadingSpinner';
import SkeletonLoader from '../ui/SkeletonLoader';
import Tooltip from '../ui/Tooltip';


interface DocumentsTabProps {
    appState: AppState;
    onAddNewDocument: (file: File) => Promise<void>;
    onAnalyzeDocument: (docId: string, mode: AnalysisMode) => Promise<void>;
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
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('scan');

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
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleSaveTags = (newTags: string[]) => {
        if (selectedDoc) {
            const updatedDoc = { ...selectedDoc, tags: newTags };
            onUpdateDocument(updatedDoc);
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
            tags: []
        });
        setActiveTab('knowledge');
        setIsChatModalOpen(false);
    };

    const getStatusBadge = (doc: Document) => {
        switch(doc.classificationStatus) {
            case 'classified': return <span className={`px-2 py-1 text-xs font-medium rounded-full ${doc.analysisMode === 'forensic' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' : 'bg-green-500/20 text-green-300'}`}>{doc.analysisMode === 'forensic' ? 'Forensisch' : 'Basis-Scan'}</span>;
            case 'unclassified': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300">Unanalysiert</span>;
            case 'error': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300">Fehler</span>;
            default: return null;
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Dokumentenverwaltung</h1>
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    
                    {/* Analysis Mode Toggle */}
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <button
                            onClick={() => setAnalysisMode('scan')}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${analysisMode === 'scan' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            title="Schneller Scan: Metadaten & Zusammenfassung"
                        >
                            🚀 Scan (Schnell)
                        </button>
                        <button
                            onClick={() => setAnalysisMode('forensic')}
                            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${analysisMode === 'forensic' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            title="Tiefenanalyse: ESF-Extraktion, Logic Engine & Widerspruchsprüfung"
                        >
                            🔍 Forensik (Tief)
                        </button>
                    </div>

                    <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        data-testid="file-input"
                    />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md flex items-center shadow-lg transition-transform hover:scale-105">
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
                {appState.tags.length === 0 && <span className="text-xs text-gray-500 italic">Keine Tags verfügbar.</span>}
            </div>

             <div className="bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-700">
                 <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-1/3">Name</th>
                            <th scope="col" className="px-6 py-3 w-1/6">Status</th>
                            <th scope="col" className="px-6 py-3 w-1/4">Tags</th>
                            <th scope="col" className="px-6 py-3 w-1/4">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Loading State Skeleton */}
                        {appState.isLoading && filteredDocuments.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-700">
                                    <td className="px-6 py-4"><SkeletonLoader type="text" className="w-3/4" /></td>
                                    <td className="px-6 py-4"><SkeletonLoader type="text" className="w-1/2" /></td>
                                    <td className="px-6 py-4"><SkeletonLoader type="text" className="w-full" /></td>
                                    <td className="px-6 py-4"><SkeletonLoader type="text" className="w-1/2" /></td>
                                </tr>
                            ))
                        ) : (
                            filteredDocuments.map(doc => (
                                <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3 opacity-70">📄</span>
                                            <div className="truncate max-w-[200px]" title={doc.name}>
                                                {doc.name}
                                                <div className="text-xs text-gray-500 font-normal">{new Date(doc.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(doc)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {(doc.tags || []).map(tag => (
                                                <span 
                                                    key={tag} 
                                                    onClick={() => setFilterTag(tag === filterTag ? null : tag)}
                                                    className={`px-2 py-0.5 rounded text-[10px] cursor-pointer hover:opacity-80 transition-opacity border ${
                                                        tag === filterTag 
                                                        ? 'bg-blue-600 text-white border-blue-500' 
                                                        : 'bg-gray-700 text-gray-300 border-gray-600'
                                                    }`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {(!doc.tags || doc.tags.length === 0) && <span className="text-gray-500 italic text-xs">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                            {appState.isLoading && appState.analyzingDocId === doc.id ? (
                                                <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                                                    <LoadingSpinner className="h-3 w-3 mr-2" />
                                                    <span className="text-xs">Analysiere...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => onAnalyzeDocument(doc.id, analysisMode)} 
                                                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:opacity-80 ${analysisMode === 'forensic' ? 'text-purple-400' : 'text-blue-400'}`}
                                                        title={`Starte ${analysisMode === 'forensic' ? 'Forensische' : 'Basis'} Analyse`}
                                                    >
                                                        <span>⚡</span> {doc.classificationStatus === 'unclassified' ? 'Analysieren' : 'Neu Analysieren'}
                                                    </button>
                                                    <button onClick={() => onViewDocumentDetails(doc.id)} className="text-blue-400 hover:text-blue-300">Details</button>
                                                    <button onClick={() => { setSelectedDocId(doc.id); setIsTagModalOpen(true); }} className="text-green-400 hover:text-green-300">Tags</button>
                                                    <button onClick={() => { setSelectedDocId(doc.id); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300">Chat</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        {!appState.isLoading && filteredDocuments.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl mb-2 opacity-30">📭</span>
                                        {filterTag ? `Keine Dokumente mit dem Tag "${filterTag}" gefunden.` : "Keine Dokumente vorhanden. Laden Sie Dokumente hoch."}
                                    </div>
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
