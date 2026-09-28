import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimulationPhase, CameraMode, TimeOfDay, WeatherMode, TelemetryData } from '../types/drone';
import { soundManager } from '../utils/audio';

interface ThreeSceneProps {
  phase: SimulationPhase;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  weatherMode: WeatherMode;
  isThermal: boolean;
  floodHeight: number;
  isSurgeActive: boolean;
  boatDispatched: boolean;
  onTelemetryUpdate: (updater: (prev: TelemetryData) => TelemetryData) => void;
  onPhaseChange?: (phase: SimulationPhase) => void;
  onBoatStatusChange?: (status: 'docked' | 'transit' | 'at_survivor') => void;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({
  phase,
  cameraMode,
  timeOfDay,
  weatherMode,
  isThermal,
  floodHeight,
  isSurgeActive,
  boatDispatched,
  onTelemetryUpdate,
  onBoatStatusChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // References to 3D entities
  const droneGroupRef = useRef<THREE.Group | null>(null);
  const droneBodyRef = useRef<THREE.Group | null>(null);
  const vtolRotorsRef = useRef<THREE.Mesh[]>([]);
  const pusherPropRef = useRef<THREE.Mesh | null>(null);
  const lidarPuckRef = useRef<THREE.Mesh | null>(null);
  const lidarLaserRaysRef = useRef<THREE.LineSegments | null>(null);
  const gimbalRef = useRef<THREE.Group | null>(null);
  const vanDoorLeftRef = useRef<THREE.Group | null>(null);
  const vanDoorRightRef = useRef<THREE.Group | null>(null);
  const winchLineRef = useRef<THREE.Line | null>(null);
  const aidCrateRef = useRef<THREE.Group | null>(null);
  const loraBeamRef = useRef<THREE.Line | null>(null);
  const loraPacketsRef = useRef<THREE.Mesh[]>([]);
  const loraWavesRef = useRef<THREE.Mesh[]>([]);
  const slamPointsRef = useRef<THREE.Points | null>(null);
  const slamConeRef = useRef<THREE.Mesh | null>(null);
  const searchSpotlightRef = useRef<THREE.SpotLight | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const waterFoamMeshRef = useRef<THREE.Mesh | null>(null);
  const survivorRef = useRef<THREE.Group | null>(null);
  const survivorFlareLightRef = useRef<THREE.PointLight | null>(null);
  const flareSmokeParticlesRef = useRef<THREE.Points | null>(null);
  const rainSystemRef = useRef<THREE.Points | null>(null);
  const floatingDebrisRef = useRef<THREE.Group[]>([]);
  const rescueBoatRef = useRef<THREE.Group | null>(null);
  const boatWakeRef = useRef<THREE.Mesh | null>(null);
  const lightningLightRef = useRef<THREE.PointLight | null>(null);

  // Base positions
  const baseCampPos = useRef<THREE.Vector3>(new THREE.Vector3(-45, 3.2, -35));
  const survivorPos = useRef<THREE.Vector3>(new THREE.Vector3(28, 8.5, 32));
  const boatDockPos = useRef<THREE.Vector3>(new THREE.Vector3(-35, 1.2, -18));
  const boatCurrentPos = useRef<THREE.Vector3>(new THREE.Vector3(-35, 1.2, -18));
  const boatProgress = useRef<number>(0);

  // Lights & Environment
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const skyMeshRef = useRef<THREE.Mesh | null>(null);

  // Animation states
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3(-45, 3.3, -35));
  const targetPos = useRef<THREE.Vector3>(new THREE.Vector3(-45, 3.3, -35));
  const droneRotation = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const winchProgress = useRef<number>(0);
  const searchGridIndex = useRef<number>(0);
  const missionStartTime = useRef<number>(Date.now());
  const packetFlyTimes = useRef<number[]>([0, 0.25, 0.5, 0.75]);
  const currentWaterLevel = useRef<number>(floodHeight);
  const targetWaterLevel = useRef<number>(floodHeight);

  // Search Waypoints
  const searchWaypoints = useRef<THREE.Vector3[]>([
    new THREE.Vector3(-30, 24, -15),
    new THREE.Vector3(-10, 24, -30),
    new THREE.Vector3(15, 25, -25),
    new THREE.Vector3(25, 25, -5),
    new THREE.Vector3(0, 24, 10),
    new THREE.Vector3(-20, 24, 25),
    new THREE.Vector3(12, 24, 28),
  ]);

  // Sync incoming floodHeight prop with targetWaterLevel
  useEffect(() => {
    targetWaterLevel.current = floodHeight;
  }, [floodHeight]);

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0e1726);
    scene.fog = new THREE.FogExp2(0x0e1726, 0.006);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.5,
      1200
    );
    camera.position.set(-78, 48, -72);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 4;
    controls.maxDistance = 300;
    controls.target.set(-15, 8, -5);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xd5e3f5, 0.85);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xfff7e6, 2.4);
    sunLight.position.set(70, 95, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 320;
    sunLight.shadow.camera.left = -110;
    sunLight.shadow.camera.right = 110;
    sunLight.shadow.camera.top = 110;
    sunLight.shadow.camera.bottom = -110;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d4835, 0.65);
    scene.add(hemiLight);

    // Lightning Flash Light (triggered during storms)
    const lightning = new THREE.PointLight(0xdbeafe, 0, 400);
    lightning.position.set(20, 90, 20);
    scene.add(lightning);
    lightningLightRef.current = lightning;

    // 6. Sky Dome
    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x82b4df, side: THREE.BackSide });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);
    skyMeshRef.current = skyMesh;

    // ==========================================
    // BUILD 3D DISASTER SCENE WITH FLOOD
    // ==========================================
    buildDisasterEnvironment(scene);

    // ==========================================
    // BUILD RESCUE CAMP & BASE VAN
    // ==========================================
    buildRescueBaseCamp(scene);

    // ==========================================
    // BUILD 3D HYBRID VTOL DRONE MODEL
    // ==========================================
    buildHybridVtolDrone(scene);

    // ==========================================
    // BUILD RESCUE BOAT & FLOATING DEBRIS
    // ==========================================
    buildRescueBoatAndDebris(scene);

    // ==========================================
    // BUILD RAIN & STORM SYSTEM
    // ==========================================
    buildRainSystem(scene);

    // ==========================================
    // BUILD LORA & SLAM VISUALIZERS
    // ==========================================
    buildVisualizers(scene);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Main Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // 1. Dynamic Water Level Transition (Rising/Surging Flood)
      currentWaterLevel.current = THREE.MathUtils.lerp(
        currentWaterLevel.current,
        targetWaterLevel.current,
        delta * 1.2
      );

      // Update Flood Water Mesh Height and Waves
      if (waterMeshRef.current) {
        waterMeshRef.current.position.y = currentWaterLevel.current;

        const pos = waterMeshRef.current.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const u = pos.getX(i);
          const v = pos.getY(i);
          // Complex dual-frequency water chop
          const z =
            Math.sin(u * 0.18 + elapsed * 2.2) * 0.28 +
            Math.cos(v * 0.22 + elapsed * 1.8) * 0.22 +
            Math.sin((u + v) * 0.12 + elapsed * 3.0) * 0.12;
          pos.setZ(i, z);
        }
        pos.needsUpdate = true;
      }

      // Update Floating Debris & Submerged Vehicles with Water Level
      floatingDebrisRef.current.forEach((debris, index) => {
        const baseOffset = (debris as any).waterOffset || 0;
        debris.position.y = currentWaterLevel.current + baseOffset + Math.sin(elapsed * 2 + index) * 0.15;
        debris.rotation.z = Math.sin(elapsed * 1.5 + index) * 0.08;
        debris.rotation.x = Math.cos(elapsed * 1.2 + index) * 0.06;
      });

      // 2. Animate Rain System if raining
      if (rainSystemRef.current && (weatherMode === 'monsoon_rain' || weatherMode === 'storm_night')) {
        const rainPos = rainSystemRef.current.geometry.attributes.position;
        for (let i = 0; i < rainPos.count; i++) {
          let y = rainPos.getY(i) - delta * 60;
          if (y < currentWaterLevel.current) {
            y = 80 + Math.random() * 20;
          }
          rainPos.setY(i, y);
        }
        rainPos.needsUpdate = true;
      }

      // 3. Lightning Flashes in Storm Mode
      if (lightningLightRef.current && weatherMode === 'storm_night') {
        if (Math.random() > 0.985) {
          lightningLightRef.current.intensity = 8.0;
          lightningLightRef.current.position.set(
            (Math.random() - 0.5) * 120,
            75,
            (Math.random() - 0.5) * 120
          );
        } else {
          lightningLightRef.current.intensity = THREE.MathUtils.lerp(
            lightningLightRef.current.intensity,
            0,
            0.15
          );
        }
      }

      // 4. Update Rescue Boat Movement (Speeding across flood in Step 6 / on demand)
      updateRescueBoat(delta, elapsed);

      // 5. Update Drone Flight & VTOL Props
      updateDroneFlight(delta, elapsed);

      // 6. Update LoRa Waves & Packet Pulses
      updateLoraComms(elapsed);

      // 7. Update LiDAR Scanning Lasers
      updateLidarScan(delta, elapsed);

      // 8. Update Survivor Waving & Flare Smoke
      updateSurvivor(elapsed);

      // 9. Camera Choreography
      updateCameraChoreography();

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Weather & Time of Day
  useEffect(() => {
    if (!sceneRef.current || !sunLightRef.current || !ambientLightRef.current || !skyMeshRef.current) return;

    if (rainSystemRef.current) {
      rainSystemRef.current.visible = weatherMode === 'monsoon_rain' || weatherMode === 'storm_night';
    }

    if (isThermal) {
      sceneRef.current.background = new THREE.Color(0x06060c);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x06060c);
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x0a0c16);
      ambientLightRef.current.color.set(0x8a9ba8);
      ambientLightRef.current.intensity = 1.3;
      sunLightRef.current.intensity = 0.8;
      sunLightRef.current.color.set(0x9fc3e8);
      return;
    }

    if (weatherMode === 'storm_night') {
      sceneRef.current.background = new THREE.Color(0x050810);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x050810);
        sceneRef.current.fog.density = 0.012;
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x070b16);
      ambientLightRef.current.color.set(0x1e293b);
      ambientLightRef.current.intensity = 0.35;
      sunLightRef.current.intensity = 0.2;
      sunLightRef.current.color.set(0x64748b);
      return;
    }

    if (weatherMode === 'monsoon_rain') {
      sceneRef.current.background = new THREE.Color(0x475569);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x475569);
        sceneRef.current.fog.density = 0.01;
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x52627a);
      ambientLightRef.current.color.set(0x94a3b8);
      ambientLightRef.current.intensity = 0.7;
      sunLightRef.current.intensity = 1.2;
      sunLightRef.current.color.set(0xdbeafe);
      return;
    }

    // Clear Weather Mode:
    if (timeOfDay === 'day') {
      sceneRef.current.background = new THREE.Color(0x76a7d0);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x76a7d0);
        sceneRef.current.fog.density = 0.005;
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x7fb8e6);
      ambientLightRef.current.color.set(0xd5e3f5);
      ambientLightRef.current.intensity = 1.0;
      sunLightRef.current.intensity = 2.4;
      sunLightRef.current.color.set(0xfffaed);
      sunLightRef.current.position.set(70, 95, 45);
    } else if (timeOfDay === 'dusk') {
      sceneRef.current.background = new THREE.Color(0x32233b);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x32233b);
        sceneRef.current.fog.density = 0.007;
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x4a2a4c);
      ambientLightRef.current.color.set(0xda937d);
      ambientLightRef.current.intensity = 0.8;
      sunLightRef.current.intensity = 1.8;
      sunLightRef.current.color.set(0xff7744);
      sunLightRef.current.position.set(100, 30, 20);
    } else {
      // Night Mode
      sceneRef.current.background = new THREE.Color(0x070b12);
      if (sceneRef.current.fog instanceof THREE.FogExp2) {
        sceneRef.current.fog.color = new THREE.Color(0x070b12);
        sceneRef.current.fog.density = 0.009;
      }
      (skyMeshRef.current.material as THREE.MeshBasicMaterial).color.set(0x0b101c);
      ambientLightRef.current.color.set(0x2d3748);
      ambientLightRef.current.intensity = 0.4;
      sunLightRef.current.intensity = 0.5;
      sunLightRef.current.color.set(0x90cdf4);
      sunLightRef.current.position.set(30, 80, -50);
    }
  }, [timeOfDay, weatherMode, isThermal]);

  // Handle Simulation Phase Triggers
  useEffect(() => {
    switch (phase) {
      case 'setup':
        targetPos.current.set(baseCampPos.current.x, baseCampPos.current.y, baseCampPos.current.z);
        winchProgress.current = 0;
        soundManager.stopDroneEngine();
        break;

      case 'takeoff_search':
        targetPos.current.copy(searchWaypoints.current[0]);
        searchGridIndex.current = 0;
        soundManager.startDroneEngine();
        break;

      case 'gps_loss':
        targetPos.current.set(10, 24, 15);
        soundManager.playGpsLossAlarm();
        soundManager.startDroneEngine();
        break;

      case 'person_found':
        targetPos.current.set(survivorPos.current.x, 22, survivorPos.current.z);
        soundManager.playAiDetectionAlert();
        soundManager.startDroneEngine();
        break;

      case 'payload_drop':
        targetPos.current.set(survivorPos.current.x, 18, survivorPos.current.z);
        soundManager.playWinchSound();
        soundManager.startDroneEngine();
        break;

      case 'live_relay':
        targetPos.current.set(survivorPos.current.x, 20, survivorPos.current.z);
        soundManager.playTelemetryBeep();
        soundManager.playBoatMotorSound();
        soundManager.startDroneEngine();
        break;

      case 'rth_landing':
        targetPos.current.set(baseCampPos.current.x, baseCampPos.current.y, baseCampPos.current.z);
        soundManager.startDroneEngine();
        break;
    }
  }, [phase]);

  // ========================================================
  // 3D SCENE BUILDERS
  // ========================================================

  const buildDisasterEnvironment = (scene: THREE.Scene) => {
    // 1. Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(260, 260, 52, 52);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let y = 0;
      if (x < -24) {
        // High dry embankment with road & camp
        y = 3.6 + Math.sin(z * 0.05) * 0.4;
      } else if (x > 38) {
        // Landslide mountain ridge
        y = Math.max(0, (x - 38) * 0.6 + Math.sin(z * 0.08) * 3.5);
      } else {
        // Deep flooded basin valley
        y = Math.sin(x * 0.07) * 1.5 + Math.cos(z * 0.05) * 1.8 - 2.2;
      }
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x3d4734,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 2. Mudslide Mountain Tongue
    const mudGeo = new THREE.BoxGeometry(42, 2.5, 80);
    const mudMat = new THREE.MeshStandardMaterial({
      color: 0x4d321d,
      roughness: 0.95,
      flatShading: true,
    });
    const mudMesh = new THREE.Mesh(mudGeo, mudMat);
    mudMesh.position.set(62, 5, 10);
    mudMesh.rotation.z = -0.25;
    mudMesh.receiveShadow = true;
    scene.add(mudMesh);

    // 3. Flood Water Surface
    const waterGeo = new THREE.PlaneGeometry(190, 220, 48, 48);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a4656,
      roughness: 0.15,
      metalness: 0.7,
      transparent: true,
      opacity: 0.88,
      flatShading: true,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(8, currentWaterLevel.current, 0);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 4. Buildings in Flooded Zone
    const buildingsData = [
      { x: -6, z: -26, h: 7, rot: 0.1, color: 0x7c7365 },
      { x: 14, z: -38, h: 9.5, rot: -0.2, color: 0x938876 },
      { x: -14, z: 16, h: 8, rot: 0.35, color: 0x6e685f },
      { x: 6, z: 46, h: 6.5, rot: -0.15, color: 0x8a7f72 },
      { x: 22, z: -10, h: 11, rot: 0.22, color: 0x5b626e },
      // SURVIVOR'S TWO-STORY RESCUE ROOFTOP:
      { x: survivorPos.current.x, z: survivorPos.current.z, h: 8.5, rot: 0.05, color: 0x475569 },
    ];

    buildingsData.forEach((b, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);
      bGroup.rotation.y = b.rot;

      // Concrete walls
      const wallGeo = new THREE.BoxGeometry(10.5, b.h, 12.5);
      const wallMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.85, flatShading: true });
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.y = b.h / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      bGroup.add(wallMesh);

      // Rooftop parapet
      const parapetGeo = new THREE.BoxGeometry(10.9, 0.9, 12.9);
      const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const parapetMesh = new THREE.Mesh(parapetGeo, parapetMat);
      parapetMesh.position.y = b.h + 0.45;
      parapetMesh.castShadow = true;
      bGroup.add(parapetMesh);

      // Water Level Depth Gauge Stick on corner of building
      const gaugeGeo = new THREE.BoxGeometry(0.3, b.h, 0.3);
      const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15 }); // Bright Yellow
      const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
      gauge.position.set(5.35, b.h / 2, 6.35);
      bGroup.add(gauge);

      // Gauge depth stripes (1m intervals)
      for (let m = 1; m < b.h; m += 1) {
        const stripeGeo = new THREE.BoxGeometry(0.35, 0.1, 0.35);
        const stripeMat = new THREE.MeshBasicMaterial({ color: m % 2 === 0 ? 0xef4444 : 0x000000 });
        const mark = new THREE.Mesh(stripeGeo, stripeMat);
        mark.position.set(5.35, m, 6.35);
        bGroup.add(mark);
      }

      // Windows
      for (let floor = 1; floor <= Math.floor(b.h / 3); floor++) {
        const winGeo = new THREE.BoxGeometry(1.6, 1.2, 0.1);
        const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
        const win1 = new THREE.Mesh(winGeo, winMat);
        win1.position.set(-2.5, floor * 2.8, 6.3);
        bGroup.add(win1);
        const win2 = new THREE.Mesh(winGeo, winMat);
        win2.position.set(2.5, floor * 2.8, 6.3);
        bGroup.add(win2);
      }

      // If survivor building:
      if (idx === buildingsData.length - 1) {
        const survivor = createSurvivorModel();
        survivor.position.set(1.2, b.h + 0.9, -1.2);
        bGroup.add(survivor);
        survivorRef.current = survivor;

        // Emergency SOS marking painted on roof
        const sosGeo = new THREE.BoxGeometry(5.2, 0.05, 2.0);
        const sosMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const sos = new THREE.Mesh(sosGeo, sosMat);
        sos.position.set(-1.8, b.h + 0.92, 2.2);
        bGroup.add(sos);
      }

      scene.add(bGroup);
    });

    // 5. Partially Submerged Collapsed Bridge Section
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 2.2, -6);
    bridgeGroup.rotation.y = 0.45;
    bridgeGroup.rotation.z = -0.15; // Collapsed tilted into flood

    const roadGeo = new THREE.BoxGeometry(6, 0.8, 36);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.castShadow = true;
    road.receiveShadow = true;
    bridgeGroup.add(road);

    // Bridge railings
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 });
    for (let r = -16; r <= 16; r += 4) {
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), railMat);
      postL.position.set(-2.9, 0.8, r);
      bridgeGroup.add(postL);
      const postR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), railMat);
      postR.position.set(2.9, 0.8, r);
      bridgeGroup.add(postR);
    }
    scene.add(bridgeGroup);

    // 6. Submerged Cars (floating / tilted in flood water)
    const carPositions = [
      { x: -3, z: -10, rotY: 0.8, rotZ: 0.15, color: 0xef4444 }, // Red sedan
      { x: 12, z: 8, rotY: -0.5, rotZ: -0.2, color: 0x3b82f6 },  // Blue SUV
      { x: -8, z: 32, rotY: 1.2, rotZ: 0.1, color: 0xe2e8f0 },  // White pickup
    ];

    carPositions.forEach((cp) => {
      const car = createSubmergedCar(cp.color);
      car.position.set(cp.x, currentWaterLevel.current - 0.3, cp.z);
      car.rotation.y = cp.rotY;
      car.rotation.z = cp.rotZ;
      (car as any).waterOffset = -0.3;
      floatingDebrisRef.current.push(car);
      scene.add(car);
    });

    // 7. Trees on embankment
    const treePositions = [
      { x: -32, z: -12 }, { x: -36, z: 8 }, { x: -30, z: 22 },
      { x: 38, z: -25 }, { x: 44, z: -10 }, { x: 40, z: 35 },
      { x: 48, z: 12 }, { x: -26, z: -42 }
    ];
    treePositions.forEach((tp) => {
      const tree = createLowPolyTree();
      tree.position.set(tp.x, 3.6, tp.z);
      scene.add(tree);
    });
  };

  const createSubmergedCar = (bodyColor: number): THREE.Group => {
    const car = new THREE.Group();
    // Chassis
    const chassisGeo = new THREE.BoxGeometry(2.2, 1.0, 4.4);
    const chassisMat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.4, roughness: 0.3 });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.5;
    chassis.castShadow = true;
    car.add(chassis);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.9, 0.8, 2.2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.25, -0.2);
    car.add(cabin);

    return car;
  };

  const createSurvivorModel = (): THREE.Group => {
    const survivor = new THREE.Group();

    // Torso in Hi-Vis Orange
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.0, 0.4);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.3;
    torso.castShadow = true;
    survivor.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.5, 0.45);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.05;
    head.castShadow = true;
    survivor.add(head);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const legGeo = new THREE.BoxGeometry(0.28, 0.9, 0.35);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.2, 0.45, 0);
    survivor.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.2, 0.45, 0);
    survivor.add(legR);

    // Waving Arm holding an Emergency Flare!
    const armGeo = new THREE.BoxGeometry(0.22, 0.8, 0.22);
    const wavingArmGroup = new THREE.Group();
    wavingArmGroup.name = 'wavingArm';
    wavingArmGroup.position.set(0.5, 1.7, 0);

    const rightArm = new THREE.Mesh(armGeo, torsoMat);
    rightArm.position.set(0, 0.4, 0);
    rightArm.castShadow = true;
    wavingArmGroup.add(rightArm);

    // Distress Flare Stick in Hand
    const flareGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
    const flareMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const flareStick = new THREE.Mesh(flareGeo, flareMat);
    flareStick.position.set(0, 0.9, 0.2);
    flareStick.rotation.x = 0.5;
    wavingArmGroup.add(flareStick);

    // Flare burning tip
    const flareTipGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const flareTipMat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const flareTip = new THREE.Mesh(flareTipGeo, flareTipMat);
    flareTip.position.set(0, 1.25, 0.35);
    wavingArmGroup.add(flareTip);

    // Glowing flare light
    const flareLight = new THREE.PointLight(0xff5500, 2.5, 14);
    flareLight.position.set(0, 1.25, 0.35);
    wavingArmGroup.add(flareLight);
    survivorFlareLightRef.current = flareLight;

    survivor.add(wavingArmGroup);

    return survivor;
  };

  const createLowPolyTree = (): THREE.Group => {
    const tree = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.9;
    trunk.castShadow = true;
    tree.add(trunk);

    const folGeo = new THREE.ConeGeometry(2.8, 4.2, 6);
    const folMat = new THREE.MeshStandardMaterial({ color: 0x2e5a27, flatShading: true });
    const fol = new THREE.Mesh(folGeo, folMat);
    fol.position.y = 4.8;
    fol.castShadow = true;
    tree.add(fol);
    return tree;
  };

  const buildRescueBoatAndDebris = (scene: THREE.Scene) => {
    // 1. Rescue Boat (Zodiac Emergency RIB)
    const boat = new THREE.Group();
    boat.position.copy(boatDockPos.current);
    boatCurrentPos.current.copy(boatDockPos.current);

    // Orange Hull
    const hullGeo = new THREE.BoxGeometry(2.2, 0.7, 5.0);
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4 }); // Safety Orange
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.35;
    hull.castShadow = true;
    boat.add(hull);

    // Inflatable Sponsons (pontoon tubes on edges)
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const tubeL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.2, 12), tubeMat);
    tubeL.rotation.x = Math.PI / 2;
    tubeL.position.set(-1.15, 0.5, 0);
    boat.add(tubeL);

    const tubeR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 5.2, 12), tubeMat);
    tubeR.rotation.x = Math.PI / 2;
    tubeR.position.set(1.15, 0.5, 0);
    boat.add(tubeR);

    // Outboard Motor
    const motorGeo = new THREE.BoxGeometry(0.6, 1.1, 0.6);
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(0, 0.6, -2.6);
    boat.add(motor);

    // 2 Rescue Personnel in boat
    const crew1 = createRescueHumanModel(0x0284c7, false);
    crew1.position.set(0, 0.4, 0.8);
    crew1.scale.set(0.85, 0.85, 0.85);
    boat.add(crew1);

    const crew2 = createRescueHumanModel(0xea580c, false);
    crew2.position.set(0, 0.4, -0.6);
    crew2.scale.set(0.85, 0.85, 0.85);
    boat.add(crew2);

    // Blue emergency strobe light on boat bow
    const blueStrobe = new THREE.PointLight(0x38bdf8, 1.8, 12);
    blueStrobe.position.set(0, 1.2, 2.3);
    boat.add(blueStrobe);

    scene.add(boat);
    rescueBoatRef.current = boat;

    // 2. Floating Debris (Barrels, pallets, life rings drifting in flood)
    const debrisPositions = [
      { x: -18, z: -2, type: 'barrel' },
      { x: 2, z: 18, type: 'pallet' },
      { x: -5, z: 28, type: 'barrel' },
      { x: 18, z: -15, type: 'pallet' },
      { x: 10, z: 38, type: 'buoy' },
    ];

    debrisPositions.forEach((dp) => {
      const dGroup = new THREE.Group();
      dGroup.position.set(dp.x, currentWaterLevel.current, dp.z);

      if (dp.type === 'barrel') {
        const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.y = 0.2;
        dGroup.add(barrel);
      } else if (dp.type === 'pallet') {
        const palletGeo = new THREE.BoxGeometry(2.0, 0.25, 2.0);
        const palletMat = new THREE.MeshStandardMaterial({ color: 0x854d0e });
        const pallet = new THREE.Mesh(palletGeo, palletMat);
        pallet.position.y = 0.1;
        dGroup.add(pallet);
      } else {
        const buoyGeo = new THREE.TorusGeometry(0.6, 0.2, 8, 16);
        const buoyMat = new THREE.MeshStandardMaterial({ color: 0xff4500 });
        const buoy = new THREE.Mesh(buoyGeo, buoyMat);
        buoy.rotation.x = Math.PI / 2;
        buoy.position.y = 0.15;
        dGroup.add(buoy);
      }

      (dGroup as any).waterOffset = 0.1;
      floatingDebrisRef.current.push(dGroup);
      scene.add(dGroup);
    });
  };

  const buildRescueBaseCamp = (scene: THREE.Scene) => {
    const campGroup = new THREE.Group();
    campGroup.position.copy(baseCampPos.current);

    // H-PAD Landing Target
    const padGeo = new THREE.CylinderGeometry(5.5, 5.5, 0.25, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = -0.1;
    pad.receiveShadow = true;
    campGroup.add(pad);

    const ringGeo = new THREE.RingGeometry(4.5, 4.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.04;
    campGroup.add(ring);

    // Yellow "H" symbol
    const hBarMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 3.2), hBarMat);
    h1.position.set(-1.1, 0.05, 0);
    campGroup.add(h1);
    const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 3.2), hBarMat);
    h2.position.set(1.1, 0.05, 0);
    campGroup.add(h2);
    const h3 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.5), hBarMat);
    h3.position.set(0, 0.05, 0);
    campGroup.add(h3);

    // 4 Corner Solar Perimeter Beacons
    for (let c = 0; c < 4; c++) {
      const angle = (c * Math.PI) / 2 + Math.PI / 4;
      const beaconLight = new THREE.PointLight(0x22c55e, 1.2, 8);
      beaconLight.position.set(Math.cos(angle) * 5.2, 0.5, Math.sin(angle) * 5.2);
      campGroup.add(beaconLight);
    }

    // Rescue Van
    const van = new THREE.Group();
    van.position.set(-9, 0, -2);
    van.rotation.y = Math.PI * 0.45;

    const vanChassisGeo = new THREE.BoxGeometry(4.2, 2.6, 8.5);
    const vanMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
    const vanChassis = new THREE.Mesh(vanChassisGeo, vanMat);
    vanChassis.position.y = 1.9;
    vanChassis.castShadow = true;
    van.add(vanChassis);

    const stripeGeo = new THREE.BoxGeometry(4.25, 0.7, 8.52);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xea580c });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.8;
    van.add(stripe);

    const cabGeo = new THREE.BoxGeometry(3.8, 1.3, 2.2);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const glass = new THREE.Mesh(cabGeo, glassMat);
    glass.position.set(0, 2.5, 2.8);
    van.add(glass);

    // Van Rear Doors
    const doorGeo = new THREE.BoxGeometry(1.8, 2.3, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });

    const doorLeftPivot = new THREE.Group();
    doorLeftPivot.position.set(-1.8, 1.8, -4.25);
    const doorL = new THREE.Mesh(doorGeo, doorMat);
    doorL.position.set(0.9, 0, 0);
    doorLeftPivot.add(doorL);
    van.add(doorLeftPivot);
    vanDoorLeftRef.current = doorLeftPivot;

    const doorRightPivot = new THREE.Group();
    doorRightPivot.position.set(1.8, 1.8, -4.25);
    const doorR = new THREE.Mesh(doorGeo, doorMat);
    doorR.position.set(-0.9, 0, 0);
    doorRightPivot.add(doorR);
    van.add(doorRightPivot);
    vanDoorRightRef.current = doorRightPivot;

    campGroup.add(van);

    // LoRa Antenna Mast
    const mast = new THREE.Group();
    mast.position.set(-1, 0, -8);
    const tripodMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2), tripodMat);
      leg.position.set(Math.cos(angle) * 0.9, 1.4, Math.sin(angle) * 0.9);
      leg.rotation.z = -Math.cos(angle) * 0.25;
      leg.rotation.x = Math.sin(angle) * 0.25;
      mast.add(leg);
    }
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7.5), tripodMat);
    pole.position.y = 4.5;
    mast.add(pole);

    // Glowing cyan/green antenna tip LED
    const tipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
    tipMesh.position.y = 8.3;
    mast.add(tipMesh);

    // LoRa Expanding Radio Waves (animated rings)
    loraWavesRef.current = [];
    for (let w = 0; w < 3; w++) {
      const waveGeo = new THREE.RingGeometry(1.0, 1.2, 24);
      waveGeo.rotateX(-Math.PI / 2);
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.position.y = 8.3;
      mast.add(wave);
      loraWavesRef.current.push(wave);
    }

    campGroup.add(mast);

    // 2 Rescue Personnel
    const pilot = createRescueHumanModel(0x0284c7, true);
    pilot.position.set(-3.2, 0, -5);
    pilot.rotation.y = Math.PI * 0.25;
    campGroup.add(pilot);

    const commander = createRescueHumanModel(0xea580c, false);
    commander.position.set(-4.8, 0, -4.8);
    commander.rotation.y = Math.PI * 0.15;
    campGroup.add(commander);

    scene.add(campGroup);
  };

  const createRescueHumanModel = (vestColor: number, hasController: boolean): THREE.Group => {
    const person = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.45), new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.6 }));
    torso.position.y = 1.35;
    person.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.5, 0.48), new THREE.MeshStandardMaterial({ color: 0xf3c59a }));
    head.position.y = 2.1;
    person.add(head);

    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.35), legMat);
    legL.position.set(-0.2, 0.48, 0);
    person.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.95, 0.35), legMat);
    legR.position.set(0.2, 0.48, 0);
    person.add(legR);

    if (hasController) {
      const rc = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.25), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      rc.position.set(0, 1.15, 0.45);
      person.add(rc);
    }
    return person;
  };

  const buildHybridVtolDrone = (scene: THREE.Scene) => {
    const drone = new THREE.Group();
    drone.position.copy(currentPos.current);
    droneGroupRef.current = drone;

    const droneBody = new THREE.Group();
    drone.add(droneBody);
    droneBodyRef.current = droneBody;

    // Aerodynamic Fuselage
    const fuseGeo = new THREE.ConeGeometry(0.85, 4.4, 8);
    fuseGeo.rotateX(Math.PI / 2);
    const fuseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.15 });
    const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
    fuselage.castShadow = true;
    droneBody.add(fuselage);

    // High-Vis Rescue Orange stripe
    const stripeGeo = new THREE.CylinderGeometry(0.82, 0.82, 1.1, 8);
    stripeGeo.rotateX(Math.PI / 2);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 }));
    stripe.position.set(0, 0, -0.2);
    droneBody.add(stripe);

    // Fixed Wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 1.1), fuseMat);
    wing.position.set(0, 0.1, -0.3);
    wing.castShadow = true;
    droneBody.add(wing);

    // Dual Booms
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const boomL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.8), boomMat);
    boomL.position.set(-1.8, -0.05, -0.2);
    droneBody.add(boomL);

    const boomR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.8), boomMat);
    boomR.position.set(1.8, -0.05, -0.2);
    droneBody.add(boomR);

    // 4 VTOL Lift Motors & Spinning Props
    const motorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const rotorPositions = [
      { x: -1.8, z: 1.5 }, { x: 1.8, z: 1.5 },
      { x: -1.8, z: -1.9 }, { x: 1.8, z: -1.9 }
    ];

    const propGeo = new THREE.BoxGeometry(1.6, 0.02, 0.15);
    const propMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
    vtolRotorsRef.current = [];

    rotorPositions.forEach(rp => {
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.35, 12), motorMat);
      motor.position.set(rp.x, 0.15, rp.z);
      droneBody.add(motor);

      const prop = new THREE.Mesh(propGeo, propMat);
      prop.position.set(rp.x, 0.35, rp.z);
      droneBody.add(prop);
      vtolRotorsRef.current.push(prop);
    });

    // Rear Pusher Motor & Propeller
    const pusherProp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.02), propMat);
    pusherProp.position.set(0, 0.05, -2.55);
    droneBody.add(pusherProp);
    pusherPropRef.current = pusherProp;

    // Spinning LiDAR Puck on top
    const lidarPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.25, 16),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 })
    );
    lidarPuck.position.set(0, 1.05, 0.3);
    droneBody.add(lidarPuck);
    lidarPuckRef.current = lidarPuck;

    // Actual 3D LiDAR Scanning Laser Rays shooting to ground
    const rayCount = 16;
    const rayPositions = new Float32Array(rayCount * 6);
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.LineBasicMaterial({
      color: 0x22c55e, // Emerald Laser
      transparent: true,
      opacity: 0.65,
    });
    const lidarRays = new THREE.LineSegments(rayGeo, rayMat);
    drone.add(lidarRays);
    lidarLaserRaysRef.current = lidarRays;

    // Gimbal Camera underneath
    const gimbal = new THREE.Group();
    gimbal.position.set(0, -0.6, 1.1);
    gimbalRef.current = gimbal;
    const gimbalBall = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), motorMat);
    gimbalBall.position.y = -0.3;
    gimbal.add(gimbalBall);
    droneBody.add(gimbal);

    // Navigation Lights
    const navRed = new THREE.PointLight(0xef4444, 1.2, 10);
    navRed.position.set(-3.6, 0.3, -0.3);
    droneBody.add(navRed);
    const navGreen = new THREE.PointLight(0x22c55e, 1.2, 10);
    navGreen.position.set(3.6, 0.3, -0.3);
    droneBody.add(navGreen);

    // Search Spotlight
    const spotlight = new THREE.SpotLight(0xffffff, 4.5, 60, Math.PI / 5, 0.4, 1.2);
    spotlight.position.set(0, -0.8, 1.2);
    spotlight.target.position.set(0, -30, 2);
    droneBody.add(spotlight);
    droneBody.add(spotlight.target);
    searchSpotlightRef.current = spotlight;

    // Winch & First-Aid Payload Crate
    const winchCrateGroup = new THREE.Group();
    aidCrateRef.current = winchCrateGroup;

    const crateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 0.75),
      new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
    );
    crateMesh.castShadow = true;
    winchCrateGroup.add(crateMesh);

    // White Medical Cross on crate
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    winchCrateGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.77), crossMat));
    winchCrateGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.77), crossMat));
    drone.add(winchCrateGroup);

    // Winch Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -0.5, 0),
      new THREE.Vector3(0, -0.6, 0),
    ]);
    const winchLine = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x94a3b8 }));
    drone.add(winchLine);
    winchLineRef.current = winchLine;

    scene.add(drone);
  };

  const buildRainSystem = (scene: THREE.Scene) => {
    const rainCount = 1400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 220;
      rainPositions[i * 3 + 1] = Math.random() * 80;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.45,
      transparent: true,
      opacity: 0.65,
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    rain.visible = false;
    scene.add(rain);
    rainSystemRef.current = rain;
  };

  const buildVisualizers = (scene: THREE.Scene) => {
    // 1. LoRa Beam
    const beamPoints = [new THREE.Vector3(-46, 11.5, -43), new THREE.Vector3(-45, 3.3, -35)];
    const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
    const beamMat = new THREE.LineDashedMaterial({
      color: 0x06b6d4,
      dashSize: 1.5,
      gapSize: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const loraBeam = new THREE.Line(beamGeo, beamMat);
    loraBeam.computeLineDistances();
    scene.add(loraBeam);
    loraBeamRef.current = loraBeam;

    // LoRa Packet Spheres
    const packetGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    loraPacketsRef.current = [];
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(packetGeo, packetMat);
      p.visible = false;
      scene.add(p);
      loraPacketsRef.current.push(p);
    }

    // 2. SLAM Visualizer Points
    const slamGeo = new THREE.BufferGeometry();
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    slamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const slamMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.55,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const slamPoints = new THREE.Points(slamGeo, slamMat);
    slamPoints.visible = false;
    scene.add(slamPoints);
    slamPointsRef.current = slamPoints;

    const coneGeo = new THREE.ConeGeometry(12, 22, 16, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const slamCone = new THREE.Mesh(coneGeo, coneMat);
    slamCone.visible = false;
    scene.add(slamCone);
    slamConeRef.current = slamCone;
  };

  // ========================================================
  // ANIMATION LOOPS
  // ========================================================

  const updateRescueBoat = (delta: number, elapsed: number) => {
    if (!rescueBoatRef.current) return;

    const boat = rescueBoatRef.current;
    const shouldDispatch = boatDispatched || phase === 'live_relay';

    if (shouldDispatch) {
      // Boat moves from dock towards survivor
      boatProgress.current = Math.min(1.0, boatProgress.current + delta * 0.12);

      if (boatProgress.current < 0.95) {
        onBoatStatusChange?.('transit');
      } else {
        onBoatStatusChange?.('at_survivor');
      }
    } else {
      boatProgress.current = Math.max(0, boatProgress.current - delta * 0.2);
      if (boatProgress.current === 0) {
        onBoatStatusChange?.('docked');
      }
    }

    // Interpolate boat position along curving river path
    const start = boatDockPos.current;
    const end = new THREE.Vector3(survivorPos.current.x - 3, currentWaterLevel.current, survivorPos.current.z + 7);
    const midPoint = new THREE.Vector3(0, currentWaterLevel.current, 10);

    // Quadratic Bezier interpolation
    const t = boatProgress.current;
    boatCurrentPos.current.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midPoint.x + t * t * end.x;
    boatCurrentPos.current.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * midPoint.z + t * t * end.z;
    boatCurrentPos.current.y = currentWaterLevel.current;

    boat.position.copy(boatCurrentPos.current);

    // Boat heading & tilt
    if (t > 0.01 && t < 0.98) {
      const nextT = Math.min(1.0, t + 0.02);
      const nextX = (1 - nextT) * (1 - nextT) * start.x + 2 * (1 - nextT) * nextT * midPoint.x + nextT * nextT * end.x;
      const nextZ = (1 - nextT) * (1 - nextT) * start.z + 2 * (1 - nextT) * nextT * midPoint.z + nextT * nextT * end.z;
      const targetAngle = Math.atan2(nextX - boat.position.x, nextZ - boat.position.z);
      boat.rotation.y = THREE.MathUtils.lerp(boat.rotation.y, targetAngle, 0.1);

      // Bow rises when speeding
      boat.rotation.x = -0.15 + Math.sin(elapsed * 4) * 0.05;
      boat.rotation.z = Math.sin(elapsed * 3) * 0.06;
    } else {
      boat.rotation.x = Math.sin(elapsed * 2) * 0.03;
      boat.rotation.z = Math.cos(elapsed * 1.8) * 0.03;
    }
  };

  const updateDroneFlight = (delta: number, elapsed: number) => {
    if (!droneGroupRef.current || !droneBodyRef.current) return;

    // Movement
    const speed = phase === 'takeoff_search' || phase === 'rth_landing' ? 0.045 : 0.035;
    currentPos.current.lerp(targetPos.current, speed);
    droneGroupRef.current.position.copy(currentPos.current);

    // Waypoint progression in Step 2
    if (phase === 'takeoff_search') {
      const dist = currentPos.current.distanceTo(searchWaypoints.current[searchGridIndex.current]);
      if (dist < 3.2) {
        searchGridIndex.current = (searchGridIndex.current + 1) % searchWaypoints.current.length;
        targetPos.current.copy(searchWaypoints.current[searchGridIndex.current]);
      }
    }

    // Drone Attitude
    const moveDelta = targetPos.current.clone().sub(currentPos.current);
    const horizDist = Math.sqrt(moveDelta.x * moveDelta.x + moveDelta.z * moveDelta.z);
    let targetYaw = droneRotation.current.y;
    if (horizDist > 0.4) {
      targetYaw = Math.atan2(moveDelta.x, moveDelta.z);
    }
    const targetPitch = Math.min(Math.max(-moveDelta.y * 0.02 - (horizDist > 1 ? 0.2 : 0), -0.35), 0.35);
    const targetRoll = Math.min(Math.max((targetYaw - droneRotation.current.y) * 1.5, -0.4), 0.4);

    droneRotation.current.x = THREE.MathUtils.lerp(droneRotation.current.x, targetPitch, 0.08);
    droneRotation.current.y = THREE.MathUtils.lerp(droneRotation.current.y, targetYaw, 0.06);
    droneRotation.current.z = THREE.MathUtils.lerp(droneRotation.current.z, targetRoll, 0.08);

    droneBodyRef.current.rotation.set(
      droneRotation.current.x,
      droneRotation.current.y,
      droneRotation.current.z
    );

    const altitudeAGL = Math.max(0, currentPos.current.y - 3.2);

    // Rotors spin
    const isStationary = phase === 'setup' && altitudeAGL < 0.5;
    const rotorSpeed = isStationary ? 0 : 28;
    vtolRotorsRef.current.forEach((r, idx) => {
      r.rotation.y += rotorSpeed * delta * (idx % 2 === 0 ? 1 : -1);
    });

    if (pusherPropRef.current) {
      const pusherSpeed = horizDist > 2 && altitudeAGL > 5 ? 42 : (altitudeAGL > 2 ? 15 : 0);
      pusherPropRef.current.rotation.z += pusherSpeed * delta;
      soundManager.updateEnginePitch(pusherSpeed / 42);
    }

    // Gimbal Pitch
    if (gimbalRef.current) {
      if (phase === 'person_found' || phase === 'payload_drop' || phase === 'live_relay') {
        gimbalRef.current.rotation.x = -0.7;
      } else {
        gimbalRef.current.rotation.x = -0.25;
      }
    }

    // Van Rear Doors in Step 1
    if (vanDoorLeftRef.current && vanDoorRightRef.current) {
      const targetAngle = phase === 'setup' ? 1.6 : 0;
      vanDoorLeftRef.current.rotation.y = THREE.MathUtils.lerp(vanDoorLeftRef.current.rotation.y, -targetAngle, 0.05);
      vanDoorRightRef.current.rotation.y = THREE.MathUtils.lerp(vanDoorRightRef.current.rotation.y, targetAngle, 0.05);
    }

    // Winch & Crate
    if (aidCrateRef.current && winchLineRef.current) {
      if (phase === 'payload_drop') {
        winchProgress.current = Math.min(1.0, winchProgress.current + delta * 0.35);
      } else if (phase === 'live_relay' || phase === 'rth_landing') {
        winchProgress.current = 1.0;
      } else {
        winchProgress.current = 0;
      }

      const dropDist = winchProgress.current * 9.5;
      aidCrateRef.current.position.set(0, -0.6 - dropDist, 0);

      const linePos = winchLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
      linePos.setXYZ(0, 0, -0.4, 0);
      linePos.setXYZ(1, 0, -0.6 - dropDist, 0);
      linePos.needsUpdate = true;
    }

    // V-SLAM point cloud & LiDAR frustum
    const isSlam = phase === 'gps_loss' || phase === 'person_found' || phase === 'payload_drop';
    if (slamPointsRef.current && slamConeRef.current) {
      slamPointsRef.current.visible = isSlam;
      slamConeRef.current.visible = isSlam;

      if (isSlam) {
        slamConeRef.current.position.copy(currentPos.current);
        slamConeRef.current.position.y -= 11;
        slamConeRef.current.rotation.y += delta * 0.4;
        slamPointsRef.current.position.set(currentPos.current.x, 3.5, currentPos.current.z);
      }
    }

    // Update Telemetry
    updateTelemetry(altitudeAGL, horizDist);
  };

  const updateLidarScan = (delta: number, elapsed: number) => {
    if (lidarPuckRef.current) {
      lidarPuckRef.current.rotation.y += delta * 18;
    }

    if (lidarLaserRaysRef.current) {
      const isScanning = phase === 'takeoff_search' || phase === 'gps_loss' || phase === 'person_found';
      lidarLaserRaysRef.current.visible = isScanning;

      if (isScanning) {
        const pos = lidarLaserRaysRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const count = 16;
        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count + elapsed * 3;
          const radius = 14 + Math.sin(elapsed * 2 + i) * 3;
          // Ray from drone puck to terrain
          pos.setXYZ(i * 2, 0, 1.0, 0.3);
          pos.setXYZ(i * 2 + 1, Math.cos(angle) * radius, -currentPos.current.y + currentWaterLevel.current, Math.sin(angle) * radius);
        }
        pos.needsUpdate = true;
      }
    }
  };

  const updateLoraComms = (elapsed: number) => {
    if (!loraBeamRef.current) return;

    const antennaTip = new THREE.Vector3(-46, 11.5, -43);
    const dronePos = currentPos.current.clone().add(new THREE.Vector3(0, 0.8, 0));

    const beamPos = loraBeamRef.current.geometry.attributes.position as THREE.BufferAttribute;
    beamPos.setXYZ(0, antennaTip.x, antennaTip.y, antennaTip.z);
    beamPos.setXYZ(1, dronePos.x, dronePos.y, dronePos.z);
    beamPos.needsUpdate = true;
    loraBeamRef.current.computeLineDistances();

    const beamMat = loraBeamRef.current.material as THREE.LineDashedMaterial;
    beamMat.color.setHex(phase === 'gps_loss' ? (Math.sin(elapsed * 10) > 0 ? 0xef4444 : 0xf59e0b) : 0x06b6d4);

    loraPacketsRef.current.forEach((packet, idx) => {
      packetFlyTimes.current[idx] = (packetFlyTimes.current[idx] + 0.018) % 1.0;
      const t = packetFlyTimes.current[idx];
      packet.position.lerpVectors(dronePos, antennaTip, t);
      packet.position.y += Math.sin(t * Math.PI * 4) * 0.45;
      packet.visible = currentPos.current.distanceTo(antennaTip) > 2;

      const pMat = packet.material as THREE.MeshBasicMaterial;
      pMat.color.setHex(phase === 'gps_loss' ? 0xef4444 : 0x38bdf8);
    });

    // Expanding Radio Wave Rings from Antenna Mast
    loraWavesRef.current.forEach((wave, idx) => {
      const scale = ((elapsed * 1.5 + idx * 0.6) % 2.0) * 4.5 + 0.5;
      wave.scale.set(scale, scale, 1);
      (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - scale * 0.07);
    });
  };

  const updateSurvivor = (elapsed: number) => {
    if (!survivorRef.current) return;

    const arm = survivorRef.current.getObjectByName('wavingArm');
    if (arm) {
      arm.rotation.z = Math.sin(elapsed * 6) * 0.45 + 0.45;
      arm.rotation.x = Math.cos(elapsed * 5) * 0.25;
    }

    if (survivorFlareLightRef.current) {
      survivorFlareLightRef.current.intensity = 2.0 + Math.sin(elapsed * 14) * 0.8;
    }
  };

  const updateCameraChoreography = () => {
    if (!cameraRef.current || !controlsRef.current || !droneGroupRef.current) return;

    const drone = droneGroupRef.current.position;

    switch (cameraMode) {
      case 'chase':
        controlsRef.current.enabled = false;
        const forward = new THREE.Vector3(0, 0, 1).applyEuler(droneRotation.current);
        const chasePos = drone.clone().sub(forward.clone().multiplyScalar(16)).add(new THREE.Vector3(0, 6, 0));
        cameraRef.current.position.lerp(chasePos, 0.08);
        cameraRef.current.lookAt(drone.clone().add(new THREE.Vector3(0, 1.5, 0)));
        break;

      case 'drone_gimbal':
        controlsRef.current.enabled = false;
        cameraRef.current.position.copy(drone.clone().add(new THREE.Vector3(0, -0.6, 1.1)));
        const gimbalTarget = phase === 'person_found' || phase === 'payload_drop'
          ? survivorPos.current
          : drone.clone().add(new THREE.Vector3(0, -18, 25));
        cameraRef.current.lookAt(gimbalTarget);
        break;

      case 'ground_base':
        controlsRef.current.enabled = false;
        cameraRef.current.position.lerp(new THREE.Vector3(-42, 4.8, -40), 0.08);
        cameraRef.current.lookAt(drone);
        break;

      case 'survivor':
        controlsRef.current.enabled = false;
        cameraRef.current.position.lerp(
          new THREE.Vector3(survivorPos.current.x + 6, survivorPos.current.y + 2.5, survivorPos.current.z + 6),
          0.08
        );
        cameraRef.current.lookAt(drone);
        break;

      case 'flood_cam':
        // Dramatic low-angle view showing the water rising against the houses & bridge!
        controlsRef.current.enabled = false;
        const floodCamPos = new THREE.Vector3(0, currentWaterLevel.current + 2.2, 10);
        cameraRef.current.position.lerp(floodCamPos, 0.06);
        cameraRef.current.lookAt(survivorPos.current);
        break;

      case 'boat_cam':
        // 3rd person chase camera right behind the rescue boat speeding in the flood
        if (rescueBoatRef.current) {
          controlsRef.current.enabled = false;
          const boatPos = rescueBoatRef.current.position;
          const chaseBoatPos = boatPos.clone().add(new THREE.Vector3(-6, 4.5, -8));
          cameraRef.current.position.lerp(chaseBoatPos, 0.08);
          cameraRef.current.lookAt(boatPos.clone().add(new THREE.Vector3(0, 1.5, 0)));
        }
        break;

      case 'orbit':
      default:
        controlsRef.current.enabled = true;
        break;
    }
  };

  const updateTelemetry = (altitudeAGL: number, horizDist: number) => {
    const elapsedSeconds = Math.floor((Date.now() - missionStartTime.current) / 1000);

    onTelemetryUpdate((prev) => {
      let battery = Math.max(20, 100 - elapsedSeconds * 0.15);
      if (phase === 'rth_landing') battery = 20;

      const isCruise = altitudeAGL > 10 && horizDist > 2 && phase === 'takeoff_search';

      return {
        ...prev,
        phase,
        altitudeMeters: Math.round(altitudeAGL * 1.8),
        batteryPercent: Math.round(battery),
        speedKmh: isCruise ? 68 : altitudeAGL > 2 ? 24 : 0,
        pitchDeg: Math.round(droneRotation.current.x * (180 / Math.PI)),
        rollDeg: Math.round(droneRotation.current.z * (180 / Math.PI)),
        yawDeg: Math.round(droneRotation.current.y * (180 / Math.PI)),
        gpsStatus: phase === 'gps_loss' ? 'LOST' : phase === 'person_found' ? 'SLAM_BACKUP' : 'OPTIMAL',
        gpsSatellites: phase === 'gps_loss' ? 0 : 16,
        hdop: phase === 'gps_loss' ? 9.9 : 0.8,
        slamStatus: phase === 'gps_loss' || phase === 'person_found' ? 'LIDAR_FUSED' : 'STANDBY',
        slamKeypoints: phase === 'gps_loss' || phase === 'person_found' ? 842 : 120,
        aiStatus: phase === 'person_found' || phase === 'payload_drop' || phase === 'live_relay' ? 'TARGET_ACQUIRED' : 'SEARCHING',
        detectedConfidence: phase === 'person_found' || phase === 'payload_drop' || phase === 'live_relay' ? 95.4 : 0,
        loraRssi: phase === 'gps_loss' ? -98 : -72,
        loraSnr: phase === 'gps_loss' ? 2 : 9.5,
        loraPacketsSent: prev.loraPacketsSent + 1,
        loraPacketsRecv: prev.loraPacketsRecv + (phase === 'gps_loss' ? 0 : 1),
        winchLengthMeters: Number((winchProgress.current * 12).toFixed(1)),
        winchStatus: phase === 'payload_drop' ? (winchProgress.current >= 0.98 ? 'RELEASED' : 'LOWERING') : winchProgress.current > 0 ? 'RELEASED' : 'STOWED',
        missionTimeSeconds: elapsedSeconds,
        vtolFlightMode: isCruise ? 'FIXED_WING_CRUISE' : phase === 'rth_landing' && altitudeAGL < 8 ? 'LANDING' : 'VTOL_HOVER',
        floodHeightMeters: Number(currentWaterLevel.current.toFixed(1)),
        floodSurgeActive: isSurgeActive,
        boatStatus: boatProgress.current >= 0.95 ? 'at_survivor' : boatProgress.current > 0.05 ? 'transit' : 'docked',
      };
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Crosshair HUD for Gimbal Feed */}
      {cameraMode === 'drone_gimbal' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 border border-sky-400/40 rounded-full flex items-center justify-center relative">
            <div className="w-3 h-3 bg-sky-400/60 rounded-full" />
            <div className="absolute w-full h-[1px] bg-sky-400/30" />
            <div className="absolute h-full w-[1px] bg-sky-400/30" />
            <span className="absolute -top-6 text-[10px] tracking-wider text-sky-400 font-mono-nums">
              OPTICAL 4K · 30 FPS · GIMBAL LOCK
            </span>
          </div>
        </div>
      )}

      {/* FLIR Scanline Overlay */}
      {isThermal && <div className="absolute inset-0 scanlines pointer-events-none opacity-40" />}
    </div>
  );
};
