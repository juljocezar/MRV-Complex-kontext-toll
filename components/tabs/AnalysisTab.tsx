import React from 'react';
import type { AppState } from '../../types';

interface AnalysisTabProps {
    appState: AppState;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ appState }) => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Analyse-Zentrum</h1>
            <p className="text-gray-400">
                Dieser Bereich ist für erweiterte, fallübergreifende Analysen vorgesehen.
                Zukünftige Funktionen könnten hier erscheinen, wie z.B. semantische Analyse,
                Mustererkennung über mehrere Fälle hinweg oder prädiktive Analysen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Semantische Suche</h2>
                    <p className="text-gray-400">
                        Durchsuchen Sie alle Dokumente und Wissenseinträge basierend auf Bedeutung und Kontext,
                        nicht nur nach Schlüsselwörtern. (In Entwicklung)
                    </p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-white mb-2">Prädiktive Analyse</h2>
                    <p className="text-gray-400">
                        Identifizieren Sie basierend auf historischen Daten Muster, die auf zukünftige Risiken
                        oder Fallentwicklungen hindeuten könnten. (In Entwicklung)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalysisTab;
