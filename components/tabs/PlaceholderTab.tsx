
import React from 'react';

/**
 * A generic placeholder component for features that are not yet implemented.
 * It displays a simple "Feature in development" message.
 */
const PlaceholderTab: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold">Feature in Development</h2>
                <p>This section will be available in a future version.</p>
            </div>
        </div>
    );
};

export default PlaceholderTab;
