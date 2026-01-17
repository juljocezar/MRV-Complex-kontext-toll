
import React, { useState } from 'react';
// Fix: Corrected import path for types.
import type { GeneratedDocument, ChecklistItem, ActiveTab, Document } from '../../types';

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
    setCoverLetter: (value: string) => void;
}

const DispatchTab: React.FC<DispatchTabProps> = ({
    dispatchDocument, checklist, onUpdateChecklist, onDraftBody, onConfirmDispatch, 
    isLoading, loadingSection, setActiveTab, documents, generatedDocuments,
    coverLetter, setCoverLetter
}) => {
    const [email, setEmail] = useState({ recipient: '', subject: '' });
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>(dispatchDocument ? [dispatchDocument.id] : []);

    const allAttachableDocs = [
        ...generatedDocuments.map(d => ({ ...d, type: 'generated' })), 
        ...documents.map(d => ({ id: d.id, title: d.name, type: 'uploaded' }))
    ];

    const handleToggleAttachment = (id: string) => {
        setSelectedAttachments(prev => prev.includes(id) ? prev.filter(attId => attId !== id) : [...prev, id]);
    };
    
    const handleChecklistToggle = (id: string) => {
        onUpdateChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };

    const handleDraftEmailBody = async () => {
        const attachedGenerated = generatedDocuments.filter(d => selectedAttachments.includes(d.id));
        const attachedDocs = documents.filter(d => selectedAttachments.includes(d.id));
        const attachments = [...attachedGenerated, ...attachedDocs];
        const draftBody = await onDraftBody(email.subject, attachments);
        setCoverLetter(draftBody);
    };

    if (!dispatchDocument && selectedAttachments.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-500">Kein Dokument für den Versand ausgewählt.</p>
                <button onClick={() => setActiveTab('generation')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md">
                    Zur Dokumentengenerierung
                </button>
            </div>
        );
    }
    
    const isChecklistComplete = checklist.every(item => item.checked);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Versandvorbereitung</h1>
            
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Email and Attachments */}
                <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold text-white">Kommunikation</h3>
                    <div>
                        <label className="text-sm text-gray-400">Empfänger</label>
                        <input type="email" placeholder="empfaenger@example.com" value={email.recipient} onChange={e => setEmail({...email, recipient: e.target.value})} className="w-full mt-1 bg-gray-700 p-2 rounded-md" />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Betreff</label>
                        <input type="text" placeholder="Betreff der E-Mail" value={email.subject} onChange={e => setEmail({...email, subject: e.target.value})} className="w-full mt-1 bg-gray-700 p-2 rounded-md" />
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="text-sm text-gray-400">Textkörper</label>
                             <button onClick={handleDraftEmailBody} disabled={isLoading && loadingSection === 'dispatch-body'} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs disabled:bg-gray-500">
                                {isLoading && loadingSection === 'dispatch-body' ? '...' : 'Entwurf erstellen'}
                             </button>
                        </div>
                        <textarea 
                            value={coverLetter}
                            onChange={e => setCoverLetter(e.target.value)}
                            rows={10}
                            className="w-full bg-gray-700 p-2 rounded-md"
                            placeholder="Hier E-Mail-Text einfügen oder generieren..."
                        />
                    </div>
                     <div>
                        <label className="text-sm text-gray-400">Anhänge</label>
                        <div className="w-full mt-1 bg-gray-700 p-2 rounded-md max-h-48 overflow-y-auto space-y-2">
                           {allAttachableDocs.map(doc => (
                               <label key={doc.id} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                                    <input type="checkbox" checked={selectedAttachments.includes(doc.id)} onChange={() => handleToggleAttachment(doc.id)} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"/>
                                    <span>{doc.title} <span className="text-xs text-gray-500">({doc.type === 'generated' ? 'Generiert' : 'Hochgeladen'})</span></span>
                               </label>
                           ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Checklist & Confirmation */}
                <div className="bg-gray-800 p-6 rounded-lg space-y-4 flex flex-col">
                    <h3 className="text-lg font-semibold text-white">Versand-Checkliste</h3>
                    <div className="space-y-3">
                        {checklist.map(item => (
                            <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => handleChecklistToggle(item.id)}
                                    className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className={`text-gray-300 ${item.checked ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex-grow flex items-end justify-center">
                        <button 
                            onClick={onConfirmDispatch}
                            disabled={!isChecklistComplete || selectedAttachments.length === 0}
                            className="w-full px-8 py-3 bg-green-600 text-white font-bold text-lg rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-500 transition-colors"
                            title={!isChecklistComplete ? "Bitte alle Punkte der Checkliste abschließen." : "Versand protokollieren"}
                        >
                            Versand bestätigen & protokollieren
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DispatchTab;
