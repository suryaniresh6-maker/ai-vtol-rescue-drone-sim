import React from 'react';
import { CameraMode, TimeOfDay } from '../types/drone';
import { 
  Sun, 
  Moon, 
  Sunset, 
  Flame, 
  Volume2, 
  VolumeX, 
  HelpCircle,
  Radio,
  PanelLeft,
  PanelRight,
  Languages
} from 'lucide-react';

interface TopBarProps {
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
  timeOfDay: TimeOfDay;
  onTimeOfDayChange: (time: TimeOfDay) => void;
  isThermal: boolean;
  onToggleThermal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
  missionTime: number;
  flightMode: string;
  isControlsOpen?: boolean;
  onToggleControls?: () => void;
  isTelemetryOpen?: boolean;
  onToggleTelemetry?: () => void;
  isTamil?: boolean;
  onToggleLanguage?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  cameraMode,
  onCameraModeChange,
  timeOfDay,
  onTimeOfDayChange,
  isThermal,
  onToggleThermal,
  isMuted,
  onToggleMute,
  onOpenGuide,
  missionTime,
  flightMode,
  isControlsOpen = true,
  onToggleControls,
  isTelemetryOpen = true,
  onToggleTelemetry,
  isTamil = false,
  onToggleLanguage,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const cameraOptions: { id: CameraMode; label: string }[] = [
    { id: 'orbit', label: 'Free Orbit' },
    { id: 'chase', label: 'Chase Cam' },
    { id: 'drone_gimbal', label: 'Gimbal POV' },
    { id: 'flood_cam', label: 'Flood View' },
    { id: 'boat_cam', label: 'Rescue Boat' },
    { id: 'ground_base', label: 'Base Camp' },
    { id: 'survivor', label: 'Survivor SOS' },
  ];

  return (
    <header className="h-14 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-5 flex items-center justify-between shrink-0 select-none z-30">
      {/* Zone 1: Brand Title & Side Panel Toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {onToggleControls && (
          <button
            onClick={onToggleControls}
            title={isControlsOpen ? 'Hide Steps Panel' : 'Show Steps Panel'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isControlsOpen
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="w-8 h-8 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-xs sm:text-sm md:text-base text-slate-100 tracking-wide uppercase truncate max-w-[210px] sm:max-w-xs md:max-w-none">
            {isTamil ? 'AI மீட்பு ட்ரோன் நேரலை இயக்கம்' : 'Rescue Team Drone Operation - Live Simulation'}
          </h1>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-mono-nums">
            <span>T+{formatTime(missionTime)}</span>
            <span aria-hidden="true">·</span>
            <span>{flightMode.replace('_', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 hidden sm:inline">LoRa 868.1 MHz</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Camera View Selectors */}
      <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg">
        {cameraOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onCameraModeChange(opt.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              cameraMode === opt.id
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Zone 3: Mission Actions & Environment Toggles */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Language Switcher */}
        {onToggleLanguage && (
          <button
            onClick={onToggleLanguage}
            title={isTamil ? 'Switch to English' : 'தமிழுக்கு மாறு (Tamil)'}
            className={`px-2 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isTamil
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{isTamil ? 'தமிழ்' : 'EN'}</span>
          </button>
        )}

        {/* Thermal FLIR Toggle */}
        <button
          onClick={onToggleThermal}
          title="Toggle Thermal FLIR View"
          className={`p-1.5 md:px-2.5 md:py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            isThermal
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-sm shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Thermal FLIR</span>
        </button>

        {/* Day / Dusk / Night Cycle Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => onTimeOfDayChange('day')}
            title="Day Lighting"
            className={`p-1.5 rounded-md transition-colors ${
              timeOfDay === 'day' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTimeOfDayChange('dusk')}
            title="Dusk / Sunset"
            className={`p-1.5 rounded-md transition-colors ${
              timeOfDay === 'dusk' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTimeOfDayChange('night')}
            title="Night Simulation"
            className={`p-1.5 rounded-md transition-colors ${
              timeOfDay === 'night' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audio Sound Toggle */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio Beeps' : 'Mute Audio Beeps'}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            isMuted
              ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              : 'bg-slate-900 border-slate-800 text-sky-400 hover:border-sky-500/40'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Telemetry Panel Toggle */}
        {onToggleTelemetry && (
          <button
            onClick={onToggleTelemetry}
            title={isTelemetryOpen ? 'Hide Telemetry' : 'Show Telemetry'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isTelemetryOpen
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* System Specs & Presentation Architecture Modal Button */}
        <button
          onClick={onOpenGuide}
          className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isTamil ? 'விளக்கம்' : 'Specs'}</span>
        </button>
      </div>
    </header>
  );
};
