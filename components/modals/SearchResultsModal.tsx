
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center z-40 pt-20" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-gray-700" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Suchergebnisse ({results.length})</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                        <ul>
                            {results.map(result => (
                                <li key={`${result.type}_${result.id}`}>
                                    <button 
                                        onClick={() => onResultClick(result)}
                                        className="w-full text-left p-3 rounded-md hover:bg-gray-700/50 flex items-start"
                                    >
                                        <Icon name={getIconName(result.type)} className="mr-4 mt-1 h-5 w-5 text-gray-400" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-white">{result.title}</p>
                                            <p className="text-sm text-gray-400 truncate">{result.preview}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Keine Ergebnisse gefunden.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResultsModal;
