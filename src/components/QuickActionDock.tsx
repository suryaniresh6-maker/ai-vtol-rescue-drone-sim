import React from 'react';
import { SimulationPhase, CameraMode } from '../types/drone';
import { missionSteps } from './MissionControls';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Languages, 
  Eye, 
  Compass, 
  Waves,
  Ship,
  Camera
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface QuickActionDockProps {
  currentPhase: SimulationPhase;
  onSelectPhase: (phase: SimulationPhase) => void;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  onReset: () => void;
  isCleanView: boolean;
  onToggleCleanView: () => void;
  isTamil: boolean;
  onToggleLanguage: () => void;
  cameraMode: CameraMode;
  onCameraModeChange: (mode: CameraMode) => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  currentPhase,
  onSelectPhase,
  isAutoPlaying,
  onToggleAutoPlay,
  onReset,
  isCleanView,
  onToggleCleanView,
  isTamil,
  onToggleLanguage,
  cameraMode,
  onCameraModeChange,
}) => {
  const currentIndex = missionSteps.findIndex(s => s.id === currentPhase);
  const currentStep = missionSteps[currentIndex] || missionSteps[0];

  const handlePrev = () => {
    soundManager.playClick();
    const prevIndex = (currentIndex - 1 + missionSteps.length) % missionSteps.length;
    onSelectPhase(missionSteps[prevIndex].id);
  };

  const handleNext = () => {
    soundManager.playClick();
    const nextIndex = (currentIndex + 1) % missionSteps.length;
    onSelectPhase(missionSteps[nextIndex].id);
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl select-none">
      <div className="bg-slate-950/92 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 flex flex-col gap-2">
        {/* Step Progress Dots & Mini Camera Shortcuts */}
        <div className="flex items-center justify-between px-1">
          {/* 7 Step Progress Indicators */}
          <div className="flex items-center gap-1.5 flex-1 max-w-xs">
            {missionSteps.map((step, idx) => {
              const isActive = idx === currentIndex;
              const isPast = idx < currentIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectPhase(step.id);
                  }}
                  title={`Step ${step.stepNumber}: ${step.title}`}
                  className="flex-1 group py-1"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-sky-400 shadow-sm shadow-sky-400/50'
                        : isPast
                        ? 'bg-emerald-500/70'
                        : 'bg-slate-800 group-hover:bg-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Camera Preset Switchers */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundManager.playClick();
                onCameraModeChange('orbit');
              }}
              title="Free Orbit Camera"
              className={`p-1.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                cameraMode === 'orbit'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Orbit</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onCameraModeChange('chase');
              }}
              title="Drone Chase Camera"
              className={`p-1.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                cameraMode === 'chase'
                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Drone</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onCameraModeChange('flood_cam');
              }}
              title="Flood View Camera"
              className={`p-1.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                cameraMode === 'flood_cam'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flood</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                onCameraModeChange('boat_cam');
              }}
              title="Rescue Boat Camera"
              className={`p-1.5 rounded-md text-[11px] flex items-center gap-1 transition-colors ${
                cameraMode === 'boat_cam'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boat</span>
            </button>
          </div>
        </div>

        {/* Primary Controls Row: [Prev] [Current Step Info & 1-Click Auto] [Next] */}
        <div className="flex items-center justify-between gap-2">
          {/* Previous Step Button */}
          <button
            onClick={handlePrev}
            className="h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-medium text-xs flex items-center gap-1 transition-all active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{isTamil ? 'முந்தைய' : 'Prev'}</span>
          </button>

          {/* Current Step Description Card */}
          <div className="flex-1 min-w-0 px-2 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-[10px] font-mono-nums font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {currentStep.stepNumber} / 7
              </span>
              <span className="font-display font-bold text-xs sm:text-sm text-slate-100 truncate">
                {isTamil && currentStep.tamilTitle ? currentStep.tamilTitle : currentStep.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {isTamil && currentStep.tamilDescription ? currentStep.tamilDescription : currentStep.description}
            </p>
          </div>

          {/* Next Step Primary Button */}
          <button
            onClick={handleNext}
            className="h-10 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-sky-500/20 active:scale-95 shrink-0"
          >
            <span>{isTamil ? 'அடுத்த படி' : 'Next Step'}</span>
            <ChevronRight className="w-4 h-4 font-extrabold" />
          </button>

          {/* Quick Utility Icons */}
          <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-800">
            {/* Auto Play / Pause Toggle */}
            <button
              onClick={onToggleAutoPlay}
              title={isAutoPlaying ? 'Pause Auto Tour' : '1-Click Auto Tour'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                isAutoPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-sky-400" />}
            </button>

            {/* Tamil / English Language Switcher */}
            <button
              onClick={onToggleLanguage}
              title={isTamil ? 'Switch to English' : 'தமிழுக்கு மாறு (Tamil)'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all ${
                isTamil
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Clean 3D View / Fullscreen Toggle */}
            <button
              onClick={onToggleCleanView}
              title={isCleanView ? 'Restore Side Panels' : 'Full 3D Cinematic View'}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all ${
                isCleanView
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              {isCleanView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Reset Mission */}
            <button
              onClick={onReset}
              title="Reset Simulation to Step 1"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
