import mammoth from 'mammoth';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export const extractFileContent = (file: File): Promise<{ text: string | null; base64: string | null; mimeType: string; }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = (error) => reject(error);

        const docxType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const isSimpleText = file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/xml';

        if (isSimpleText) {
            reader.onload = () => {
                resolve({ text: reader.result as string, base64: null, mimeType: file.type });
            };
            reader.readAsText(file);
        } else if (file.type === docxType) {
            reader.onload = async () => {
                try {
                    const arrayBuffer = reader.result as ArrayBuffer;
                    // Extract text using mammoth
                    const textResult = await mammoth.extractRawText({ arrayBuffer });
                    // Also convert the original buffer to base64 for storage
                    const base64String = arrayBufferToBase64(arrayBuffer);
                    resolve({ text: textResult.value, base64: base64String, mimeType: file.type });
                } catch (e) {
                    console.error('Fehler beim Parsen der DOCX-Datei:', e);
                    // Provide a user-friendly error
                    reject(new Error('Der Inhalt der DOCX-Datei konnte nicht gelesen werden. Die Datei ist möglicherweise beschädigt oder in einem nicht unterstützten Format.'));
                }
            };
            reader.readAsArrayBuffer(file);
        } else { // Fallback for images, PDFs, other binary files
            reader.onload = () => {
                const result = reader.result as string;
                // result is a Data URL like "data:image/png;base64,iVBORw0KGgo..."
                // We need to strip the prefix to get only the base64 part
                const base64String = result.split(',')[1];
                resolve({ text: null, base64: base64String, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    });
};