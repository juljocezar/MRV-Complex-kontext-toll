import { CaseEntity, TimelineEvent, Document, DocumentAnalysisResults } from '../types';

function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function escapeCsvCell(cell: any): string {
    if (cell == null) { // null or undefined
        return '';
    }
    const str = String(cell);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export class ExportService {
    static exportEntitiesToCSV(entities: CaseEntity[]): void {
        const headers = ['id', 'name', 'type', 'description', 'roles'];
        const rows = entities.map(e => [
            e.id,
            e.name,
            e.type,
            e.description,
            (e.roles || []).join('; ')
        ]);

        let csvContent = headers.map(escapeCsvCell).join(',') + '\r\n';
        rows.forEach(row => {
            csvContent += row.map(escapeCsvCell).join(',') + '\r\n';
        });

        downloadCSV(csvContent, 'entities-export.csv');
    }
    
    static exportTimelineToCSV(events: TimelineEvent[], documents: Document[]): void {
        const headers = ['id', 'date', 'title', 'description', 'source_document_names'];
        const docMap = new Map(documents.map(d => [d.id, d.name]));
        
        const rows = events.map(e => [
            e.id,
            e.date,
            e.title,
            e.description,
            e.documentIds.map(id => docMap.get(id) || id).join('; ')
        ]);

        let csvContent = headers.map(escapeCsvCell).join(',') + '\r\n';
        rows.forEach(row => {
            csvContent += row.map(escapeCsvCell).join(',') + '\r\n';
        });

        downloadCSV(csvContent, 'timeline-export.csv');
    }
    
    static exportStructuredDataToCSV(documents: Document[], analysisResults: DocumentAnalysisResults): void {
        const headers = ['document_id', 'document_name', 'event_title', 'event_start_date', 'event_location', 'act_type', 'victim_name', 'participant_name', 'participant_role'];
        const rows: (string | undefined)[][] = [];

        documents.forEach(doc => {
            const result = analysisResults[doc.id];
            if (!result) return;
            
            const events = result.structuredEvents || [];
            const acts = result.structuredActs || [];
            const participants = result.structuredParticipants || [];
            
            if (events.length === 0 && acts.length === 0 && participants.length === 0) return;

            // This is a simplified representation. A real export might need multiple files for normalization.
            // For a single flat file, we can create rows for each piece of data.
            events.forEach(event => {
                rows.push([doc.id, doc.name, event.title, event.startDate, event.location, '', '', '', '']);
            });
            acts.forEach(act => {
                rows.push([doc.id, doc.name, '', '', '', act.actType, act.victimName, '', '']);
            });
            participants.forEach(p => {
                rows.push([doc.id, doc.name, '', '', '', '', '', p.name, p.role]);
            });
        });
        
        let csvContent = headers.map(escapeCsvCell).join(',') + '\r\n';
        rows.forEach(row => {
            csvContent += row.map(escapeCsvCell).join(',') + '\r\n';
        });

        downloadCSV(csvContent, 'structured-data-export.csv');
    }
}
