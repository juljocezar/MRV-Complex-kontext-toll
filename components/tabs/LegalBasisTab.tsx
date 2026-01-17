
import React, { useState, useMemo } from 'react';
import { LEGAL_SOURCE_CARDS } from '../../legalResources';
import { LegalMechanism, LegalSourceCard } from '../../types';
import Icon from '../ui/Icon';

const LegalBasisTab: React.FC = () => {
    const [selectedMechanism, setSelectedMechanism] = useState<LegalMechanism | 'ALL'>('ALL');
    const [selectedRegion, setSelectedRegion] = useState<LegalSourceCard['region'] | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCards = useMemo(() => {
        return LEGAL_SOURCE_CARDS.filter(card => {
            const matchesMech = selectedMechanism === 'ALL' || card.mechanism === selectedMechanism;
            const matchesRegion = selectedRegion === 'ALL' || card.region === selectedRegion;
            const matchesSearch = searchQuery === '' || 
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesMech && matchesRegion && matchesSearch;
        });
    }, [selectedMechanism, selectedRegion, searchQuery]);

    const getBadgeColor = (mechanism: LegalMechanism) => {
        switch (mechanism) {
            case 'UN_TREATY_BODY': return 'bg-blue-900/50 text-blue-200 border-blue-700';
            case 'UN_SPECIAL_PROCEDURE': return 'bg-purple-900/50 text-purple-200 border-purple-700';
            case 'IHL_TREATY':
            case 'IHL_CUSTOMARY': return 'bg-red-900/50 text-red-200 border-red-700';
            case 'NGO_GUIDANCE': return 'bg-green-900/50 text-green-200 border-green-700';
            default: return 'bg-gray-700 text-gray-300 border-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Rechtsgrundlagen & Ressourcen</h1>
                <p className="text-gray-400 mt-2">
                    Eine kuratierte Bibliothek relevanter internationaler Menschenrechtsinstrumente, Datenbanken und Recherche-Portale.
                </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                    <input 
                        type="text" 
                        placeholder="Suche (z.B. 'Folter', 'Frauenrechte')..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                
                <select 
                    value={selectedMechanism} 
                    onChange={(e) => setSelectedMechanism(e.target.value as any)}
                    className="bg-gray-700 text-white p-2 rounded border border-gray-600"
                >
                    <option value="ALL">Alle Mechanismen</option>
                    <option value="UN_TREATY_BODY">UN Vertragsorgane</option>
                    <option value="UN_SPECIAL_PROCEDURE">UN Sonderverfahren</option>
                    <option value="IHL_TREATY">Humanitäres Völkerrecht (Vertrag)</option>
                    <option value="IHL_CUSTOMARY">HVR (Gewohnheitsrecht)</option>
                    <option value="UN_ORGANISED_CRIME">Organisierte Kriminalität</option>
                    <option value="NGO_GUIDANCE">NGO Leitfäden</option>
                    <option value="REGIONAL_MECHANISM">Regionale Systeme</option>
                </select>

                <select 
                    value={selectedRegion} 
                    onChange={(e) => setSelectedRegion(e.target.value as any)}
                    className="bg-gray-700 text-white p-2 rounded border border-gray-600"
                >
                    <option value="ALL">Alle Regionen</option>
                    <option value="GLOBAL">Global</option>
                    <option value="EUROPE">Europa</option>
                    <option value="AFRICA">Afrika</option>
                    <option value="AMERICAS">Amerika</option>
                    <option value="ASIA">Asien</option>
                    <option value="MENA">MENA</option>
                </select>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map(card => (
                    <div key={card.id} className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg hover:border-gray-500 transition-all flex flex-col h-full group">
                        <div className="p-5 flex-grow">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getBadgeColor(card.mechanism)} uppercase tracking-wider`}>
                                    {card.mechanism.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono bg-gray-900 px-1.5 py-0.5 rounded">
                                    {card.region}
                                </span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                <a href={card.baseUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    {card.title}
                                    <span className="opacity-0 group-hover:opacity-100 text-xs transition-opacity">↗</span>
                                </a>
                            </h3>
                            
                            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                {card.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-auto">
                                {card.topics.map(topic => (
                                    <span key={topic} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600/50">
                                        #{topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-gray-700/30 p-3 border-t border-gray-700 flex justify-end">
                            <a 
                                href={card.baseUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 uppercase tracking-wide flex items-center gap-1"
                            >
                                Datenbank öffnen <span className="text-lg leading-none">›</span>
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCards.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                    <p className="text-xl mb-2">🤷‍♂️</p>
                    <p>Keine Ressourcen gefunden, die den Filtern entsprechen.</p>
                </div>
            )}
        </div>
    );
};

export default LegalBasisTab;
