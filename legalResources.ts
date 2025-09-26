/**
 * @file legalResources.ts
 * @description This file contains static, structured data about legal resources,
 * complaint mechanisms, reporting guides, and external databases relevant to human rights work.
 * This data is used to populate the static 'Legal Basis' and 'UN Submissions' tabs in the application.
 */

/**
 * @const legalResources
 * @description A structured object containing detailed information on human rights complaint mechanisms (UN and regional)
 * and guides for reporting, such as creating shadow reports and checklists for fact-finding.
 * This data directly informs the content of the "Rechtsgrundlagen" (Legal Basis) tab.
 */
export const legalResources = {
    complaintMechanisms: {
        title: "Beschwerdemechanismen bei Menschenrechtsverletzungen",
        description: "Eine Übersicht über internationale und regionale Gremien, bei denen Beschwerden über Menschenrechtsverletzungen eingereicht werden können. Die Auswahl des geeigneten Mechanismus hängt von der Art der Verletzung, dem betroffenen Staat und den spezifischen Regeln des jeweiligen Gremiens ab.",
        unMechanisms: {
            title: "UN-Mechanismen",
            options: [
                {
                    name: "UN-Menschenrechtsrat: Individualbeschwerden",
                    details: "Prüft konsistente Muster schwerer und zuverlässig belegter Menschenrechtsverletzungen. Gilt für alle UN-Mitgliedstaaten. Rechtsmittel sind begrenzt."
                },
                {
                    name: "UN-Vertragsorgane: Untersuchungen & Individualbeschwerden",
                    details: "Zuständig für die Vertragsstaaten des jeweiligen Vertrags. Bieten Untersuchungsverfahren für dringende, schwere oder systematische Verletzungen sowie meist individuelle Beschwerdemechanismen."
                },
                {
                    name: "UN-Sonderverfahren: Dringende Appelle & Anschuldigungsschreiben",
                    details: "Bestehen aus dringenden Appellen bei zeitkritischen, lebensbedrohlichen Angelegenheiten. Gelten für alle UN-Mitgliedstaaten und erfordern nicht die Ausschöpfung nationaler Rechtsmittel."
                },
                {
                    name: "Schutz vor Repressalien (Alle UN-Gremien)",
                    details: "Alle UN-Menschenrechtsmechanismen verfügen über Verfahren, um gegen Vergeltungsmaßnahmen gegen Personen vorzugehen, die mit ihnen zusammenarbeiten. Betroffene sollten sich umgehend an den zuständigen Mechanismus wenden."
                }
            ]
        },
        regionalMechanisms: {
            title: "Regionale Mechanismen",
            options: [
                {
                    name: "Afrikanische Kommission für Menschenrechte und Rechte der Völker",
                    details: "Prüft individuelle Mitteilungen gegen Vertragsstaaten der Afrikanischen Charta."
                },
                {
                    name: "Gerichtshof der Wirtschaftsgemeinschaft westafrikanischer Staaten (ECOWAS)",
                    details: "Zuständig für Verletzungen grundlegender Menschenrechte. Erschöpfung innerstaatlicher Rechtsmittel nicht erforderlich."
                },
                {
                    name: "Interamerikanische Menschenrechtskommission (IACHR)",
                    details: "Kann vorsorgliche Maßnahmen zum Schutz von gefährdeten Personen anordnen und prüft individuelle Petitionen gegen alle OAS-Mitgliedstaaten."
                },
                {
                    name: "Europäischer Gerichtshof für Menschenrechte (EGMR)",
                    details: "Internationales Gericht zur Wahrung der Europäischen Menschenrechtskonvention. Zuständig für alle Mitgliedstaaten des Europarates."
                },
            ]
        }
    },
    reportingGuides: {
        title: "Anleitungen zur Berichterstattung",
        description: "Ressourcen und Checklisten für die Erstellung von Berichten an UN-Gremien.",
        shadowReportSteps: {
            title: "10 Schritte zum Schreiben eines Schattenberichts",
            steps: [
                "1. Eigene Expertise identifizieren",
                "2. Verbündete identifizieren",
                "3. Relevante Rechte identifizieren",
                "4. Bisherigen Prozess überprüfen (letzte Berichte, Empfehlungen)",
                "5. Eigene Rolle klären (welche Informationen können Sie beisteuern?)",
                "6. Ziele für die Überprüfung setzen (was sollen Ausschussmitglieder fragen/empfehlen?)",
                "7. Arbeitsplan erstellen und umsetzen",
                "8. Bericht schreiben (kurz, faktenbasiert, konstruktiv)",
                "9. Bericht abschließen und fristgerecht absenden",
                "10. Nachverfolgung und Advocacy (Lobbyarbeit, Monitoring der Umsetzung)"
            ]
        },
        factFindingChecklist: {
            title: "Checkliste zur Faktenermittlung",
            sources: [
                "Traditionelle Quellen: Berichte von Außenministerien (z.B. US State Dept.), Amnesty International, Human Rights Watch.",
                "Quellen zweiter Ebene: Juristische Fachzeitschriften, glaubwürdige Nachrichtenberichte.",
                "Vor-Ort-Recherchen: Interviews, Umfragen, koordiniert mit Partnerorganisationen.",
                "Entwicklungen im nationalen Recht: Aktuelle Gesetzesentwürfe, kürzlich verabschiedete Gesetze, Gerichtsurteile.",
                "Sonstiges: Statistiken, rechtliche Fragen zur Vertragsauslegung, Verfahrensgeschichte mit UN-Gremien."
            ]
        }
    },
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
};

/**
 * @const otherResources
 * @description A structured object containing links and descriptions for external resources,
 * primarily databases from the OHCHR and other key partner organizations.
 * This data is used to provide helpful external links within the application.
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
                title: 'Jurisprudence Database',
                description: 'Zugang zur Rechtsprechung der UN-Vertragsorgane bei Individualbeschwerden.',
                url: 'http://juris.ohchr.org'
            },
            {
                title: 'Universal Human Rights Index (UHRI)',
                description: 'Länderspezifische Menschenrechtsempfehlungen aus allen UN-Mechanismen (Vertragsorgane, Sonderverfahren, UPR).',
                url: 'http://uhri.ohchr.org'
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
                title: 'ISHR: End Reprisals',
                description: 'Informationen und Kampagnen gegen Repressalien gegen Menschenrechtsverteidiger.',
                url: 'https://endreprisals.ishr.ch/'
            }
        ]
    }
};
