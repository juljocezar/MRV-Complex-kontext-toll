import React, { useState, useEffect } from 'react';
import type { GeneratedDocument, Document, AppState, ArgumentationPoint } from '../../types';
import { TemplateService, DocumentTemplate } from '../../services/templateService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { marked } from 'marked';

interface GenerationTabProps {
    onGenerateContentStream: (params: { instructions: string; template?: string; templateName?: string; sourceDocuments?: Document[], selectedArguments?: ArgumentationPoint[] }, onChunk: (chunk: string) => void) => Promise<GeneratedDocument | null>;
    appState: AppState;
    onUpdateGeneratedDocuments: (docs: GeneratedDocument[]) => void;
    isLoading: boolean;
    onPrepareDispatch: (doc: GeneratedDocument) => void;
}

const GenerationTab: React.FC<GenerationTabProps> = ({ onGenerateContentStream, appState, onUpdateGeneratedDocuments, isLoading, onPrepareDispatch }) => {
    const [instructions, setInstructions] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [selectedArgs, setSelectedArgs] = useState<number[]>([]);
    const [latestGeneratedDoc, setLatestGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

    const supportingArguments = appState.argumentationAnalysis?.supportingArguments || [];

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
        const template = selectedTemplateId ? TemplateService.getTemplateById(selectedTemplateId) : null;
        const selectedArguments = selectedArgs.map(index => supportingArguments[index]);
        
        const params = {
            instructions,
            template: template?.content,
            templateName: template?.name,
            sourceDocuments: sourceDocuments,
            selectedArguments: selectedArguments,
        };

        const result = await onGenerateContentStream(params, (chunk) => {
            setLatestGeneratedDoc(prev => ({
                id: 'temp-streaming-id',
                title: params.templateName || 'Generiere...',
                content: (prev?.content || '') + chunk,
                htmlContent: '', // Not parsed during stream for performance
                createdAt: new Date().toISOString(),
                sourceDocIds: [], // Placeholder
                templateUsed: params.templateName,
            }));
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
    
    const handleArgToggle = (argIndex: number) => {
        setSelectedArgs(prev =>
            prev.includes(argIndex) ? prev.filter(index => index !== argIndex) : [...prev, argIndex]
        );
    };

    const handleDownload = () => {
        if (!latestGeneratedDoc) return;
        const blob = new Blob([latestGeneratedDoc.content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${latestGeneratedDoc.title.replace(/ /g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Dokumentengenerierung</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Left Column: Controls --- */}
                <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg space-y-4 flex flex-col">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Vorlage (Optional)</label>
                        <select
                            value={selectedTemplateId}
                            onChange={e => handleTemplateChange(e.target.value)}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        >
                            <option value="">Keine Vorlage</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Anweisungen & Prompt</label>
                        <textarea
                            rows={8}
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            placeholder="z.B. 'Erstelle einen zusammenfassenden Bericht basierend auf den ausgewählten Dokumenten...'"
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Quelldokumente (Optional)</label>
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

                    {supportingArguments.length > 0 && (
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Schlüsselargumente integrieren</label>
                            <div className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 max-h-48 overflow-y-auto space-y-2">
                                {supportingArguments.map((arg, index) => (
                                    <label key={index} className="flex items-start space-x-2 text-sm text-gray-200 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedArgs.includes(index)} 
                                            onChange={() => handleArgToggle(index)}
                                            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500 mt-1"
                                        />
                                        <span className="flex-grow">{arg.point}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-grow flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500 flex items-center justify-center"
                        >
                            {isLoading && <LoadingSpinner className="h-5 w-5 mr-3" />}
                            {isLoading ? 'Generiere...' : 'Dokument erstellen'}
                        </button>
                    </div>
                </div>

                {/* --- Right Column: Output --- */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg min-h-[600px] flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Vorschau</h2>
                        {latestGeneratedDoc && latestGeneratedDoc.id !== 'temp-streaming-id' && (
                            <div className="flex space-x-2">
                                <button onClick={handleDownload} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-xs">
                                    Download (.md)
                                </button>
                                <button onClick={() => onPrepareDispatch(latestGeneratedDoc)} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-md text-xs">
                                    Für Versand vorbereiten
                                </button>
                            </div>
                        )}
                     </div>
                     <div className="flex-grow bg-gray-900/50 p-4 rounded-md border border-gray-700 overflow-y-auto">
                        {isLoading && !latestGeneratedDoc && <p className="text-gray-400">Dokument wird generiert...</p>}
                        {latestGeneratedDoc ? (
                            <div 
                                className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: latestGeneratedDoc.htmlContent || latestGeneratedDoc.content.replace(/\n/g, '<br />') }}
                            >
                            </div>
                        ) : !isLoading && (
                            <p className="text-gray-500">Hier wird das generierte Dokument angezeigt.</p>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default GenerationTab;