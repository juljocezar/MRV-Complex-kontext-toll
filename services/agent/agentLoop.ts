
import { Tool, Part, Content, GenerateContentResponse } from "@google/genai";
import { GeminiService } from "../geminiService";
import { SearchService } from "../searchService";
import { AppState, AISettings } from "../../types";
import { AGENT_TOOLS, GROUNDING_TOOL } from "./tools";
import { DocumentAnalystService } from "../documentAnalyst";

export class AgentLoopService {
    
    /**
     * Runs an agentic conversation loop.
     * 1. Calls Gemini with tools.
     * 2. If Gemini requests a function call (e.g. query DB), executes it.
     * 3. Feeds the result back to Gemini.
     * 4. Repeats until a final text response is generated or max turns reached.
     */
    static async runAgent(
        initialPrompt: string,
        appState: AppState,
        searchService: SearchService | null,
        useGrounding: boolean = false
    ): Promise<string> {
        
        const tools: Tool[] = [...AGENT_TOOLS];
        if (useGrounding) {
            tools.push(GROUNDING_TOOL);
        }

        const systemInstruction = `
            You are an advanced forensic legal agent named "Astraea Zero".
            Your goal is to assist in analyzing human rights violations.
            
            You have access to:
            1. An internal database of the case (documents, entities, timeline). Use the 'queryLocalDatabase' tool to find specific facts if you don't know them.
            2. A Long-Context Reader: Use 'analyze_documents' to read FULL document contents when you have specific Document IDs (found via search).
            ${useGrounding ? '3. Google Search (Grounding) for up-to-date external information (news, legal precedents).' : ''}
            
            Always verify facts. If you search the database, summarize what you found.
        `;

        let history: Content[] = [
            { role: 'user', parts: [{ text: initialPrompt }] }
        ];

        let finalResponseText = "";
        let turns = 0;
        const MAX_TURNS = 5; // Prevent infinite loops

        while (turns < MAX_TURNS) {
            try {
                // 1. Call AI
                const response: GenerateContentResponse = await GeminiService.callAgent(
                    history.flatMap(h => h.parts.map(p => p.text || '')), // Simplified for now, ideally pass full Content objects
                    appState.settings.ai,
                    tools,
                    systemInstruction
                );

                const modelTurn = response.candidates?.[0]?.content;
                if (!modelTurn) throw new Error("No response from agent.");

                // Add model response to history
                // Note: We need to reconstruct the parts correctly for the history
                history.push(modelTurn);

                // 2. Check for Function Calls
                const functionCalls = modelTurn.parts?.filter(part => part.functionCall);
                
                // If no function calls, we are done.
                if (!functionCalls || functionCalls.length === 0) {
                    finalResponseText = response.text || "";
                    
                    // Append grounding metadata if present
                    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
                        const sources = chunks
                            .map((c: any) => c.web ? `[${c.web.title}](${c.web.uri})` : null)
                            .filter(Boolean)
                            .join(', ');
                        if (sources) {
                            finalResponseText += `\n\n**Quellen (Google Search):** ${sources}`;
                        }
                    }
                    break; 
                }

                // 3. Execute Function Calls
                const functionResponses: Part[] = [];
                
                for (const callPart of functionCalls) {
                    const call = callPart.functionCall!;
                    console.log(`Agent calling function: ${call.name}`, call.args);

                    let resultString = "";

                    if (call.name === 'queryLocalDatabase') {
                        if (searchService) {
                            const query = call.args['query'] as string;
                            const results = await searchService.search(query);
                            // Format results for the AI
                            const topResults = results.slice(0, 5).map(r => `[${r.type}] ${r.title} (ID: ${r.id}): ${r.preview}`).join('\n');
                            resultString = topResults || "No results found in the database.";
                        } else {
                            resultString = "Error: Search service not available.";
                        }
                    } 
                    else if (call.name === 'analyze_documents') {
                        const docIds = call.args['docIds'] as string[];
                        const analysisFocus = call.args['analysisFocus'] as string;
                        
                        // Retrieve full documents from State
                        const docsToAnalyze = appState.documents.filter(d => docIds.includes(d.id));
                        
                        if (docsToAnalyze.length > 0) {
                            // Call the dedicated Long-Context Analyst
                            resultString = await DocumentAnalystService.performLongContextAnalysis(
                                docsToAnalyze,
                                analysisFocus,
                                appState.settings.ai
                            );
                        } else {
                            resultString = "Error: Documents not found with the provided IDs.";
                        }
                    }
                    else {
                        resultString = "Error: Unknown function.";
                    }

                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: resultString }
                        }
                    });
                }

                // 4. Send Function Response back to Model (Next Turn)
                history.push({ role: 'user', parts: functionResponses });
                turns++;

            } catch (error) {
                console.error("Agent Loop Error:", error);
                return "Es ist ein Fehler im Agenten-Loop aufgetreten.";
            }
        }

        return finalResponseText;
    }
}
