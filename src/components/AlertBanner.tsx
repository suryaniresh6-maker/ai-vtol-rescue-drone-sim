import React from 'react';
import { SimulationPhase } from '../types/drone';
import { 
  AlertTriangle, 
  CheckCircle, 
  Radio, 
  Flame, 
  PackageCheck,
  Ship,
  X
} from 'lucide-react';

interface AlertBannerProps {
  phase: SimulationPhase;
  isThermal: boolean;
  onToggleThermal: () => void;
  onDismissAlert?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  phase,
  isThermal,
  onToggleThermal,
}) => {
  // Step 3: GPS Loss Banner
  if (phase === 'gps_loss') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-xl animate-bounce duration-1000">
        <div className="bg-rose-950/90 border-2 border-rose-500 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-rose-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-rose-100 tracking-wider flex items-center gap-2">
                <span>GPS SIGNAL LOST</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 text-rose-300 font-mono-nums">
                  HDOP: 9.9
                </span>
              </div>
              <p className="text-xs text-rose-300 mt-0.5">
                Auto Failover: <strong>Camera + LiDAR + IMU &rarr; V-SLAM Active</strong>. Maintaining stable trajectory.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Person Found AI Alert Pop-up
  if (phase === 'person_found') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-xl animate-pulse">
        <div className="bg-emerald-950/90 border-2 border-emerald-400 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Radio className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-emerald-200 tracking-wide flex items-center gap-2">
                <span>LoRa Alert: PERSON FOUND</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-mono-nums font-bold">
                  95.4% CONFIDENCE
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-mono-nums mt-0.5">
                Target Coords: <strong>12.9824° N, 80.2215° E</strong> · Stranded on Roof
              </p>
            </div>
          </div>

          <button
            onClick={onToggleThermal}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors ${
              isThermal
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isThermal ? 'RGB View' : 'Thermal View'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Winch Delivery Active
  if (phase === 'payload_drop') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-lg">
        <div className="bg-sky-950/90 border border-sky-400/80 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 text-sky-100">
          <div className="w-9 h-9 rounded-lg bg-sky-500/20 flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-sky-200">
              Winch Delivery: First-Aid Kit Lowering
            </div>
            <p className="text-xs text-sky-300">
              Motorized winch cable unspooling with pendulum dampening. Safe touchdown zone verified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Rescue Team Dispatched
  if (phase === 'live_relay') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-lg">
        <div className="bg-indigo-950/90 border border-indigo-400/80 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 text-indigo-100">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Ship className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-indigo-200">
              Disaster Response Unit Dispatched
            </div>
            <p className="text-xs text-indigo-300">
              Boat Rescue Unit 3 receiving live LoRa telemetry coordinates for survivor extraction.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 7: Mission Complete
  if (phase === 'rth_landing') {
    return (
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-lg">
        <div className="bg-emerald-950/90 border border-emerald-400/80 rounded-xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 text-emerald-100">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-emerald-200">
              Return to Home (RTH) & Precision Landing
            </div>
            <p className="text-xs text-emerald-300 font-mono-nums">
              Touchdown on H-Pad complete. Final battery reserve: 20%. Mission logged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
