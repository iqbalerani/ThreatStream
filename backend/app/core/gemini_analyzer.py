"""
Google Gemini AI Threat Analyzer
"""
import json
import asyncio
from typing import Dict, Any
from google import generativeai as genai
from app.config import settings
from app.models.threat import GeminiAnalysis, SeverityLevel, ThreatType
from app.utils.logger import get_logger
from app.utils.mitre_mapping import get_mitre_info

logger = get_logger(__name__)


class GeminiThreatAnalyzer:
    """
    AI-powered threat analyzer using Google Gemini.

    Provides:
    - Threat severity classification
    - MITRE ATT&CK mapping
    - Contextual analysis for SOC analysts
    - Recommended response actions
    """

    def __init__(self):
        # Configure Gemini
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)

            self.model = genai.GenerativeModel(
                model_name=settings.gemini_model,
                generation_config={
                    "temperature": settings.gemini_temperature,
                    "max_output_tokens": settings.gemini_max_tokens,
                }
            )

            # Rate limiting
            self._semaphore = asyncio.Semaphore(settings.gemini_rate_limit)
            self._request_count = 0

            logger.info(f"Gemini Analyzer initialized: {settings.gemini_model}")
        else:
            self.model = None
            logger.warning("Gemini API key not configured - using fallback analysis")

    def _build_analysis_prompt(self, event: Dict[str, Any]) -> str:
        """Build the analysis prompt for Gemini."""
        return f"""You are an expert cybersecurity threat analyst for a Security Operations Center (SOC).
Analyze the following security event and provide a detailed threat assessment.

SECURITY EVENT:
```json
{json.dumps(event, indent=2, default=str)}
```

Provide your analysis in the following JSON format:
{{
    "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
    "threat_type": "BRUTE_FORCE|SQL_INJECTION|DDOS_ATTACK|RANSOMWARE|PORT_SCAN|MALWARE|DATA_EXFILTRATION|AUTHENTICATION|FIREWALL_EVENT|API_REQUEST|LOGIN_ATTEMPT|NORMAL_TRAFFIC",
    "confidence": 0.0-1.0,
    "description": "Brief one-line description of the threat",
    "contextual_analysis": "Detailed analysis explaining the threat context, attack patterns, and potential impact",
    "contributing_signals": ["Signal 1", "Signal 2", "Signal 3"],
    "recommended_actions": ["Action 1", "Action 2", "Action 3"],
    "mitre_attack_id": "T1110|T1190|T1498|T1486|etc or null if not applicable"
}}

SEVERITY GUIDELINES:
- CRITICAL: Active breach, data exfiltration, ransomware execution, successful exploitation
- HIGH: Active attacks (brute force, SQL injection), port scans from known bad actors, malware detected
- MEDIUM: Suspicious activity, multiple failed authentication, unusual traffic patterns
- LOW: Minor anomalies, single failed auth, informational events
- INFO: Normal traffic, routine operations, baseline activity

IMPORTANT:
- Be precise with severity - don't over-classify
- Include specific IOCs in contributing_signals
- Provide actionable recommendations
- Map to MITRE ATT&CK when applicable
"""

    async def analyze(self, event: Dict[str, Any]) -> GeminiAnalysis:
        """
        Analyze a security event using Gemini AI.

        Args:
            event: Raw security event data

        Returns:
            GeminiAnalysis with complete threat intelligence
        """
        if not self.model:
            return self._fallback_analysis(event)

        async with self._semaphore:
            try:
                self._request_count += 1

                prompt = self._build_analysis_prompt(event)

                # Generate analysis
                response = await asyncio.to_thread(
                    self.model.generate_content,
                    prompt
                )

                # Parse JSON response
                response_text = response.text

                # Handle markdown code blocks
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]

                analysis_dict = json.loads(response_text.strip())

                # Enrich with MITRE info
                mitre_id = analysis_dict.get("mitre_attack_id")
                mitre_name = None
                if mitre_id:
                    mitre_info = get_mitre_info(mitre_id)
                    mitre_name = mitre_info.get("technique_name") if mitre_info else None

                return GeminiAnalysis(
                    severity=SeverityLevel(analysis_dict["severity"]),
                    threat_type=ThreatType(analysis_dict["threat_type"]),
                    confidence=float(analysis_dict["confidence"]),
                    description=analysis_dict["description"],
                    contextual_analysis=analysis_dict["contextual_analysis"],
                    contributing_signals=analysis_dict["contributing_signals"],
                    recommended_actions=analysis_dict["recommended_actions"],
                    mitre_attack_id=mitre_id,
                    mitre_attack_name=mitre_name,
                    audit_ref="GEMINI-PRO-ENGINE"
                )

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response: {e}")
                return self._fallback_analysis(event)

            except Exception as e:
                logger.error(f"Gemini analysis error: {e}")
                return self._fallback_analysis(event)

    def _fallback_analysis(self, event: Dict[str, Any]) -> GeminiAnalysis:
        """Provide rule-based fallback analysis when AI is unavailable."""
        event_type = event.get("event_type", "unknown").lower()

        # Simple rule-based severity mapping
        severity_map = {
            "brute_force": SeverityLevel.CRITICAL,
            "sql_injection": SeverityLevel.CRITICAL,
            "ddos": SeverityLevel.CRITICAL,
            "ransomware": SeverityLevel.CRITICAL,
            "malware": SeverityLevel.CRITICAL,
            "port_scan": SeverityLevel.HIGH,
            "authentication": SeverityLevel.MEDIUM,
            "login_attempt": SeverityLevel.INFO,
            "api_request": SeverityLevel.INFO,
            "firewall_event": SeverityLevel.INFO,
        }

        severity = severity_map.get(event_type, SeverityLevel.MEDIUM)

        return GeminiAnalysis(
            severity=severity,
            threat_type=ThreatType.AUTHENTICATION,
            confidence=0.5,
            description=f"Event detected: {event_type}",
            contextual_analysis="Fallback analysis - AI engine temporarily unavailable",
            contributing_signals=[event.get("source_ip", "unknown")],
            recommended_actions=["Review event manually", "Check related events"],
            mitre_attack_id=None,
            mitre_attack_name=None,
            audit_ref="FALLBACK-ENGINE"
        )

    def get_metrics(self) -> Dict:
        """Get analyzer metrics for monitoring."""
        return {
            "model": settings.gemini_model,
            "requests_processed": self._request_count,
            "rate_limit": settings.gemini_rate_limit
        }
