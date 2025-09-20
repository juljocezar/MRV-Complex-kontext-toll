
export const extractFileContent = (file: File): Promise<{ text: string | null; base64: string | null; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // Simple check for text files
            if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml') {
                resolve({ text: result, base64: null, mimeType: file.type });
            } else {
                // For other files, assume binary and provide base64
                const base64String = result.split(',')[1];
                resolve({ text: null, base64: base64String, mimeType: file.type });
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        // Read as text for potential text files, and as data URL for others
        if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
};
