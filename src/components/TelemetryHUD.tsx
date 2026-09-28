import React from 'react';
import { TelemetryData, FlightLogEntry } from '../types/drone';
import { 
  Battery, 
  Gauge, 
  Satellite, 
  Cpu, 
  Signal, 
  Compass, 
  Anchor, 
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface TelemetryHUDProps {
  telemetry: TelemetryData;
  logs: FlightLogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  logs,
  isOpen,
  onToggle,
}) => {
  const getGpsBadge = () => {
    switch (telemetry.gpsStatus) {
      case 'OPTIMAL':
        return (
          <span className="text-emerald-400 font-mono-nums flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 16 SATS · OPTIMAL
          </span>
        );
      case 'LOST':
        return (
          <span className="text-rose-400 font-mono-nums flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> NO FIX · LOST
          </span>
        );
      case 'SLAM_BACKUP':
        return (
          <span className="text-sky-400 font-mono-nums flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> V-SLAM ACTIVE
          </span>
        );
      default:
        return (
          <span className="text-amber-400 font-mono-nums flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> DEGRADED
          </span>
        );
    }
  };

  const getBatteryColor = (percent: number) => {
    if (percent <= 20) return 'text-rose-400 bg-rose-500';
    if (percent <= 40) return 'text-amber-400 bg-amber-500';
    return 'text-emerald-400 bg-emerald-500';
  };

  return (
    <aside
      className={`fixed lg:static top-14 right-0 bottom-0 w-80 md:w-84 bg-slate-950/90 backdrop-blur-md border-l border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Telemetry Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">
            Live Drone Telemetry
          </h2>
        </div>
        <span className="text-[11px] font-mono-nums text-slate-400">
          UAV-VTOL-01
        </span>
      </div>

      {/* Main Telemetry Gauges & Readings */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Primary Flight Metrics: Altitude, Speed, Battery */}
        <div className="grid grid-cols-2 gap-2">
          {/* Altitude */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3 text-sky-400" /> Altitude
              </span>
              <span className="text-[10px] text-slate-500">AGL</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-nums text-slate-100">
                {telemetry.altitudeMeters}
              </span>
              <span className="text-xs text-slate-400 font-mono-nums">m</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono-nums mt-0.5">
              MSL: {(telemetry.altitudeMeters + 42)}m
            </div>
          </div>

          {/* Speed */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-sky-400" /> Airspeed
              </span>
              <span className="text-[10px] text-slate-500">CRUISE</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono-nums text-slate-100">
                {telemetry.speedKmh}
              </span>
              <span className="text-xs text-slate-400 font-mono-nums">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono-nums mt-0.5">
              GS: {telemetry.speedKmh} km/h
            </div>
          </div>
        </div>

        {/* 2. Battery Status Gauge */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1.5">
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-sky-400" /> LiPo Battery (6S 22000mAh)
            </span>
            <span className={`font-mono-nums font-bold text-xs ${telemetry.batteryPercent <= 20 ? 'text-rose-400' : 'text-slate-200'}`}>
              {telemetry.batteryPercent}%
            </span>
          </div>
          {/* Battery level bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                telemetry.batteryPercent <= 20
                  ? 'bg-rose-500'
                  : telemetry.batteryPercent <= 40
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${telemetry.batteryPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono-nums text-slate-500 mt-1">
            <span>22.6 V · 42.4 A</span>
            <span>Est: {Math.max(4, Math.round(telemetry.batteryPercent * 0.28))} min flight</span>
          </div>
        </div>

        {/* 2b. Disaster Flood Water Crest Gauge */}
        <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/40">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Flood Water Level
            </span>
            <span className="font-mono-nums font-bold text-cyan-200">
              +{telemetry.floodHeightMeters}m MSL
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (telemetry.floodHeightMeters / 7.5) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono-nums text-slate-400">
            <span>Boat Unit: <strong className="text-emerald-400 uppercase">{telemetry.boatStatus.replace('_', ' ')}</strong></span>
            <span>Critical Crest: 8.5m</span>
          </div>
        </div>

        {/* 3. Navigation & GPS Status (Crucial for Step 3 Demonstration!) */}
        <div className={`p-2.5 rounded-lg border transition-all ${
          telemetry.gpsStatus === 'LOST'
            ? 'bg-rose-950/30 border-rose-500/80 shadow-sm shadow-rose-500/10'
            : telemetry.gpsStatus === 'SLAM_BACKUP'
            ? 'bg-sky-950/30 border-sky-500/60'
            : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Satellite className="w-3.5 h-3.5 text-sky-400" /> GNSS / GPS Lock
            </span>
            {getGpsBadge()}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-nums text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500">HDOP: </span>
              <span className={telemetry.hdop > 5 ? 'text-rose-400' : 'text-slate-300'}>{telemetry.hdop}</span>
            </div>
            <div>
              <span className="text-slate-500">Sats: </span>
              <span className="text-slate-300">{telemetry.gpsSatellites}</span>
            </div>
          </div>
        </div>

        {/* 4. Visual SLAM & LiDAR Fusion Status */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Visual-Inertial SLAM
            </span>
            <span className={`text-[10px] font-mono-nums font-semibold ${
              telemetry.slamStatus === 'LIDAR_FUSED' ? 'text-sky-400' : 'text-slate-400'
            }`}>
              {telemetry.slamStatus}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-nums text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500">Keypoints: </span>
              <span className="text-slate-200">{telemetry.slamKeypoints}</span>
            </div>
            <div>
              <span className="text-slate-500">LiDAR Puck: </span>
              <span className="text-emerald-400">10Hz 360°</span>
            </div>
          </div>
        </div>

        {/* 5. LoRa Long-Range Telemetry Link */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Signal className="w-3.5 h-3.5 text-sky-400" /> LoRa Radio Comms
            </span>
            <span className="text-[10px] font-mono-nums text-emerald-400">
              {telemetry.loraFrequency}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-nums text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
            <div>
              <span className="text-slate-500">RSSI: </span>
              <span className="text-slate-200">{telemetry.loraRssi} dBm</span>
            </div>
            <div>
              <span className="text-slate-500">SNR: </span>
              <span className="text-slate-200">+{telemetry.loraSnr} dB</span>
            </div>
            <div>
              <span className="text-slate-500">Tx Pkts: </span>
              <span className="text-slate-200">{telemetry.loraPacketsSent}</span>
            </div>
            <div>
              <span className="text-slate-500">Loss: </span>
              <span className="text-emerald-400">0.0%</span>
            </div>
          </div>
        </div>

        {/* 6. Winch & Payload Drop Mechanism */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-slate-400">
              <Anchor className="w-3.5 h-3.5 text-sky-400" /> Winch Delivery System
            </span>
            <span className={`text-[10px] font-mono-nums font-semibold ${
              telemetry.winchStatus === 'RELEASED' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {telemetry.winchStatus}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono-nums text-slate-400 mt-1">
            <span>Cable Cable Ext: {telemetry.winchLengthMeters}m</span>
            <span>Payload: First-Aid Kit (1.8kg)</span>
          </div>
        </div>

        {/* 7. Real-Time Mission Event Log Stream */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Flight Operation Log</span>
          </div>
          <div className="h-28 overflow-y-auto space-y-1 font-mono-nums text-[10px] pr-1">
            {logs.map((log, index) => (
              <div key={`${log.id || 'log'}-${index}`} className="flex items-start gap-1 leading-tight">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span
                  className={
                    log.type === 'alert'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'warning'
                      ? 'text-amber-400'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ground Station Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>GCS: Station Alpha</span>
        <span className="text-emerald-400 font-mono-nums">LINK ACTIVE</span>
      </div>
    </aside>
  );
};
