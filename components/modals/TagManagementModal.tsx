import React, { useState, useEffect } from 'react';
import type { Tag } from '../../types';

/**
 * @interface TagManagementModalProps
 * @description Represents the props for the TagManagementModal component.
 * @description Stellt die Props für die TagManagementModal-Komponente dar.
 * @property {boolean} isOpen - Whether the modal is currently open. / Ob das Modal gerade geöffnet ist.
 * @property {() => void} onClose - Function to close the modal. / Funktion zum Schließen des Modals.
 * @property {Tag[]} availableTags - A list of all available tags in the system. / Eine Liste aller im System verfügbaren Tags.
 * @property {string[]} assignedTags - A list of tags currently assigned to the item. / Eine Liste der dem Element aktuell zugewiesenen Tags.
 * @property {(newTags: string[]) => void} onSave - Function to save the new list of assigned tags. / Funktion zum Speichern der neuen Liste zugewiesener Tags.
 * @property {string} itemName - The name of the item being tagged, for display purposes. / Der Name des zu taggenden Elements, zu Anzeigezwecken.
 */
interface TagManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableTags: Tag[];
    assignedTags: string[];
    onSave: (newTags: string[]) => void;
    itemName: string;
}

/**
 * @component TagManagementModal
 * @description A modal component for assigning and unassigning tags to an item.
 * @description Eine Modal-Komponente zum Zuweisen und Entfernen von Tags zu einem Element.
 * @param {TagManagementModalProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement | null} The rendered tag management modal or null if not open. / Das gerenderte Tag-Verwaltungs-Modal oder null, wenn es nicht geöffnet ist.
 */
const TagManagementModal: React.FC<TagManagementModalProps> = ({ isOpen, onClose, availableTags, assignedTags, onSave, itemName }) => {
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setSelectedTags(new Set(assignedTags));
        }
    }, [isOpen, assignedTags]);

    if (!isOpen) return null;

    const handleToggleTag = (tagName: string) => {
        setSelectedTags(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tagName)) {
                newSet.delete(tagName);
            } else {
                newSet.add(tagName);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        onSave(Array.from(selectedTags));
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white truncate pr-4">Tags für "{itemName}"</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-6 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableTags.map(tag => (
                            <label key={tag.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedTags.has(tag.name)}
                                    onChange={() => handleToggleTag(tag.name)}
                                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
                                />
                                <span className="text-gray-200">{tag.name}</span>
                            </label>
                        ))}
                    </div>
                    {availableTags.length === 0 && <p className="text-gray-500 text-center py-4">Keine Tags verfügbar. Erstellen Sie welche in den Einstellungen.</p>}
                </div>
                <footer className="p-4 border-t border-gray-700 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Abbrechen</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Speichern</button>
                </footer>
            </div>
        </div>
    );
};

export default TagManagementModal;
