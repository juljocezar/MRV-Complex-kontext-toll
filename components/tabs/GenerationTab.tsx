
import React, { useState } from 'react';
// Fix: Corrected type name from GeneratedDocument to GeneratedDoc to match type definitions.
import { Document, GeneratedDocument, ActiveTab } from '../../types';
import { DOCUMENT_TEMPLATES } from '../../constants';

interface GenerationTabProps {
    onGenerateDocument: (prompt: string, title: string, sourceDocIds: string[]) => Promise<string>;
    isLoading: boolean;
    generatedDocuments: GeneratedDocument[];
    setGeneratedDocuments: React.Dispatch<React.SetStateAction<GeneratedDocument[]>>;
    documents: Document[];
    setActiveTab: (tab: ActiveTab) => void;
    onDispatchDocument: (doc: GeneratedDocument) => void;
}

const GenerationTab: React.FC<GenerationTabProps> = ({
    onGenerateDocument, isLoading, generatedDocuments, setGeneratedDocuments,
    documents, setActiveTab, onDispatchDocument
}) => {
    const [prompt, setPrompt] = useState('');
    const [title, setTitle] = useState('');
    const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('');
    const [selectedSourceDocIds, setSelectedSourceDocIds] = useState<string[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);

    const handleGenerate = async () => {
        if (!prompt || !title) {
            alert("Bitte Titel und Anweisung eingeben.");
            return;
        }
        await onGenerateDocument(prompt, title, selectedSourceDocIds);
        // Reset form after generation
        setPrompt('');
        setTitle('');
        setSelectedTemplateCategory('');
        setSelectedSourceDocIds([]);
    };
    
    const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = e.target;
      if (!value) {
          setTitle('');
          setPrompt('');
          setSelectedTemplateCategory('');
          return;
      }
      const [categoryName, templateIndex] = value.split('-');
      const category = DOCUMENT_TEMPLATES[categoryName as keyof typeof DOCUMENT_TEMPLATES];
      const template = category?.[parseInt(templateIndex)];
      
      if (template) {
        setTitle(template.title);
        setPrompt(template.content);
        setSelectedTemplateCategory(categoryName);
      }
    }

    const handleSourceDocChange = (docId: string) => {
        setSelectedSourceDocIds(prev => 
            prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
        );
    };
    
    const handleSaveEdit = () => {
        if (selectedDocument) {
            setGeneratedDocuments(docs => docs.map(d => d.id === selectedDocument.id ? selectedDocument : d));
            setSelectedDocument(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Column: Generator */}
            <div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4">Dokumentengenerator</h2>
                
                <div className="mb-4">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Titel des Dokuments</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="z.B. Sachstandsbericht"
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="template" className="block text-sm font-medium text-gray-300 mb-1">Vorlagen</label>
                    <select 
                      id="template"
                      onChange={handleSelectTemplate}
                      className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    >
                        <option value="">Vorlage auswählen...</option>
                        {Object.entries(DOCUMENT_TEMPLATES).map(([categoryName, templates]) => (
                            <optgroup label={categoryName} key={categoryName}>
                                {templates.map((template, index) => (
                                    <option key={`${categoryName}-${index}`} value={`${categoryName}-${index}`}>
                                        {template.title}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {selectedTemplateCategory === 'UN-Verfahren' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Relevante Quelldokumente auswählen</label>
                        <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-md p-2 space-y-1">
                            {documents.map(doc => (
                                <label key={doc.id} className="flex items-center space-x-2 text-xs text-gray-200">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSourceDocIds.includes(doc.id)}
                                        onChange={() => handleSourceDocChange(doc.id)}
                                        className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span>{doc.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-grow flex flex-col">
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Anweisung / Prompt</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={10}
                        placeholder="Beschreiben Sie hier, was generiert werden soll..."
                        className="w-full flex-grow bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md disabled:bg-gray-500"
                >
                    {isLoading ? 'Generiere...' : 'Dokument erstellen'}
                </button>
            </div>

            {/* Right Column: Generated Documents */}
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg overflow-y-auto">
                 {selectedDocument ? (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Dokument bearbeiten</h2>
                        <input 
                          type="text" 
                          value={selectedDocument.title}
                          onChange={(e) => setSelectedDocument({...selectedDocument, title: e.target.value})}
                          className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600 mb-4"
                        />
                        <textarea
                            value={selectedDocument.content}
                            onChange={(e) => setSelectedDocument({...selectedDocument, content: e.target.value})}
                            rows={20}
                            className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                        <div className="mt-4 flex gap-4">
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">Speichern</button>
                            <button onClick={() => setSelectedDocument(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Abbrechen</button>
                        </div>
                    </div>
                 ) : (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">Generierte Dokumente</h2>
                        <div className="space-y-4">
                            {generatedDocuments.map(doc => (
                                <div key={doc.id} className="bg-gray-700/50 p-4 rounded-md flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white">{doc.title}</h3>
                                        <p className="text-xs text-gray-400">Erstellt am: {new Date(doc.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => setSelectedDocument(doc)} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-md text-xs">Ansehen/Bearbeiten</button>
                                        <button onClick={() => {onDispatchDocument(doc); setActiveTab('dispatch');}} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-xs">Zum Versand</button>
                                    </div>
                                </div>
                            ))}
                            {generatedDocuments.length === 0 && <p className="text-gray-500 text-center py-8">Noch keine Dokumente generiert.</p>}
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default GenerationTab;