import React from 'react';
import { WeatherMode, CameraMode } from '../types/drone';
import { 
  Waves, 
  CloudRain, 
  CloudLightning, 
  Sun, 
  Ship, 
  AlertOctagon, 
  Eye, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface FloodControllerProps {
  floodHeight: number;
  onFloodHeightChange: (h: number) => void;
  weatherMode: WeatherMode;
  onWeatherModeChange: (w: WeatherMode) => void;
  boatDispatched: boolean;
  onToggleBoatDispatch: () => void;
  cameraMode: CameraMode;
  onCameraModeChange: (c: CameraMode) => void;
}

export const FloodController: React.FC<FloodControllerProps> = ({
  floodHeight,
  onFloodHeightChange,
  weatherMode,
  onWeatherModeChange,
  boatDispatched,
  onToggleBoatDispatch,
  cameraMode,
  onCameraModeChange,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getInundationSeverity = (h: number) => {
    if (h < 2.0) return { label: 'MODERATE INUNDATION', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' };
    if (h < 5.0) return { label: 'SEVERE FLASH FLOOD', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' };
    return { label: 'CATASTROPHIC CREST', color: 'text-rose-400 animate-pulse', bg: 'bg-rose-500/20 border-rose-500/40' };
  };

  const severity = getInundationSeverity(floodHeight);

  const setFloodPreset = (h: number) => {
    soundManager.playClick();
    soundManager.playWaterSurgeSound();
    onFloodHeightChange(h);
  };

  return (
    <div className="absolute top-4 left-4 z-20 w-72 sm:w-80 bg-slate-950/92 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md select-none transition-all">
      {/* Header with Accordion Toggle */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="font-display font-semibold text-xs tracking-wider text-slate-100 uppercase">
            Flood Depth & Weather
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-nums font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
            {floodHeight.toFixed(1)}m
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3 text-xs">
          {/* Severity Banner */}
          <div className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${severity.bg}`}>
            <span className="flex items-center gap-1.5 font-bold font-display tracking-wide">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span className={severity.color}>{severity.label}</span>
            </span>
            <span className="font-mono-nums text-slate-300">
              +{floodHeight.toFixed(1)}m AGL
            </span>
          </div>

          {/* Interactive Water Level Slider */}
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
              <span>Interactive Water Crest Slider</span>
              <span className="font-mono-nums text-cyan-400 font-bold">{floodHeight.toFixed(1)} Meters</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="7.2"
              step="0.1"
              value={floodHeight}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onFloodHeightChange(val);
              }}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono-nums mt-0.5">
              <span>0.5m (Riverbank)</span>
              <span>4.0m (1st Floor)</span>
              <span>7.2m (Rooftop SOS)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 font-mono-nums text-[10px]">
            <button
              onClick={() => setFloodPreset(1.2)}
              className={`p-1.5 rounded border transition-colors ${
                Math.abs(floodHeight - 1.2) < 0.3
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Normal (1.2m)
            </button>
            <button
              onClick={() => setFloodPreset(4.2)}
              className={`p-1.5 rounded border transition-colors ${
                Math.abs(floodHeight - 4.2) < 0.3
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Surge (4.2m)
            </button>
            <button
              onClick={() => setFloodPreset(7.0)}
              className={`p-1.5 rounded border transition-colors ${
                Math.abs(floodHeight - 7.0) < 0.3
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Crest (7.0m)
            </button>
          </div>

          {/* Weather & Storm Toggles */}
          <div>
            <div className="text-slate-400 text-[11px] mb-1">Weather & Monsoon Intensity</div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  soundManager.playClick();
                  onWeatherModeChange('clear');
                }}
                className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 transition-colors ${
                  weatherMode === 'clear'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Clear
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  soundManager.playWaterSurgeSound();
                  onWeatherModeChange('monsoon_rain');
                }}
                className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 transition-colors ${
                  weatherMode === 'monsoon_rain'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" /> Rain
              </button>
              <button
                onClick={() => {
                  soundManager.playClick();
                  soundManager.playWaterSurgeSound();
                  onWeatherModeChange('storm_night');
                }}
                className={`p-1.5 rounded-lg border text-[11px] flex items-center justify-center gap-1 transition-colors ${
                  weatherMode === 'storm_night'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CloudLightning className="w-3.5 h-3.5" /> Storm
              </button>
            </div>
          </div>

          {/* Rescue Boat Action & Flood Cam Buttons */}
          <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                soundManager.playBoatMotorSound();
                onToggleBoatDispatch();
              }}
              className={`p-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                boatDispatched
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>{boatDispatched ? 'Boat En Route' : 'Launch Boat'}</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onCameraModeChange(cameraMode === 'flood_cam' ? 'orbit' : 'flood_cam');
              }}
              className={`p-2 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                cameraMode === 'flood_cam'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Flood Cam</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
