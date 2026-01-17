
import React, { useState } from 'react';
import { RadbruchEvent, Radbruch4DAssessment, DimensionAssessment } from '../../types';
import { RadbruchLogicService } from '../../services/radbruchLogic';

interface RadbruchWizardTabProps {
    onSave?: (assessment: Radbruch4DAssessment) => void;
}

const RadbruchWizardTab: React.FC<RadbruchWizardTabProps> = ({ onSave }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<RadbruchEvent>({
        eventId: crypto.randomUUID(),
        eventType: 'Verwaltungsakt',
        location: { country: 'DE', region: '', city: '' },
        jurisdictionUnitId: '',
        dateStart: '',
        
        summary: '',
        allegedRightsViolated: [],
        
        usesAlgorithmicDecision: false,
        aiSystemNameOrType: '',
        decisionOpacityLevel: 'transparent',
        legalProcedureStage: 'administrative',
        
        involvedActors: '', // UI helper
        
        // New Fields
        referencedLaws: [],
        signerName: '',
        isMachineGenerated: false,
        officialSignal: '',
        sphereRisks: {
            lossOfHousing: false,
            lossOfIncome: false,
            healthRisk: false
        }
    });
    const [assessment, setAssessment] = useState<Radbruch4DAssessment | null>(null);
    const [tempLaw, setTempLaw] = useState('');

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const calculate = () => {
        const result = RadbruchLogicService.computeRadbruch4D(formData);
        setAssessment(result);
        handleNext();
    };

    const handleChange = (field: keyof RadbruchEvent, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLocationChange = (field: keyof typeof formData.location, value: string) => {
        setFormData(prev => ({ ...prev, location: { ...prev.location, [field]: value } }));
    };
    
    const handleSphereRiskChange = (field: keyof typeof formData.sphereRisks) => {
        setFormData(prev => ({
            ...prev,
            sphereRisks: { ...prev.sphereRisks, [field]: !prev.sphereRisks[field] }
        }));
    };

    const handleAddLaw = () => {
        if(tempLaw.trim()) {
            setFormData(prev => ({ ...prev, referencedLaws: [...prev.referencedLaws, tempLaw.trim()] }));
            setTempLaw('');
        }
    };

    const handleRemoveLaw = (index: number) => {
        setFormData(prev => ({ ...prev, referencedLaws: prev.referencedLaws.filter((_, i) => i !== index) }));
    };

    const toggleRight = (right: string) => {
        setFormData(prev => {
            const rights = prev.allegedRightsViolated.includes(right)
                ? prev.allegedRightsViolated.filter(r => r !== right)
                : [...prev.allegedRightsViolated, right];
            return { ...prev, allegedRightsViolated: rights };
        });
    };

    const renderProgressBar = () => (
        <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map(num => (
                <div key={num} className={`flex flex-col items-center ${step >= num ? 'text-indigo-400' : 'text-gray-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step === num ? 'border-indigo-400 bg-indigo-900/50' : step > num ? 'border-indigo-400 bg-indigo-400 text-slate-900' : 'border-gray-600'}`}>
                        {step > num ? '✓' : num}
                    </div>
                    <span className="text-xs mt-1 uppercase font-semibold">
                        {num === 1 ? 'Kontext' : num === 2 ? 'Fakten' : num === 3 ? 'Validierung' : 'Matrix'}
                    </span>
                </div>
            ))}
            <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-700 -z-10 mt-4 mx-8" />
        </div>
    );

    const renderDimensionCard = (title: string, data: DimensionAssessment, icon: string) => (
        <div className={`bg-gray-700/30 p-4 rounded-lg border ${data.label === 'critical' ? 'border-red-500/50' : data.label === 'problematic' ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-white flex items-center gap-2">{icon} {title}</h4>
                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${data.label === 'critical' ? 'bg-red-500/20 text-red-300' : data.label === 'problematic' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                    {data.label}
                </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className={`h-full ${data.score < 4 ? 'bg-red-500' : data.score < 7 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${data.score * 10}%` }} />
            </div>
            <p className="text-xs text-gray-400">{data.notes || "Keine Auffälligkeiten."}</p>
        </div>
    );

    const ESFLabel = ({ tag }: { tag: string }) => (
        <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1 py-0.5 rounded border border-slate-600 font-mono tracking-tighter" title={`HURIDOCS ESF Feld ${tag}`}>
            ESF {tag}
        </span>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Radbruch 4D Validierung</h1>
            <p className="text-gray-400 mb-8">Forensische Bewertung von Rechtsstaatlichkeit (ESF-Konform).</p>

            {renderProgressBar()}

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Schritt 1: Jurisdiktion & Kontext</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Land (ISO) <ESFLabel tag="111" /></label>
                                <input type="text" value={formData.location.country} onChange={e => handleLocationChange('country', e.target.value)} className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Region <ESFLabel tag="111" /></label>
                                <input type="text" value={formData.location.region} onChange={e => handleLocationChange('region', e.target.value)} placeholder="z.B. Niedersachsen" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Stadt <ESFLabel tag="111" /></label>
                                <input type="text" value={formData.location.city} onChange={e => handleLocationChange('city', e.target.value)} placeholder="z.B. Stadthagen" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Verantwortliche Behörde (Jurisdiction Unit)</label>
                                <input type="text" value={formData.jurisdictionUnitId} onChange={e => handleChange('jurisdictionUnitId', e.target.value)} placeholder="Name der Behörde / Institution" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Verfahrensstadium</label>
                                <select 
                                    value={formData.legalProcedureStage} 
                                    onChange={e => handleChange('legalProcedureStage', e.target.value)} 
                                    className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="administrative">Verwaltungsverfahren</option>
                                    <option value="criminal_or_OWi_court">Straf- / Bußgeldgericht</option>
                                    <option value="civil_court">Zivilgericht</option>
                                    <option value="other">Sonstiges</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Legislative Genealogie (Gesetzesbezüge)</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="text" 
                                    value={tempLaw} 
                                    onChange={e => setTempLaw(e.target.value)} 
                                    placeholder="z.B. § 123 BGB, Gesetz vom 1935..." 
                                    className="flex-grow bg-gray-600 text-white p-2 rounded-md border border-gray-500 text-sm"
                                    onKeyPress={e => e.key === 'Enter' && handleAddLaw()}
                                />
                                <button onClick={handleAddLaw} className="px-3 py-1 bg-blue-600 rounded-md text-white text-sm">+</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.referencedLaws.map((law, i) => (
                                    <span key={i} className="bg-gray-600 px-2 py-1 rounded text-xs text-white flex items-center">
                                        {law}
                                        <button onClick={() => handleRemoveLaw(i)} className="ml-2 text-red-300 hover:text-red-100">×</button>
                                    </span>
                                ))}
                                {formData.referencedLaws.length === 0 && <span className="text-xs text-gray-500 italic">Keine Gesetze hinzugefügt.</span>}
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                            <button onClick={handleNext} disabled={!formData.jurisdictionUnitId} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md disabled:bg-gray-600 transition-colors">Weiter</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Schritt 2: Sachverhalt & Akteure</h2>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Sachverhalt / Ereignisbeschreibung <ESFLabel tag="115" /></label>
                            <textarea rows={3} value={formData.summary} onChange={e => handleChange('summary', e.target.value)} placeholder="Was ist passiert? Welche Entscheidung wurde getroffen?" className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Offizielle Begründung (Signal-Code)</label>
                            <input 
                                type="text" 
                                value={formData.officialSignal} 
                                onChange={e => handleChange('officialSignal', e.target.value)} 
                                placeholder="z.B. 'Zum Schutz der öffentlichen Sicherheit', 'Hilfsmaßnahme'..." 
                                className="w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Unterzeichner (Name) <ESFLabel tag="2400" /></label>
                                <input type="text" value={formData.signerName} onChange={e => handleChange('signerName', e.target.value)} className="w-full bg-gray-600 text-white p-2 rounded-md border border-gray-500" placeholder="Name des Beamten / Richters" />
                            </div>
                            <div className="flex items-center pt-6">
                                 <input type="checkbox" id="machine" checked={formData.isMachineGenerated} onChange={e => handleChange('isMachineGenerated', e.target.checked)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500" />
                                 <label htmlFor="machine" className="ml-2 text-sm text-gray-200">"Maschinell erstellt / Ohne Unterschrift"</label>
                            </div>
                        </div>

                        <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                            <h3 className="font-semibold text-gray-300 mb-3">System- & Algorithmen-Check</h3>
                            <div className="flex items-center mb-4">
                                <input type="checkbox" id="algo" checked={formData.usesAlgorithmicDecision} onChange={e => handleChange('usesAlgorithmicDecision', e.target.checked)} className="h-5 w-5 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500" />
                                <label htmlFor="algo" className="ml-2 text-sm text-gray-200">Algorithmische Entscheidungsfindung / KI involviert?</label>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Transparenz-Niveau (Opacity Level)</label>
                                <select 
                                    value={formData.decisionOpacityLevel} 
                                    onChange={e => handleChange('decisionOpacityLevel', e.target.value)} 
                                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="transparent">Transparent (Vollständig erklärt)</option>
                                    <option value="partially_explained">Teilweise erklärt</option>
                                    <option value="black_box">Blackbox (Keine Einsicht / Algorithmus)</option>
                                    <option value="paper_only_no_hearing">Nur Aktenlage (Kein Gehör)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={handleBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">Zurück</button>
                            <button onClick={handleNext} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors">Weiter</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Schritt 3: Betroffene Rechte & Sphären</h2>
                        
                        <p className="text-sm text-gray-400">Markieren Sie alle zutreffenden Rechte oder Normen, die verletzt oder berührt wurden <ESFLabel tag="151" />.</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {['Art. 1 GG (Menschenwürde)', 'Art. 2 GG (Handlungsfreiheit)', 'Art. 3 GG (Gleichheit)', 'Art. 19(4) GG (Rechtsweggarantie)', 'Art. 6 EMRK (Fair Trial)', 'DSGVO (Auskunftsrecht)', 'Recht auf Wahrheit (UN)'].map(right => (
                                <button
                                    key={right}
                                    onClick={() => toggleRight(right)}
                                    className={`p-3 rounded-md text-sm text-left border transition-all ${
                                        formData.allegedRightsViolated.includes(right)
                                        ? 'bg-red-500/20 border-red-500 text-red-200'
                                        : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-gray-500'
                                    }`}
                                >
                                    {right}
                                </button>
                            ))}
                        </div>

                        <div className="bg-orange-900/20 border border-orange-700/50 p-4 rounded-lg mt-4">
                            <h3 className="font-bold text-orange-200 mb-3">Sphere Standards Audit (Humanitäres Minimum)</h3>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.sphereRisks.lossOfHousing} onChange={() => handleSphereRiskChange('lossOfHousing')} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500"/>
                                    <span className="text-sm text-gray-300">Verlust von Unterkunft / Obdachlosigkeit</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.sphereRisks.lossOfIncome} onChange={() => handleSphereRiskChange('lossOfIncome')} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500"/>
                                    <span className="text-sm text-gray-300">Verlust von Einkommen / Lebensgrundlage</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.sphereRisks.healthRisk} onChange={() => handleSphereRiskChange('healthRisk')} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-orange-500"/>
                                    <span className="text-sm text-gray-300">Akute Gesundheitsgefährdung / Zugang zu Medizin verwehrt</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={handleBack} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">Zurück</button>
                            <button onClick={calculate} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md shadow-lg shadow-green-500/20 transition-colors">Forensische Validierung starten</button>
                        </div>
                    </div>
                )}

                {step === 4 && assessment && (
                    <div className="space-y-8 animate-in zoom-in duration-300">
                        <div className="text-center">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Gesamtergebnis</h2>
                            <div className="inline-flex flex-col items-center justify-center p-6 bg-gray-900 rounded-full border-4 border-gray-700 shadow-2xl w-48 h-48 relative">
                                <span className={`text-5xl font-black ${assessment.overallPhantomIndex > 50 ? 'text-red-500' : assessment.overallPhantomIndex > 20 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {assessment.overallPhantomIndex}
                                </span>
                                <span className="text-xs text-gray-400 mt-2 uppercase">Phantom Index</span>
                                <div className={`absolute inset-0 rounded-full border-4 ${assessment.overallPhantomIndex > 50 ? 'border-red-500/30 animate-pulse' : 'border-transparent'}`}></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderDimensionCard('Explainability (D1)', assessment.d1Explainability, '🔍')}
                            {renderDimensionCard('Responsibility (D2)', assessment.d2Responsibility, '⚖️')}
                            {renderDimensionCard('Data Status (D3)', assessment.d3DataStatus, '💾')}
                            {renderDimensionCard('Right to Truth (D4)', assessment.d4TruthRight, '🕊️')}
                        </div>

                        {/* Detailed Forensic Findings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assessment.normHierarchy && (
                                <div className={`p-4 rounded-lg border ${assessment.normHierarchy.severity !== 'none' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800 border-gray-700'}`}>
                                    <h4 className="font-bold text-gray-200 mb-2">🏛️ Art. 25 GG Engine (Normen)</h4>
                                    <p className="text-sm text-gray-300">{assessment.normHierarchy.notes}</p>
                                    {assessment.normHierarchy.voidSuggested && <p className="text-xs font-bold text-red-400 mt-1 uppercase">NICHTIGKEIT NAHEGELEGT</p>}
                                </div>
                            )}
                            
                            {assessment.stigmaAnalysis && assessment.stigmaAnalysis.gaslightingIndicators && (
                                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/50">
                                    <h4 className="font-bold text-gray-200 mb-2">🧠 Anti-Stigma Protokoll</h4>
                                    <p className="text-sm text-gray-300">{assessment.stigmaAnalysis.notes}</p>
                                </div>
                            )}

                            {assessment.medicalNeutrality && assessment.medicalNeutrality.neutralityViolation && (
                                <div className="p-4 rounded-lg bg-orange-900/20 border border-orange-500/50">
                                    <h4 className="font-bold text-gray-200 mb-2">⚕️ Health Care Shield</h4>
                                    <p className="text-sm text-gray-300">{assessment.medicalNeutrality.notes}</p>
                                </div>
                            )}

                            {assessment.genealogyAudit && assessment.genealogyAudit.suspicious && (
                                <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-500/50">
                                    <h4 className="font-bold text-gray-200 mb-2">📜 Legislative Genealogie</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300">
                                        {assessment.genealogyAudit.findings.map(f => (
                                            <li key={f.lawId}>{f.lawId}: {f.notes}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {assessment.suggestedLegalActions.length > 0 && (
                            <div className="bg-blue-900/20 border border-blue-700/50 p-4 rounded-lg">
                                <h3 className="font-bold text-blue-300 mb-2">Empfohlene rechtliche Schritte</h3>
                                <ul className="list-disc list-inside text-gray-300 space-y-1">
                                    {assessment.suggestedLegalActions.map((action, i) => (
                                        <li key={i}>{action}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-between pt-6 border-t border-gray-700">
                            <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Neue Analyse</button>
                            {onSave && (
                                <button 
                                    onClick={() => onSave(assessment)} 
                                    data-testid="btn-generate-dossier"
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md shadow-lg transition-colors flex items-center gap-2"
                                >
                                    <span>💾</span> Ergebnis speichern
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RadbruchWizardTab;
