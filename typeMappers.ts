/**
 * Type Mappers
 * Convert between backend API types and frontend UI types
 */

import {
  BackendThreat,
  BackendSeverityLevel,
  BackendThreatType,
  BackendDashboardStats
} from './backendTypes';
import {
  SecurityEvent,
  EventStatus,
  EventType,
  Severity,
  DashboardStats
} from './types';

// Coordinates mapping for countries (same as in App.tsx)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'US': [37.0902, -95.7129],
  'CN': [35.8617, 104.1954],
  'RU': [61.5240, 105.3188],
  'DE': [51.1657, 10.4515],
  'GB': [55.3781, -3.4360],
  'IN': [20.5937, 78.9629],
  'BR': [-14.2350, -51.9253],
  'KP': [40.3399, 127.5101],
  'IR': [32.4279, 53.6880]
};

/**
 * Map backend severity to frontend severity
 */
export function mapBackendSeverityToFrontend(backendSeverity: BackendSeverityLevel): Severity {
  switch (backendSeverity) {
    case BackendSeverityLevel.CRITICAL:
      return Severity.CRITICAL;
    case BackendSeverityLevel.HIGH:
      return Severity.HIGH;
    case BackendSeverityLevel.MEDIUM:
      return Severity.MEDIUM;
    case BackendSeverityLevel.LOW:
      return Severity.LOW;
    case BackendSeverityLevel.INFO:
      return Severity.INFO;
    default:
      return Severity.INFO;
  }
}

/**
 * Map backend threat type to frontend event type
 */
export function mapBackendThreatTypeToEventType(backendType: BackendThreatType): EventType {
  switch (backendType) {
    case BackendThreatType.BRUTE_FORCE:
      return EventType.BRUTE_FORCE;
    case BackendThreatType.DDOS:
      return EventType.DDOS;
    case BackendThreatType.RANSOMWARE:
      return EventType.RANSOMWARE;
    case BackendThreatType.PHISHING:
    case BackendThreatType.MALWARE:
      return EventType.FILE_ACCESS;
    case BackendThreatType.AUTHENTICATION:
      return EventType.AUTH;
    case BackendThreatType.NETWORK_ANOMALY:
      return EventType.FIREWALL;
    case BackendThreatType.DATA_EXFILTRATION:
      return EventType.API_REQ;
    default:
      return EventType.API_REQ;
  }
}

/**
 * Determine event status based on threat severity and auto_blocked flag
 */
export function mapBackendThreatToEventStatus(threat: BackendThreat): EventStatus {
  if (threat.auto_blocked) {
    return EventStatus.BLOCKED;
  }

  if (threat.severity === BackendSeverityLevel.CRITICAL || threat.severity === BackendSeverityLevel.HIGH) {
    return EventStatus.SUSPICIOUS;
  }

  if (threat.severity === BackendSeverityLevel.MEDIUM) {
    return EventStatus.FAILURE;
  }

  return EventStatus.SUCCESS;
}

/**
 * Get coordinates for a country code
 */
function getCoordinates(countryCode?: string): [number, number] {
  if (!countryCode) return [0, 0];
  return COUNTRY_COORDS[countryCode] || [0, 0];
}

/**
 * Convert backend Threat to frontend SecurityEvent
 */
export function mapBackendThreatToSecurityEvent(threat: BackendThreat): SecurityEvent {
  return {
    id: threat.id,
    timestamp: new Date(threat.timestamp),
    type: mapBackendThreatTypeToEventType(threat.threat_type),
    sourceIp: threat.source_ip,
    userId: `threat_${threat.id.slice(-8)}`, // Generate a userId from threat ID
    status: mapBackendThreatToEventStatus(threat),
    description: threat.description,
    severity: mapBackendSeverityToFrontend(threat.severity),
    country: threat.source_country_code || threat.source_country || 'Unknown',
    coordinates: getCoordinates(threat.source_country_code),
    mitre: threat.mitre_attack_id
  };
}

/**
 * Convert backend DashboardStats to frontend DashboardStats
 */
export function mapBackendDashboardStatsToFrontend(backendStats: BackendDashboardStats): DashboardStats {
  return {
    processed: backendStats.processed,
    blocked: backendStats.blocked,
    critical: backendStats.critical,
    avgDetectTime: backendStats.avg_detect_time,
    latencyHistory: backendStats.latency_history || []
  };
}

/**
 * Create scenario-based event for simulation
 */
export function createSimulationEvent(scenario: string): any {
  const timestamp = new Date().toISOString();
  const eventId = `SIM-${Date.now()}`;

  const scenarios: Record<string, any> = {
    brute_force: {
      event_id: eventId,
      timestamp,
      event_type: 'brute_force',
      source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      destination_ip: '10.0.0.100',
      destination_port: 22,
      protocol: 'TCP',
      payload: { attempts: Math.floor(Math.random() * 200) + 50 },
      metadata: { scenario: 'brute_force' }
    },
    sql_injection: {
      event_id: eventId,
      timestamp,
      event_type: 'sql_injection',
      source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      destination_ip: '10.0.0.200',
      destination_port: 443,
      protocol: 'HTTPS',
      payload: { query: "' OR '1'='1' --" },
      metadata: { scenario: 'sql_injection' }
    },
    ddos: {
      event_id: eventId,
      timestamp,
      event_type: 'ddos',
      source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      destination_ip: '10.0.0.1',
      destination_port: 80,
      protocol: 'UDP',
      payload: { packets_per_sec: Math.floor(Math.random() * 10000) + 5000 },
      metadata: { scenario: 'ddos' }
    },
    ransomware: {
      event_id: eventId,
      timestamp,
      event_type: 'ransomware',
      source_ip: `10.0.0.${Math.floor(Math.random() * 255)}`,
      destination_ip: '10.0.0.250',
      destination_port: 445,
      protocol: 'SMB',
      payload: { encrypted_files: Math.floor(Math.random() * 1000) + 100 },
      metadata: { scenario: 'ransomware' }
    },
    normal: {
      event_id: eventId,
      timestamp,
      event_type: (() => {
        const normalTypes = ['api_request', 'login_attempt', 'firewall_event', 'normal_traffic', 'data_access', 'network_traffic'];
        return normalTypes[Math.floor(Math.random() * normalTypes.length)];
      })(),
      source_ip: `10.0.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`,
      destination_ip: `10.0.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`,
      destination_port: (() => {
        const ports = [80, 443, 22, 3306, 5432, 8080];
        return ports[Math.floor(Math.random() * ports.length)];
      })(),
      protocol: (() => {
        const protocols = ['HTTPS', 'HTTP', 'SSH', 'TCP', 'UDP'];
        return protocols[Math.floor(Math.random() * protocols.length)];
      })(),
      payload: { bytes: Math.floor(Math.random() * 5000) + 100 },
      metadata: { scenario: 'normal' }
    }
  };

  return scenarios[scenario] || scenarios.normal;
}
