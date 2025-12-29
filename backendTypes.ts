/**
 * Backend API Type Definitions
 * These types match the Pydantic models in the ThreatStream backend
 */

// Backend Enums (matching Pydantic enums)
export enum BackendSeverityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum BackendThreatType {
  MALWARE = 'MALWARE',
  PHISHING = 'PHISHING',
  DDOS = 'DDOS',
  BRUTE_FORCE = 'BRUTE_FORCE',
  DATA_EXFILTRATION = 'DATA_EXFILTRATION',
  RANSOMWARE = 'RANSOMWARE',
  AUTHENTICATION = 'AUTHENTICATION',
  NETWORK_ANOMALY = 'NETWORK_ANOMALY',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY'
}

export enum BackendIPZone {
  HOSTILE_ZONE = 'HOSTILE_ZONE',
  EXTERNAL_NETWORK = 'EXTERNAL_NETWORK',
  INTERNAL_NETWORK = 'INTERNAL_NETWORK',
  TRUSTED_PARTNER = 'TRUSTED_PARTNER',
  UNKNOWN = 'UNKNOWN'
}

export enum BackendAlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE'
}

export enum BackendAlertPriority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4'
}

// Backend Threat Model
export interface BackendThreat {
  id: string;
  event_id: string;
  timestamp: string; // ISO 8601 datetime string
  severity: BackendSeverityLevel;
  threat_type: BackendThreatType;
  risk_score: number; // 0-100
  source_ip: string;
  source_country?: string;
  source_country_code?: string;
  source_zone: BackendIPZone;
  destination_ip?: string;
  destination_port?: number;
  confidence: number; // 0-1
  description: string;
  contextual_analysis: string;
  contributing_signals: string[];
  mitre_attack_id?: string;
  mitre_attack_name?: string;
  recommended_actions: string[];
  auto_blocked: boolean;
  processing_time_ms: number;
  analyzed_at: string; // ISO 8601 datetime string
  audit_ref: string;
}

// Backend Alert Model
export interface BackendAlert {
  id: string;
  threat_id: string;
  severity: string;
  priority: BackendAlertPriority;
  status: BackendAlertStatus;
  description: string;
  created_at: string; // ISO 8601 datetime string
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution?: string;
  notes?: string;
}

// Backend Analytics/Dashboard Stats
export interface BackendDashboardStats {
  processed: number;
  blocked: number;
  critical: number;
  avg_detect_time: number;
  latency_history: number[];
  alerts_generated?: number;
  threats_detected?: number;
}

export interface BackendRiskIndex {
  value: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface BackendTimelinePoint {
  timestamp: string;
  risk_score: number;
  threats_detected: number;
}

// WebSocket Message Types
export type BackendWebSocketMessage =
  | BackendInitialStateMessage
  | BackendNewThreatMessage
  | BackendNewAlertMessage
  | BackendMetricsUpdateMessage
  | BackendRiskUpdateMessage
  | BackendRiskTimelineUpdateMessage
  | BackendHeartbeatMessage;

export interface BackendInitialStateMessage {
  type: 'initial_state';
  data: {
    threats: BackendThreat[];
    alerts: BackendAlert[];
    risk_index: BackendRiskIndex;
    stats: BackendDashboardStats;
    risk_timeline?: Array<{ time: string; risk: number }>;
  };
}

export interface BackendNewThreatMessage {
  type: 'new_threat';
  data: BackendThreat;
}

export interface BackendNewAlertMessage {
  type: 'new_alert';
  data: BackendAlert;
}

export interface BackendMetricsUpdateMessage {
  type: 'metrics_update';
  data: BackendDashboardStats;
}

export interface BackendRiskUpdateMessage {
  type: 'risk_update';
  data: BackendRiskIndex;
}

export interface BackendRiskTimelineUpdateMessage {
  type: 'risk_timeline_update';
  data: {
    time: string;          // "22:50:19"
    risk: number;          // 39
    timestamp: string;     // ISO format
  };
}

export interface BackendHeartbeatMessage {
  type: 'heartbeat';
  timestamp: string;
}

// API Response Types
export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  services: {
    kafka: string;
    gemini: string;
    firestore: string;
  };
}

export interface BackendThreatsResponse {
  threats: BackendThreat[];
  count: number;
}

export interface BackendAlertsResponse {
  alerts: BackendAlert[];
  count: number;
}

export interface BackendAnalyticsSummaryResponse {
  dashboard_stats: BackendDashboardStats;
  risk_index: BackendRiskIndex;
  risk_timeline: BackendTimelinePoint[];
  threat_stats: any;
}

// Event Simulation (for testing)
export interface BackendSimulateEventRequest {
  event_id: string;
  timestamp: string;
  event_type: string;
  source_ip: string;
  destination_ip: string;
  destination_port: number;
  protocol: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
}

export interface BackendSimulateEventResponse {
  status: 'success' | 'error';
  threat?: BackendThreat;
  message: string;
}
