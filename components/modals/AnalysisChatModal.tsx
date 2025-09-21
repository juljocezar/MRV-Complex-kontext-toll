import React, { useState, useRef, useEffect } from 'react';
import React, { useState, useRef, useEffect } from 'react';
import type { Document, AnalysisChatMessage } from '../../types';

/**
 * Props for the AnalysisChatModal component.
 */
interface AnalysisChatModalProps {
    /** The document(s) being analyzed in the chat. */
    documents: Document[];
    /** The history of messages in the chat. */
    chatHistory: AnalysisChatMessage[];
    /** Callback function to send a new message. */
    onSendMessage: (message: string) => void;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** Boolean indicating if the chat is currently waiting for a response. */
    isLoading: boolean;
    /** Callback to create a new knowledge item from selected text. */
    onAddKnowledge: (title: string, summary: string, sourceDocId: string) => void;
}

/**
 * A modal component that provides a chat interface for analyzing one or more documents.
 * It allows users to ask questions about the documents and captures insights.
 * @param {AnalysisChatModalProps} props - The props for the component.
 */
const AnalysisChatModal: React.FC<AnalysisChatModalProps> = ({ documents, chatHistory, onSendMessage, onClose, isLoading, onAddKnowledge }) => {
    const [message, setMessage] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isMultiDoc = documents.length > 1;
    const singleDoc = isMultiDoc ? null : documents[0];

    // Auto-scroll to the bottom of the chat history when new messages are added.
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    /**
     * Captures text selected by the user within the chat container.
     * This is disabled in multi-document chat mode.
     */
    const handleMouseUp = () => {
        if (isMultiDoc) return;
        const selection = window.getSelection()?.toString().trim();
        if (selection) {
            setSelectedText(selection);
        } else {
            setSelectedText('');
        }
    };

    /**
     * Handles the creation of a new knowledge item from the selected text.
     * Prompts the user for a title for the new item.
     */
    const handleCreateKnowledgeItem = () => {
        if (!selectedText || !singleDoc) return;
        const title = prompt("Title for the new knowledge item:", `Excerpt from ${singleDoc.name}`);
        if (title) {
            onAddKnowledge(title, selectedText, singleDoc.id);
            setSelectedText('');
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white truncate">Chat Analysis: <span className="text-blue-400">{isMultiDoc ? `${documents.length} Documents` : documents[0]?.name}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4" onMouseUp={handleMouseUp}>
                    {chatHistory.map((chat, index) => (
                        <div key={index} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl px-4 py-2 rounded-lg ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="whitespace-pre-wrap">{chat.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-xl px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                                 <div className="flex items-center space-x-2">
                                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                 </div>
                             </div>
                         </div>
                    )}
                </div>
                {selectedText && !isMultiDoc && (
                    <div className="p-2 border-t border-gray-700 bg-gray-700/50 flex items-center justify-between">
                        <p className="text-xs text-gray-300 truncate italic mr-4">"{selectedText}"</p>
                        <button onClick={handleCreateKnowledgeItem} className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-white text-xs whitespace-nowrap">
                            Save as Knowledge
                        </button>
                    </div>
                )}
                <footer className="p-4 border-t border-gray-700">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Ask a question about the document..."
                            className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isLoading ? '...' : 'Send'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AnalysisChatModal;
