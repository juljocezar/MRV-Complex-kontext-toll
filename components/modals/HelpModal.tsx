
import React from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col border border-gray-700 max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/50 rounded-t-lg">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>❓</span> Hilfe & Workflow
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-gray-300">
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-2">Wie nutze ich den MRV-Assistenten?</h3>
                        <p className="text-sm mb-4">
                            Dieses Tool unterstützt Sie bei der forensischen Aufarbeitung von Menschenrechtsfällen. Der typische Workflow besteht aus drei Phasen:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                                <div className="text-blue-400 font-bold mb-1">1. Erfassen</div>
                                <p className="text-xs">Laden Sie Dokumente im <strong>Archiv</strong> hoch. Die KI extrahiert automatisch Metadaten, Personen und Ereignisse.</p>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                                <div className="text-purple-400 font-bold mb-1">2. Analysieren</div>
                                <p className="text-xs">Nutzen Sie den <strong>Graph</strong>, die <strong>Zeitachse</strong> oder den <strong>Radbruch-Check</strong>, um Muster und Widersprüche zu finden.</p>
                            </div>
                            <div className="bg-gray-700/30 p-3 rounded border border-gray-600">
                                <div className="text-green-400 font-bold mb-1">3. Handeln</div>
                                <p className="text-xs">Generieren Sie Berichte, Strategien oder UN-Beschwerden im <strong>Output</strong>-Bereich.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-white mb-2">Spezial-Tools erklärt</h3>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="font-bold text-indigo-300">Radbruch 4D Check</dt>
                                <dd className="pl-4 border-l-2 border-indigo-500/30 mt-1 text-gray-400">
                                    Eine forensische Methode zur Prüfung staatlicher Willkür. Sie bewertet Transparenz (D1), Verantwortung (D2), Datenqualität (D3) und Wahrheitsrecht (D4).
                                </dd>
                            </div>
                            <div>
                                <dt className="font-bold text-indigo-300">Systemdynamik</dt>
                                <dd className="pl-4 border-l-2 border-indigo-500/30 mt-1 text-gray-400">
                                    Nutzt das "Thinking"-Modell der KI, um tiefere strukturelle Ursachen und gesellschaftliche Folgen von Verletzungen zu erkennen.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-bold text-indigo-300">Widerspruchsanalyse</dt>
                                <dd className="pl-4 border-l-2 border-indigo-500/30 mt-1 text-gray-400">
                                    Vergleicht Aussagen über mehrere Dokumente hinweg, um Inkonsistenzen in der gegnerischen Darstellung zu finden.
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="bg-yellow-900/10 border border-yellow-700/30 p-4 rounded text-xs text-yellow-200/80">
                        <strong>Hinweis zur Datensicherheit:</strong><br/>
                        Die Analyse erfolgt über eine verschlüsselte Verbindung zur KI. Im Hybrid-Modus werden Daten lokal auf Ihrem Gerät und optional auf Ihrem sicheren Server gespeichert. Sensible Metadaten werden gemäß ESF-Standards behandelt.
                    </section>
                </div>
                
                <footer className="p-4 border-t border-gray-700 bg-gray-900/30 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-sm">
                        Verstanden
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HelpModal;
