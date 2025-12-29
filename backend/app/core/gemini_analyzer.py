"""
AI Threat Analyzer using Google Vertex AI (Gemini)
"""
import json
import asyncio
from typing import Dict, Any
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from app.config import settings
from app.models.threat import GeminiAnalysis, SeverityLevel, ThreatType
from app.utils.logger import get_logger
from app.utils.mitre_mapping import get_mitre_info

logger = get_logger(__name__)


class GeminiThreatAnalyzer:
    """
    AI-powered threat analyzer using Google Vertex AI (Gemini).

    Provides:
    - Threat severity classification
    - MITRE ATT&CK mapping
    - Contextual analysis for SOC analysts
    - Recommended response actions
    """

    def __init__(self):
        self.project_id = settings.google_cloud_project
        self.location = settings.gcp_region
        self.model_name = settings.gemini_model

        # Rate limiting
        self._semaphore = asyncio.Semaphore(settings.gemini_rate_limit)
        self._request_count = 0

        # Initialize Vertex AI
        try:
            if self.project_id and self.project_id != "your-project-id":
                vertexai.init(project=self.project_id, location=self.location)
                self.model = GenerativeModel(self.model_name)
                logger.info(f"Vertex AI initialized: {self.model_name} in {self.location}")
            else:
                self.model = None
                logger.warning("Google Cloud project not configured - using fallback analysis")
        except Exception as e:
            self.model = None
            logger.error(f"Failed to initialize Vertex AI: {e}")
            logger.warning("Falling back to rule-based analysis")

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

Respond ONLY with the JSON, no markdown formatting."""

    async def analyze(self, event: Dict[str, Any]) -> GeminiAnalysis:
        """
        Analyze a security event using Vertex AI Gemini.

        Args:
            event: Raw security event data

        Returns:
            GeminiAnalysis with complete threat intelligence
        """
        # Check if this is a normal/healthy flow simulation - skip AI analysis
        metadata = event.get("metadata", {})
        if metadata.get("scenario") == "normal":
            return self._fallback_analysis(event, force_normal=True)

        if not self.model:
            return self._fallback_analysis(event)

        async with self._semaphore:
            try:
                self._request_count += 1

                prompt = self._build_analysis_prompt(event)

                # Configure generation parameters
                generation_config = GenerationConfig(
                    temperature=settings.gemini_temperature,
                    max_output_tokens=settings.gemini_max_tokens,
                )

                # Generate content using Vertex AI
                # Note: Vertex AI's generate_content is not async, so we run it in executor
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.model.generate_content(
                        prompt,
                        generation_config=generation_config
                    )
                )

                # Extract the response text
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
                    audit_ref="VERTEX-AI-GEMINI"
                )

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response: {e}")
                logger.error(f"Response text: {response_text if 'response_text' in locals() else 'N/A'}")
                return self._fallback_analysis(event)

            except Exception as e:
                logger.error(f"Vertex AI analysis error: {e}")
                return self._fallback_analysis(event)

    def _fallback_analysis(self, event: Dict[str, Any], force_normal: bool = False) -> GeminiAnalysis:
        """Provide rule-based fallback analysis when AI is unavailable."""
        event_type = event.get("event_type", "unknown").lower()

        # Force normal traffic classification for healthy flow scenarios
        if force_normal:
            return GeminiAnalysis(
                severity=SeverityLevel.INFO,
                threat_type=ThreatType.NORMAL_TRAFFIC,
                confidence=0.95,
                description=f"Normal {event_type.replace('_', ' ')} activity",
                contextual_analysis="Routine operation - baseline network activity within normal parameters",
                contributing_signals=["Standard traffic pattern", "Known source", "Expected behavior"],
                recommended_actions=["Continue monitoring", "No action required"],
                mitre_attack_id=None,
                mitre_attack_name=None,
                audit_ref="HEALTHY-FLOW"
            )

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
            "normal_traffic": SeverityLevel.INFO,
            "data_access": SeverityLevel.INFO,
            "network_traffic": SeverityLevel.INFO,
        }

        # Map event types to threat types
        threat_type_map = {
            "brute_force": ThreatType.BRUTE_FORCE,
            "sql_injection": ThreatType.SQL_INJECTION,
            "ddos": ThreatType.DDOS_ATTACK,
            "ransomware": ThreatType.RANSOMWARE,
            "malware": ThreatType.MALWARE,
            "port_scan": ThreatType.PORT_SCAN,
            "authentication": ThreatType.AUTHENTICATION,
            "login_attempt": ThreatType.AUTHENTICATION,
            "api_request": ThreatType.API_REQUEST,
            "firewall_event": ThreatType.FIREWALL_EVENT,
            "normal_traffic": ThreatType.NORMAL_TRAFFIC,
            "data_access": ThreatType.API_REQUEST,
            "network_traffic": ThreatType.NETWORK_ANOMALY,
        }

        severity = severity_map.get(event_type, SeverityLevel.MEDIUM)
        threat_type = threat_type_map.get(event_type, ThreatType.AUTHENTICATION)

        return GeminiAnalysis(
            severity=severity,
            threat_type=threat_type,
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
            "model": self.model_name,
            "requests_processed": self._request_count,
            "rate_limit": settings.gemini_rate_limit,
            "provider": "Vertex AI",
            "project_id": self.project_id,
            "location": self.location
        }
