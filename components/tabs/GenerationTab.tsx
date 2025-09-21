import React, { useState, useEffect } from 'react';
import type { GeneratedDocument, Document, AppState } from '../../types';
import { TemplateService, DocumentTemplate } from '../../services/templateService';

/**
 * Props for the GenerationTab component.
 */
interface GenerationTabProps {
    /** The main callback function to trigger content generation. */
    onGenerateContent: (params: { instructions: string; templateId?: string; sourceDocuments?: Document[] }) => Promise<GeneratedDocument | null>;
    /** The global state of the application. */
    appState: AppState;
    /** Function to update the list of generated documents in the global state. */
    setGeneratedDocuments: React.Dispatch<React.SetStateAction<GeneratedDocument[]>>;
    /** A boolean indicating if the generation process is currently running. */
    isLoading: boolean;
}

/**
 * A UI component for generating new documents based on user inputs.
 * It provides controls for selecting templates, writing instructions, and choosing source documents,
 * and displays the generated content.
 * @param {GenerationTabProps} props - The props for the component.
 */
const GenerationTab: React.FC<GenerationTabProps> = ({ onGenerateContent, appState, setGeneratedDocuments, isLoading }) => {
    const [instructions, setInstructions] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [latestGeneratedDoc, setLatestGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

    useEffect(() => {
        setTemplates(TemplateService.getAllTemplates());
    }, []);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        if (templateId) {
            const template = TemplateService.getTemplateById(templateId);
            if(template) {
                setInstructions(template.content);
            }
        } else {
            setInstructions('');
        }
    };

    const handleGenerate = async () => {
        setLatestGeneratedDoc(null);
        const sourceDocuments = appState.documents.filter(doc => selectedDocs.includes(doc.id));
        
        const result = await onGenerateContent({
            instructions,
            templateId: selectedTemplateId,
            sourceDocuments: sourceDocuments,
        });

        if (result) {
            setLatestGeneratedDoc(result);
        }
    };

    const handleDocToggle = (docId: string) => {
        setSelectedDocs(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Document Generation</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Left Column: Controls --- */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg space-y-4 flex flex-col">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Template (Optional)</label>
                        <select
                            value={selectedTemplateId}
                            onChange={e => handleTemplateChange(e.target.value)}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        >
                            <option value="">No Template</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Instructions & Prompt</label>
                        <textarea
                            rows={8}
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            placeholder="e.g., 'Create a summary report based on the selected documents...'"
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Source Documents (Optional)</label>
                        <div className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 max-h-48 overflow-y-auto space-y-2">
                            {appState.documents.map(doc => (
                                <label key={doc.id} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedDocs.includes(doc.id)} 
                                        onChange={() => handleDocToggle(doc.id)}
                                        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="truncate">{doc.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500"
                        >
                            {isLoading ? 'Generating...' : 'Create Document'}
                        </button>
                    </div>
                </div>

                {/* --- Right Column: Output --- */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg min-h-[600px] flex flex-col">
                     <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
                     <div className="flex-grow bg-gray-900/50 p-4 rounded-md border border-gray-700 overflow-y-auto">
                        {isLoading && <p className="text-gray-400">Generating document...</p>}
                        {latestGeneratedDoc ? (
                            <div 
                                className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: latestGeneratedDoc.htmlContent || latestGeneratedDoc.content.replace(/\n/g, '<br />') }}
                            >
                            </div>
                        ) : !isLoading && (
                            <p className="text-gray-500">The generated document will be displayed here.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default GenerationTab;
