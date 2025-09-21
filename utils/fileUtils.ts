
/**
 * Extracts the content of a file as either a text string or a Base64 encoded string.
 * It intelligently determines the reading method based on the file's MIME type.
 * @param {File} file - The file object to read.
 * @returns {Promise<{ text: string | null; base64: string | null; mimeType: string; }>} A promise that resolves to an object containing the file's content.
 * If the file is text-based, the `text` property will be populated. Otherwise, the `base64` property will be populated.
 */
export const extractFileContent = (file: File): Promise<{ text: string | null; base64: string | null; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // Check for common text-based MIME types.
            if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml') {
                resolve({ text: result, base64: null, mimeType: file.type });
            } else {
                // For all other file types, assume binary and provide a Base64 string.
                const base64String = result.split(',')[1];
                resolve({ text: null, base64: base64String, mimeType: file.type });
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        // Read as text for potential text files, and as a data URL for binary files.
        if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml') {
            reader.readAsText(file);
        } else {
            reader.readAsDataURL(file);
        }
    });
};
