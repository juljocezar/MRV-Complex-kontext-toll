
import { useState, useEffect, useRef } from 'react';

// Extend the Window interface for vendor-prefixed SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [finalTranscript, setFinalTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Die Spracherkennung wird von diesem Browser nicht unterstützt.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // We only care about the final result
        recognition.lang = 'de-DE';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setFinalTranscript('');
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                 setError('Keine Sprache erkannt. Bitte versuchen Sie es erneut.');
            } else if (event.error === 'audio-capture') {
                 setError('Mikrofon nicht gefunden. Stellen Sie sicher, dass es angeschlossen ist.');
            } else if (event.error === 'not-allowed') {
                 setError('Berechtigung für das Mikrofon verweigert.');
            } else {
                 setError(`Fehler bei der Spracherkennung: ${event.error}`);
            }
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                }
            }
            if (final) {
                setFinalTranscript(final.trim());
            }
        };

        recognitionRef.current = recognition;

        // Cleanup function
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    return {
        isListening,
        finalTranscript,
        error,
        toggleListening,
        browserSupportsSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
};

export default useSpeechRecognition;
