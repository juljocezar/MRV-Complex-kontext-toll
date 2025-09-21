
/**
 * Asynchronously generates a SHA-256 hash of a given text string.
 * This is useful for creating consistent, unique identifiers for content like documents.
 * @param {string} text - The input string to hash.
 * @returns {Promise<string>} A promise that resolves to the hexadecimal string representation of the hash.
 */
export const hashText = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
