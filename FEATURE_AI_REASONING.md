# Feature: AI-Powered Threat Reasoning

**Component:** `AIExplanation.tsx`
**AI Integration:** Google Gemini AI (client-side) + Backend contextual analysis
**Trigger:** Automatic at SUSPICIOUS/CRITICAL threat levels

---

## Overview

AI Reasoning provides intelligent threat analysis using Google's Gemini AI. When the threat level reaches SUSPICIOUS or CRITICAL, the system automatically analyzes recent threats and provides contextual explanations, MITRE ATT&CK framework mappings, and recommended mitigation actions.

---

## UI Component

### Component: `AIExplanation`

**Location:** `components/AIExplanation.tsx`

**Props:**
```typescript
interface AIExplanationProps {
  reasoning: AIReasoning;
  onMitigate: () => void;
  mitigationActive: boolean;
}
```

**Display Sections:**
1. **Summary** - Brief threat analysis
2. **Explanation** - Detailed reasoning
3. **Key Factors** - Contributing factors list
4. **MITRE ATT&CK** - Attack framework classification
5. **Recommended Actions** - Mitigation steps
6. **Confidence Level** - AI confidence (Low/Medium/High)
7. **Mitigation Button** - Execute automated playbook

---

## Data Types

### Frontend Type: `AIReasoning`

**File:** `types.ts`

```typescript
export interface AIReasoning {
  explanation: string;              // Detailed analysis
  factors: string[];                // Contributing factors
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;                  // Brief overview
  mitreAttack?: string;             // MITRE ATT&CK ID
  recommendedActions: string[];     // Action items
}
```

---

## AI Analysis Trigger Logic

**File:** `App.tsx` (lines 154-169)

```typescript
useEffect(() => {
  // Only analyze when threat level is elevated
  if (threatLevel !== ThreatLevel.NORMAL &&
      (Date.now() - lastAnalysisRef.current > 15000) &&  // Rate limit: 15s
      !isAnalyzing) {

    lastAnalysisRef.current = Date.now();

    // Get top 5 critical events
    const criticalEvents = events
      .filter(e => e.severity === Severity.CRITICAL)
      .slice(0, 5);

    if (criticalEvents.length > 0) {
      setIsAnalyzing(true);

      // Call Gemini AI
      analyzeThreat(criticalEvents)
        .then((res) => {
          setAiReasoning(res);
          setIsAnalyzing(false);
        })
        .catch(() => setIsAnalyzing(false));
    }
  } else if (threatLevel === ThreatLevel.NORMAL) {
    // Reset to baseline when normal
    setAiReasoning(INITIAL_REASONING);
  }
}, [threatLevel, events]);
```

---

## Gemini AI Integration

### Service: `geminiService.ts`

**Function:** `analyzeThreat(events: SecurityEvent[]): Promise<AIReasoning>`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.GEMINI_API_KEY || '');

export async function analyzeThreat(events: SecurityEvent[]): Promise<AIReasoning> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a cybersecurity AI analyzing threats. Analyze these recent security events:

${events.map(e => `
- Type: ${e.type}
- Severity: ${e.severity}
- Source IP: ${e.sourceIp}
- Country: ${e.country}
- Description: ${e.description}
`).join('\n')}

Provide:
1. A brief summary (1-2 sentences)
2. Detailed explanation of the threat pattern
3. Key contributing factors (3-5 bullet points)
4. MITRE ATT&CK technique if applicable
5. Recommended immediate actions (3-5 items)
6. Confidence level (Low/Medium/High)

