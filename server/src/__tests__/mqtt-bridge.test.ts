import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted to top of file — use vi.hoisted for the factory
const mockQuery = vi.hoisted(() => vi.fn());

vi.mock('../db.js', () => ({ query: mockQuery }));

import { handleMessage } from '../mqtt-bridge.js';

beforeEach(() => {
  vi.clearAllMocks();
  mockQuery.mockResolvedValue({ rows: [] });
});

describe('MQTT bridge message handling', () => {
  it('drops invalid JSON without crashing', async () => {
    await expect(
      handleMessage('smartgarden/SENSOR_001/sensor/weather', Buffer.from('not json'))
    ).resolves.not.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('ignores unknown topic prefixes', async () => {
    await expect(
      handleMessage('otherprefix/SENSOR_001/sensor/weather', Buffer.from('{}'))
    ).resolves.not.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('ignores topics with fewer than 3 parts', async () => {
    await expect(
      handleMessage('smartgarden/SENSOR_001', Buffer.from('{}'))
    ).resolves.not.toThrow();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('handles weather sensor message and inserts into DB', async () => {
    await handleMessage(
      'smartgarden/SENSOR_001/sensor/weather',
      Buffer.from(JSON.stringify({ temp: 25.5, humidity: 65, rain: 0, ts: Date.now() }))
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sensor_data'),
      expect.arrayContaining(['SENSOR_001', 25.5, 65, 0])
    );
  });

  it('handles soil sensor message and inserts into DB', async () => {
    await handleMessage(
      'smartgarden/SENSOR_001/sensor/soil',
      Buffer.from(JSON.stringify({ moisture: 45, ts: Date.now() }))
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sensor_data'),
      expect.arrayContaining(['SENSOR_001', 45])
    );
  });

  it('handles ai/dryout message', async () => {
    await handleMessage(
      'smartgarden/SENSOR_001/ai/dryout',
      Buffer.from(JSON.stringify({ hours: 4.5, confidence: 0.85 }))
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ai_predictions'),
      expect.arrayContaining(['SENSOR_001', 4.5, 0.85])
    );
  });

  it('handles pump/status message', async () => {
    await handleMessage(
      'smartgarden/PUMP_001/pump/status',
      Buffer.from(JSON.stringify({ running: true, remaining: 60, ts: Date.now() }))
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pump_status'),
      expect.arrayContaining(['PUMP_001', true, 60])
    );
  });

  it('handles heartbeat and updates device last_seen', async () => {
    await handleMessage(
      'smartgarden/SENSOR_001/device/heartbeat',
      Buffer.from(JSON.stringify({ uptime: 3600, rssi: -45 }))
    );
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE devices'),
      expect.arrayContaining(['SENSOR_001'])
    );
  });

  it('logs pump ack without querying DB', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleMessage(
      'smartgarden/PUMP_001/pump/ack',
      Buffer.from(JSON.stringify({ cmd_id: 'test-cmd', accepted: true }))
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Pump ack'));
    expect(mockQuery).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
