/**
 * Types and interfaces for the AI Hybrid VTOL Rescue Drone Simulation
 */

export type SimulationPhase = 
  | 'setup'          // Step 1: Team Setup at base van
  | 'takeoff_search' // Step 2: VTOL takeoff & lawnmower grid search
  | 'gps_loss'       // Step 3: GPS Loss & V-SLAM recovery
  | 'person_found'   // Step 4: AI YOLO person detected alert
  | 'payload_drop'   // Step 5: Winch First-Aid kit deployment
  | 'live_relay'     // Step 6: LoRa packet relay & ground update
  | 'rth_landing';   // Step 7: Return to Home & precision landing

export type CameraMode = 'orbit' | 'chase' | 'drone_gimbal' | 'ground_base' | 'survivor' | 'flood_cam' | 'boat_cam';

export type TimeOfDay = 'day' | 'dusk' | 'night';

export type WeatherMode = 'clear' | 'monsoon_rain' | 'storm_night';

export interface TelemetryData {
  phase: SimulationPhase;
  altitudeMeters: number;
  batteryPercent: number;
  speedKmh: number;
  pitchDeg: number;
  rollDeg: number;
  yawDeg: number;
  gpsStatus: 'OPTIMAL' | 'DEGRADED' | 'LOST' | 'SLAM_BACKUP';
  gpsSatellites: number;
  hdop: number;
  slamStatus: 'STANDBY' | 'INITIALIZING' | 'ACTIVE_LOCALIZING' | 'LIDAR_FUSED';
  slamKeypoints: number;
  aiStatus: 'SEARCHING' | 'TARGET_ACQUIRED' | 'TRACKING' | 'PAYLOAD_LOCK';
  detectedConfidence: number;
  targetCoords: {
    lat: string;
    lng: string;
    description: string;
  };
  loraRssi: number; // dBm
  loraSnr: number;  // dB
  loraPacketsSent: number;
  loraPacketsRecv: number;
  loraFrequency: string; // e.g. "868.1 MHz / 915 MHz"
  winchLengthMeters: number;
  winchStatus: 'STOWED' | 'LOWERING' | 'RELEASED' | 'RETRACTING';
  missionTimeSeconds: number;
  vtolFlightMode: 'VTOL_HOVER' | 'TRANSITION' | 'FIXED_WING_CRUISE' | 'LANDING';
  floodHeightMeters: number;
  floodSurgeActive: boolean;
  boatStatus: 'docked' | 'transit' | 'at_survivor';
}

export interface FlightLogEntry {
  id: string;
  time: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  message: string;
}

export interface StepConfig {
  id: SimulationPhase;
  stepNumber: number;
  title: string;
  subtitle: string;
  tamilTitle?: string;
  tamilDescription?: string;
  description: string;
  badge: string;
}
