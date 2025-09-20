
import React from 'react';

interface FocusModeSwitcherProps {
    isFocusMode: boolean;
    toggleFocusMode: () => void;
}

const FocusModeSwitcher: React.FC<FocusModeSwitcherProps> = ({ isFocusMode, toggleFocusMode }) => {
    return (
        <button
            onClick={toggleFocusMode}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-200 transition-colors flex items-center"
            title={isFocusMode ? "Fokus-Modus verlassen" : "Fokus-Modus aktivieren"}
        >
            {isFocusMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v2.586l2.293-2.293a1 1 0 111.414 1.414L12.414 8H15a1 1 0 110 2h-2.586l2.293 2.293a1 1 0 11-1.414 1.414L11 11.414V14a1 1 0 11-2 0v-2.586l-2.293 2.293a1 1 0 11-1.414-1.414L7.586 10H5a1 1 0 110-2h2.586L5.293 5.707a1 1 0 011.414-1.414L9 6.586V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            )}
            Fokus
        </button>
    );
};

export default FocusModeSwitcher;
