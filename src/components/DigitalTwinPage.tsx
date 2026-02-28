/**
 * DigitalTwinPage
 *
 * Two-level navigation:
 *   1. Globe  → click a site marker
 *   2. Exterior (3-D building) → floor info cards always visible beside each floor
 */

import { useState, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Perf } from 'r3f-perf';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';

import { DataCenterGlobe } from './DigitalTwin/DataCenterGlobe';
import { BuildingExterior } from './DigitalTwin/BuildingExterior';

import { sampleSites } from './DigitalTwin/sampleData';
import type { GlobeSite, ViewMode } from './DigitalTwin/types';

// ── Constants ────────────────────────────────────────────────────────────────
const TOTAL_FLOORS = 9;
const FLOOR_HEIGHT = 4;

// APS switch world-space position (matches BuildingExterior: buildingWidth/2 + 6.5, y=2.39)
// APSSwitchVendor H=0.18 × scale 5.5 → switch centre at world y ≈ 2.39
// Front face Z = D/2 × scale = 0.22 × 5.5 ≈ 1.21
const SW_X = 13.5;
const SW_Y = 2.39;

// ── Camera animator (runs inside Canvas via useFrame) ────────────────────────
function CameraAnimator({
    focused,
    controlsRef,
}: {
    focused: boolean;
    controlsRef: React.RefObject<any>;
}) {
    const { camera } = useThree();
    // APSSwitchVendor world width = 1.20×5.5 = 6.6 m → camera at Z≈9.5 gives full-panel view
    // Front face world Z = 0.22×5.5 = 1.21
    const focusCamPos  = useMemo(() => new THREE.Vector3(SW_X, SW_Y + 0.3, 9.5), []);
    const focusTarget  = useMemo(() => new THREE.Vector3(SW_X, SW_Y,        1.21), []);
    // Home: shifted right so building (x=-7..+7) AND switch (x=13.5) both fit in frame
    const homeCamPos   = useMemo(() => new THREE.Vector3(4, 22, 50), []);
    const homeTarget   = useMemo(() => new THREE.Vector3(3, 16, 0), []);

    useFrame(() => {
        if (!controlsRef.current) return;
        const tPos  = focused ? focusCamPos : homeCamPos;
        const tLook = focused ? focusTarget  : homeTarget;
        camera.position.lerp(tPos,  0.055);
        controlsRef.current.target.lerp(tLook, 0.055);
        controlsRef.current.update();
    });

    return null;
}

// ── Exterior scene (Three.js) ─────────────────────────────────────────────────
function ExteriorScene({ siteName, currentFloor, onFloorClick, onSwitchClick }: {
    siteName: string;
    currentFloor: number;
    onFloorClick: (f: number) => void;
    onSwitchClick?: () => void;
}) {
    return (
        <>
            <ambientLight intensity={0.5} color="#d0e8ff" />
            <hemisphereLight color="#aaddff" groundColor="#444422" intensity={0.7} />
            <directionalLight position={[10, 20, 15]} intensity={1.3} castShadow
                shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
            <directionalLight position={[-10, 10, -10]} intensity={0.4} color="#88aaff" />
            <pointLight position={[0, 40, 0]} intensity={0.3} distance={60} color="#ffffff" />
            <Environment preset="city" background={false} />
            <Suspense fallback={null}>
                <Stars radius={200} depth={60} count={1000} factor={2} saturation={0.2} fade speed={0.2} />
                <BuildingExterior
                    floors={TOTAL_FLOORS}
                    floorHeight={FLOOR_HEIGHT}
                    regionName={siteName}
                    currentFloor={currentFloor}
                    onFloorClick={onFloorClick}
                    onSwitchClick={onSwitchClick}
                />
            </Suspense>
        </>
    );
}

