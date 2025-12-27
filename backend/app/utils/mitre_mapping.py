"""
MITRE ATT&CK Framework Mapping
"""
from typing import Dict, Optional


# MITRE ATT&CK Technique Mapping
MITRE_ATTACK_MAPPING = {
    # Credential Access
    "T1110": {
        "technique_id": "T1110",
        "technique_name": "Brute Force",
        "tactic": "Credential Access",
        "description": "Adversaries may use brute force techniques to gain access to accounts",
        "sub_techniques": [
            "T1110.001 - Password Guessing",
            "T1110.002 - Password Cracking",
            "T1110.003 - Password Spraying",
            "T1110.004 - Credential Stuffing"
        ]
    },

    # Initial Access
    "T1190": {
        "technique_id": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "tactic": "Initial Access",
        "description": "Adversaries may exploit vulnerabilities in Internet-facing software",
        "sub_techniques": [
            "SQL Injection",
            "Command Injection",
            "Cross-Site Scripting (XSS)"
        ]
    },

    # Impact
    "T1498": {
        "technique_id": "T1498",
        "technique_name": "Network Denial of Service",
        "tactic": "Impact",
        "description": "Adversaries may perform Network DoS attacks to degrade or block availability",
        "sub_techniques": [
            "T1498.001 - Direct Network Flood",
            "T1498.002 - Reflection Amplification"
        ]
    },

    "T1486": {
        "technique_id": "T1486",
        "technique_name": "Data Encrypted for Impact",
        "tactic": "Impact",
        "description": "Adversaries may encrypt data on target systems to interrupt availability",
        "sub_techniques": []
    },

    # Discovery
    "T1046": {
        "technique_id": "T1046",
        "technique_name": "Network Service Discovery",
        "tactic": "Discovery",
        "description": "Adversaries may attempt to get a listing of services running on remote hosts",
        "sub_techniques": []
    },

    # Exfiltration
    "T1041": {
        "technique_id": "T1041",
        "technique_name": "Exfiltration Over C2 Channel",
        "tactic": "Exfiltration",
        "description": "Adversaries may steal data by exfiltrating it over an existing C2 channel",
        "sub_techniques": []
    },

    "T1048": {
        "technique_id": "T1048",
        "technique_name": "Exfiltration Over Alternative Protocol",
        "tactic": "Exfiltration",
        "description": "Adversaries may steal data using a protocol other than the existing C2 channel",
        "sub_techniques": [
            "T1048.001 - Exfiltration Over Symmetric Encrypted Non-C2 Protocol",
            "T1048.002 - Exfiltration Over Asymmetric Encrypted Non-C2 Protocol",
            "T1048.003 - Exfiltration Over Unencrypted/Obfuscated Non-C2 Protocol"
        ]
    },

    # Execution
    "T1204": {
        "technique_id": "T1204",
        "technique_name": "User Execution",
        "tactic": "Execution",
        "description": "An adversary may rely upon specific actions by a user in order to gain execution",
        "sub_techniques": [
            "T1204.001 - Malicious Link",
            "T1204.002 - Malicious File"
        ]
    },
}


def get_mitre_info(technique_id: str) -> Optional[Dict]:
    """
    Get MITRE ATT&CK information for a technique ID.

    Args:
        technique_id: MITRE ATT&CK technique ID (e.g., "T1110")

    Returns:
        Dictionary with technique information or None if not found
    """
    # Clean the ID (remove any sub-technique suffixes like .001)
    base_id = technique_id.split(".")[0] if "." in technique_id else technique_id

    return MITRE_ATTACK_MAPPING.get(base_id)


def get_technique_name(technique_id: str) -> str:
    """
    Get the technique name for a MITRE ID.

    Args:
        technique_id: MITRE ATT&CK technique ID

    Returns:
        Technique name or the ID itself if not found
    """
    info = get_mitre_info(technique_id)
    if info:
        return info.get("technique_name", technique_id)
    return technique_id


def get_tactic(technique_id: str) -> Optional[str]:
    """
    Get the MITRE ATT&CK tactic for a technique.

    Args:
        technique_id: MITRE ATT&CK technique ID

    Returns:
        Tactic name or None if not found
    """
    info = get_mitre_info(technique_id)
    if info:
        return info.get("tactic")
    return None


def enrich_with_mitre(technique_id: Optional[str]) -> Dict:
    """
    Enrich a threat with MITRE ATT&CK information.

    Args:
        technique_id: MITRE ATT&CK technique ID

    Returns:
        Dictionary with enriched MITRE information
    """
    if not technique_id:
        return {
            "mitre_attack_id": None,
            "mitre_attack_name": None,
            "mitre_tactic": None
        }

    info = get_mitre_info(technique_id)
    if info:
        return {
            "mitre_attack_id": technique_id,
            "mitre_attack_name": info.get("technique_name"),
            "mitre_tactic": info.get("tactic")
        }

    return {
        "mitre_attack_id": technique_id,
        "mitre_attack_name": None,
        "mitre_tactic": None
    }
