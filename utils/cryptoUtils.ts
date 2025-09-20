/**
 * @function hashText
 * @description Hashes a string using the SHA-256 algorithm.
 * @description Hasht einen String mit dem SHA-256-Algorithmus.
 * @param {string} text - The text to hash. / Der zu hashende Text.
 * @returns {Promise<string>} A promise that resolves with the hexadecimal representation of the hash. / Ein Promise, das mit der hexadezimalen Darstellung des Hashes aufgelöst wird.
 */
export const hashText = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};
