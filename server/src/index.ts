import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Document } from './types';

const app = express();
const port = 3001; // Using a different port than the frontend

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use a unique filename to avoid overwriting
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

import { getDb } from './db.js';

// GET endpoint for tags
app.get('/api/tags', async (req, res) => {
  const db = await getDb();
  res.json(db.data.tags);
});

// POST endpoint for tags
app.post('/api/tags', async (req, res) => {
  const db = await getDb();
  const newTag = {
    id: crypto.randomUUID(),
    name: req.body.name,
  };
  db.data.tags.push(newTag);
  await db.write();
  res.status(201).json(newTag);
});

// DELETE endpoint for tags
app.delete('/api/tags/:id', async (req, res) => {
    const db = await getDb();
    const tagId = req.params.id;

    const tagIndex = db.data.tags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
        return res.status(404).json({ message: "Tag not found" });
    }

    db.data.tags.splice(tagIndex, 1);
    await db.write();

    res.status(204).send();
});

// --- Document Endpoints ---

// GET all documents
app.get('/api/documents', async (req, res) => {
    const db = await getDb();
    res.json(db.data.documents);
});

// POST a new document
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const db = await getDb();
    const newDocument: Document = {
        id: crypto.randomUUID(),
        name: req.file.originalname,
        path: req.file.path, // Store the path to the file
        createdAt: new Date().toISOString(),
        mimeType: req.file.mimetype,
        // Set default values for other required fields
        content: '',
        textContent: null,
        base64Content: null,
        classificationStatus: 'unclassified',
        tags: [],
    };

    db.data.documents.push(newDocument);
    await db.write();

    res.status(201).json(newDocument);
});

// DELETE a document
app.delete('/api/documents/:id', async (req, res) => {
    const db = await getDb();
    const docId = req.params.id;

    const docToDelete = db.data.documents.find(d => d.id === docId);

    if (!docToDelete) {
        return res.status(404).json({ message: "Document not found" });
    }

    // Delete the file from the filesystem if path exists
    if (docToDelete.path) {
        fs.unlink(docToDelete.path, (err) => {
            if (err) {
                // This is not a critical error for the client, so we just log it.
                console.error(`Failed to delete file: ${docToDelete.path}`, err);
            }
        });
    }

    // Remove the document from the database
    db.data.documents = db.data.documents.filter(d => d.id !== docId);
    await db.write();

    res.status(204).send();
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
