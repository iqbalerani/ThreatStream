"""
IP Address Utilities
"""
import ipaddress
from typing import Tuple, Optional


def is_private_ip(ip: str) -> bool:
    """
    Check if an IP address is private (RFC 1918).

    Args:
        ip: IP address string

    Returns:
        True if private, False otherwise
    """
    try:
        ip_obj = ipaddress.ip_address(ip)
        return ip_obj.is_private
    except ValueError:
        return False


def is_valid_ip(ip: str) -> bool:
    """
    Validate an IP address.

    Args:
        ip: IP address string

    Returns:
        True if valid, False otherwise
    """
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def get_ip_type(ip: str) -> str:
    """
    Determine the type of IP address.

    Args:
        ip: IP address string

    Returns:
        String: 'private', 'public', 'loopback', or 'invalid'
    """
    try:
        ip_obj = ipaddress.ip_address(ip)

        if ip_obj.is_loopback:
            return "loopback"
        elif ip_obj.is_private:
            return "private"
        else:
            return "public"
    except ValueError:
        return "invalid"


def classify_source_zone(ip: str, country_code: Optional[str] = None) -> str:
    """
    Classify the source into a threat zone.

    Args:
        ip: Source IP address
        country_code: Two-letter country code

    Returns:
        Zone classification: INTERNAL, EXTERNAL, HOSTILE, TRUSTED
    """
    # High-risk countries
    HOSTILE_COUNTRIES = ["RU", "CN", "KP", "IR"]

    # Trusted partners
    TRUSTED_COUNTRIES = []  # Add your trusted partner countries

    # Check IP type
    ip_type = get_ip_type(ip)

    if ip_type == "private" or ip_type == "loopback":
        return "INTERNAL_ZONE"

    # Check country
    if country_code:
        if country_code in HOSTILE_COUNTRIES:
            return "HOSTILE_ZONE"
        elif country_code in TRUSTED_COUNTRIES:
            return "TRUSTED_ZONE"

    return "EXTERNAL_ZONE"


def get_country_risk_multiplier(country_code: str) -> float:
    """
    Get risk multiplier for a country.

    Args:
        country_code: Two-letter country code

    Returns:
        Risk multiplier (1.0 = baseline)
    """
    COUNTRY_RISK_MULTIPLIERS = {
        "RU": 1.5,  # Russia
        "CN": 1.4,  # China
        "KP": 1.8,  # North Korea
        "IR": 1.3,  # Iran
        "US": 1.0,  # United States (baseline)
        "default": 1.0
    }

    return COUNTRY_RISK_MULTIPLIERS.get(country_code, 1.0)


def mask_ip(ip: str, keep_octets: int = 2) -> str:
    """
    Mask an IP address for privacy.

    Args:
        ip: IP address to mask
        keep_octets: Number of octets to keep visible

    Returns:
        Masked IP address
    """
    try:
        parts = ip.split(".")
        if len(parts) == 4:
            visible = parts[:keep_octets]
            masked = ["*"] * (4 - keep_octets)
            return ".".join(visible + masked)
    except:
        pass

    return "***.***.***.*"