// ── Breadcrumb nav ────────────────────────────────────────────────────────────
function Breadcrumb({ viewMode, siteName, onGlobe }: {
    viewMode: ViewMode;
    siteName: string;
    onGlobe: () => void;
}) {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
            padding: '14px 20px',
            background: 'linear-gradient(180deg, rgba(2,4,12,0.97) 0%, transparent 100%)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'Inter', -apple-system, sans-serif",
            pointerEvents: 'none',
        }}>
            {/* Logo / brand */}
            <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0,188,235,0.15)', border: '1px solid rgba(0,188,235,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: '#00bceb', marginRight: 4,
            }}>DT</div>

            {/* Globe crumb */}
            <button
                onClick={viewMode !== 'globe' ? onGlobe : undefined}
                style={{
                    padding: '4px 10px', borderRadius: 6,
                    cursor: viewMode !== 'globe' ? 'pointer' : 'default',
                    color: viewMode !== 'globe' ? '#00bceb' : '#e2e8f0',
                    fontSize: 13, fontWeight: viewMode !== 'globe' ? 500 : 700,
                    fontFamily: 'inherit',
                    background: viewMode !== 'globe' ? 'rgba(0,188,235,0.08)' : 'rgba(255,255,255,0.04)',
                    border: viewMode !== 'globe' ? '1px solid rgba(0,188,235,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    pointerEvents: viewMode !== 'globe' ? 'auto' : 'none',
                }}
            >Globe</button>

            {viewMode === 'exterior' && (
                <>
                    <span style={{ color: '#374151', fontSize: 14 }}>›</span>
                    <button style={{
                        padding: '4px 10px', borderRadius: 6, cursor: 'default',
                        color: '#e2e8f0', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        pointerEvents: 'none',
                    }}>{siteName}</button>
                </>
            )}

            {/* View badge */}
            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#4b5563', fontWeight: 500 }}>
                {viewMode === 'globe'    && '🌐 Globe View'}
                {viewMode === 'exterior' && '🏢 Building View'}
            </div>
        </div>
    );
}

