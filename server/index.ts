
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Fixed: Cast middleware to any to resolve overload mismatch in TypeScript
app.use(express.json({ limit: '50mb' }) as any);

// Helper to safe parsing JSON
const safeParse = (str: string | null, fallback: any) => {
    if (!str) return fallback;
    try { return JSON.parse(str); } catch { return fallback; }
};

app.get('/api/status', (req, res) => {
  res.json({ status: 'online', database: 'connected' });
});

// --- DOCUMENTS ---
app.get('/api/documents', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(docs.map(d => ({
        ...d,
        tags: safeParse(d.tags, []),
        embedding: safeParse(d.embedding, undefined)
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { tags, embedding, ...rest } = req.body;
    const doc = await prisma.document.create({
      data: {
        ...rest,
        tags: JSON.stringify(tags || []),
        embedding: embedding ? JSON.stringify(embedding) : null,
        createdAt: new Date(rest.createdAt)
      }
    });
    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Create failed' });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, embedding, ...rest } = req.body;
    const data: any = { ...rest };
    
    if (tags) data.tags = JSON.stringify(tags);
    if (embedding) data.embedding = JSON.stringify(embedding);

    const doc = await prisma.document.update({ where: { id }, data });
    res.json(doc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Update failed' });
  }
});

// --- ENTITIES ---
app.get('/api/entities', async (req, res) => {
  try {
    const entities = await prisma.caseEntity.findMany();
    res.json(entities.map(e => ({
        ...e,
        roles: safeParse(e.roles, []),
        relationships: safeParse(e.relationships, []),
        embedding: safeParse(e.embedding, undefined)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.post('/api/entities/batch', async (req, res) => {
    try {
        const entities = req.body;
        for (const e of entities) {
            await prisma.caseEntity.upsert({
                where: { id: e.id },
                update: {
                    name: e.name, type: e.type, description: e.description,
                    roles: JSON.stringify(e.roles || []),
                    relationships: JSON.stringify(e.relationships || []),
                    embedding: e.embedding ? JSON.stringify(e.embedding) : null
                },
                create: {
                    id: e.id, name: e.name, type: e.type, description: e.description,
                    roles: JSON.stringify(e.roles || []),
                    relationships: JSON.stringify(e.relationships || []),
                    embedding: e.embedding ? JSON.stringify(e.embedding) : null
                }
            });
        }
        res.json({ success: true });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Batch save failed' });
    }
});

// --- TIMELINE ---
app.get('/api/timeline', async (req, res) => {
    try {
        const events = await prisma.timelineEvent.findMany({ orderBy: { date: 'desc' } });
        res.json(events.map(e => ({
            ...e,
            documentIds: safeParse(e.documentIds, [])
        })));
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.post('/api/timeline/batch', async (req, res) => {
    try {
        const events = req.body;
        await prisma.timelineEvent.deleteMany({}); 
        for (const e of events) {
            await prisma.timelineEvent.create({
                data: {
                    id: e.id, date: e.date, title: e.title, description: e.description,
                    documentIds: JSON.stringify(e.documentIds || [])
                }
            });
        }
        res.json({ success: true });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Batch save failed' });
    }
});

// --- KNOWLEDGE ---
app.get('/api/knowledge', async (req, res) => {
    try {
        const items = await prisma.knowledgeItem.findMany();
        res.json(items.map(i => ({
            ...i,
            tags: safeParse(i.tags, []),
            embedding: safeParse(i.embedding, undefined)
        })));
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed' });
    }
});

app.post('/api/knowledge/batch', async (req, res) => {
    try {
        const items = req.body;
        for (const i of items) {
            await prisma.knowledgeItem.upsert({
                where: { id: i.id },
                update: {
                    title: i.title, summary: i.summary, sourceDocId: i.sourceDocId,
                    tags: JSON.stringify(i.tags || []),
                    embedding: i.embedding ? JSON.stringify(i.embedding) : null
                },
                create: {
                    id: i.id, title: i.title, summary: i.summary, sourceDocId: i.sourceDocId,
                    tags: JSON.stringify(i.tags || []),
                    embedding: i.embedding ? JSON.stringify(i.embedding) : null,
                    createdAt: new Date(i.createdAt || Date.now())
                }
            });
        }
        res.json({ success: true });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Batch save failed' });
    }
});

// --- SINGLETONS: CONTEXT, RISKS, SETTINGS ---

app.get('/api/context', async (req, res) => {
    try {
        const ctx = await prisma.caseContext.findUnique({ where: { id: 1 } });
        res.json(ctx || { caseDescription: '' });
    } catch { res.status(500).send(); }
});

app.post('/api/context', async (req, res) => {
    try {
        const ctx = await prisma.caseContext.upsert({
            where: { id: 1 },
            update: { caseDescription: req.body.caseDescription },
            create: { id: 1, caseDescription: req.body.caseDescription }
        });
        res.json(ctx);
    } catch { res.status(500).send(); }
});

app.get('/api/risks', async (req, res) => {
    try {
        const risks = await prisma.risks.findUnique({ where: { id: 1 } });
        if (!risks) return res.json(null);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = risks;
        res.json(rest);
    } catch { res.status(500).send(); }
});

app.post('/api/risks', async (req, res) => {
    try {
        const risks = await prisma.risks.upsert({
            where: { id: 1 },
            update: req.body,
            create: { id: 1, ...req.body }
        });
        res.json(risks);
    } catch { res.status(500).send(); }
});

app.get('/api/settings', async (req, res) => {
    try {
        const set = await prisma.appSettings.findUnique({ where: { id: 1 } });
        if (!set) return res.json(null);
        // Map DB flat structure to Nested Object structure used in App
        res.json({
            ai: { temperature: set.aiTemperature, topP: set.aiTopP },
            complexity: { low: set.complexityLow, medium: set.complexityMedium }
        });
    } catch { res.status(500).send(); }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { ai, complexity } = req.body;
        const set = await prisma.appSettings.upsert({
            where: { id: 1 },
            update: {
                aiTemperature: ai.temperature, aiTopP: ai.topP,
                complexityLow: complexity.low, complexityMedium: complexity.medium
            },
            create: {
                id: 1, aiTemperature: ai.temperature, aiTopP: ai.topP,
                complexityLow: complexity.low, complexityMedium: complexity.medium
            }
        });
        res.json(set);
    } catch { res.status(500).send(); }
});

// --- TAGS ---
app.get('/api/tags', async (req, res) => {
    const tags = await prisma.tag.findMany();
    res.json(tags);
});

app.post('/api/tags/batch', async (req, res) => {
    try {
        const tags = req.body; // Expect array of {id, name}
        for (const t of tags) {
            await prisma.tag.upsert({
                where: { name: t.name },
                update: {},
                create: { id: t.id, name: t.name }
            });
        }
        res.json({success: true});
    } catch { res.status(500).send(); }
});

app.listen(PORT, () => {
  console.log(`🚀 MRV API Server running on port ${PORT}`);
});
