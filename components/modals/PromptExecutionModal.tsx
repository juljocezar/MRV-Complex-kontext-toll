import React, { useState } from 'react';

/**
 * Props for the PromptExecutionModal component.
 */
interface PromptExecutionModalProps {
    /** Whether the modal is currently open. */
    isOpen: boolean;
    /** Callback function to close the modal. */
    onClose: () => void;
    /** The asynchronous function to call when the prompt is executed. It takes the prompt string and should return the result string. */
    onExecute: (prompt: string) => Promise<string>;
    /** An optional prompt to pre-populate the text area with. */
    suggestedPrompt?: string;
}

/**
 * A modal for executing free-form text prompts and displaying the results.
 * It provides a flexible way to interact with various AI capabilities.
 * @param {PromptExecutionModalProps} props - The props for the component.
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
            setResult('An error occurred.');
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Free-form Input</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="p-6 space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={5}
                        className="w-full bg-gray-700 text-gray-200 p-2 rounded-md border border-gray-600"
                        placeholder="Enter your instruction or question here..."
                    />
                    <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 min-h-[150px] overflow-y-auto">
                        {isLoading ? <p>Executing...</p> : <p className="whitespace-pre-wrap">{result}</p>}
                    </div>
                </div>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleExecute} disabled={isLoading || !prompt} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500">
                        Execute
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PromptExecutionModal;
