import React from 'react';
import { legalResources, otherResources } from '../../legalResources';

/**
 * @interface AccordionItemProps
 * @description Represents the props for the AccordionItem component.
 * @description Stellt die Props für die AccordionItem-Komponente dar.
 * @property {string} title - The title displayed in the accordion header. / Der im Akkordeon-Header angezeigte Titel.
 * @property {React.ReactNode} children - The content to be displayed within the accordion body. / Der im Akkordeon-Körper anzuzeigende Inhalt.
 */
interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

/**
 * @component AccordionItem
 * @description A reusable accordion item component using the HTML <details> element.
 * @description Eine wiederverwendbare Akkordeon-Element-Komponente, die das HTML-<details>-Element verwendet.
 * @param {AccordionItemProps} props - The props for the component. / Die Props für die Komponente.
 * @returns {React.ReactElement} The rendered accordion item. / Das gerenderte Akkordeon-Element.
 */
const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => (
    <details className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <summary className="cursor-pointer p-4 font-semibold text-white text-lg hover:bg-gray-700/50">
            {title}
        </summary>
        <div className="p-4 border-t border-gray-700">
            {children}
        </div>
    </details>
);

/**
 * @component LegalBasisTab
 * @description A tab that provides a curated collection of important legal information and procedural guides.
 * @description Ein Tab, der eine kuratierte Sammlung von wichtigen rechtlichen Informationen und prozeduralen Anleitungen bereitstellt.
 * @returns {React.ReactElement} The rendered legal basis tab. / Der gerenderte Rechtsgrundlagen-Tab.
 */
const LegalBasisTab: React.FC = () => {
    const { unSpecialProcedures } = legalResources;
    const { ohchrDatabases, otherKeyResources } = otherResources;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Rechtsgrundlagen & Verfahren</h1>
            <p className="text-gray-400">
                Eine kuratierte Sammlung von wichtigen rechtlichen Informationen und prozeduralen Anleitungen.
            </p>

            <div className="space-y-4">
                <AccordionItem title={unSpecialProcedures.title}>
                    <p className="text-gray-300 mb-6">{unSpecialProcedures.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-md font-semibold text-gray-200 mb-3">Checkliste für erforderliche Informationen</h3>
                            <ul className="space-y-3">
                                {unSpecialProcedures.submissionInfo.map(item => (
                                    <li key={item.title}>
                                        <h4 className="font-semibold text-blue-400">{item.title}</h4>
                                        <p className="text-sm text-gray-400">{item.content}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                             <div>
                                <h3 className="text-md font-semibold text-gray-200 mb-3">Einreichungskanäle</h3>
                                <ul className="space-y-2">
                                    {unSpecialProcedures.submissionChannels.map(channel => (
                                        <li key={channel.type} className="text-sm">
                                            <span className="text-gray-400">{channel.type}: </span>
                                            <a href={channel.value.startsWith('http') ? channel.value : `mailto:${channel.value}`} target="_blank" rel="noopener noreferrer" className="font-mono text-indigo-400 hover:underline">{channel.value}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-200 mb-3">Weiterführende Links</h3>
                                 <ul className="space-y-2">
                                    {unSpecialProcedures.helpfulLinks.map(link => (
                                        <li key={link.name}>
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                                                {link.name} &rarr;
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </AccordionItem>
                
                <AccordionItem title={ohchrDatabases.title}>
                    <p className="text-gray-300 mb-6">{ohchrDatabases.description}</p>
                    <div className="space-y-4">
                        {ohchrDatabases.items.map(item => (
                            <div key={item.title} className="bg-gray-800/50 p-4 rounded-md border border-gray-700/50">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-400 hover:underline">
                                    {item.title} &rarr;
                                </a>
                                <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </AccordionItem>

                <AccordionItem title={otherKeyResources.title}>
                    <p className="text-gray-300 mb-6">{otherKeyResources.description}</p>
                    <div className="space-y-4">
                        {otherKeyResources.items.map(item => (
                            <div key={item.title} className="bg-gray-800/50 p-4 rounded-md border border-gray-700/50">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-blue-400 hover:underline">
                                    {item.title} &rarr;
                                </a>
                                <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </AccordionItem>

            </div>
        </div>
    );
};

export default LegalBasisTab;
