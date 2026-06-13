import { useState, useEffect } from 'react';
import { createSSEConnection, type SensorState, type SensorData, type DryoutData, type PumpStatus } from './useSSE';
import { fetchSensorLatest, fetchDryoutPrediction, fetchPumpStatus } from '../api';

export function useSensorData() {
  const [state, setState] = useState<SensorState>({
    sensor: null,
    dryout: null,
    pump: null,
    connection: 'connecting',
    lastUpdate: null,
  });

  useEffect(() => {
    let cancelled = false;

    // 1. Initial REST pull so pages get data immediately
    async function fetchInitial() {
      try {
        const [sensor, dryout, pump] = await Promise.all([
          fetchSensorLatest().catch(() => null),
          fetchDryoutPrediction().catch(() => null),
          fetchPumpStatus().catch(() => null),
        ]);
        if (cancelled) return;

        if (sensor && sensor.temp != null) {
          setState(s => ({
            ...s,
            sensor: {
              device_code: sensor.device_code || 'SENSOR_001',
              ts: Date.now(),
              temp: sensor.temp,
              humidity: sensor.humidity ?? 0,
              rain: sensor.rain_intensity ?? 0,
              soil_moisture: sensor.soil_moisture ?? (s.sensor?.soil_moisture ?? 0),
            } as SensorData,
            lastUpdate: Date.now(),
          }));
        }

        if (dryout && dryout.predicted_hours != null) {
          setState(s => ({
            ...s,
            dryout: { hours: dryout.predicted_hours, confidence: dryout.confidence } as DryoutData,
          }));
        }

        if (pump) {
          setState(s => ({
            ...s,
            pump: { running: pump.running, remaining: pump.remaining_sec ?? 0 } as PumpStatus,
          }));
        }
      } catch {
        // REST failed — SSE will pick up if it connects
      }
    }

    fetchInitial();

    // 2. SSE for live updates
    const cleanup = createSSEConnection(
      (data) => {
        if ('temp' in data && 'humidity' in data) {
          const incoming = data as SensorData;
          setState(s => ({
            ...s,
            sensor: {
              device_code: incoming.device_code,
              ts: incoming.ts,
              temp: incoming.temp,
              humidity: incoming.humidity,
              rain: incoming.rain,
              soil_moisture: incoming.soil_moisture || (s.sensor?.soil_moisture ?? 0),
            },
            lastUpdate: Date.now(),
          }));
        } else if ('hours' in data) {
          setState(s => ({ ...s, dryout: data as DryoutData }));
        } else if ('running' in data) {
          setState(s => ({ ...s, pump: data as PumpStatus }));
        }
      },
      (connection) => setState(s => ({ ...s, connection }))
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return state;
}
