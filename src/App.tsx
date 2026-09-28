/**
 * AI Hybrid VTOL Rescue Drone Simulation
 * Mission Control & 3D Interactive Web App
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SimulationPhase, 
  CameraMode, 
  TimeOfDay, 
  WeatherMode,
  TelemetryData, 
  FlightLogEntry 
} from './types/drone';
import { ThreeScene } from './components/ThreeScene';
import { TopBar } from './components/TopBar';
import { MissionControls, missionSteps } from './components/MissionControls';
import { TelemetryHUD } from './components/TelemetryHUD';
import { GimbalCameraPIP } from './components/GimbalCameraPIP';
import { AlertBanner } from './components/AlertBanner';
import { FloodController } from './components/FloodController';
import { QuickActionDock } from './components/QuickActionDock';
import { InfoGuideModal } from './components/InfoGuideModal';
import { soundManager } from './utils/audio';
import { Activity, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentPhase, setCurrentPhase] = useState<SimulationPhase>('setup');
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('clear');
  const [floodHeight, setFloodHeight] = useState<number>(1.8);
  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
  const [boatDispatched, setBoatDispatched] = useState<boolean>(false);
  const [isThermal, setIsThermal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(true);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(true);
  const [isCleanView, setIsCleanView] = useState<boolean>(false);
  const [isTamil, setIsTamil] = useState<boolean>(false);

  // Live Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    phase: 'setup',
    altitudeMeters: 0,
    batteryPercent: 100,
    speedKmh: 0,
    pitchDeg: 0,
    rollDeg: 0,
    yawDeg: 0,
    gpsStatus: 'OPTIMAL',
    gpsSatellites: 16,
    hdop: 0.8,
    slamStatus: 'STANDBY',
    slamKeypoints: 120,
    aiStatus: 'SEARCHING',
    detectedConfidence: 0,
    targetCoords: {
      lat: '12.9824° N',
      lng: '80.2215° E',
      description: 'Flooded 2-Story Building Roof',
    },
    loraRssi: -72,
    loraSnr: 9.5,
    loraPacketsSent: 142,
    loraPacketsRecv: 142,
    loraFrequency: '868.1 MHz LoRa',
    winchLengthMeters: 0,
    winchStatus: 'STOWED',
    missionTimeSeconds: 0,
    vtolFlightMode: 'VTOL_HOVER',
    floodHeightMeters: 1.8,
    floodSurgeActive: false,
    boatStatus: 'docked',
  });

  // Flight Operation Log
  const [logs, setLogs] = useState<FlightLogEntry[]>([
    { id: '1', time: '00:01', type: 'info', message: 'Ground Control Station initialized.' },
    { id: '2', time: '00:03', type: 'info', message: 'LoRa 868.1 MHz telemetry link verified. RSSI -72 dBm.' },
    { id: '3', time: '00:05', type: 'success', message: 'UAV-VTOL-01 systems nominal. Ready on Pad H-1.' },
  ]);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logIdCounterRef = useRef<number>(100);

  const addLog = useCallback((message: string, type: FlightLogEntry['type'] = 'info') => {
    const mins = Math.floor(telemetry.missionTimeSeconds / 60);
    const secs = telemetry.missionTimeSeconds % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const uniqueId = `log-${Date.now()}-${logIdCounterRef.current++}-${Math.random().toString(36).slice(2, 6)}`;
    setLogs((prev) => [
      { id: uniqueId, time: timeStr, type, message },
      ...prev.slice(0, 30),
    ]);
  }, [telemetry.missionTimeSeconds]);

  // Phase selection handler
  const handleSelectPhase = useCallback((newPhase: SimulationPhase) => {
    soundManager.playClick();
    setCurrentPhase(newPhase);

    // Contextual camera adjustments for best visual presentation
    if (newPhase === 'setup') {
      setCameraMode('ground_base');
      addLog('Step 1: Rescue team base camp setup initiated. Van rear doors opened.', 'info');
    } else if (newPhase === 'takeoff_search') {
      setCameraMode('chase');
      addLog('Step 2: VTOL vertical climb to 50m. Autonomous grid search engaged.', 'info');
    } else if (newPhase === 'gps_loss') {
      setCameraMode('orbit');
      addLog('Step 3: ALERT! GPS signal lost. Automatic failover to Visual SLAM + LiDAR.', 'alert');
    } else if (newPhase === 'person_found') {
      setCameraMode('drone_gimbal');
      addLog('Step 4: AI YOLOv8 target match: Survivor found at 12.98N, 80.22E (95.4% Conf).', 'success');
    } else if (newPhase === 'payload_drop') {
      setCameraMode('survivor');
      addLog('Step 5: Precision hover locked. Lowering First-Aid kit via winch cable.', 'info');
    } else if (newPhase === 'live_relay') {
      setCameraMode('ground_base');
      addLog('Step 6: LoRa telemetry relayed to Disaster Rescue Boat Unit 3.', 'success');
    } else if (newPhase === 'rth_landing') {
      setCameraMode('orbit');
      addLog('Step 7: Mission successful! RTH landing on H-Pad completed. Battery 20%.', 'success');

      // Celebration confetti on mission completion!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [addLog]);

  // Auto-Play Step sequencer
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentPhase((current) => {
          const currentIndex = missionSteps.findIndex((s) => s.id === current);
          const nextIndex = (currentIndex + 1) % missionSteps.length;
          const nextPhase = missionSteps[nextIndex].id;
          handleSelectPhase(nextPhase);
          return nextPhase;
        });
      }, 7500); // Progress every 7.5 seconds
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, handleSelectPhase]);

  const handleReset = () => {
    soundManager.playClick();
    setIsAutoPlaying(false);
    handleSelectPhase('setup');
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* 1. Universal Top Bar */}
      <TopBar
        cameraMode={cameraMode}
        onCameraModeChange={(mode) => {
          soundManager.playClick();
          setCameraMode(mode);
        }}
        timeOfDay={timeOfDay}
        onTimeOfDayChange={(t) => {
          soundManager.playClick();
          setTimeOfDay(t);
        }}
        isThermal={isThermal}
        onToggleThermal={() => {
          soundManager.playClick();
          setIsThermal((prev) => !prev);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideOpen(true)}
        missionTime={telemetry.missionTimeSeconds}
        flightMode={telemetry.vtolFlightMode}
        isControlsOpen={!isCleanView && isControlsOpen}
        onToggleControls={() => setIsControlsOpen((prev) => !prev)}
        isTelemetryOpen={!isCleanView && isTelemetryOpen}
        onToggleTelemetry={() => setIsTelemetryOpen((prev) => !prev)}
        isTamil={isTamil}
        onToggleLanguage={() => setIsTamil((prev) => !prev)}
      />

      {/* 2. Main Simulation Viewport with Side Panels */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Side: 7 Mission Control Flow Buttons */}
        <MissionControls
          currentPhase={currentPhase}
          onSelectPhase={handleSelectPhase}
          isAutoPlaying={isAutoPlaying}
          onToggleAutoPlay={() => {
            soundManager.playClick();
            setIsAutoPlaying((prev) => !prev);
          }}
          onReset={handleReset}
          isTamil={isTamil}
          isOpen={!isCleanView && isControlsOpen}
          onClose={() => setIsControlsOpen(false)}
        />

        {/* Center: Full-Scale 3D Three.js Spatial Viewport */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <ThreeScene
            phase={currentPhase}
            cameraMode={cameraMode}
            timeOfDay={timeOfDay}
            weatherMode={weatherMode}
            isThermal={isThermal}
            floodHeight={floodHeight}
            isSurgeActive={isSurgeActive}
            boatDispatched={boatDispatched}
            onTelemetryUpdate={setTelemetry}
            onPhaseChange={handleSelectPhase}
            onBoatStatusChange={(status) => {
              if (status === 'at_survivor' && !logs.some(l => l.message.includes('Boat Unit 3 reached'))) {
                addLog('Rescue Boat Unit 3 reached stranded survivor on rooftop.', 'success');
              }
            }}
          />

          {/* Contextual Alert Banners for GPS loss, Person Found, Delivery */}
          <AlertBanner
            phase={currentPhase}
            isThermal={isThermal}
            onToggleThermal={() => {
              soundManager.playClick();
              setIsThermal((prev) => !prev);
            }}
          />

          {/* Bottom Floating Quick Navigation Dock */}
          <QuickActionDock
            currentPhase={currentPhase}
            onSelectPhase={handleSelectPhase}
            isAutoPlaying={isAutoPlaying}
            onToggleAutoPlay={() => {
              soundManager.playClick();
              setIsAutoPlaying((prev) => !prev);
            }}
            onReset={handleReset}
            isCleanView={isCleanView}
            onToggleCleanView={() => {
              soundManager.playClick();
              setIsCleanView((prev) => !prev);
            }}
            isTamil={isTamil}
            onToggleLanguage={() => {
              soundManager.playClick();
              setIsTamil((prev) => !prev);
            }}
            cameraMode={cameraMode}
            onCameraModeChange={(c) => {
              soundManager.playClick();
              setCameraMode(c);
            }}
          />

          {/* Interactive Disaster Flood Simulation & Weather Controller */}
          <FloodController
            floodHeight={floodHeight}
            onFloodHeightChange={(h) => {
              setFloodHeight(h);
              setIsSurgeActive(h > 3.5);
              if (h >= 4.0 && !logs.some(l => l.message.includes('Water level surge'))) {
                addLog(`Water level surge alert: Flooding reached +${h.toFixed(1)}m.`, 'warning');
              }
            }}
            weatherMode={weatherMode}
            onWeatherModeChange={(w) => {
              setWeatherMode(w);
              if (w === 'storm_night') {
                setTimeOfDay('night');
                addLog('Severe night storm system with lightning active.', 'warning');
              } else if (w === 'monsoon_rain') {
                addLog('Tropical monsoon heavy rain active.', 'info');
              }
            }}
            boatDispatched={boatDispatched || currentPhase === 'live_relay'}
            onToggleBoatDispatch={() => {
              setBoatDispatched((prev) => {
                const next = !prev;
                if (next) {
                  addLog('Disaster Response Boat Unit 3 dispatched to flood zone.', 'info');
                } else {
                  addLog('Rescue boat returning to base dock.', 'info');
                }
                return next;
              });
            }}
            cameraMode={cameraMode}
            onCameraModeChange={(c) => {
              soundManager.playClick();
              setCameraMode(c);
            }}
          />

          {/* Picture-In-Picture: 4K Drone Gimbal Camera with YOLO Bounding Box */}
          <GimbalCameraPIP
            phase={currentPhase}
            isThermal={isThermal}
            onToggleThermal={() => {
              soundManager.playClick();
              setIsThermal((prev) => !prev);
            }}
            batteryPercent={telemetry.batteryPercent}
            altitudeMeters={telemetry.altitudeMeters}
          />
        </main>

        {/* Right Side: Telemetry HUD Panel */}
        <TelemetryHUD
          telemetry={telemetry}
          logs={logs}
          isOpen={!isCleanView && isTelemetryOpen}
          onToggle={() => setIsTelemetryOpen((prev) => !prev)}
        />
      </div>

      {/* 3. Technical Project Architecture & Specs Modal */}
      <InfoGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
