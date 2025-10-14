import React, { useState, useEffect } from 'react';
import type { GeneratedDocument, Document, ChecklistItem, ActiveTab } from '../../types';
import RecipientSuggestionModal from '../modals/RecipientSuggestionModal';

interface DispatchTabProps {
    dispatchDocument: GeneratedDocument | null;
    checklist: ChecklistItem[];
    onUpdateChecklist: (checklist: ChecklistItem[]) => void;
    onDraftBody: (subject: string, attachments: (Document | GeneratedDocument)[]) => Promise<string>;
    onConfirmDispatch: () => void;
    isLoading: boolean;
    loadingSection: string;
    setActiveTab: (tab: ActiveTab) => void;
    documents: Document[];
    generatedDocuments: GeneratedDocument[];
    coverLetter: string;
    setCoverLetter: (val: string) => void;
}

const DispatchTab: React.FC<DispatchTabProps> = ({
    dispatchDocument, checklist, onUpdateChecklist, onDraftBody, onConfirmDispatch,
    isLoading, loadingSection, setActiveTab, documents, generatedDocuments, coverLetter, setCoverLetter
}) => {
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState(dispatchDocument?.title || '');
    const [attachments, setAttachments] = useState<(Document | GeneratedDocument)[]>([]);
    const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);

    useEffect(() => {
        if (dispatchDocument) {
            setSubject(dispatchDocument.title);
            setAttachments([dispatchDocument]);
        }
    }, [dispatchDocument]);

    if (!dispatchDocument) {
        return (
            <div className="text-center text-gray-500 py-12">
                <p>Kein Dokument für den Versand ausgewählt.</p>
                <button onClick={() => setActiveTab('generation')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
                    Zur Generierung
                </button>
            </div>
        );
    }

    const handleChecklistToggle = (id: string) => {
        const newChecklist = checklist.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        onUpdateChecklist(newChecklist);
    };

    const handleDraftClick = () => {
        if (subject) {
            onDraftBody(subject, attachments);
        }
    };
    
    const isDispatchReady = checklist.every(item => item.checked) && recipient && subject && coverLetter;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Versandvorbereitung</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">E-Mail-Entwurf</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Empfänger</label>
                        <div className="flex items-center">
                            <input
                                type="email"
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                className="mt-1 w-full bg-gray-700 p-2 rounded-md"
                                placeholder="empfaenger@example.com"
                            />
                            <button onClick={() => setIsRecipientModalOpen(true)} className="ml-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm">...</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Betreff</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="mt-1 w-full bg-gray-700 p-2 rounded-md"
                        />
                    </div>
                     <div>
                         <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-300">Textkörper</label>
                            <button onClick={handleDraftClick} disabled={isLoading && loadingSection === 'dispatch-body'} className="text-sm text-blue-400 hover:underline disabled:text-gray-500">
                                {isLoading && loadingSection === 'dispatch-body' ? 'Erstelle...' : 'KI-Entwurf erstellen'}
                            </button>
                         </div>
                        <textarea
                            rows={12}
                            value={coverLetter}
                            onChange={e => setCoverLetter(e.target.value)}
                            className="mt-1 w-full bg-gray-700 p-2 rounded-md"
                            placeholder="Schreiben Sie hier Ihre E-Mail oder lassen Sie einen Entwurf generieren..."
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300">Anhänge</label>
                        <div className="mt-1 space-y-2">
                           {attachments.map(att => (
                               <div key={att.id} className="bg-gray-700 p-2 rounded-md text-sm">
                                   {'name' in att ? att.name : att.title}
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">Checkliste</h2>
                    <div className="space-y-3">
                        {checklist.map(item => (
                            <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleChecklistToggle(item.id)}
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600"
                                />
                                <span className={`text-gray-300 ${item.checked ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
                            </label>
                        ))}
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                         <button
                            onClick={onConfirmDispatch}
                            disabled={!isDispatchReady}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Versand protokollieren
                        </button>
                    </div>
                </div>
            </div>
            {isRecipientModalOpen && (
                <RecipientSuggestionModal
                    isOpen={isRecipientModalOpen}
                    onClose={() => setIsRecipientModalOpen(false)}
                    onSelect={email => {
                        setRecipient(email);
                        setIsRecipientModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default DispatchTab;
