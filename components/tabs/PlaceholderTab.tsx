import React from 'react';

/**
 * @component PlaceholderTab
 * @description A placeholder component for features that are still in development.
 * @description Eine Platzhalter-Komponente für Funktionen, die sich noch in der Entwicklung befinden.
 * @returns {React.ReactElement} The rendered placeholder tab. / Der gerenderte Platzhalter-Tab.
 */
const PlaceholderTab: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold">Funktion in Entwicklung</h2>
                <p>Dieser Bereich wird in einer zukünftigen Version verfügbar sein.</p>
            </div>
        </div>
    );
};

export default PlaceholderTab;
