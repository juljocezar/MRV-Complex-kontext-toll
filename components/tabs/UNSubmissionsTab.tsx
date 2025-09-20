import React, { useState } from 'react';
import type { UNSubmission } from '../../types';

/**
 * @interface UNSubmissionsTabProps
 * @description Represents the props for the UNSubmissionsTab component.
 * @description Stellt die Props für die UNSubmissionsTab-Komponente dar.
 * @property {UNSubmission[]} submissions - The list of all UN submissions. / Die Liste aller UN-Einreichungen.
 * @property {React.Dispatch<React.SetStateAction<UNSubmission[]>>} setSubmissions - Function to update the list of submissions. / Funktion zum Aktualisieren der Liste der Einreichungen.
 * @property {(sectionTitle: string, currentContent: { [key: string]: string }) => Promise<string>} onGenerateSection - Function to generate content for a specific section. / Funktion zum Generieren von Inhalt für einen bestimmten Abschnitt.
 * @property {() => Promise<void>} onFinalize - Function to finalize a submission. / Funktion zum Finalisieren einer Einreichung.
 * @property {boolean} isLoading - Flag indicating if a process is running. / Flag, das anzeigt, ob ein Prozess läuft.
 * @property {string} loadingSection - The specific section being loaded. / Der spezifische Abschnitt, der geladen wird.
 */
interface UNSubmissionsTabProps {
    submissions: UNSubmission[];
    setSubmissions: React.Dispatch<React.SetStateAction<UNSubmission[]>>;
    onGenerateSection: (sectionTitle: string, currentContent: { [key: string]: string }) => Promise<string>;
    onFinalize: () => Promise<void>;
    isLoading: boolean;
    loadingSection: string;
}

/**
 * @constant submissionSections
 * @description An array defining the standard sections of a UN submission.
 * @description Ein Array, das die Standardabschnitte einer UN-Einreichung definiert.
 */
const submissionSections = [
    'I. INFORMATIONEN ZUM OPFER/ZU DEN OPFERN',
    'II. INFORMATIONEN ZUM VORFALL',
    'III. INFORMATIONEN ZU DEN MUTMASSLICHEN TÄTERN',
    'IV. ERSCHÖPFUNG NATIONALER RECHTSMITTEL',
    'V. ZUSTIMMUNG (CONSENT)',
    'VI. GEWÜNSCHTE MASSNAHMEN'
];

/**
 * @component UNSubmissionsTab
 * @description A tab for creating, managing, and generating content for submissions to UN bodies.
 * @description Ein Tab zum Erstellen, Verwalten und Generieren von Inhalten für Einreichungen bei UN-Gremien.
 * @param {UNSubmissionsTabProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered UN submissions tab. / Der gerenderte UN-Einreichungen-Tab.
 */
const UNSubmissionsTab: React.FC<UNSubmissionsTabProps> = ({ submissions, setSubmissions, onGenerateSection, onFinalize, isLoading, loadingSection }) => {
    const [currentSubmission, setCurrentSubmission] = useState<UNSubmission | null>(null);

    const handleNewSubmission = () => {
        const newSub: UNSubmission = {
            id: crypto.randomUUID(),
            title: `UN-Einreichung ${new Date().toLocaleDateString()}`,
            status: 'draft',
            content: submissionSections.reduce((acc, section) => ({ ...acc, [section]: '' }), {})
        };
        setCurrentSubmission(newSub);
    };

    const handleSaveSubmission = () => {
        if (currentSubmission) {
            setSubmissions(prev => {
                const existing = prev.find(s => s.id === currentSubmission.id);
                if (existing) {
                    return prev.map(s => s.id === currentSubmission.id ? currentSubmission : s);
                }
                return [...prev, currentSubmission];
            });
            setCurrentSubmission(null);
        }
    };

    const handleGenerate = async (sectionTitle: string) => {
        if (!currentSubmission) return;
        const generatedText = await onGenerateSection(sectionTitle, currentSubmission.content);
        setCurrentSubmission(prev => {
            if (!prev) return null;
            return {
                ...prev,
                content: {
                    ...prev.content,
                    [sectionTitle]: generatedText,
                }
            };
        });
    };
    
    const handleContentChange = (sectionTitle: string, text: string) => {
        if (!currentSubmission) return;
        setCurrentSubmission(prev => {
            if (!prev) return null;
            return {
                ...prev,
                content: {
                    ...prev.content,
                    [sectionTitle]: text,
                }
            };
        });
    };

    if (currentSubmission) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <input 
                        type="text"
                        value={currentSubmission.title}
                        onChange={(e) => setCurrentSubmission({...currentSubmission, title: e.target.value})}
                        className="text-3xl font-bold text-white bg-transparent border-b-2 border-gray-700 focus:outline-none focus:border-blue-500"
                    />
                     <div>
                        <button onClick={() => setCurrentSubmission(null)} className="mr-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Abbrechen</button>
                        <button onClick={handleSaveSubmission} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md">Speichern & Schließen</button>
                    </div>
                </div>
                <div className="space-y-4">
                    {submissionSections.map(section => (
                        <details key={section} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden" open>
                            <summary className="cursor-pointer p-4 font-semibold text-white text-lg hover:bg-gray-700/50 flex justify-between items-center">
                                {section}
                                <button
                                    onClick={(e) => { e.preventDefault(); handleGenerate(section); }}
                                    disabled={isLoading && loadingSection === `un-section-${section}`}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs disabled:bg-gray-500"
                                >
                                    {isLoading && loadingSection === `un-section-${section}` ? '...' : 'Generieren'}
                                </button>
                            </summary>
                            <div className="p-4 border-t border-gray-700">
                                <textarea
                                    value={currentSubmission.content[section] || ''}
                                    onChange={(e) => handleContentChange(section, e.target.value)}
                                    rows={8}
                                    className="w-full bg-gray-700/50 p-2 rounded-md"
                                    placeholder={`Inhalt für Sektion "${section}" eingeben oder generieren...`}
                                />
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">UN-Eingaben</h1>
                <button onClick={handleNewSubmission} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-md">
                    Neue Eingabe erstellen
                </button>
            </div>
            <p className="text-gray-400">
                Verwalten Sie hier Ihre Entwürfe für Eingaben an UN-Sonderberichterstatter und andere Mechanismen.
            </p>

            <div className="space-y-4">
                {submissions.map(sub => (
                    <div key={sub.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-white">{sub.title}</h3>
                            <p className="text-sm text-gray-400">Status: {sub.status}</p>
                        </div>
                        <button onClick={() => setCurrentSubmission(sub)} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm">Bearbeiten</button>
                    </div>
                ))}
                 {submissions.length === 0 && (
                    <p className="text-center py-8 text-gray-500">Noch keine Eingaben erstellt.</p>
                )}
            </div>
        </div>
    );
};

export default UNSubmissionsTab;