Return as JSON matching this format:
{
  "summary": "...",
  "explanation": "...",
  "factors": ["...", "..."],
  "mitreAttack": "T1110.001",
  "recommendedActions": ["...", "..."],
  "confidence": "High"
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Fallback
  return {
    summary: "Analysis unavailable",
    explanation: text,
    factors: [],
    confidence: 'Low',
    recommendedActions: []
  };
}
```

---

## Backend Contextual Analysis

### Backend Threat Model

Each threat from the backend includes contextual analysis:

```json
{
  "id": "THR-8B00500B",
  "contextual_analysis": "Multiple failed authentication attempts detected from hostile zone. Pattern consistent with credential stuffing attack. Source IP has history of malicious activity.",
  "mitre_attack_id": "T1110.004",
  "mitre_attack_name": "Brute Force: Credential Stuffing",
  "recommended_actions": [
    "Block source IP immediately",
    "Review account access logs",
    "Enable MFA for affected accounts",
    "Check for compromised credentials"
  ]
}
```

The frontend can use this backend analysis as a fallback if Gemini API is unavailable.

---

## Required Configuration

### Environment Variables

**File:** `.env.local`

```bash
# Optional: Gemini API Key for client-side AI
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note:** The Gemini API key is optional. If not provided, the frontend will display the backend's contextual analysis instead.

---

## UI Behavior

### Analysis States

1. **Idle** (Normal threat level)
   - Shows baseline message
   - No mitigation needed

2. **Analyzing** (Loading)
   - Spinning loader overlay
   - "Deep Neural Processing..." message

3. **Analysis Complete**
   - Display AI reasoning
   - Show mitigation button (if applicable)

### Mitigation Execution

When user clicks "EXECUTE MITIGATION":

```typescript
const handleExecuteMitigation = async () => {
  setMitigationActive(true);

  const steps = [
    "ISOLATING_TARGET_SEGMENTS",
    "ENACTING_ACL_OVERRIDE",
    "RESETTING_SESSION_HANDSHAKES",
    "DEPLOYING_IP_QUARANTINE"
  ];

  for (const step of steps) {
    setPlaybookStep(step);
    await new Promise(r => setTimeout(r, 1200));  // 1.2s per step
  }

  setPlaybookStep("PROTECTION_VERIFIED");
  setTimeout(() => setPlaybookStep(null), 3000);
};
```

This is a **UI simulation**. For real mitigation, this should call:
- `POST /api/playbooks/execute` (see [FEATURE_PLAYBOOKS.md](./FEATURE_PLAYBOOKS.md))

---

## Fallback Behavior

### When Gemini API Unavailable

If Gemini API fails or API key is missing, use backend analysis:

```typescript
const reasoning: AIReasoning = {
  summary: threat.description,
  explanation: threat.contextual_analysis,
  factors: threat.contributing_signals,
  mitreAttack: threat.mitre_attack_id,
  recommendedActions: threat.recommended_actions,
  confidence: threat.confidence > 0.7 ? 'High' : 'Medium'
};
```

---

## Rate Limiting

### Frontend Rate Limiting

- **Minimum interval:** 15 seconds between analyses
- **Trigger:** Only when threat level changes or new critical events arrive
- **Prevents:** API quota exhaustion

### Gemini API Quotas

- **Free tier:** 15 requests per minute
- **Paid tier:** 1000+ requests per minute
- **Implementation:** Client-side rate limiting sufficient

---

## Backend Requirements

### Optional (Recommended)

1. **Contextual Analysis Field:** All threats should include `contextual_analysis`
2. **MITRE Mapping:** Populate `mitre_attack_id` and `mitre_attack_name`
3. **Recommended Actions:** Provide actionable mitigation steps
4. **Confidence Score:** Include threat confidence (0-1)

### Backend AI Engine

The backend can implement its own AI analysis using:
- **Google Gemini API** (server-side)
- **OpenAI GPT-4**
- **Claude AI**
- **Custom ML models**

---

## Testing

### With Gemini API

1. Set `GEMINI_API_KEY` in `.env.local`
2. Trigger CRITICAL threat
3. Wait for analysis (3-5 seconds)
4. Verify AI reasoning displays

### Without Gemini API

1. Remove `GEMINI_API_KEY`
2. Trigger CRITICAL threat
3. Verify backend analysis displays

---

## Related Features

- [FEATURE_PLAYBOOKS.md](./FEATURE_PLAYBOOKS.md) - Automated mitigation
- [FEATURE_RISK_ANALYSIS.md](./FEATURE_RISK_ANALYSIS.md) - Risk scoring that triggers AI
- [FEATURE_THREAT_STREAM.md](./FEATURE_THREAT_STREAM.md) - Event source for analysis

---

**Last Updated:** December 27, 2025
