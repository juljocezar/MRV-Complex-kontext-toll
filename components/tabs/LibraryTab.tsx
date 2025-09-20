import React from 'react';
import { DOCUMENT_TEMPLATES } from '../../constants';

/**
 * @component LibraryTab
 * @description A tab that displays a library of predefined document templates (prompts).
 * @description Ein Tab, der eine Bibliothek mit vordefinierten Dokumentvorlagen (Prompts) anzeigt.
 * @returns {React.ReactElement} The rendered library tab. / Der gerenderte Bibliotheks-Tab.
 */
const LibraryTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Prompt-Bibliothek</h1>
            <p className="text-gray-400">
                Nutzen Sie vordefinierte Vorlagen, um schnell und effizient qualitativ hochwertige Dokumente zu erstellen.
                Die Vorlagen sind im Tab "Generator" verfügbar.
            </p>

            <div className="space-y-6">
                {Object.entries(DOCUMENT_TEMPLATES).map(([category, templates]) => (
                    <div key={category}>
                        <h2 className="text-2xl font-semibold text-gray-300 border-b-2 border-gray-700 pb-2 mb-4">{category}</h2>
                        <div className="space-y-4">
                            {templates.map((item, index) => (
                                <div key={index} className="bg-gray-800 p-6 rounded-lg shadow">
                                    <h3 className="text-xl font-semibold text-blue-400 mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm bg-gray-900/50 p-4 rounded-md">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryTab;