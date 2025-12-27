/**
 * Backend API Service
 * REST API client for ThreatStream backend
 */

import {
  BackendHealthResponse,
  BackendThreatsResponse,
  BackendAlertsResponse,
  BackendDashboardStats,
  BackendRiskIndex,
  BackendAnalyticsSummaryResponse,
  BackendSimulateEventRequest,
  BackendSimulateEventResponse
} from '../backendTypes';

// Get backend API URL from environment
const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Backend API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Health & System
 */
export async function getHealth(): Promise<BackendHealthResponse> {
  return fetchAPI<BackendHealthResponse>('/api/health');
}

/**
 * Threats
 */
export async function getRecentThreats(
  limit: number = 50,
  severity?: string
): Promise<BackendThreatsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (severity) {
    params.append('severity', severity);
  }
  return fetchAPI<BackendThreatsResponse>(`/api/threats/recent?${params}`);
}

export async function getThreatById(threatId: string): Promise<any> {
  return fetchAPI(`/api/threats/${threatId}`);
}

export async function getThreatStats(): Promise<any> {
  return fetchAPI('/api/threats/stats/summary');
}

/**
 * Alerts
 */
export async function getActiveAlerts(limit: number = 50): Promise<BackendAlertsResponse> {
  return fetchAPI<BackendAlertsResponse>(`/api/alerts/active?limit=${limit}`);
}

export async function acknowledgeAlert(
  alertId: string,
  analystId: string,
  notes?: string
): Promise<any> {
  return fetchAPI(`/api/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ analyst_id: analystId, notes }),
  });
}

export async function resolveAlert(
  alertId: string,
  analystId: string,
  resolution: string,
  notes?: string
): Promise<any> {
  return fetchAPI(`/api/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ analyst_id: analystId, resolution, notes }),
  });
}

/**
 * Analytics
 */
export async function getDashboardMetrics(): Promise<BackendDashboardStats> {
  return fetchAPI<BackendDashboardStats>('/api/analytics/dashboard');
}

export async function getRiskIndex(): Promise<BackendRiskIndex> {
  return fetchAPI<BackendRiskIndex>('/api/analytics/risk-index');
}

export async function getRiskTimeline(): Promise<{ timeline: any[] }> {
  return fetchAPI('/api/analytics/timeline');
}

export async function getAnalyticsSummary(): Promise<BackendAnalyticsSummaryResponse> {
  return fetchAPI<BackendAnalyticsSummaryResponse>('/api/analytics/summary');
}

/**
 * Playbooks
 */
export async function getPlaybooks(): Promise<any> {
  return fetchAPI('/api/playbooks');
}

export async function executePlaybook(playbookId: string, threatId: string): Promise<any> {
  return fetchAPI('/api/playbooks/execute', {
    method: 'POST',
    body: JSON.stringify({ playbook_id: playbookId, threat_id: threatId }),
  });
}

export async function getPlaybookHistory(limit: number = 50): Promise<any> {
  return fetchAPI(`/api/playbooks/history?limit=${limit}`);
}

/**
 * Simulation (for testing)
 */
export async function simulateEvent(
  eventData: BackendSimulateEventRequest
): Promise<BackendSimulateEventResponse> {
  return fetchAPI<BackendSimulateEventResponse>('/api/simulate/event', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

/**
 * Backend Service Object (export for convenient usage)
 */
export const BackendService = {
  // Health
  getHealth,

  // Threats
  getRecentThreats,
  getThreatById,
  getThreatStats,

  // Alerts
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,

  // Analytics
  getDashboardMetrics,
  getRiskIndex,
  getRiskTimeline,
  getAnalyticsSummary,

  // Playbooks
  getPlaybooks,
  executePlaybook,
  getPlaybookHistory,

  // Simulation
  simulateEvent,
};

export default BackendService;
