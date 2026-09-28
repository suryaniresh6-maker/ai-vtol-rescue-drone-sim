import React from 'react';
import { 
  X, 
  Cpu, 
  Radio, 
  Compass, 
  Anchor, 
  ShieldCheck, 
  Zap, 
  Layers, 
  FileText 
} from 'lucide-react';

interface InfoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoGuideModal: React.FC<InfoGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base md:text-lg text-slate-100 tracking-wide">
                AI Hybrid VTOL Rescue Drone System Specs
              </h2>
              <p className="text-xs text-slate-400">
                Disaster Response & Ground Team Telemetry Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs / Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 text-slate-300 text-xs md:text-sm">
          {/* 1. Core Technical Specifications */}
          <div>
            <h3 className="font-display font-semibold text-sky-400 uppercase tracking-wider text-xs mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> 01. Hybrid VTOL Airframe Architecture
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono-nums">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Wingspan</span>
                <span className="text-sm font-bold text-slate-100">2.8 Meters</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cruising Range</span>
                <span className="text-sm font-bold text-slate-100">45 km @ 68 km/h</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Flight Endurance</span>
                <span className="text-sm font-bold text-slate-100">85 - 95 mins</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Max Takeoff Weight</span>
                <span className="text-sm font-bold text-slate-100">14.5 kg (MTOW)</span>
              </div>
            </div>
          </div>

          {/* 2. Visual-Inertial SLAM (GPS-Denied Navigation) */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <h3 className="font-display font-semibold text-sky-400 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> 02. GPS-Loss Fallback: Visual-Inertial SLAM & LiDAR Fusion
            </h3>
            <p className="text-slate-300 leading-relaxed mb-2">
              In severe disaster zones (urban canyons, collapsed valleys, or electronic jamming), GPS signals frequently degrade or fail completely. This drone features an onboard <strong>Jetson Orin Nano companion computer</strong> running <strong>ORB-SLAM3 fused with a 16-channel 360° LiDAR puck and 6-DOF IMU</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs font-mono-nums">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-sky-300 font-semibold">Optical Keypoint Tracking:</span> 800+ feature points per frame at 30 FPS.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-sky-300 font-semibold">LiDAR Point Cloud:</span> 360° depth obstacle avoidance & terrain elevation profiling.
              </div>
            </div>
          </div>

          {/* 3. LoRa Telemetry & Ground Station Relay */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <h3 className="font-display font-semibold text-sky-400 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
              <Radio className="w-4 h-4" /> 03. Long-Range LoRa 868.1 MHz Communication Link
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Standard 2.4GHz / 5.8GHz Wi-Fi links fail within 1-2 km in disaster areas. The system uses a dedicated <strong>Semtech SX1262 LoRa module</strong> transmitting encrypted telemetry, emergency coordinate packets, and mission health data up to <strong>15+ km line-of-sight</strong> even with zero cellular network coverage.
            </p>
          </div>

          {/* 4. YOLO AI Target Detection & Winch Drop */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <h3 className="font-display font-semibold text-sky-400 uppercase tracking-wider text-xs mb-2 flex items-center gap-1.5">
              <Anchor className="w-4 h-4" /> 04. AI Detection & Motorized Winch Delivery
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Upon detecting stranded humans via YOLOv8 (RGB and Thermal infrared FLIR), the drone calculates wind drift, enters precision VTOL hover, and unspools a 12-meter Dyneema winch line carrying a waterproof First-Aid survival kit containing emergency rations, water purification, and a VHF distress beacon.
            </p>
          </div>

          {/* 5. College Viva / Presentation Highlights */}
          <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30">
            <h3 className="font-display font-semibold text-sky-300 uppercase tracking-wider text-xs mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Presentation & Demo Guide for Evaluators
            </h3>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
              <li>Use the <strong>7 Buttons on the Left Panel</strong> to walk through each phase of the rescue mission sequentially.</li>
              <li>Toggle <strong>Thermal FLIR</strong> or <strong>Night Mode</strong> to demonstrate nighttime search capabilities.</li>
              <li>Switch between <strong>Free Orbit</strong>, <strong>Chase Cam</strong>, and <strong>Gimbal POV</strong> to showcase the 3D realism.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono-nums">
            Project: Hybrid VTOL Disaster Rescue System
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
