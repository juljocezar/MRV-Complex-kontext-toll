import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import LoadingSpinner from '../ui/LoadingSpinner';

const AnalyseDocTab: React.FC = () => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch('/ANALYSE.md');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const markdown = await response.text();
                const html = await marked.parse(markdown);
                setContent(html);
            } catch (e) {
                console.error("Failed to load analysis document:", e);
                setError("Fehler beim Laden des Dokuments.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Architektur & Anwendungsanalyse</h1>
            
            <div className="bg-gray-800 p-6 rounded-lg">
                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <LoadingSpinner className="h-8 w-8" />
                    </div>
                ) : error ? (
                    <p className="text-red-400">{error}</p>
                ) : (
                    <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: content }}
                    ></div>
                )}
            </div>
        </div>
    );
};

export default AnalyseDocTab;
