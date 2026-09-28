import React, { useState } from 'react';
import { SimulationPhase } from '../types/drone';
import { 
  Camera, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Flame, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface GimbalCameraPIPProps {
  phase: SimulationPhase;
  isThermal: boolean;
  onToggleThermal: () => void;
  batteryPercent: number;
  altitudeMeters: number;
}

export const GimbalCameraPIP: React.FC<GimbalCameraPIPProps> = ({
  phase,
  isThermal,
  onToggleThermal,
  batteryPercent,
  altitudeMeters,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const isPersonDetected = phase === 'person_found' || phase === 'payload_drop' || phase === 'live_relay';

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="absolute top-4 right-4 md:right-88 z-20 px-3 py-2 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-semibold text-sky-400 flex items-center gap-2 backdrop-blur-md shadow-lg"
      >
        <Camera className="w-4 h-4" />
        <span>Gimbal Feed PIP</span>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 md:right-88 z-20 w-60 sm:w-68 bg-slate-950/92 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md select-none transition-all">
      {/* Top Bar of Gimbal Feed */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-display font-semibold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>GIMBAL EO/IR 4K</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleThermal}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono-nums transition-colors ${
              isThermal ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FLIR
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize PIP"
            className="text-slate-400 hover:text-slate-200"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Simulated Camera Viewfinder Frame */}
      <div
        className={`relative h-40 w-full overflow-hidden flex items-center justify-center ${
          isThermal ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-amber-950' : 'bg-slate-900'
        }`}
      >
        {/* Synthetic background representing flooded building rooftop */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* HUD Pitch Ladder & Reticle */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-24 h-24 border border-sky-400/20 rounded-full flex items-center justify-center relative">
            <div className="w-2 h-2 bg-sky-400/50 rounded-full" />
            <div className="absolute w-8 h-[1px] bg-sky-400/50 -left-10" />
            <div className="absolute w-8 h-[1px] bg-sky-400/50 -right-10" />
            <div className="absolute h-8 w-[1px] bg-sky-400/50 -top-10" />
            <div className="absolute h-8 w-[1px] bg-sky-400/50 -bottom-10" />
          </div>
        </div>

        {/* YOLO Detection Bounding Box on Survivor */}
        {isPersonDetected ? (
          <div className="relative z-10 w-28 h-24 border-2 border-emerald-400 bg-emerald-500/10 rounded flex flex-col justify-between p-1 animate-pulse">
            <div className="flex items-center justify-between text-[9px] font-mono-nums font-bold text-emerald-300 bg-emerald-950/80 px-1 py-0.5 rounded">
              <span className="flex items-center gap-0.5">
                <UserCheck className="w-2.5 h-2.5" /> PERSON
              </span>
              <span>95.4%</span>
            </div>

            {/* Survivor Graphic Mock inside viewfinder */}
            <div className="self-center flex flex-col items-center">
              <div className={`w-3.5 h-3.5 rounded-full ${isThermal ? 'bg-amber-300' : 'bg-orange-500'}`} />
              <div className={`w-5 h-6 rounded-t-sm ${isThermal ? 'bg-amber-400' : 'bg-orange-600'}`} />
            </div>

            <div className="text-[8px] font-mono-nums text-emerald-300 text-center bg-emerald-950/80 rounded py-0.5">
              12.9824°N 80.2215°E
            </div>
          </div>
        ) : (
          <div className="text-center z-10 px-4">
            <Crosshair className="w-6 h-6 text-slate-500 mx-auto mb-1 animate-spin duration-1000" />
            <div className="text-[10px] font-mono-nums text-slate-400">
              YOLOv8 SCANNING GRID...
            </div>
            <div className="text-[9px] text-slate-500 font-mono-nums">
              FLOOD SECTOR BRAVO-4
            </div>
          </div>
        )}

        {/* Viewfinder Corner Brackets */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-sky-400" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-sky-400" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-sky-400" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-sky-400" />

        {/* Viewfinder Telemetry Readouts */}
        <div className="absolute bottom-1.5 left-2 text-[9px] font-mono-nums text-sky-400">
          ALT: {altitudeMeters}m · FOV: 64°
        </div>
        <div className="absolute bottom-1.5 right-2 text-[9px] font-mono-nums text-sky-400">
          BAT: {batteryPercent}%
        </div>
      </div>
    </div>
  );
};
