/**
 * @constant legalResources
 * @description Provides detailed information and links related to UN Special Procedures for submitting human rights cases.
 * @description Enthält detaillierte Informationen und Links zu den UN-Sonderverfahren für die Einreichung von Menschenrechtsfällen.
 */
export const legalResources = {
    unSpecialProcedures: {
        title: 'UN Sonderverfahren (Special Procedures)',
        description: 'Informationen zur Einreichung von Fällen bei den UN-Sonderberichterstattern, unabhängigen Experten und Arbeitsgruppen.',
        submissionInfo: [
            { title: 'Identität des/der Opfer', content: 'Vollständiger Name, Geburtsdatum, Nationalität und andere relevante Identifikationsmerkmale.' },
            { title: 'Zustimmung (Consent)', content: 'Eine informierte Zustimmung des Opfers oder seiner Familie ist zwingend erforderlich. Es muss geklärt werden, ob der Name des Opfers veröffentlicht werden darf.' },
            { title: 'Identität der mutmaßlichen Täter', content: 'Name, Titel, staatliche Einheit oder Gruppe. Jede Information, die zur Identifizierung beiträgt.' },
            { title: 'Datum, Ort und Beschreibung des Vorfalls', content: 'Eine detaillierte, chronologische und faktenbasierte Darstellung der Menschenrechtsverletzung.' },
            { title: 'Erschöpfung nationaler Rechtsmittel', content: 'Darlegung, welche rechtlichen Schritte auf nationaler Ebene unternommen wurden und warum diese nicht erfolgreich, nicht verfügbar oder nicht effektiv waren.' },
            { title: 'Bezug zu internationalen Menschenrechtsnormen', content: 'Welche Artikel welcher Konventionen (z.B. AEMR, UN-Zivilpakt) wurden verletzt?' },
        ],
        submissionChannels: [
            { type: 'Allgemeine E-Mail für Einreichungen', value: 'submissions@ohchr.org' },
            { type: 'E-Mail für dringende Appelle (Urgent Appeals)', value: 'urgent-action@ohchr.org' },
            { type: 'Online-Portal', value: 'https://spsubmission.ohchr.org/' },
        ],
        helpfulLinks: [
            { name: 'Offizielle Seite der Sonderverfahren', url: 'https://www.ohchr.org/en/special-procedures-human-rights-council' },
            { name: 'Verzeichnis der Mandatsträger', url: 'https://www.ohchr.org/en/special-procedures/find-mandate-holders-and-their-mandates' },
        ]
    },
    // Weitere Ressourcen können hier hinzugefügt werden
};

/**
 * @constant otherResources
 * @description A collection of links to various human rights databases and resources from the OHCHR and other organizations.
 * @description Eine Sammlung von Links zu verschiedenen Menschenrechtsdatenbanken und Ressourcen des OHCHR und anderer Organisationen.
 */
export const otherResources = {
    ohchrDatabases: {
        title: 'OHCHR-Datenbanken',
        description: 'Spezialisierte Datenbanken des Hochkommissariats für Menschenrechte (OHCHR) zur Recherche von Dokumenten, Rechtsprechung und Empfehlungen.',
        items: [
            {
                title: 'Search Library',
                description: 'Zentraler Suchzugang zu allen öffentlichen OHCHR-Dokumenten.',
                url: 'https://searchlibrary.ohchr.org/?ln=en'
            },
            {
                title: 'Anti-discrimination Database',
                description: 'Informationen, Richtlinien und Maßnahmen zur Bekämpfung von Rassismus und Diskriminierung.',
                url: 'http://adsdatabase.ohchr.org/'
            },
            {
                title: 'Human Rights Education and Training Database',
                description: 'Weltweite Suche nach Institutionen, Programmen und Materialien zur Menschenrechtsbildung.',
                url: 'http://hre.ohchr.org'
            },
            {
                title: 'Jurisprudence Database',
                description: 'Zugang zur Rechtsprechung der UN-Vertragsorgane bei Individualbeschwerden.',
                url: 'http://juris.ohchr.org'
            },
            {
                title: 'Status of Ratification Interactive Dashboard',
                description: 'Interaktive Karte zum Ratifizierungsstatus internationaler Menschenrechtsverträge.',
                url: 'http://indicators.ohchr.org'
            },
            {
                title: 'Universal Human Rights Index (UHRI)',
                description: 'Länderspezifische Menschenrechtsempfehlungen aus allen UN-Mechanismen (Vertragsorgane, Sonderverfahren, UPR).',
                url: 'http://uhri.ohchr.org'
            },
            {
                title: 'UN Charter Body Database',
                description: 'Dokumente und Informationen zu chartabasierten Gremien wie dem Menschenrechtsrat.',
                url: 'https://ap.ohchr.org/Documents/gmainec.aspx'
            },
            {
                title: 'UN Treaty Bodies Database',
                description: 'Dokumente und Informationen zu den wichtigsten internationalen Menschenrechtsverträgen.',
                url: 'http://tbinternet.ohchr.org/'
            },
            {
                title: 'Universal Periodic Review (UPR) Database',
                description: 'Dokumentation zur periodischen Überprüfung der Menschenrechtslage in den UN-Mitgliedstaaten.',
                url: 'http://www.ohchr.org/en/hr-bodies/upr/documentation'
            },
            {
                title: 'Special Procedures Database',
                description: 'Dokumente zu den Mandaten und Länderbesuchen der Sonderverfahren.',
                url: 'http://spinternet.ohchr.org'
            },
            {
                title: 'Special Procedures Communications Search',
                description: 'Durchsuchen Sie Mitteilungen der Sonderverfahren an Staaten und andere Akteure seit 2011.',
                url: 'https://spcommreports.ohchr.org'
            },
        ]
    },
    otherKeyResources: {
        title: 'Weitere Schlüsselressourcen',
        description: 'Wichtige externe Datenbanken und Informationsportale von Partnerorganisationen.',
        items: [
            {
                title: 'Right-Docs',
                description: 'Dokumentationsressource für Menschenrechtsverteidiger.',
                url: 'https://www.right-docs.org/'
            },
            {
                title: 'IHL Treaties Database (ICRC)',
                description: 'Datenbank des IKRK zu Verträgen des humanitären Völkerrechts.',
                url: 'https://ihl-databases.icrc.org/en/ihl-treaties'
            },
            {
                title: 'UN Convention against Corruption (UNODC)',
                description: 'Informationen zur UN-Konvention gegen Korruption.',
                url: 'https://www.unodc.org/corruption/en/uncac/learn-about-uncac.html'
            },
            {
                title: 'ISHR: End Reprisals',
                description: 'Informationen und Kampagnen gegen Repressalien gegen Menschenrechtsverteidiger.',
                url: 'https://endreprisals.ishr.ch/'
            },
            {
                title: 'UN Special Rapporteur on Human Rights Defenders',
                description: 'Offizielle Webseite des UN-Sonderberichterstatters für Menschenrechtsverteidiger.',
                url: 'https://srdefenders.org/'
            },
            {
                title: 'Universal Declaration of Human Rights (UDHR) Translations',
                description: 'Die Allgemeine Erklärung der Menschenrechte in über 500 Sprachen.',
                url: 'https://www.ohchr.org/en/human-rights/universal-declaration/universal-declaration-human-rights/search-udhr-translations'
            }
        ]
    }
};
