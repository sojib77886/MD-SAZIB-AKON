import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useApp } from '../context/AppContext';
import { formatTaka, toBengaliNumber } from '../utils/formatters';
import {
  RotateCcw,
  Eye,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Box,
  Coins,
  Shield,
  Layers,
} from 'lucide-react';

export const ThreeDView: React.FC = () => {
  const { state, filteredTransactions, monthlyExpense } = useApp();
  const canvasMountRef = useRef<HTMLDivElement>(null);

  // HUD and scene state
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'vault' | 'pillars'>('isometric');
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);
  const [hoveredCategoryName, setHoveredCategoryName] = useState<string | null>(null);

  // Group actual expenses by category
  const categoryExpenses: Record<string, number> = {};
  filteredTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      categoryExpenses[tx.categoryId] = (categoryExpenses[tx.categoryId] || 0) + tx.amount;
    }
  });

  // Keep ref to mutable props for 60fps loop
  const autoRotateRef = useRef(isAutoRotate);
  autoRotateRef.current = isAutoRotate;

  const targetCameraPosRef = useRef(new THREE.Vector3(12, 11, 16));
  const targetLookAtRef = useRef(new THREE.Vector3(0, 2, 0));

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.025);

    // 2. Camera setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(12, 11, 16);
    camera.lookAt(0, 2, 0);

    // 3. Renderer setup strictly per Three.js guidelines
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting rig
    const warmKeyLight = new THREE.DirectionalLight(0xfff3db, 2.2);
    warmKeyLight.position.set(10, 15, 8);
    warmKeyLight.castShadow = !isHeadless;
    warmKeyLight.shadow.mapSize.width = 1024;
    warmKeyLight.shadow.mapSize.height = 1024;
    warmKeyLight.shadow.camera.near = 0.5;
    warmKeyLight.shadow.camera.far = 40;
    warmKeyLight.shadow.camera.left = -12;
    warmKeyLight.shadow.camera.right = 12;
    warmKeyLight.shadow.camera.top = 12;
    warmKeyLight.shadow.camera.bottom = -12;
    warmKeyLight.shadow.bias = -0.0005;
    warmKeyLight.shadow.normalBias = 0.02;
    scene.add(warmKeyLight);

    const coolHemiFill = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 0.9);
    scene.add(coolHemiFill);

    const accentRimLight = new THREE.DirectionalLight(0x10b981, 1.2);
    accentRimLight.position.set(-10, 8, -10);
    scene.add(accentRimLight);

    // 6. Floor with soft radial contact shadow plane
    const floorGeo = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Circular pedestal platform
    const platformGeo = new THREE.CylinderGeometry(8.5, 9.0, 0.4, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.35,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = 0.2;
    platform.receiveShadow = true;
    platform.castShadow = true;
    scene.add(platform);

    // Circular neon ring on pedestal
    const ringGeo = new THREE.RingGeometry(8.1, 8.35, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
    });
    const neonRing = new THREE.Mesh(ringGeo, ringMat);
    neonRing.rotation.x = -Math.PI / 2;
    neonRing.position.y = 0.41;
    scene.add(neonRing);

    // 7. Composite Procedural Model 1: The Wealth Safe / Vault (6-part THREE.Group)
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(0, 0.4, 0);

    // Part 1: Outer Heavy Safe Body
    const safeBodyGeo = new THREE.BoxGeometry(4.2, 4.4, 4.2);
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.22,
    });
    const safeBody = new THREE.Mesh(safeBodyGeo, steelMat);
    safeBody.position.y = 2.2;
    safeBody.castShadow = true;
    safeBody.receiveShadow = true;
    vaultGroup.add(safeBody);

    // Part 2: Vault Beveled Door
    const doorGeo = new THREE.BoxGeometry(3.6, 3.8, 0.5);
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.18,
    });
    const vaultDoor = new THREE.Mesh(doorGeo, darkSteelMat);
    vaultDoor.position.set(0, 2.2, 2.15);
    vaultDoor.castShadow = true;
    vaultGroup.add(vaultDoor);

    // Part 3: Door Hinges (2 parts)
    const hingeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 16);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
    });
    const hingeTop = new THREE.Mesh(hingeGeo, goldMat);
    hingeTop.position.set(-1.85, 3.2, 2.2);
    hingeTop.castShadow = true;
    vaultGroup.add(hingeTop);

    const hingeBottom = new THREE.Mesh(hingeGeo, goldMat);
    hingeBottom.position.set(-1.85, 1.2, 2.2);
    hingeBottom.castShadow = true;
    vaultGroup.add(hingeBottom);

    // Part 4: Rotating Safe Wheel / Dial Lock
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, 2.2, 2.45);

    const dialBaseGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.2, 32);
    dialBaseGeo.rotateX(Math.PI / 2);
    const dialBase = new THREE.Mesh(dialBaseGeo, goldMat);
    wheelGroup.add(dialBase);

    const torusGeo = new THREE.TorusGeometry(0.85, 0.08, 16, 32);
    const wheelRing = new THREE.Mesh(torusGeo, goldMat);
    wheelRing.castShadow = true;
    wheelGroup.add(wheelRing);

    // Wheel spokes (4 spokes)
    for (let s = 0; s < 4; s++) {
      const spokeGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.9, 12);
      const spoke = new THREE.Mesh(spokeGeo, steelMat);
      spoke.rotation.z = (s * Math.PI) / 4;
      wheelGroup.add(spoke);
    }

    vaultGroup.add(wheelGroup);

    // Part 5: Safe Keypad / Digital Lock Indicator
    const lockLedGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const lockLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const lockLed = new THREE.Mesh(lockLedGeo, lockLedMat);
    lockLed.position.set(1.2, 2.8, 2.42);
    vaultGroup.add(lockLed);

    // Part 6: Procedural Bangladeshi Taka ৳ Coins Stacks
    const coinGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 24);
    for (let c = 0; c < 8; c++) {
      const coin = new THREE.Mesh(coinGeo, goldMat);
      coin.position.set(2.8 + (c % 2) * 0.4, 0.04 + c * 0.09, 1.8 + Math.floor(c / 4) * 0.5);
      coin.castShadow = true;
      vaultGroup.add(coin);
    }

    scene.add(vaultGroup);

    // 8. Composite Procedural Model 2: Dynamic Category 3D Pillars
    // Arranged in a radial semicircle around the vault
    const pillarsGroup = new THREE.Group();
    const expenseCats = state.categories.filter((c) => c.type === 'expense');
    const totalExpenseAmount = monthlyExpense || 1;

    const angleStep = Math.PI / Math.max(1, expenseCats.length - 1);
    const radius = 6.2;

    const pillarMeshes: { mesh: THREE.Mesh; catName: string; amount: number }[] = [];

    expenseCats.forEach((cat, idx) => {
      const spent = categoryExpenses[cat.id] || 0;
      const heightRatio = Math.max(0.3, (spent / totalExpenseAmount) * 6.0);
      const angle = Math.PI + idx * angleStep;

      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      // Hexagonal Pillar Geometry
      const colGeo = new THREE.CylinderGeometry(0.45, 0.55, heightRatio, 6);
      const colColor = new THREE.Color(cat.color || '#3b82f6');
      const colMat = new THREE.MeshStandardMaterial({
        color: colColor,
        roughness: 0.25,
        metalness: 0.7,
        emissive: colColor,
        emissiveIntensity: 0.15,
      });

      const colMesh = new THREE.Mesh(colGeo, colMat);
      colMesh.position.set(px, 0.4 + heightRatio / 2, pz);
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;

      // Glowing crystal cap at top
      const capGeo = new THREE.OctahedronGeometry(0.25, 0);
      const capMat = new THREE.MeshBasicMaterial({ color: colColor });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, heightRatio / 2 + 0.35, 0);
      colMesh.add(cap);

      pillarsGroup.add(colMesh);
      pillarMeshes.push({ mesh: colMesh, catName: cat.name, amount: spent });
    });

    scene.add(pillarsGroup);

    // 9. Pre-allocated scratch objects outside loop (Zero GC)
    const _currentPos = new THREE.Vector3();
    const _currentLookAt = new THREE.Vector3();
    let clock = new THREE.Clock();
    let animationFrameId: number;

    // 10. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = clock.getDelta();

      // Smooth wheel spin
      if (wheelGroup) {
        wheelGroup.rotation.z += 0.8 * dt;
      }

      // Auto-rotation around scene
      if (autoRotateRef.current) {
        vaultGroup.rotation.y += 0.3 * dt;
        pillarsGroup.rotation.y += 0.3 * dt;
      }

      // Exponential damping camera glide
      const dampK = 4.0;
      camera.position.x += (targetCameraPosRef.current.x - camera.position.x) * (1 - Math.exp(-dampK * dt));
      camera.position.y += (targetCameraPosRef.current.y - camera.position.y) * (1 - Math.exp(-dampK * dt));
      camera.position.z += (targetCameraPosRef.current.z - camera.position.z) * (1 - Math.exp(-dampK * dt));

      camera.lookAt(targetLookAtRef.current);

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 600;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [state.categories, monthlyExpense, categoryExpenses]);

  // Handle camera presets
  const handleCameraPreset = (preset: 'isometric' | 'vault' | 'pillars') => {
    setCameraPreset(preset);
    if (preset === 'isometric') {
      targetCameraPosRef.current.set(12, 11, 16);
      targetLookAtRef.current.set(0, 2, 0);
    } else if (preset === 'vault') {
      targetCameraPosRef.current.set(0, 4.5, 9);
      targetLookAtRef.current.set(0, 2.5, 0);
    } else if (preset === 'pillars') {
      targetCameraPosRef.current.set(10, 8, -4);
      targetLookAtRef.current.set(0, 2, 0);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl font-['Hind_Siliguri','Inter',sans-serif]">
      {/* 3D WebGL Canvas Container */}
      <div ref={canvasMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Title & Spec Badge (Unobstructive) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-lg text-xs font-semibold text-white backdrop-blur-none">
          <Box className="w-4 h-4 text-emerald-400" />
          <span>৩ডি আর্থিক ভল্ট ও ক্যাটাগরি বিশ্লেষণ</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            Three.js PBR
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 pl-1">
          ক্যাটাগরি পিলারগুলোর উচ্চতা আপনার চলতি মাসের খরচের অনুপাত প্রকাশ করে
        </p>
      </div>

      {/* Top-Right Info Pill */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs font-bold text-emerald-400">
          মোট ব্যয়: {formatTaka(monthlyExpense, state.useBengaliDigits)}
        </div>
      </div>

      {/* Viewport-First Collapsible Bottom Control Dock (<= 15% viewport footprint) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-auto">
        <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2.5 transition-all duration-300">
          {/* Header row with toggle */}
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>৩ডি নিয়ন্ত্রণ ডক</span>
            </span>

            <button
              onClick={() => setIsHudCollapsed(!isHudCollapsed)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{isHudCollapsed ? 'নিয়ন্ত্রণ দেখান' : 'লুকান'}</span>
              {isHudCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {!isHudCollapsed && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              {/* Camera Presets */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1">কোণ:</span>
                {[
                  { id: 'isometric', label: 'আইসোমেট্রিক' },
                  { id: 'vault', label: 'ভল্ট দৃশ্য' },
                  { id: 'pillars', label: 'পিলার ভিউ' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCameraPreset(p.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                      cameraPreset === p.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Rotation toggle */}
              <button
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  isAutoRotate
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoRotate ? 'ঘূর্ণন থামান' : 'ঘূর্ণন চালু'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
