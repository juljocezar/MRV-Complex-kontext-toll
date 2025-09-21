import React from 'react';
import { legalResources, otherResources } from '../../legalResources';
import Accordion from '../ui/Accordion';

/**
 * A static informational tab that displays a library of legal resources.
 * The content is organized into accordions and imported from a constants file.
 */
const LegalBasisTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Legal Basis & Resources</h1>
            <p className="text-gray-400">A library of relevant international human rights instruments, complaint mechanisms, and research databases.</p>
            
            <div className="space-y-4">
                <Accordion title={legalResources.complaintMechanisms.title} defaultOpen>
                    <p className="text-gray-400 mb-4">{legalResources.complaintMechanisms.description}</p>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg text-gray-200">{legalResources.complaintMechanisms.unMechanisms.title}</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                            {legalResources.complaintMechanisms.unMechanisms.options.map(item => (
                                <li key={item.name}><strong>{item.name}:</strong> {item.details}</li>
                            ))}
                        </ul>
                         <h3 className="font-semibold text-lg text-gray-200 mt-4">{legalResources.complaintMechanisms.regionalMechanisms.title}</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-300">
                            {legalResources.complaintMechanisms.regionalMechanisms.options.map(item => (
                                <li key={item.name}><strong>{item.name}:</strong> {item.details}</li>
                            ))}
                        </ul>
                    </div>
                </Accordion>

                <Accordion title={legalResources.reportingGuides.title}>
                     <p className="text-gray-400 mb-4">{legalResources.reportingGuides.description}</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-lg text-gray-200">{legalResources.reportingGuides.shadowReportSteps.title}</h3>
                            <ol className="list-decimal list-inside space-y-1 text-gray-300 mt-2">
                                {legalResources.reportingGuides.shadowReportSteps.steps.map(step => <li key={step}>{step}</li>)}
                            </ol>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg text-gray-200">{legalResources.reportingGuides.factFindingChecklist.title}</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-300 mt-2">
                                {legalResources.reportingGuides.factFindingChecklist.sources.map(source => <li key={source}>{source}</li>)}
                            </ul>
                        </div>
                     </div>
                </Accordion>
                
                <Accordion title={otherResources.ohchrDatabases.title}>
                    <p className="text-gray-400 mb-4">{otherResources.ohchrDatabases.description}</p>
                    <div className="space-y-3">
                        {otherResources.ohchrDatabases.items.map(item => (
                            <div key={item.title} className="bg-gray-800 p-3 rounded-md">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-400 hover:underline">{item.title}</a>
                                <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </Accordion>
            </div>
        </div>
    );
};

export default LegalBasisTab;
