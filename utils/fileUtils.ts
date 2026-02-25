
import { createWorker } from 'tesseract.js';

export const extractFileContent = (file: File): Promise<{ text: string | null; base64: string | null; mimeType: string; }> => {
    return new Promise(async (resolve, reject) => {
        const mimeType = file.type;
        
        // Helper to read file as Base64
        const readAsBase64 = (f: File): Promise<string> => {
            return new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64String = result.split(',')[1];
                    res(base64String);
                };
                reader.onerror = rej;
                reader.readAsDataURL(f);
            });
        };

        // Helper to read file as Text
        const readAsText = (f: File): Promise<string> => {
            return new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsText(f);
            });
        };

        try {
            // 1. Text Files (JSON, TXT, XML, MD)
            if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/xml') {
                const text = await readAsText(file);
                resolve({ text, base64: null, mimeType });
                return;
            }

            // 2. Images (OCR Pipeline)
            if (mimeType.startsWith('image/')) {
                const base64 = await readAsBase64(file);
                
                // Perform OCR to make image searchable locally
                // Note: This is resource intensive.
                try {
                    const worker = await createWorker('deu'); // Initialize with German
                    const { data: { text } } = await worker.recognize(file);
                    await worker.terminate();
                    
                    resolve({ text: text, base64, mimeType });
                } catch (ocrError) {
                    console.error("OCR Failed:", ocrError);
                    // Fallback: Return image without text (Gemini can still see it via Vision)
                    resolve({ text: null, base64, mimeType });
                }
                return;
            }

            // 3. PDFs & Binaries
            const base64 = await readAsBase64(file);
            resolve({ text: null, base64, mimeType });

        } catch (error) {
            reject(error);
        }
    });
};
