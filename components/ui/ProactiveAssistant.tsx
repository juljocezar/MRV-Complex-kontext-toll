
import React from 'react';
import type { ProactiveSuggestion } from '../../types';

interface ProactiveAssistantProps {
    suggestions: ProactiveSuggestion[];
    onExecute: (suggestion: ProactiveSuggestion) => void;
    onDismiss: (id: string) => void;
}

const ProactiveAssistant: React.FC<ProactiveAssistantProps> = ({ suggestions, onExecute, onDismiss }) => {
    const suggestion = suggestions.length > 0 ? suggestions[0] : null;

    if (!suggestion) {
        return null;
    }

    return (
        <div 
            className="fixed bottom-6 right-6 w-80 bg-gray-800 border border-blue-500/50 rounded-lg shadow-2xl p-4 z-50 animate-fade-in-up"
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    <span className="text-blue-400">💡</span>
                </div>
                <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200">
                        Intelligenter Vorschlag
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        {suggestion.text}
                    </p>
                    <div className="mt-4 flex">
                        <button
                            onClick={() => onExecute(suggestion)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                        >
                            Anzeigen
                        </button>
                        <button
                            onClick={() => onDismiss(suggestion.id)}
                            className="ml-3 inline-flex items-center px-3 py-1.5 border border-gray-600 text-xs font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                        >
                            Verwerfen
                        </button>
                    </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={() => onDismiss(suggestion.id)}
                        className="inline-flex text-gray-400 rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
                    >
                        <span className="sr-only">Schließen</span>
                        &times;
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ProactiveAssistant;
