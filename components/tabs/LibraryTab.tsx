import React, { useMemo, useState } from 'react';
// Fix: Corrected import path for types.
import { GeneratedDocument, Document } from '../../types';
import { DocumentTemplate, TemplateService } from '../../services/templateService';

interface LibraryTabProps {
    generatedDocuments: GeneratedDocument[];
    documents: Document[];
    onViewDocument: (docId: string) => void;
}

const LibraryTab: React.FC<LibraryTabProps> = ({ generatedDocuments, documents, onViewDocument }) => {
    const templates = TemplateService.getAllTemplates();
    const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

    const getDocName = (docId: string) => documents.find(d => d.id === docId)?.name;

    const groupedDocs = useMemo(() => {
        const groups = new Map<string, GeneratedDocument[]>();
        generatedDocuments.forEach(doc => {
            const chainId = doc.versionChainId || doc.id;
            const chain = groups.get(chainId) || [];
            chain.push(doc);
            groups.set(chainId, chain);
        });

        const sortedGroups: GeneratedDocument[][] = [];
        groups.forEach(chain => {
            // Sort by version descending, then by language (de first)
            chain.sort((a, b) => {
                if (b.version !== a.version) {
                    return b.version - a.version;
                }
                return a.language === 'de' ? -1 : 1;
            });
            sortedGroups.push(chain);
        });

        // Sort groups by the creation date of their latest version
        sortedGroups.sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime());

        return sortedGroups;
    }, [generatedDocuments]);

    const toggleChain = (chainId: string) => {
        setExpandedChains(prev => {
            const newSet = new Set(prev);
            if (newSet.has(chainId)) {
                newSet.delete(chainId);
            } else {
                newSet.add(chainId);
            }
            return newSet;
        });
    };

    const renderDocRow = (doc: GeneratedDocument, isChild: boolean = false) => (
        <tr key={doc.id} className={`bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 ${isChild ? 'bg-gray-800/50' : ''}`}>
            <td className={`px-6 py-4 font-medium text-white whitespace-nowrap ${isChild ? 'pl-10' : ''}`}>
                {doc.title}
                <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-gray-600 rounded-full">v{doc.version}</span>
            </td>
            <td className="px-6 py-4">{new Date(doc.createdAt).toLocaleString()}</td>
            <td className="px-6 py-4">{doc.templateUsed || 'Keine'}</td>
            <td className="px-6 py-4 text-xs">
                {doc.sourceDocIds && doc.sourceDocIds.length > 0 ? (
                    doc.sourceDocIds.map((id, index) => {
                        const name = getDocName(id);
                        return name ? (
                            <span key={id}>
                                <button onClick={() => onViewDocument(id)} className="text-blue-400 hover:underline">{name}</button>
                                {index < doc.sourceDocIds.length - 1 ? ', ' : ''}
                            </span>
                        ) : null
                    })
                ) : (
                    <span className="text-gray-500">Keine</span>
                )}
            </td>
        </tr>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Bibliothek</h1>
            <p className="text-gray-400">Eine Übersicht über alle generierten Dokumente, versioniert und gruppiert, sowie die verfügbaren Vorlagen.</p>

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-300 mb-3">Generierte Dokumente</h2>
                    <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                         <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Titel & Version</th>
                                    <th scope="col" className="px-6 py-3">Erstellt am</th>
                                    <th scope="col" className="px-6 py-3">Vorlage</th>
                                    <th scope="col" className="px-6 py-3">Quellen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedDocs.map(chain => {
                                    const latestDoc = chain[0];
                                    const hasHistory = chain.length > 1;
                                    const isExpanded = expandedChains.has(latestDoc.versionChainId);

                                    return (
                                        <React.Fragment key={latestDoc.versionChainId}>
                                            <tr className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                                                    {hasHistory && (
                                                        <button onClick={() => toggleChain(latestDoc.versionChainId)} className="mr-2 text-gray-400">
                                                            {isExpanded ? '▼' : '►'}
                                                        </button>
                                                    )}
                                                    {latestDoc.title}
                                                    <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">v{latestDoc.version}</span>
                                                </td>
                                                <td className="px-6 py-4">{new Date(latestDoc.createdAt).toLocaleString()}</td>
                                                <td className="px-6 py-4">{latestDoc.templateUsed || 'Keine'}</td>
                                                <td className="px-6 py-4 text-xs">
                                                    {/* Source docs logic from renderDocRow */}
                                                    {latestDoc.sourceDocIds && latestDoc.sourceDocIds.length > 0 ? (
                                                        latestDoc.sourceDocIds.map((id, index) => {
                                                            const name = getDocName(id);
                                                            return name ? <span key={id}><button onClick={() => onViewDocument(id)} className="text-blue-400 hover:underline">{name}</button>{index < latestDoc.sourceDocIds.length - 1 ? ', ' : ''}</span> : null
                                                        })
                                                    ) : <span className="text-gray-500">Keine</span>}
                                                </td>
                                            </tr>
                                            {isExpanded && hasHistory && chain.slice(1).map(doc => renderDocRow(doc, true))}
                                        </React.Fragment>
                                    );
                                })}
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