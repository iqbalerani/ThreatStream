
export enum EventStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked'
}

export enum EventType {
  LOGIN = 'Login Attempt',
  API_REQ = 'API Request',
  FIREWALL = 'Firewall Event',
  AUTH = 'Authentication',
  FILE_ACCESS = 'File Access',
  SQL_INJ = 'SQL Injection',
  BRUTE_FORCE = 'Brute Force',
  DDOS = 'DDoS Attack',
  RANSOMWARE = 'Ransomware Signal'
}

export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ThreatLevel {
  NORMAL = 'Normal',
  SUSPICIOUS = 'Suspicious',
  CRITICAL = 'Critical'
}

export type ScenarioType = 'normal' | 'brute_force' | 'sql_injection' | 'ddos' | 'ransomware';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  sourceIp: string;
  userId: string;
  status: EventStatus;
  description: string;
  severity: Severity;
  country: string;
  coordinates: [number, number]; // [lat, lng]
  mitre?: string;
}

export interface AIReasoning {
  explanation: string;
  factors: string[];
  confidence: 'Low' | 'Medium' | 'High';
  summary: string;
  mitreAttack?: string;
  recommendedActions: string[];
}

export interface ForensicReport {
  summary: string;
  technicalDetails: string;
  timeline: string[];
  riskAssessment: string;
  remediationSteps: string[];
}

export interface TimelineData {
  time: string;
  risk: number;
}

export interface DashboardStats {
  processed: number;
  blocked: number;
  critical: number;
  avgDetectTime: number;
  latencyHistory: number[];
}
