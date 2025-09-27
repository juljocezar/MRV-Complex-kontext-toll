
import React, { useState, useRef, useCallback } from 'react';
import type { AppState, Document, Tag, AnalysisChatMessage, AgentActivity, KnowledgeItem, ActiveTab, Notification } from '../../types';
import DocumentDetailModal from '../modals/DocumentDetailModal';
import TagManagementModal from '../modals/TagManagementModal';
import AnalysisChatModal from '../modals/AnalysisChatModal';
import { GeminiService } from '../../services/geminiService';


/**
 * Definiert die Props für die DocumentsTab-Komponente.
 * Diese Schnittstelle beschreibt die Daten und Funktionen, die die Komponente
 * von ihrer übergeordneten Komponente (App.tsx) benötigt.
 */
interface DocumentsTabProps {
    appState: AppState; // Der gesamte Anwendungszustand
    onAddNewDocument: (file: File) => Promise<void>; // Funktion zum Hinzufügen und Analysieren eines neuen Dokuments
    onRunOrchestration: (doc: Document) => Promise<void>; // Funktion zum manuellen Starten der Analyse für ein Dokument
    onUpdateDocument: (doc: Document) => void; // Funktion zum Aktualisieren eines Dokuments (z.B. nach Tag-Änderungen)
    onUpdateTags: (tags: Tag[]) => void; // Funktion zum Aktualisieren der globalen Tag-Liste
    addKnowledgeItem: (item: Omit<KnowledgeItem, 'id' | 'createdAt'>) => void; // Funktion zum Hinzufügen eines neuen Wissenseintrags
    setActiveTab: (tab: ActiveTab) => void; // Funktion zum Wechseln des aktiven Tabs
    addNotification: (message: string, type?: Notification['type']) => void; // Funktion zum Anzeigen von Benachrichtigungen
    onViewDocumentDetails: (docId: string) => void; // Funktion zum Öffnen des Detail-Modals für ein Dokument
}

/**
 * Die `DocumentsTab`-Komponente ist die Benutzeroberfläche für die Verwaltung von Dokumenten.
 * Sie zeigt eine Liste aller Dokumente an und bietet Funktionen zum Hochladen, Analysieren,
 * Taggen und zur Interaktion mit den Dokumenten (z.B. per Chat).
 */
