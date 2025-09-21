import React from 'react';
import { GeneratedDocument } from '../../types';
import { DocumentTemplate, TemplateService } from '../../services/templateService';

interface LibraryTabProps {
    generatedDocuments: GeneratedDocument[];
}

const LibraryTab: React.FC<LibraryTabProps> = ({ generatedDocuments }) => {
    const templates = TemplateService.getAllTemplates();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Bibliothek</h1>
            <p className="text-gray-400">Eine Übersicht über alle generierten Dokumente und verfügbaren Vorlagen.</p>

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-3">Generierte Dokumente</h2>
                    <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                         <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Titel</th>
                                    <th scope="col" className="px-6 py-3">Erstellt am</th>
                                    <th scope="col" className="px-6 py-3">Vorlage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {generatedDocuments.map(doc => (
                                    <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.title}</td>
                                        <td className="px-6 py-4">{new Date(doc.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">{doc.templateUsed || 'Keine'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {generatedDocuments.length === 0 && (
                            <p className="text-center py-8 text-gray-500">Noch keine Dokumente generiert.</p>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-3">Vorlagen</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(template => (
                            <div key={template.id} className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="font-semibold text-white">{template.name}</h3>
                                <p className="text-sm text-gray-400">{template.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryTab;
