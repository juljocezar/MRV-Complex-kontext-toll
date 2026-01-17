
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface GlobalSearchProps {
    onSearch: (query: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if(!query.trim()) return;
        setIsSearching(true);
        await onSearch(query);
        setIsSearching(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    return (
        <div className="relative w-full max-w-md ml-4">
            <div className="relative">
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Semantische Suche..."
                    className="w-full bg-gray-700 border border-transparent rounded-md pl-10 pr-10 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <LoadingSpinner className="h-4 w-4 text-blue-400" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
