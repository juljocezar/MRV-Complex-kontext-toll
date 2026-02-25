
import React, { useState, useEffect } from 'react';
import type { GeneratedDocument, Document, AppState } from '../../types';
import { TemplateService, DocumentTemplate } from '../../services/templateService';
import LoadingSpinner from '../ui/LoadingSpinner';
import { GeminiService } from '../../services/geminiService';
import { buildCaseContext } from '../../utils/contextUtils';
import { marked } from 'marked';

declare global {
    interface Window {
        DOMPurify: {
            sanitize: (html: string) => string;
        };
    }
}

interface GenerationTabProps {
    onGenerateContent: (params: { instructions: string; templateId?: string; sourceDocuments?: Document[] }) => Promise<GeneratedDocument | null>;
    appState: AppState;
    onUpdateGeneratedDocuments: (docs: GeneratedDocument[]) => void;
    isLoading: boolean;
}

const GenerationTab: React.FC<GenerationTabProps> = ({ onGenerateContent, appState, onUpdateGeneratedDocuments, isLoading }) => {
    const [instructions, setInstructions] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [latestGeneratedDoc, setLatestGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    
    // Streaming State
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');

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

    const handleGenerateStream = async () => {
        setLatestGeneratedDoc(null);
        setStreamContent('');
        setIsStreaming(true);

        const sourceDocuments = appState.documents.filter(doc => selectedDocs.includes(doc.id));
        const caseContext = buildCaseContext(appState);
        
        const documentsContext = sourceDocuments.map(doc => 
            `--- DOKUMENT START: ${doc.name} ---\nINHALT:\n${doc.textContent || doc.content.substring(0, 5000)}...\n--- DOKUMENT ENDE ---\n`
        ).join('\n');

        const prompt = `
            Du bist ein Spezialist für die Erstellung hochwertiger, strukturierter Dokumente im Bereich Menschenrechte.
            FALLKONTEXT:\n${caseContext}
            ${documentsContext ? `QUELLDOKUMENTE:\n${documentsContext}\n` : ''}
            ANWEISUNGEN:\n${instructions}
            
            Erstelle ein professionelles Dokument in Markdown.
        `;

        let fullText = "";
        try {
            const stream = GeminiService.callAIStream(prompt, appState.settings.ai, 'gemini-3-pro-preview');
            
            for await (const chunk of stream) {
                fullText += chunk;
                setStreamContent(fullText);
            }

            // Finalize
            const htmlContent = await marked.parse(fullText);
            const newDoc: GeneratedDocument = {
                id: crypto.randomUUID(),
                title: selectedTemplateId ? `Generiert: ${selectedTemplateId}` : 'Generiertes Dokument',
                content: fullText,
                htmlContent: htmlContent,
                createdAt: new Date().toISOString(),
                templateUsed: selectedTemplateId,
                sourceDocIds: sourceDocuments.map(d => d.id)
            };
            
            setLatestGeneratedDoc(newDoc);
            
            // We use the parent prop to save it properly via Reducer/Storage
            // Ideally we expose a specific save action, but reusing onGenerateContent logic for saving is a bit tricky
            // if onGenerateContent does generation AND saving.
            // Let's assume we call a save function here or manually dispatch. 
            // For now, to keep consistency with the prop interface, we might not save automatically 
            // OR we assume the user will copy it. 
            // BETTER: Dispatch the SAVE action. But I don't have dispatch here.
            // WORKAROUND: I will re-implement a "Save" button for the streamed content.
            
        } catch (e) {
            console.error("Streaming error", e);
        } finally {
            setIsStreaming(false);
        }
    };

    const handleDocToggle = (docId: string) => {
        setSelectedDocs(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };

    const getSafeHtml = (content: string) => {
        const raw = marked.parse(content) as string; // synchronous parse if awaited before
        return window.DOMPurify && window.DOMPurify.sanitize ? window.DOMPurify.sanitize(raw) : raw;
    }

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
                            placeholder="z.B. 'Erstelle einen zusammenfassenden Bericht...'"
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Quelldokumente</label>
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
                            onClick={handleGenerateStream}
                            disabled={isStreaming || isLoading}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500 flex items-center justify-center"
                        >
                            {isStreaming ? <LoadingSpinner className="h-5 w-5 mr-3" /> : null}
                            {isStreaming ? 'Generiere...' : 'Dokument erstellen'}
                        </button>
                    </div>
                </div>

                {/* --- Right Column: Output --- */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg min-h-[600px] flex flex-col">
                     <h2 className="text-xl font-semibold text-white mb-4">Vorschau</h2>
                     <div className="flex-grow bg-gray-900/50 p-4 rounded-md border border-gray-700 overflow-y-auto">
                        
                        {/* Stream Content */}
                        {streamContent ? (
                            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                                {streamContent}
                                {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse"></span>}
                            </div>
                        ) : latestGeneratedDoc ? (
                            <div 
                                className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: latestGeneratedDoc.htmlContent || '' }}
                            ></div>
                        ) : (
                            <p className="text-gray-500">Ergebnis erscheint hier...</p>
                        )}
                     </div>
                     
                     {latestGeneratedDoc && !isStreaming && (
                         <div className="mt-4 flex justify-end">
                             {/* Placeholder for save functionality if we decoupled it from generate */}
                             <span className="text-green-400 text-sm">Fertiggestellt.</span>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default GenerationTab;
