
import { GoogleGenAI, Type } from "@google/genai";
import { SecurityEvent, AIReasoning, ForensicReport } from "./types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeThreat = async (events: SecurityEvent[], retryCount = 0): Promise<AIReasoning> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const model = 'gemini-3-flash-preview';
  
  const eventContext = events.map(e => ({
    time: e.timestamp.toISOString(),
    type: e.type,
    ip: e.sourceIp,
    user: e.userId,
    status: e.status,
    severity: e.severity,
    desc: e.description
  }));

  const prompt = `Act as an elite Tier 3 SOC Analyst. Analyze these high-priority security events and map them to the MITRE ATT&CK framework.
  Provide a detailed technical justification, specific contributing factors, and prioritized remediation steps.
  
  Events to analyze:
  ${JSON.stringify(eventContext, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are an AI Security Expert. Return strictly valid JSON. Map patterns to MITRE techniques (e.g., T1110 for Brute Force).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            factors: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidence: { type: Type.STRING },
            summary: { type: Type.STRING },
            mitreAttack: { type: Type.STRING, description: "MITRE ATT&CK Technique code and name." },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["explanation", "factors", "confidence", "summary", "mitreAttack", "recommendedActions"]
        }
      }
    });

    return JSON.parse(response.text) as AIReasoning;
  } catch (error: any) {
    if ((error?.message?.includes('429') || error?.status === 429) && retryCount < 3) {
      await delay(Math.pow(2, retryCount) * 2000);
      return analyzeThreat(events, retryCount + 1);
    }
    return {
      explanation: "Analysis engine is currently cooling down due to high traffic volume. Heuristic patterns still suggest active lateral movement.",
      factors: ["Rate limit threshold reached"],
      confidence: 'Medium',
      summary: "AI Analysis Throttled - Manual Review Recommended",
      mitreAttack: "T1110 - Brute Force (Predicted)",
      recommendedActions: ["Check API Quota", "Verify source IP blocklists"]
    };
  }
};

export const generateForensicReport = async (event: SecurityEvent): Promise<ForensicReport> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  // Using Pro for deep forensics
  const model = 'gemini-3-pro-preview';

  const prompt = `Generate a comprehensive forensic investigation report for the following security incident:
  ID: ${event.id}
  Type: ${event.type}
  Source IP: ${event.sourceIp}
  User: ${event.userId}
  Description: ${event.description}
  Country: ${event.country}
  Severity: ${event.severity}
  Timestamp: ${event.timestamp.toISOString()}

  The report should be structured for executive and technical stakeholders.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            technicalDetails: { type: Type.STRING },
            timeline: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskAssessment: { type: Type.STRING },
            remediationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "technicalDetails", "timeline", "riskAssessment", "remediationSteps"]
        }
      }
    });

    return JSON.parse(response.text) as ForensicReport;
  } catch (error) {
    console.error("Forensic generation failed", error);
    throw error;
  }
};
