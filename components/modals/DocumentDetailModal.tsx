import React from 'react';
import type { Document, DocumentAnalysisResult } from '../../types';

/**
 * Props for the DocumentDetailModal component.
 */
interface DocumentDetailModalProps {
    /** The document object to display details for. */
    document: Document;
    /** The analysis result associated with the document, or null if not available. */
    analysisResult: DocumentAnalysisResult | null;
    /** Callback function to close the modal. */
    onClose: () => void;
}

/**
 * A modal component for displaying the detailed view of a document.
 * It shows metadata, analysis results, and the full document content in a two-column layout.
 * @param {DocumentDetailModalProps} props - The props for the component.
 */
const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({ document, analysisResult, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-gray-700">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white truncate pr-4">Document Details: {document.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Metadata & Analysis */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-gray-700/50 p-3 rounded-md">
                            <h3 className="font-semibold text-gray-300 text-sm mb-2">Metadata</h3>
                            <p className="text-xs text-gray-400"><strong>MIME Type:</strong> {document.mimeType}</p>
                            <p className="text-xs text-gray-400"><strong>Created At:</strong> {new Date(document.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-gray-400"><strong>Status:</strong> {document.classificationStatus}</p>
                            <p className="text-xs text-gray-400"><strong>Work Category:</strong> {document.workCategory || 'N/A'}</p>
                        </div>
                        {analysisResult && (
                             <div className="bg-gray-700/50 p-3 rounded-md">
                                <h3 className="font-semibold text-gray-300 text-sm mb-2">Analysis Results</h3>
                                 <div>
                                    <h4 className="font-bold text-xs text-gray-400">Summary</h4>
                                    <p className="text-xs text-gray-300 mt-1">{analysisResult.summary}</p>
                                </div>
                                {analysisResult.entities && analysisResult.entities.length > 0 && (
                                     <div className="mt-3">
                                        <h4 className="font-bold text-xs text-gray-400">Detected Entities</h4>
                                        <ul className="list-disc list-inside text-xs text-gray-300 mt-1 space-y-1">
                                            {analysisResult.entities.map(e => <li key={e.id}>{e.name} ({e.type})</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Content */}
                    <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-md border border-gray-700">
                         <h3 className="font-semibold text-gray-300 text-sm mb-2">Content</h3>
                        <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap overflow-y-auto h-[calc(80vh-100px)]">
                           {document.textContent || "Preview for this file type is not available."}
                        </div>
                    </div>
                </div>
                 <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default DocumentDetailModal;
