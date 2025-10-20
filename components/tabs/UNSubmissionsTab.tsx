import React, { useState } from 'react';
import { UN_SUBMISSION_TEMPLATES, UN_SUBMISSION_CHECKLIST } from '../../constants/unProcedures';
// Fix: Corrected import path for types.
import { AppState } from '../../types';
import { UNProceduresService } from '../../services/unProceduresService';

interface UNSubmissionsTabProps {
    appState: AppState;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const UNSubmissionsTab: React.FC<UNSubmissionsTabProps> = ({ appState, isLoading, setIsLoading }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(UN_SUBMISSION_TEMPLATES[0].id);
    const [draftContent, setDraftContent] = useState('');
    const [finalContent, setFinalContent] = useState('');
    const [checklist, setChecklist] = useState(UN_SUBMISSION_CHECKLIST);

    const handleDraft = async () => {
        setIsLoading(true);
        setDraftContent('');
        setFinalContent('');
        const draft = await UNProceduresService.draftSubmission(selectedTemplate, appState);
        setDraftContent(draft);
        setIsLoading(false);
    };

    const handleFinalize = async () => {
        setIsLoading(true);
        const final = await UNProceduresService.finalizeSubmission(draftContent, appState);
        setFinalContent(final);
        setIsLoading(false);
    };
    
    const handleChecklistToggle = (id: string) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };
    
    const isChecklistComplete = checklist.every(item => item.checked);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">UN-Einreichungen (Special Procedures)</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg space-y-4 flex flex-col">
                    <h2 className="text-xl font-semibold text-white">Steuerung</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Vorlage auswählen</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        >
                            {UN_SUBMISSION_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleDraft} disabled={isLoading} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md disabled:bg-gray-500">
                        {isLoading ? 'Erstelle...' : '1. Entwurf erstellen'}
                    </button>
                    <button onClick={handleFinalize} disabled={isLoading || !draftContent} className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-500">
                        {isLoading ? 'Finalisiere...' : '2. Entwurf finalisieren'}
                    </button>
                    <div className="border-t border-gray-700 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Checkliste vor Versand</h3>
                        <div className="space-y-2">
                            {checklist.map(item => (
                                <label key={item.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={item.checked} onChange={() => handleChecklistToggle(item.id)} className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"/>
                                    <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{item.text}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div className="flex-grow flex items-end">
                        <button disabled={!isChecklistComplete || !finalContent} className="w-full mt-4 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed">
                            Versand simulieren
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Entwurf</h3>
                        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap bg-gray-700 p-3 rounded-md min-h-[200px]">
                           {isLoading && !draftContent ? 'Generiere Entwurf...' : draftContent || 'Hier erscheint der Entwurf.'}
                        </div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Finalisierte Version</h3>
                        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap bg-gray-700 p-3 rounded-md min-h-[200px]">
                           {isLoading && !finalContent && draftContent ? 'Finalisiere Entwurf...' : finalContent || 'Hier erscheint die finalisierte Version.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UNSubmissionsTab;
