import { useState, useEffect } from 'react';
import { fetchDeviceStatus, type DeviceData } from '../api';
import { Droplets, Cpu, Wifi, CloudSync } from 'lucide-react';

export function DevicesPage() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchDeviceStatus('SENSOR_001').catch(() => null),
      fetchDeviceStatus('PUMP_001').catch(() => null),
    ]).then(([sensor, pump]) => {
      const list: DeviceData[] = [];
      if (sensor) list.push(sensor);
      if (pump) list.push(pump);
      setDevices(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary">Device Management</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Monitor and manage your IoT garden nodes.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href = '/settings'} className="text-primary hover:scale-105 transition-transform" title="WiFi Settings"><Wifi size={20} /></button>
          <button onClick={() => window.location.href = '/settings'} className="text-primary hover:scale-105 transition-transform" title="Sync"><CloudSync size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 flex flex-col gap-6">
          <h3 className="font-headline-md text-headline-md text-primary">Active Nodes</h3>
          <div className="flex flex-col gap-4">
            {loading && <p className="font-body-md text-on-surface-variant">Loading devices...</p>}
            {!loading && devices.length === 0 && <p className="font-body-md text-on-surface-variant">No devices found.</p>}
            {devices.map((d) => (
              <div key={d.device_code}
                className="glass-panel rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-[0_40px_80px_rgba(23,49,36,0.05)] transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    {d.device_type === 'pump' ? <Droplets size={24} /> : <Cpu size={24} />}
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface">{d.device_code}</h4>
                    <p className="font-body-md text-sm text-on-surface-variant mt-1">{d.device_name || d.device_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex flex-col items-end">
                    <span className="font-body-md text-sm text-outline">Status</span>
                    <span className="font-label-md text-label-md text-primary">{d.is_active ? 'Online' : 'Offline'}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${d.is_active ? 'bg-primary-container/20' : 'bg-error-container/20'}`}>
                    <span className={`w-2 h-2 rounded-full ${d.is_active ? 'bg-primary-container' : 'bg-error'} animate-pulse`} />
                    <span className={`font-label-md text-xs ${d.is_active ? 'text-primary-container' : 'text-error'}`}>{d.is_active ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 flex flex-col gap-6">
          <h3 className="font-headline-md text-headline-md text-primary">System Health</h3>
          <div className="glass-panel rounded-2xl p-8 flex flex-col gap-8 relative overflow-hidden h-full">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-2 gap-8 z-10">
              <div>
                <p className="font-body-md text-sm text-on-surface-variant mb-2">Firmware</p>
                <p className="font-data-display text-data-display text-primary">v1.0.2</p>
              </div>
              <div>
                <p className="font-body-md text-sm text-on-surface-variant mb-2">Uptime</p>
                <p className="font-data-display text-data-display text-primary">{Math.floor(((Date.now() - 3600000) / 1000)).toLocaleString()}<span className="text-lg font-body-md text-outline ml-1">s</span></p>
              </div>
            </div>
            <div className="h-px w-full bg-surface-variant my-2 z-10" />
            <div className="flex items-center justify-between z-10">
              <div>
                <p className="font-label-md text-label-md text-on-surface mb-1">MQTT Connection</p>
                <p className="font-body-md text-sm text-on-surface-variant">Local Mosquitto</p>
              </div>
              <div className="w-12 h-12 rounded-full border border-primary-container/30 flex items-center justify-center bg-surface-bright shadow-sm">
                <CloudSync size={24} className="text-primary-container" style={{ fill: 'currentColor' }} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
