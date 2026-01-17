
import { CausalNode, CausalEdge, CausalityMap } from '../types';

/**
 * Builds a CausalityMap from raw nodes and edges.
 * Performs forensic analysis to detect "Zersetzung" (Destruction of Autonomy).
 * 
 * @param nodes List of causal nodes (Events, States, etc.)
 * @param edges List of causal edges (Relationships)
 * @returns A structured CausalityMap with analysis results.
 */
export function buildCausalityMap(nodes: CausalNode[], edges: CausalEdge[]): CausalityMap {
    let zersetzungDetected = false;
    const criticalChains: string[][] = [];
    
    // 1. Build Adjacency List and Reverse Adjacency List for traversal
    const adjacency: Record<string, string[]> = {};
    const reverseAdjacency: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    nodes.forEach(n => {
        adjacency[n.id] = [];
        reverseAdjacency[n.id] = [];
        inDegree[n.id] = 0;
    });

    edges.forEach(edge => {
        if (adjacency[edge.source]) adjacency[edge.source].push(edge.target);
        if (reverseAdjacency[edge.target]) reverseAdjacency[edge.target].push(edge.source);
        if (inDegree[edge.target] !== undefined) inDegree[edge.target]++;

        // 2. Detect Zersetzung (Violation of Object Formula)
        if (edge.relationType === 'destroys_autonomy') {
            zersetzungDetected = true;
            // Trace the chain that led to this specific destruction
            const chain = traceChainBackwards(edge.target, reverseAdjacency);
            criticalChains.push(chain);
        }
    });

    // 3. Identify Root Causes (Nodes with in-degree 0)
    const rootCauses = nodes
        .filter(n => inDegree[n.id] === 0)
        .map(n => n.id);

    return {
        nodes,
        edges,
        zersetzungDetected,
        rootCauses,
        criticalChains,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Helper to trace a path backwards from a node to a root.
 * Used to identify the causal chain leading to a critical event.
 */
function traceChainBackwards(startNodeId: string, reverseAdj: Record<string, string[]>): string[] {
    const chain: string[] = [startNodeId];
    let currentId = startNodeId;
    const visited = new Set<string>([startNodeId]);

    // Simple heuristic: Take the first parent found to trace one possible causal line.
    // In a complex graph, BFS/DFS would be needed for all paths, but for forensic
    // linear reconstruction, tracing one strong causal line is often sufficient.
    while (reverseAdj[currentId] && reverseAdj[currentId].length > 0) {
        const parentId = reverseAdj[currentId][0]; // Take first parent
        
        if (visited.has(parentId)) break; // Cycle detection
        
        chain.unshift(parentId); // Add to beginning of chain
        visited.add(parentId);
        currentId = parentId;
    }

    return chain;
}
