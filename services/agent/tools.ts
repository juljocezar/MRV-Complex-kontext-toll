
import { FunctionDeclaration, Schema, Type, Tool } from "@google/genai";

/**
 * Definition of the HURIDOCS Database Query Tool.
 * Allows the AI to search the local IndexedDB for specific entities or documents.
 */
const queryLocalDatabaseDeclaration: FunctionDeclaration = {
    name: 'queryLocalDatabase',
    description: 'Searches the internal legal case database (HURIDOCS standard) for information about people, events, locations, or specific documents. Use this when you need to find facts that are not in your immediate context.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: 'The search term or question to query the database with (e.g., "Verhaftung von Müller", "Vorfall am 12.05.").'
            },
            filterType: {
                type: Type.STRING,
                enum: ['Document', 'Entity', 'Knowledge', 'All'],
                description: 'Optional filter to narrow down the search to specific data types.'
            }
        },
        required: ['query']
    }
};

/**
 * Definition of the Long-Context Document Analysis Tool.
 * Allows the AI to read the FULL content of multiple documents simultaneously.
 */
const analyzeDocumentsDeclaration: FunctionDeclaration = {
    name: 'analyze_documents',
    description: 'Reads and analyzes the FULL text content of specific documents. Use this when you need to answer complex questions, find cross-references, or extract HURIDOCS events from specific files found via search.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            docIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of Document IDs to analyze in depth.'
            },
            analysisFocus: {
                type: Type.STRING,
                description: 'The specific question or analysis instruction (e.g., "Find all contradictions regarding the date", "Map all torture events to HURIDOCS format").'
            }
        },
        required: ['docIds', 'analysisFocus']
    }
};

export const AGENT_TOOLS: Tool[] = [
    { functionDeclarations: [queryLocalDatabaseDeclaration, analyzeDocumentsDeclaration] }
];

// Definition for Google Search Grounding (separated as it's a different tool object structure)
export const GROUNDING_TOOL: Tool = {
    googleSearch: {}
};
