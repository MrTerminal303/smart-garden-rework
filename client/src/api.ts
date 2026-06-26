import { API_BASE } from './hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeviceData {
  device_code: string;
  device_type: string;
  device_name: string;
  is_active: boolean;
  last_seen: string | null;
}

export interface SensorLatest {
  temp: number | null;
  humidity: number | null;
  soil_moisture: number | null;
  rain_intensity: number | null;
  device_code: string | null;
}

export interface DryoutPrediction {
  predicted_hours: number | null;
  confidence: number | null;
}

export interface PumpStatusResponse {
  running: boolean;
  remaining_sec: number;
}

export interface PumpEvent {
  device_code: string;
  action: string;
  duration: number;
  cmd_id: string;
  created_at: string;
}

export interface SeedResponse {
  seeded: boolean;
  prediction: { hours: number; confidence: number } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `API ${res.status}: ${path}`);
  }
  return res.json();
}

// ── Sensors ────────────────────────────────────────────────────────────────────

export function fetchSensorLatest(device?: string) {
  const qs = device ? `?device=${device}` : '';
  return apiFetch<SensorLatest>(`/api/sensors/latest${qs}`);
}

export function fetchDryoutPrediction(device = 'SENSOR_001') {
  return apiFetch<DryoutPrediction>(`/api/sensors/dryout?device=${device}`);
}

// ── Pump ───────────────────────────────────────────────────────────────────────

export function fetchPumpStatus(device = 'PUMP_001') {
  return apiFetch<PumpStatusResponse>(`/api/pump/status?device=${device}`);
}

export function sendPumpCommand(device_code: string, duration: number) {
  return apiFetch<{ accepted: boolean; cmd_id: string }>('/api/pump/command', {
    method: 'POST',
    body: JSON.stringify({ device_code, duration }),
  });
}

// ── Devices ────────────────────────────────────────────────────────────────────

export function fetchDeviceStatus(code: string) {
  return apiFetch<DeviceData>(`/api/devices/${code}/status`);
}

// ── Seed ───────────────────────────────────────────────────────────────────────

export function seedDemoData() {
  return apiFetch<SeedResponse>('/api/seed', { method: 'POST' });
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export function fetchMe() {
  return apiFetch<{ user: { id: string; email: string } }>('/api/auth/me');
}
