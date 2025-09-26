import React, { useState } from 'react';

/**
 * @interface PromptExecutionModalProps
 * @description Props for the PromptExecutionModal component.
 * @property {boolean} isOpen - Whether the modal is currently open.
 * @property {() => void} onClose - Callback function to close the modal.
 * @property {(prompt: string) => Promise<string>} onExecute - Asynchronous callback function to execute the given prompt.
 * @property {string} [suggestedPrompt] - An optional prompt to pre-populate the text area.
 */
interface PromptExecutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (prompt: string) => Promise<string>;
    suggestedPrompt?: string;
}

/**
 * @component PromptExecutionModal
 * @description A modal for executing free-form text prompts. It provides a textarea
 * for input, an execute button, and a display area for the result.
 * @param {PromptExecutionModalProps} props The props for the component.
 * @returns {React.FC<PromptExecutionModalProps>} The rendered prompt execution modal, or null if not open.
 */
const PromptExecutionModal: React.FC<PromptExecutionModalProps> = ({ isOpen, onClose, onExecute, suggestedPrompt }) => {
    const [prompt, setPrompt] = useState(suggestedPrompt || '');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleExecute = async () => {
        setIsLoading(true);
        setResult('');
        try {
            const response = await onExecute(prompt);
            setResult(response);
        } catch (error) {
            setResult('Ein Fehler ist aufgetreten.');
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Freie Eingabe</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="p-6 space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={5}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        placeholder="Geben Sie hier Ihre Anweisung oder Frage ein..."
                    />
                    <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 min-h-[150px] overflow-y-auto">
                        {isLoading ? <p>Wird ausgeführt...</p> : <p className="whitespace-pre-wrap">{result}</p>}
                    </div>
                </div>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleExecute} disabled={isLoading || !prompt} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500">
                        Ausführen
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PromptExecutionModal;
