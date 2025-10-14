
import React from 'react';
import Icon from './Icon';
import Tooltip from './Tooltip';

interface MicrophoneButtonProps {
    isListening: boolean;
    error: string | null;
    onClick: () => void;
    disabled?: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isListening, error, onClick, disabled }) => {
    
    let tooltipText = "Spracheingabe starten";
    let buttonClass = "text-gray-400 hover:text-white";

    if (isListening) {
        tooltipText = "Aufnahme stoppen";
        buttonClass = "text-blue-400";
    }
    if (error) {
        tooltipText = `Fehler: ${error}`;
        buttonClass = "text-red-400";
    }
     if (disabled) {
        tooltipText = "Spracheingabe deaktiviert";
        buttonClass = "text-gray-600 cursor-not-allowed";
    }

    return (
        <Tooltip text={tooltipText} position="top">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${isListening ? 'animate-pulse-strong' : ''} ${buttonClass}`}
                aria-label={tooltipText}
            >
                <Icon name="microphone" className="h-5 w-5" />
                <style>{`
                    @keyframes pulse-strong {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
                        }
                        50% {
                            transform: scale(1.1);
                            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
                        }
                    }
                    .animate-pulse-strong {
                        animation: pulse-strong 1.5s infinite;
                    }
                `}</style>
            </button>
        </Tooltip>
    );
};

export default MicrophoneButton;
