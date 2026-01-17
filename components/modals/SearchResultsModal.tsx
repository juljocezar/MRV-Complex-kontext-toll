
import React from 'react';
import { SearchResult } from '../../types';
import Icon from '../ui/Icon';

interface SearchResultsModalProps {
    results: SearchResult[];
    onClose: () => void;
    onResultClick: (result: SearchResult) => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ results, onClose, onResultClick }) => {
    
    const getIconName = (type: SearchResult['type']): string => {
        switch(type) {
            case 'Document': return 'documents';
            case 'Entity': return 'entities';
            case 'Knowledge': return 'knowledge';
            default: return 'unknown';
        }
    };

    const getTypeLabel = (type: SearchResult['type']) => {
        switch(type) {
            case 'Document': return 'Dokument';
            case 'Entity': return 'Entität';
            case 'Knowledge': return 'Wissen';
            default: return type;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-50 pt-20 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-gray-700 max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-white">Suchergebnisse</h2>
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{results.length}</span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                </header>
                
                <div className="p-2 overflow-y-auto custom-scrollbar flex-grow">
                    {results.length > 0 ? (
                        <ul className="space-y-2">
                            {results.map(result => (
                                <li key={`${result.type}_${result.id}`}>
                                    <button 
                                        onClick={() => onResultClick(result)}
                                        className="w-full text-left p-3 rounded-md bg-gray-700/30 hover:bg-gray-700 hover:shadow-md transition-all border border-transparent hover:border-gray-600 flex items-start group"
                                    >
                                        <div className="mr-4 mt-1 p-2 bg-gray-800 rounded-lg group-hover:bg-gray-900 transition-colors">
                                            <Icon name={getIconName(result.type)} className="h-5 w-5 text-gray-400 group-hover:text-blue-400" />
                                        </div>
                                        
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                                                        {getTypeLabel(result.type)}
                                                    </span>
                                                    {result.isSemantic ? (
                                                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                                                            <span>✨</span> Semantisch
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-600/20 text-gray-400 text-[10px] px-1.5 py-0.5 rounded border border-gray-600/30">
                                                            🔤 Keyword
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                                {result.title}
                                            </p>
                                            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                                {result.preview}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <span className="text-4xl mb-2">🔍</span>
                            <p>Keine Ergebnisse gefunden.</p>
                            <p className="text-sm mt-1">Versuchen Sie andere Begriffe oder erstellen Sie Embeddings in den Einstellungen.</p>
                        </div>
                    )}
                </div>
                
                <footer className="p-3 border-t border-gray-700 bg-gray-900/30 text-xs text-center text-gray-500 rounded-b-lg">
                    Drücken Sie <kbd className="bg-gray-700 px-1 rounded text-gray-300">ESC</kbd> zum Schließen
                </footer>
            </div>
        </div>
    );
};

export default SearchResultsModal;
