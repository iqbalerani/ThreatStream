import { SecurityEvent, AIReasoning, ForensicReport } from "./types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeThreat = async (events: SecurityEvent[], retryCount = 0): Promise<AIReasoning> => {
  try {
    // Call backend AI analysis endpoint
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threats: events.map(e => ({
          id: e.id,
          timestamp: e.timestamp.toISOString(),
          type: e.type,
          sourceIp: e.sourceIp,
          userId: e.userId,
          status: e.status,
          severity: e.severity,
          description: e.description,
          country: e.country,
          mitre: e.mitre
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const analysis = await response.json();

    // Check for error in response
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    return {
      explanation: analysis.explanation,
      factors: analysis.factors,
      confidence: analysis.confidence,
      summary: analysis.summary,
      mitreAttack: analysis.mitreAttack,
      recommendedActions: analysis.recommendedActions
    } as AIReasoning;

  } catch (error: any) {
    console.error('AI analysis error:', error);

    if (retryCount < 2) {
      await delay(Math.pow(2, retryCount) * 1000);
      return analyzeThreat(events, retryCount + 1);
    }

    return {
      explanation: "AI analysis engine temporarily unavailable. System operating in fallback mode with heuristic detection.",
      factors: ["Backend service unavailable", "Network connectivity issue"],
      confidence: 'Low',
      summary: "AI Analysis Unavailable - Manual Review Recommended",
      mitreAttack: "N/A - Service Unavailable",
      recommendedActions: ["Check backend connectivity", "Review events manually", "Verify API endpoint health"]
    };
  }
};

export const generateForensicReport = async (event: SecurityEvent): Promise<ForensicReport> => {
  try {
    // Call backend for forensic analysis (using same AI analysis endpoint)
    const response = await fetch(`${BACKEND_URL}/api/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threats: [event]
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const analysis = await response.json();

    // Convert to forensic report format
    return {
      summary: analysis.summary || "Security incident detected",
      technicalDetails: analysis.explanation || "Analysis unavailable",
      timeline: [
        `${event.timestamp.toISOString()}: Event detected from ${event.sourceIp}`,
        `Type: ${event.type}`,
        `Severity: ${event.severity}`
      ],
      riskAssessment: `Confidence: ${analysis.confidence}. ${analysis.explanation}`,
      remediationSteps: analysis.recommendedActions || ["Review manually"]
    };
  } catch (error) {
    console.error("Forensic generation failed", error);
    throw error;
  }
};
