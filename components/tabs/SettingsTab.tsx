import React, { useState } from 'react';
import type { AppSettings, Tag } from '../../types';

/**
 * Props for the SettingsTab component.
 */
interface SettingsTabProps {
    /** The current application settings object. */
    settings: AppSettings;
    /** Callback function to update the application settings. */
    setSettings: (settings: AppSettings) => void;
    /** An array of all globally available tags. */
    tags: Tag[];
    /** Callback function to create a new global tag. */
    onCreateTag: (name: string) => void;
    /** Callback function to delete a global tag by its ID. */
    onDeleteTag: (tagId: string) => void;
}

/**
 * A UI component for managing application-wide settings.
 * This includes AI parameters, global tag management, and workload calculation thresholds.
 * @param {SettingsTabProps} props - The props for the component.
 */
const SettingsTab: React.FC<SettingsTabProps> = ({ settings, setSettings, tags, onCreateTag, onDeleteTag }) => {
    const [newTagName, setNewTagName] = useState('');
    
    const handleAIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings({
            ...settings,
            ai: { ...settings.ai, [name]: parseFloat(value) }
        });
    };

    const handleComplexityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings({
            ...settings,
            complexity: { ...settings.complexity, [name]: parseInt(value) }
        });
    };

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if(newTagName.trim()) {
            onCreateTag(newTagName.trim());
            setNewTagName('');
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white">Settings</h1>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">AI Settings</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-gray-300">
                            Temperature (Creativity): {settings.ai.temperature}
                        </label>
                        <input
                            type="range"
                            id="temperature"
                            name="temperature"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.ai.temperature}
                            onChange={handleAIChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div>
                        <label htmlFor="topP" className="block text-sm font-medium text-gray-300">
                            Top-P (Word Selection Precision): {settings.ai.topP}
                        </label>
                         <input
                            type="range"
                            id="topP"
                            name="topP"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.ai.topP}
                            onChange={handleAIChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Tag Management</h2>
                <p className="text-sm text-gray-400 mb-4">Manage the globally available tags here.</p>
                <form onSubmit={handleCreateTag} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Enter new tag name"
                        className="flex-grow bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Create</button>
                </form>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                            <span className="text-gray-200">{tag.name}</span>
                            <button onClick={() => onDeleteTag(tag.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                        </div>
                    ))}
                     {tags.length === 0 && <p className="text-center text-gray-500 py-4">No tags exist.</p>}
                </div>
            </div>

             <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Workload Calculation</h2>
                 <p className="text-sm text-gray-400 mb-4">Define the hour thresholds for complexity assessment.</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="low" className="block text-sm font-medium text-gray-300">"Low" Threshold (Hours)</label>
                        <input
                            type="number"
                            id="low"
                            name="low"
                            value={settings.complexity.low}
                            onChange={handleComplexityChange}
                            className="mt-1 w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                     <div>
                        <label htmlFor="medium" className="block text-sm font-medium text-gray-300">"Medium" Threshold (Hours)</label>
                        <input
                            type="number"
                            id="medium"
                            name="medium"
                            value={settings.complexity.medium}
                            onChange={handleComplexityChange}
                            className="mt-1 w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        />
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default SettingsTab;
