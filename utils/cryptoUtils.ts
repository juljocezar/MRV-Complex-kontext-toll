
/**
 * @async
 * @function hashText
 * @description Computes a SHA-256 hash of a given string using the Web Crypto API.
 * This is useful for creating consistent, anonymized identifiers or for data integrity checks.
 * @param {string} text - The input string to hash.
 * @returns {Promise<string>} A promise that resolves to the hexadecimal string representation of the SHA-256 hash.
 */
export const hashText = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
