import React, { useState, useEffect } from 'react';
import { useAgentDispatcher } from '../../hooks/useAgentDispatcher';
import type { GeneratedDocument, Document, AppState, AgentActivity } from '../../types';
import { TemplateService, DocumentTemplate } from '../../services/templateService';
import { marked } from 'marked';

interface GenerationTabProps {
    appState: AppState;
    addAgentActivity: (activity: Omit<AgentActivity, 'id' | 'timestamp'>) => Promise<void>;
    setAppState: React.Dispatch<React.SetStateAction<AppState | null>>;
}

const GenerationTab: React.FC<GenerationTabProps> = ({ appState, addAgentActivity, setAppState }) => {
    const { dispatchAgentTask, isLoading } = useAgentDispatcher(appState, addAgentActivity);
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

    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        setLatestGeneratedDoc(null);
        setIsSaved(false);

        const sourceDocuments = appState.documents.filter(doc => selectedDocs.includes(doc.id));
        const template = selectedTemplateId ? TemplateService.getTemplateById(selectedTemplateId) : null;

        let fullInstructions = instructions;
        if (template) {
            fullInstructions = `Using the following template as a structural guide, ${instructions}\n\nTemplate:\n"""${template.content}"""`;
        }
        if (sourceDocuments.length > 0) {
            fullInstructions += `\n\nBase your response on the following source documents:\n` + sourceDocuments.map(d => `--- DOC: ${d.name} ---\n${d.content}\n`).join('\n');
        }

        const result = await dispatchAgentTask(fullInstructions, 'content_creation');

        if (result) {
            const htmlContent = await marked.parse(result);
            const newDoc: GeneratedDocument = {
                id: crypto.randomUUID(),
                title: `Generated Document - ${new Date().toLocaleDateString()}`,
                content: result,
                htmlContent: htmlContent,
                createdAt: new Date().toISOString(),
                templateUsed: selectedTemplateId || undefined,
                sourceDocIds: selectedDocs,
            };
            setLatestGeneratedDoc(newDoc);
        }
    };

    const handleSaveDocument = () => {
        if (latestGeneratedDoc) {
            setAppState(s => {
                if (!s) return null;
                // Avoid duplicates
                if (s.generatedDocuments.some(d => d.id === latestGeneratedDoc.id)) {
                    return s;
                }
                return {
                    ...s,
                    generatedDocuments: [...s.generatedDocuments, latestGeneratedDoc]
                };
            });
            setIsSaved(true);
        }
    };

    const handleDocToggle = (docId: string) => {
        setSelectedDocs(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
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
                    <div className="flex-grow flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500"
                        >
                            {isLoading ? 'Generiere...' : 'Dokument erstellen'}
                        </button>
                    </div>
                </div>

                {/* --- Right Column: Output --- */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg min-h-[600px] flex flex-col">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Vorschau</h2>
                        {latestGeneratedDoc && !isSaved && (
                            <button
                                onClick={handleSaveDocument}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md"
                            >
                                Im Fall speichern
                            </button>
                        )}
                        {latestGeneratedDoc && isSaved && (
                            <p className="text-green-400">Dokument wurde gespeichert.</p>
                        )}
                     </div>
                     <div className="flex-grow bg-gray-900/50 p-4 rounded-md border border-gray-700 overflow-y-auto">
                        {isLoading && <p className="text-gray-400">Dokument wird generiert...</p>}
                        {latestGeneratedDoc ? (
                            <div 
                                className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: latestGeneratedDoc.htmlContent || '' }}
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
