
import { Document, CaseEntity, TimelineEvent, KnowledgeItem, CaseContext, Risks, AppSettings, Tag } from '../types';

const API_BASE = '/api';

export class ApiService {
    
    static async checkStatus(): Promise<boolean> {
        try {
            const res = await fetch(`${API_BASE}/status`);
            return res.ok;
        } catch {
            return false;
        }
    }

    // --- DOCUMENTS ---
    static async getDocuments(): Promise<Document[]> {
        const res = await fetch(`${API_BASE}/documents`);
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    }

    static async createDocument(doc: Document): Promise<Document> {
        const res = await fetch(`${API_BASE}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc)
        });
        if (!res.ok) throw new Error('Failed to create document');
        return res.json();
    }

    static async updateDocument(doc: Document): Promise<Document> {
        const res = await fetch(`${API_BASE}/documents/${doc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc)
        });
        if (!res.ok) throw new Error('Failed to update document');
        return res.json();
    }

    // --- ENTITIES ---
    static async getEntities(): Promise<CaseEntity[]> {
        const res = await fetch(`${API_BASE}/entities`);
        if (!res.ok) throw new Error('Failed to fetch entities');
        return res.json();
    }

    static async saveAllEntities(entities: CaseEntity[]): Promise<void> {
        const res = await fetch(`${API_BASE}/entities/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entities)
        });
        if (!res.ok) throw new Error('Failed to save entities');
    }

    // --- TIMELINE ---
    static async getTimeline(): Promise<TimelineEvent[]> {
        const res = await fetch(`${API_BASE}/timeline`);
        if (!res.ok) throw new Error('Failed to fetch timeline');
        return res.json();
    }

    static async saveAllTimelineEvents(events: TimelineEvent[]): Promise<void> {
        const res = await fetch(`${API_BASE}/timeline/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(events)
        });
        if (!res.ok) throw new Error('Failed to save timeline');
    }

    // --- KNOWLEDGE ---
    static async getKnowledgeItems(): Promise<KnowledgeItem[]> {
        const res = await fetch(`${API_BASE}/knowledge`);
        if (!res.ok) throw new Error('Failed to fetch knowledge');
        return res.json();
    }

    static async saveAllKnowledgeItems(items: KnowledgeItem[]): Promise<void> {
        const res = await fetch(`${API_BASE}/knowledge/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items)
        });
        if (!res.ok) throw new Error('Failed to save knowledge items');
    }

    // --- SINGLETONS ---
    static async getContext(): Promise<CaseContext> {
        const res = await fetch(`${API_BASE}/context`);
        if (!res.ok) return { caseDescription: '' };
        return res.json();
    }

    static async saveContext(ctx: CaseContext): Promise<void> {
        await fetch(`${API_BASE}/context`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ctx)
        });
    }

    static async getRisks(): Promise<Risks | null> {
        const res = await fetch(`${API_BASE}/risks`);
        if (!res.ok) return null;
        return res.json();
    }

    static async saveRisks(risks: Risks): Promise<void> {
        await fetch(`${API_BASE}/risks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(risks)
        });
    }

    static async getSettings(): Promise<AppSettings | null> {
        const res = await fetch(`${API_BASE}/settings`);
        if (!res.ok) return null;
        return res.json();
    }

    static async saveSettings(settings: AppSettings): Promise<void> {
        await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    }

    // --- TAGS ---
    static async getTags(): Promise<Tag[]> {
        const res = await fetch(`${API_BASE}/tags`);
        if (!res.ok) return [];
        return res.json();
    }

    static async saveAllTags(tags: Tag[]): Promise<void> {
        await fetch(`${API_BASE}/tags/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tags)
        });
    }
}
