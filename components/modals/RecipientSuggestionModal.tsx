import React from 'react';

interface RecipientSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (email: string) => void;
}

const RecipientSuggestionModal: React.FC<RecipientSuggestionModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    // Placeholder data - a real implementation would pull from case entities
    const suggestedRecipients = [
        { name: 'UN Special Rapporteur', email: 'submissions@ohchr.org' },
        { name: 'Legal Aid Office', email: 'intake@legalaid.example.com' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Empfänger vorschlagen</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="p-4">
                    <ul className="space-y-2">
                        {suggestedRecipients.map(recipient => (
                            <li key={recipient.email}>
                                <button
                                    onClick={() => onSelect(recipient.email)}
                                    className="w-full text-left p-2 rounded-md hover:bg-gray-700"
                                >
                                    <p className="font-semibold text-white">{recipient.name}</p>
                                    <p className="text-sm text-gray-400">{recipient.email}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RecipientSuggestionModal;