const DocumentsTab: React.FC<DocumentsTabProps> = ({ 
    appState, onAddNewDocument, onRunOrchestration, onUpdateDocument, onUpdateTags,
    addKnowledgeItem, setActiveTab, addNotification, onViewDocumentDetails
}) => {
    // Ref für das unsichtbare Datei-Input-Element, um den Datei-Upload-Dialog programmgesteuert zu öffnen.
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Lokaler State für diese Komponente
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null); // ID des Dokuments, das gerade für eine Aktion (Tagging, Chat) ausgewählt ist
    const [isTagModalOpen, setIsTagModalOpen] = useState(false); // Steuert die Sichtbarkeit des Tag-Management-Modals
    const [isChatModalOpen, setIsChatModalOpen] = useState(false); // Steuert die Sichtbarkeit des Analyse-Chat-Modals
    const [chatHistory, setChatHistory] = useState<AnalysisChatMessage[]>([]); // Speichert die Nachrichten des aktuellen Chats
    const [isChatLoading, setIsChatLoading] = useState(false); // Zeigt einen Ladeindikator während der KI-Chat-Antwort

    // Findet das vollständige Dokumentenobjekt basierend auf der `selectedDocId`.
    const selectedDoc = appState.documents.find(d => d.id === selectedDocId) || null;

    /**
     * Handler für das `change`-Ereignis des Datei-Inputs.
     * Wird ausgelöst, wenn der Benutzer eine oder mehrere Dateien zum Hochladen auswählt.
     */
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = [...event.target.files];
            for (const file of files) {
                await onAddNewDocument(file);
            }
            // Clear the input value to allow re-uploading the same file
            if (event.target) {
                event.target.value = '';
            }
        }
    };

            // Iteriert über alle ausgewählten Dateien und ruft die Hinzufügen-Funktion für jede einzelne auf.
            for (const file of files) {
                await onAddNewDocument(file);
            }
            // Setzt den Wert des Inputs zurück, damit der Benutzer dieselbe Datei erneut hochladen kann.
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    /**
     * Startet die Analyse-Orchestrierung für ein bereits vorhandenes Dokument manuell.
     */
    const handleManualAnalyzeDocument = useCallback(async (docId: string) => {
        const doc = appState.documents.find(d => d.id === docId);
        if (!doc) return;

        addNotification(`Manuelle Analyse für "${doc.name}" gestartet...`, 'info');
        await onRunOrchestration(doc);

    }, [appState, onRunOrchestration, addNotification]);

    /**
     * Speichert die im Tag-Management-Modal ausgewählten Tags für ein Dokument.
     */
    const handleSaveTags = (newTags: string[]) => {
        if (selectedDoc) {
            const updatedDoc = { ...selectedDoc, tags: newTags };
            onUpdateDocument(updatedDoc); // Ruft die Update-Funktion aus App.tsx auf
            setSelectedDocId(updatedDoc.id);
        }
    };

    /**
     * Sendet eine Nachricht im Analyse-Chat und erhält eine Antwort von der KI.
     */
    const handleSendMessage = async (message: string) => {
        if (!selectedDoc) return;

        // Fügt die Benutzernachricht zur Chat-Historie hinzu und aktiviert den Ladezustand.
        const newHistory: AnalysisChatMessage[] = [...chatHistory, { role: 'user', text: message }];
        setChatHistory(newHistory);
        setIsChatLoading(true);

        try {
            // Baut den Prompt für die KI, der den Dokumenteninhalt, die bisherige Konversation und die neue Frage enthält.
            const conversationContext = newHistory.map(m => `${m.role}: ${m.text}`).join('\n');
            const docContent = selectedDoc.textContent || selectedDoc.content;

            const prompt = `
                Du bist ein KI-Assistent, der Fragen zu einem spezifischen Dokument beantwortet.
                Sei präzise und beziehe dich nur auf die Informationen im Dokument.

                **Dokumenteninhalt (Auszug):**
                ---
                ${docContent.substring(0, 15000)}
                ---

                **Bisherige Konversation:**
                ---
                ${conversationContext}
                ---

                **Neue Frage vom Benutzer:**
                ${message}

                **Deine Antwort:**
            `;
            
            // Ruft den Gemini-Service auf und fügt die Antwort der KI zur Historie hinzu.
            const responseText = await GeminiService.callAI(prompt, null, appState.settings.ai);
            setChatHistory(h => [...h, { role: 'assistant', text: responseText }]);

        } catch (error) {
            console.error("Chat API call failed:", error);
            setChatHistory(h => [...h, { role: 'assistant', text: "Entschuldigung, bei der Beantwortung Ihrer Frage ist ein Fehler aufgetreten." }]);
        } finally {
            setIsChatLoading(false);
        }
    };
    
    /**
     * Erstellt einen neuen Wissenseintrag aus einer Konversation im Chat-Modal.
     */
    const handleAddKnowledgeFromChat = (title: string, summary: string, sourceDocId: string) => {
        addKnowledgeItem({
            title,
            summary,
            sourceDocId,
            tags: [] // Standardmäßig leere Tags
        });
        setActiveTab('knowledge'); // Wechselt zum Wissens-Tab, um den neuen Eintrag anzuzeigen
        setIsChatModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Kopfzeile des Tabs mit Titel und Upload-Button */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Dokumentenverwaltung</h1>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">
                    Dokumente hochladen
                </button>
            </div>
            
            {/* Tabelle zur Anzeige der Dokumentenliste */}
             <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Tags</th>
                            <th scope="col" className="px-6 py-3">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appState.documents.map(doc => (
                            <tr key={doc.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{doc.name}</td>
                                <td className="px-6 py-4">{doc.classificationStatus}</td>
                                <td className="px-6 py-4">{(doc.tags || []).join(', ')}</td>
                                {/* Aktions-Buttons für jedes Dokument */}
                                <td className="px-6 py-4 space-x-2">
                                    <button onClick={() => onViewDocumentDetails(doc.id)} className="text-blue-400 hover:underline">Details</button>
                                    <button onClick={() => { setSelectedDocId(doc.id); setIsTagModalOpen(true); }} className="text-green-400 hover:underline">Tags</button>
                                    <button onClick={() => handleManualAnalyzeDocument(doc.id)} className="text-purple-400 hover:underline disabled:text-gray-500">Analysieren</button>
                                    <button onClick={() => { setSelectedDocId(doc.id); setChatHistory([]); setIsChatModalOpen(true); }} className="text-yellow-400 hover:underline">Chat</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Modale Fenster, die nur bei Bedarf gerendert werden */}
            {isTagModalOpen && selectedDoc && (
                <TagManagementModal
                    isOpen={isTagModalOpen}
                    onClose={() => setIsTagModalOpen(false)}
                    availableTags={appState.tags}
                    assignedTags={selectedDoc.tags}
                    onSave={handleSaveTags}
                    itemName={selectedDoc.name}
                    onCreateTag={(name) => onUpdateTags([...appState.tags, {id: crypto.randomUUID(), name}])}
                />
            )}
            
             {isChatModalOpen && selectedDoc && (
                <AnalysisChatModal
                    documents={[selectedDoc]}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    onClose={() => setIsChatModalOpen(false)}
                    isLoading={isChatLoading}
                    onAddKnowledge={handleAddKnowledgeFromChat}
                />
            )}
        </div>
    );
};

export default DocumentsTab;
