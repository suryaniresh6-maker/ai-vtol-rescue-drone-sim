import React from 'react';
import { SimulationPhase, StepConfig } from '../types/drone';
import { 
  Truck, 
  PlaneTakeoff, 
  RadioTower, 
  Crosshair, 
  Package, 
  Share2, 
  Home, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface MissionControlsProps {
  currentPhase: SimulationPhase;
  onSelectPhase: (phase: SimulationPhase) => void;
  isAutoPlaying: boolean;
  onToggleAutoPlay: () => void;
  onReset: () => void;
  isTamil?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const missionSteps: StepConfig[] = [
  {
    id: 'setup',
    stepNumber: 1,
    title: 'Team Setup',
    subtitle: 'Base Camp Deployment',
    tamilTitle: '1. மீட்புக் குழு தயார் நிலை',
    tamilDescription: 'வானூர்தி வேன் கதவுகள் திறக்கப்பட்டு, LoRa ஆண்டெனா மற்றும் ட்ரோன் தரைப்பரிசோதனை செய்யப்படுகிறது.',
    description: 'Rescue van rear doors open, directional LoRa antenna deployed, drone pre-flight check.',
    badge: 'BASE CAMP',
  },
  {
    id: 'takeoff_search',
    stepNumber: 2,
    title: 'Takeoff & Auto Search',
    subtitle: 'VTOL Climb to 50m',
    tamilTitle: '2. தானியங்கி புறப்பாடு & தேடுதல்',
    tamilDescription: 'செங்குத்தாக 50மீ உயரம் எழும்பி, வெள்ளப் பகுதியில் தானியங்கி முறையில் தேடுதல் துவங்குகிறது.',
    description: 'VTOL climb, transition to forward cruise flight, initiates lawnmower grid search pattern.',
    badge: 'AUTONOMOUS',
  },
  {
    id: 'gps_loss',
    stepNumber: 3,
    title: 'GPS Loss Recovery',
    subtitle: 'V-SLAM Activated',
    tamilTitle: '3. GPS சிக்னல் இழப்பு & மீட்சி',
    tamilDescription: 'GPS சிக்னல் இழந்தவுடன், கேமரா + LiDAR + IMU மூலம் V-SLAM வரைபடம் தானாக இயங்குகிறது.',
    description: 'GPS signal lost in disaster canyon. Camera + LiDAR + IMU fusion maintains drift-free flight.',
    badge: 'CRITICAL',
  },
  {
    id: 'person_found',
    stepNumber: 4,
    title: 'Person Found AI Alert',
    subtitle: 'YOLOv8 Detection',
    tamilTitle: '4. பாதிக்கப்பட்ட நபர் AI கண்டுபிடிப்பு',
    tamilDescription: 'கட்டிட மேற்கூரையில் தவித்த நபர் YOLO AI மூலம் அடையாளம் காணப்பட்டு LoRa அவசர எச்சரிக்கை அனுப்பப்படுகிறது.',
    description: 'Computer vision locks on survivor stranded on roof. Instant LoRa emergency broadcast sent.',
    badge: '95% CONF',
  },
  {
    id: 'payload_drop',
    stepNumber: 5,
    title: 'Payload Delivery',
    subtitle: 'Precision Winch Drop',
    tamilTitle: '5. முதலுதவிப் பெட்டி விநியோகம்',
    tamilDescription: 'ட்ரோன் நிலையாக நின்று வின்ச் கயிறு மூலம் உயிர் காக்கும் முதலுதவிப் பெட்டியைப் பாதுகாப்பாக இறக்குகிறது.',
    description: 'Drone enters stable hover. Winch cable lowers First-Aid emergency survival kit to survivor.',
    badge: 'WINCH ACTIVE',
  },
  {
    id: 'live_relay',
    stepNumber: 6,
    title: 'Live Location & Comms',
    subtitle: 'LoRa Mesh Packet Relay',
    tamilTitle: '6. நேரலை தகவல் பரிமாற்றம்',
    tamilDescription: 'தொடர்ச்சியான LoRa தகவல்கள் தரைக்கட்டுப்பாட்டு நிலையத்திற்கு அனுப்பப்பட்டு மீட்புப் படகு அனுப்பப்படுகிறது.',
    description: 'Continuous long-range telemetry stream. Coordinates sent to ground control for boat team.',
    badge: 'LORA TELEMETRY',
  },
  {
    id: 'rth_landing',
    stepNumber: 7,
    title: 'RTH & Landing',
    subtitle: 'Return to H-Pad',
    tamilTitle: '7. தளம் திரும்புதல் & தரையிறங்குதல்',
    tamilDescription: 'பயணம் முடிந்து ட்ரோன் மீண்டும் H-Pad தளத்தில் பாதுகாப்பாகத் தரையிறங்குகிறது (பேட்டரி 20%).',
    description: 'Drone returns along safe vector, transitions to hover, lands on pad. Battery at 20%.',
    badge: 'MISSION COMPLETE',
  },
];

export const MissionControls: React.FC<MissionControlsProps> = ({
  currentPhase,
  onSelectPhase,
  isAutoPlaying,
  onToggleAutoPlay,
  onReset,
  isTamil = false,
  isOpen = true,
  onClose,
}) => {
  const getStepIcon = (id: SimulationPhase) => {
    switch (id) {
      case 'setup': return <Truck className="w-4 h-4" />;
      case 'takeoff_search': return <PlaneTakeoff className="w-4 h-4" />;
      case 'gps_loss': return <RadioTower className="w-4 h-4" />;
      case 'person_found': return <Crosshair className="w-4 h-4" />;
      case 'payload_drop': return <Package className="w-4 h-4" />;
      case 'live_relay': return <Share2 className="w-4 h-4" />;
      case 'rth_landing': return <Home className="w-4 h-4" />;
    }
  };

  const currentStepIndex = missionSteps.findIndex(s => s.id === currentPhase);

  return (
    <aside
      className={`fixed lg:static top-14 left-0 bottom-0 w-72 md:w-80 bg-slate-950/90 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-30 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Header & Simulation Flow Status */}
      <div className="p-3.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <h2 className="font-display font-semibold text-xs tracking-wider text-slate-200 uppercase">
              {isTamil ? 'திட்டப் படிகள்' : 'Mission Flow Control'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-nums text-slate-400">
              {currentStepIndex + 1} / 7
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Global Action Bar: Auto-Play, Next Step, Reset */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleAutoPlay}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isAutoPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sm'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlaying ? (isTamil ? 'நிறுத்து' : 'Pause Auto') : (isTamil ? 'தானியங்கி' : 'Auto Play')}</span>
          </button>

          <button
            onClick={onReset}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isTamil ? 'மீட்டமை' : 'Reset Base'}</span>
          </button>
        </div>
      </div>

      {/* 7 Step-by-Step Interactive Buttons */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {missionSteps.map((step, idx) => {
          const isActive = currentPhase === step.id;
          const isPassed = currentStepIndex > idx;

          return (
            <button
              key={step.id}
              onClick={() => onSelectPhase(step.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all relative group flex items-start gap-2.5 ${
                isActive
                  ? 'bg-sky-950/40 border-sky-500 text-slate-100 shadow-md shadow-sky-500/10'
                  : isPassed
                  ? 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  : 'bg-slate-950/40 border-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {/* Step Number & Icon badge */}
              <div
                className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-xs font-mono-nums font-bold transition-colors ${
                  isActive
                    ? 'bg-sky-500 text-slate-950'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-4 h-4" /> : getStepIcon(step.id)}
              </div>

              {/* Title & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-display font-semibold text-xs tracking-tight truncate text-slate-100">
                    {isTamil && step.tamilTitle ? step.tamilTitle : `${step.stepNumber}. ${step.title}`}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono-nums uppercase tracking-widest text-sky-400 font-bold shrink-0">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                  {isTamil && step.tamilDescription ? step.tamilDescription : step.description}
                </p>
              </div>

              {/* Active arrow indicator */}
              {isActive && (
                <div className="shrink-0 self-center text-sky-400">
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Mission Guide Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono-nums">VTOL-SLAM v4.2</span>
        <span className="text-slate-500">{isTamil ? 'மீட்புப் பணி' : 'Autonomous Rescue'}</span>
      </div>
    </aside>
  );
};