// ── Hint overlay ──────────────────────────────────────────────────────────────
function ViewHint({ viewMode }: { viewMode: ViewMode }) {
    const hints: Record<ViewMode, string> = {
        globe:    'Drag to rotate  ·  Scroll to zoom  ·  Click a marker to view site',
        exterior: 'Click a floor panel to highlight  ·  Click the switch to inspect  ·  Drag to orbit',
    };
    return (
        <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,12,22,0.88)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 999,
            padding: '9px 22px', zIndex: 20, pointerEvents: 'none',
            fontSize: 12, color: '#9ca3af',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>{hints[viewMode]}</div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function DigitalTwinPage() {
    const [viewMode, setViewMode]         = useState<ViewMode>('globe');
    const [selectedSite, setSelectedSite] = useState<GlobeSite | null>(null);
    const [currentFloor, setCurrentFloor] = useState<number>(1);
    const [transitioning, setTransitioning] = useState(false);
    const [switchFocused, setSwitchFocused] = useState(false);
    const controlsRef = useRef<any>(null);

    const handleSiteClick = useCallback((site: GlobeSite) => {
        setTransitioning(true);
        setTimeout(() => {
            setSelectedSite(site);
            setCurrentFloor(1);
            setViewMode('exterior');
            setTransitioning(false);
        }, 300);
    }, []);

    const handleFloorClick = useCallback((floor: number) => {
        // Just highlight the clicked floor — no interior navigation
        setCurrentFloor(floor);
        setSwitchFocused(false);
    }, []);

    const goGlobe = useCallback(() => {
        setSwitchFocused(false);
        setTransitioning(true);
        setTimeout(() => {
            setViewMode('globe');
            setSelectedSite(null);
            setTransitioning(false);
        }, 300);
    }, []);

    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#020408',
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>

            {/* Breadcrumb / navigation */}
            <Breadcrumb
                viewMode={viewMode}
                siteName={selectedSite?.name ?? ''}
                onGlobe={goGlobe}
            />

            {/* Transition overlay */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 25, pointerEvents: 'none',
                background: '#020408',
                opacity: transitioning ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }} />

            {/* ── GLOBE VIEW ──────────────────────────────── */}
            {viewMode === 'globe' && (
                <div style={{ position: 'absolute', inset: 0, paddingTop: 60 }}>
                    <DataCenterGlobe
                        sites={sampleSites}
                        onSiteClick={handleSiteClick}
                        hideSiteListPanel={false}
                        hideStatsPanel={false}
                        hideInstructions={false}
                    />
                </div>
            )}

            {/* ── EXTERIOR VIEW ───────────────────────────── */}
            {viewMode === 'exterior' && (
                <Canvas
                    shadows
                    gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
                    style={{ position: 'absolute', inset: 0 }}
                >
                    <PerspectiveCamera makeDefault position={[4, 22, 50]} fov={50} />
                    <OrbitControls
                        ref={controlsRef}
                        enabled={!switchFocused}
                        target={[3, 16, 0]}
                        minDistance={15} maxDistance={100}
                        enableDamping dampingFactor={0.07}
                        maxPolarAngle={Math.PI / 2.05}
                    />
                    <CameraAnimator focused={switchFocused} controlsRef={controlsRef} />
                    <Perf position="top-left" />
                    <ExteriorScene
                        siteName={selectedSite?.name ?? 'DC'}
                        currentFloor={currentFloor}
                        onFloorClick={handleFloorClick}
                        onSwitchClick={() => setSwitchFocused(true)}
                    />
                </Canvas>
            )}

            {/* ── SWITCH FOCUS OVERLAY ────────────────────── */}
            {viewMode === 'exterior' && switchFocused && (
                <>
                    {/* Back-to-building button */}
                    <button
                        onClick={() => setSwitchFocused(false)}
                        style={{
                            position: 'absolute', top: 60, right: 20, zIndex: 30,
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '8px 16px',
                            background: 'rgba(10,12,22,0.92)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0,188,235,0.35)', borderRadius: 8,
                            color: '#00bceb', fontSize: 13, fontWeight: 500,
                            fontFamily: "'Inter', -apple-system, sans-serif",
                            cursor: 'pointer',
                        }}
                    >
                        ← Back to Building
                    </button>

                    {/* Switch detail panel */}
                    <div style={{
                        position: 'absolute', bottom: 60, right: 20, zIndex: 30,
                        width: 270,
                        background: 'rgba(8,10,20,0.94)', backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(0,188,235,0.22)', borderRadius: 14,
                        padding: '18px 20px',
                        fontFamily: "'Inter', -apple-system, sans-serif",
                        color: '#e2e8f0',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <div style={{
                                width: 9, height: 9, borderRadius: '50%',
                                background: '#00ff55', boxShadow: '0 0 7px #00ff55',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.02em' }}>
                                APS-SW-01
                            </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>
                            APS Networks · AS7726-50X · 50×25GbE
                        </div>

                        {([
                            ['Cisco Meraki Ports', '25 × SFP+  (20 active)'],
                            ['Huawei Ports',       '25 × SFP+  (20 active)'],
                            ['Management',         'CTRL 1/2 + Console'],
                            ['USB',                '1 × USB-A'],
                            ['Status',             '● Online'],
                            ['Uptime',             '99.98 %'],
                        ] as [string, string][]).map(([label, value]) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '6px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                fontSize: 12,
                            }}>
                                <span style={{ color: '#64748b' }}>{label}</span>
                                <span style={{
                                    color: label === 'Status' ? '#00ff88' : '#cbd5e1',
                                    fontWeight: 500,
                                }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Hint */}
            <ViewHint viewMode={viewMode} />

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                button:hover { opacity: 0.85; }
                * { box-sizing: border-box; }
            `}</style>
        </div>
    );
}

export default DigitalTwinPage;
