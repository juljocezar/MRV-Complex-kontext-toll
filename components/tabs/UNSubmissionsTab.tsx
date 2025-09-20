import React, { useState } from 'react';
import type { UNSubmission } from '../../types';

interface UNSubmissionsTabProps {
    submissions: UNSubmission[];
    setSubmissions: React.Dispatch<React.SetStateAction<UNSubmission[]>>;
    onGenerateSection: (sectionTitle: string, currentContent: { [key: string]: string }) => Promise<string>;
    onFinalize: () => Promise<void>;
    isLoading: boolean;
    loadingSection: string;
}

const submissionSections = [
    'I. INFORMATIONEN ZUM OPFER/ZU DEN OPFERN',
    'II. INFORMATIONEN ZUM VORFALL',
    'III. INFORMATIONEN ZU DEN MUTMASSLICHEN TÄTERN',
    'IV. ERSCHÖPFUNG NATIONALER RECHTSMITTEL',
    'V. ZUSTIMMUNG (CONSENT)',
    'VI. GEWÜNSCHTE MASSNAHMEN'
];

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