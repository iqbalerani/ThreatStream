"""
Geolocation Service
IP address to geographic location mapping
"""
from typing import Dict, Optional, Tuple
from app.utils.ip_utils import classify_source_zone, get_country_risk_multiplier
from app.utils.logger import get_logger

logger = get_logger(__name__)


# Country code to coordinates mapping for globe visualization
COUNTRY_COORDS = {
    "US": {"lat": 37.0902, "lng": -95.7129, "country": "United States"},
    "CN": {"lat": 35.8617, "lng": 104.1954, "country": "China"},
    "RU": {"lat": 61.5240, "lng": 105.3188, "country": "Russia"},
    "DE": {"lat": 51.1657, "lng": 10.4515, "country": "Germany"},
    "GB": {"lat": 55.3781, "lng": -3.4360, "country": "United Kingdom"},
    "IN": {"lat": 20.5937, "lng": 78.9629, "country": "India"},
    "BR": {"lat": -14.2350, "lng": -51.9253, "country": "Brazil"},
    "KP": {"lat": 40.3399, "lng": 127.5101, "country": "North Korea"},
    "IR": {"lat": 32.4279, "lng": 53.6880, "country": "Iran"},
    "FR": {"lat": 46.2276, "lng": 2.2137, "country": "France"},
    "JP": {"lat": 36.2048, "lng": 138.2529, "country": "Japan"},
    "CA": {"lat": 56.1304, "lng": -106.3468, "country": "Canada"},
    "AU": {"lat": -25.2744, "lng": 133.7751, "country": "Australia"},
    "IT": {"lat": 41.8719, "lng": 12.5674, "country": "Italy"},
    "ES": {"lat": 40.4637, "lng": -3.7492, "country": "Spain"},
    "MX": {"lat": 23.6345, "lng": -102.5528, "country": "Mexico"},
    "KR": {"lat": 35.9078, "lng": 127.7669, "country": "South Korea"},
    "NL": {"lat": 52.1326, "lng": 5.2913, "country": "Netherlands"},
    "SE": {"lat": 60.1282, "lng": 18.6435, "country": "Sweden"},
    "PL": {"lat": 51.9194, "lng": 19.1451, "country": "Poland"},
}


class GeoService:
    """Service for IP geolocation and geographic threat analysis."""

    def __init__(self):
        logger.info("GeoService initialized")

    def lookup_ip(self, ip: str) -> Dict:
        """
        Lookup geographic information for an IP address.

        Args:
            ip: IP address to lookup

        Returns:
            Dictionary with country, coordinates, zone, and risk multiplier
        """
        # For production, integrate with a real IP geolocation service
        # like MaxMind GeoIP2, IPStack, or IP2Location
        # For now, we'll use a simplified approach

        # Check if private IP
        if ip.startswith(("10.", "172.16.", "192.168.", "127.")):
            return {
                "country": "Internal",
                "country_code": "XX",
                "coordinates": [0, 0],
                "zone": "INTERNAL_ZONE",
                "risk_multiplier": 1.0
            }

        # Simple heuristic based on IP range (for demo purposes)
        # In production, use a proper GeoIP database
        country_code = self._guess_country_from_ip(ip)
        country_info = COUNTRY_COORDS.get(country_code, COUNTRY_COORDS["US"])

        zone = classify_source_zone(ip, country_code)
        risk_multiplier = get_country_risk_multiplier(country_code)

        return {
            "country": country_info["country"],
            "country_code": country_code,
            "coordinates": [country_info["lat"], country_info["lng"]],
            "zone": zone,
            "risk_multiplier": risk_multiplier
        }

    def _guess_country_from_ip(self, ip: str) -> str:
        """
        Simple heuristic to guess country from IP (for demo purposes).
        In production, use MaxMind GeoIP2 or similar service.
        """
        octets = ip.split(".")
        if len(octets) != 4:
            return "US"

        try:
            first_octet = int(octets[0])

            # Very simplified mapping (for demonstration only)
            if 1 <= first_octet <= 50:
                return "US"
            elif 51 <= first_octet <= 80:
                return "CN"
            elif 81 <= first_octet <= 100:
                return "RU"
            elif 101 <= first_octet <= 120:
                return "DE"
            elif 121 <= first_octet <= 140:
                return "GB"
            elif 141 <= first_octet <= 160:
                return "IN"
            elif 161 <= first_octet <= 180:
                return "BR"
            elif 181 <= first_octet <= 200:
                return "KP"
            elif 201 <= first_octet <= 220:
                return "IR"
            else:
                return "US"
        except ValueError:
            return "US"

    def get_country_coords(self, country_code: str) -> Tuple[float, float]:
        """Get coordinates for a country code."""
        country = COUNTRY_COORDS.get(country_code, COUNTRY_COORDS["US"])
        return (country["lat"], country["lng"])

    def get_country_name(self, country_code: str) -> str:
        """Get country name from code."""
        country = COUNTRY_COORDS.get(country_code)
        if country:
            return country["country"]
        return "Unknown"


# Global instance
_geo_service = None


def get_geo_service() -> GeoService:
    """Get the global GeoService instance."""
    global _geo_service
    if _geo_service is None:
        _geo_service = GeoService()
    return _geo_service
