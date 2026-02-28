/**
 * SwitchDemoPage
 *
 * Full-screen 3-D showcase of the APS Networks 50-port multi-vendor switch.
 *
 * – Canvas with orbit controls
 * – Rich layered lighting rig (ambient, hemisphere, directionals, spots, points, rim, under-glow)
 * – Animated pulsing accent lights (Meraki cyan / Huawei red)
 * – Stars backdrop + reflective ground + sci-fi grid
 * – Top bar: title + live badge
 * – Bottom bar: vendor stats cards
 * – Right panel: port detail on click
 */

import { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Stars, Environment, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import {
    APSSwitchVendor,
    type PortInfo,
    MERAKI_ACTIVE_COUNT,
    HUAWEI_ACTIVE_COUNT,
} from './DigitalTwin/APSSwitchVendor';

const MERAKI_TOTAL = 25;
const HUAWEI_TOTAL = 25;

// ── Animated accent lights (pulse independently per vendor) ──────────────────
function AnimatedLights() {
    const merakiRef  = useRef<THREE.PointLight>(null!);
    const huaweiRef  = useRef<THREE.PointLight>(null!);
    const rimRef     = useRef<THREE.PointLight>(null!);
    const underRef   = useRef<THREE.PointLight>(null!);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        // Meraki cyan pulses slowly
        if (merakiRef.current)  merakiRef.current.intensity  = 1.2 + Math.sin(t * 0.9) * 0.5;
        // Huawei red pulses slightly offset
        if (huaweiRef.current)  huaweiRef.current.intensity  = 1.2 + Math.sin(t * 0.9 + 1.8) * 0.5;
        // Rim light breathes gently
        if (rimRef.current)     rimRef.current.intensity     = 0.5 + Math.sin(t * 0.4) * 0.2;
        // Under-glow drifts
        if (underRef.current)   underRef.current.intensity   = 0.55 + Math.sin(t * 0.7 + 0.5) * 0.2;
    });

    return (
        <>
            {/* ── Animated Meraki point – left mid ─────────────── */}
            <pointLight ref={merakiRef}  position={[-1.1, 0.12, 0.9]}
                color="#00bceb" intensity={1.2} distance={4.5} />
            {/* ── Animated Huawei point – right mid ────────────── */}
            <pointLight ref={huaweiRef}  position={[ 1.1, 0.12, 0.9]}
                color="#ff3344" intensity={1.2} distance={4.5} />
            {/* ── Animated rim – rear purple ────────────────────── */}
            <pointLight ref={rimRef}     position={[ 0,   1.2, -1.8]}
                color="#6655ff" intensity={0.5} distance={5} />
            {/* ── Animated under-glow ──────────────────────────── */}
            <pointLight ref={underRef}   position={[ 0,  -0.45, 0.55]}
                color="#0044cc" intensity={0.55} distance={3} />
        </>
    );
}

// ── Static rich lighting rig ─────────────────────────────────────────────────
function SceneLights() {
    return (
        <>
            {/* Base ambient – deep blue-indigo */}
            <ambientLight intensity={0.55} color="#0d1830" />

            {/* Hemisphere – sky blue / ground dark */}
            <hemisphereLight args={['#1a2a4a', '#050210', 0.85]} />

            {/* Key directional – slightly cool white, hard shadows */}
            <directionalLight
                position={[2.5, 5, 3.5]} intensity={1.5} castShadow color="#cce4ff"
                shadow-mapSize-width={2048} shadow-mapSize-height={2048}
                shadow-bias={-0.001}
            />

            {/* ── Meraki (cyan) static fill ──────────────────────── */}
            {/* Wide wash from far left */}
            <pointLight position={[-4.0, 0.5, 1.5]} color="#00bceb" intensity={0.9} distance={8} />
            {/* Near accent – upper left */}
            <pointLight position={[-1.8, 1.6, 0.8]} color="#00d4ff" intensity={0.6} distance={4} />
            {/* Ground bounce left */}
            <pointLight position={[-0.9, -0.55, 0.7]} color="#005588" intensity={0.45} distance={2.5} />

            {/* ── Huawei (red) static fill ───────────────────────── */}
            {/* Wide wash from far right */}
            <pointLight position={[ 4.0, 0.5, 1.5]} color="#ff3344" intensity={0.9} distance={8} />
            {/* Near accent – upper right */}
            <pointLight position={[ 1.8, 1.6, 0.8]} color="#ff5566" intensity={0.6} distance={4} />
            {/* Ground bounce right */}
            <pointLight position={[ 0.9, -0.55, 0.7]} color="#550011" intensity={0.45} distance={2.5} />

            {/* ── Rim / back-lights ──────────────────────────────── */}
            {/* Main blue-purple rim from behind */}
            <directionalLight position={[0, 2.5, -4]} intensity={0.65} color="#5566ee" />
            {/* Secondary rim points */}
            <pointLight position={[-1.2, 0.8, -1.8]} color="#4466ff" intensity={0.45} distance={5} />
            <pointLight position={[ 1.2, 0.8, -1.8]} color="#9944ff" intensity={0.40} distance={5} />

            {/* ── Top-down accent ────────────────────────────────── */}
            <pointLight position={[ 0, 2.5, 0.3]} color="#334466" intensity={0.5} distance={4} />

            {/* ── Front soft wash ────────────────────────────────── */}
            <pointLight position={[0, 0.1, 3.5]} color="#aabbdd" intensity={0.18} distance={6} />

            {/* ── Spotlights for drama ───────────────────────────── */}
            <SpotLight
                position={[-1.6, 2.8, 1.6]} color="#00bceb"
                intensity={1.4} angle={0.42} penumbra={0.75}
                distance={7} castShadow attenuation={3} anglePower={4}
            />
            <SpotLight
                position={[ 1.6, 2.8, 1.6]} color="#ff3344"
                intensity={1.4} angle={0.42} penumbra={0.75}
                distance={7} castShadow attenuation={3} anglePower={4}
            />
            {/* Center top-spot – cool neutral */}
            <SpotLight
                position={[0, 3.5, 1.2]} color="#ddeeff"
                intensity={0.7} angle={0.35} penumbra={0.9}
                distance={6} attenuation={4} anglePower={3}
            />
        </>
    );
}

// ── Ground reflector + grid ──────────────────────────────────────────────────
function SceneFloor() {
    return (
        <>
            {/* Slightly reflective dark metal ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} receiveShadow>
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial color="#050810" metalness={0.45} roughness={0.7} />
            </mesh>

            {/* Subtle second layer for extra depth */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.131, 0]}>
                <planeGeometry args={[6, 6]} />
                <meshStandardMaterial color="#030608" metalness={0.6} roughness={0.5}
                    transparent opacity={0.6} />
            </mesh>

            {/* Sci-fi primary grid */}
            <Grid position={[0, -0.128, 0]} args={[10, 10]}
                cellSize={0.25} cellThickness={0.5} cellColor="#0a1840"
                sectionSize={1.0} sectionThickness={0.9} sectionColor="#0c1e88"
                fadeDistance={7} fadeStrength={2.0} infiniteGrid />

            {/* Fine micro-grid overlay */}
            <Grid position={[0, -0.127, 0]} args={[6, 6]}
                cellSize={0.05} cellThickness={0.3} cellColor="#07112a"
                sectionSize={0.25} sectionThickness={0.3} sectionColor="#091440"
                fadeDistance={3} fadeStrength={3.0} />
        </>
    );
}

// ── Port bar UI element ──────────────────────────────────────────────────────
function PortBar({ active, total, color }: { active: number; total: number; color: string }) {
    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${(active / total) * 100}%`,
                    background: color, borderRadius: 2,
                    boxShadow: `0 0 8px ${color}, 0 0 16px ${color}44`,
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3,
                          fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)' }}>
                <span>{active} active</span>
                <span>{total - active} inactive</span>
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function SwitchDemoPage() {
    const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);

    return (
        <div style={{
            width: '100vw', height: '100vh', background: '#030508',
            position: 'relative', overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, sans-serif",
        }}>

            {/* ── 3-D CANVAS ──────────────────────────────────────── */}
            <Canvas
                shadows
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
                style={{ position: 'absolute', inset: 0 }}
            >
                <PerspectiveCamera makeDefault position={[0.7, 0.45, 1.75]} fov={42} />
                <OrbitControls
                    target={[0, 0, 0]}
                    minDistance={0.6} maxDistance={5.5}
                    enableDamping dampingFactor={0.06}
                />

                {/* Environment map (warehouse preset) for metallic reflections */}
                <Environment preset="warehouse" background={false} />

                {/* Static rich lighting */}
                <SceneLights />

                {/* Animated pulsing accent lights */}
                <AnimatedLights />

                <Suspense fallback={null}>
                    {/* Stars backdrop */}
                    <Stars
                        radius={40} depth={30} count={2000}
                        factor={2} saturation={0.4} fade speed={0.4}
                    />

                    {/* Floor + grids */}
                    <SceneFloor />

                    {/* THE SWITCH */}
                    <APSSwitchVendor position={[0, 0, 0]} onPortClick={setSelectedPort} />
                </Suspense>
            </Canvas>

            {/* ── TOP BAR ─────────────────────────────────────────── */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16,
                background: 'linear-gradient(180deg, rgba(2,4,10,0.98) 0%, rgba(2,4,10,0.6) 70%, transparent 100%)',
                pointerEvents: 'none', zIndex: 10,
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.02em' }}>
                        APS Networks &nbsp;·&nbsp; Multi-Vendor Switch
                    </h1>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                        50 SFP+ ports &nbsp;·&nbsp;
                        <span style={{ color: '#00bceb' }}>25 × Cisco Meraki</span>
                        &nbsp;·&nbsp;
                        <span style={{ color: '#ff5566' }}>25 × Huawei</span>
                        &nbsp;·&nbsp; AS7726-50X
                    </p>
                </div>

                {/* Live badge */}
                <div style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px',
                    background: 'rgba(0,255,85,0.05)', border: '1px solid rgba(0,255,85,0.2)',
                    borderRadius: 20,
                }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#00ff55', boxShadow: '0 0 10px rgba(0,255,85,1), 0 0 20px rgba(0,255,85,0.5)',
                        animation: 'pulse 2s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: 11, color: '#00cc44', fontWeight: 600, letterSpacing: '0.05em' }}>
                        OPERATIONAL
                    </span>
                </div>
            </div>

            {/* ── BOTTOM STATS ─────────────────────────────────────── */}
            <div style={{
                position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: 10, zIndex: 10, pointerEvents: 'none',
            }}>
                {/* Meraki */}
                <div style={{
                    background: 'rgba(1,10,20,0.94)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,188,235,0.3)',
                    borderRadius: 14, padding: '14px 20px', minWidth: 230,
                    boxShadow: '0 0 24px rgba(0,188,235,0.08), inset 0 0 20px rgba(0,188,235,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'rgba(0,188,235,0.15)', border: '1px solid rgba(0,188,235,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                            boxShadow: '0 0 10px rgba(0,188,235,0.2)',
                        }}>🔵</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4ff' }}>Cisco Meraki</div>
                            <div style={{ fontSize: 10, color: '#4a7a9b', marginTop: 1 }}>SFP+ · 25GbE · Ports 1–25</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#00bceb', lineHeight: 1,
                                          textShadow: '0 0 12px rgba(0,188,235,0.8)' }}>
                                {MERAKI_ACTIVE_COUNT}
                            </div>
                            <div style={{ fontSize: 8, color: '#336688', letterSpacing: '0.05em' }}>
                                / {MERAKI_TOTAL} ACTIVE
                            </div>
                        </div>
                    </div>
                    <PortBar active={MERAKI_ACTIVE_COUNT} total={MERAKI_TOTAL} color="#00bceb" />
                </div>

                {/* Total */}
                <div style={{
                    background: 'rgba(8,8,20,0.94)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(100,100,180,0.2)', borderRadius: 14,
                    padding: '14px 22px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 110,
                    boxShadow: '0 0 24px rgba(80,80,180,0.07)',
                }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#e2e8f0', lineHeight: 1,
                                  textShadow: '0 0 20px rgba(150,150,255,0.4)' }}>50</div>
                    <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.08em' }}>TOTAL PORTS</div>
                    <div style={{ fontSize: 9, color: '#4b5563', marginTop: 4 }}>
                        {MERAKI_ACTIVE_COUNT + HUAWEI_ACTIVE_COUNT} active
                    </div>
                </div>

                {/* Huawei */}
                <div style={{
                    background: 'rgba(20,2,6,0.94)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,51,68,0.3)',
                    borderRadius: 14, padding: '14px 20px', minWidth: 230,
                    boxShadow: '0 0 24px rgba(255,51,68,0.08), inset 0 0 20px rgba(255,51,68,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'rgba(255,51,68,0.15)', border: '1px solid rgba(255,51,68,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                            boxShadow: '0 0 10px rgba(255,51,68,0.2)',
                        }}>🔴</div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ff5566' }}>Huawei</div>
                            <div style={{ fontSize: 10, color: '#9b4a52', marginTop: 1 }}>SFP+ · 25GbE · Ports 26–50</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#ff3344', lineHeight: 1,
                                          textShadow: '0 0 12px rgba(255,51,68,0.8)' }}>
                                {HUAWEI_ACTIVE_COUNT}
                            </div>
                            <div style={{ fontSize: 8, color: '#882233', letterSpacing: '0.05em' }}>
                                / {HUAWEI_TOTAL} ACTIVE
                            </div>
                        </div>
                    </div>
                    <PortBar active={HUAWEI_ACTIVE_COUNT} total={HUAWEI_TOTAL} color="#ff3344" />
                </div>
            </div>

            {/* ── PORT DETAIL PANEL ─────────────────────────────────── */}
            {selectedPort && (
                <div style={{
                    position: 'absolute', top: '50%', right: 24,
                    transform: 'translateY(-50%)',
                    background: 'rgba(4,6,16,0.98)', backdropFilter: 'blur(24px)',
                    border: `1px solid ${selectedPort.vendor === 'meraki' ? 'rgba(0,188,235,0.5)' : 'rgba(255,51,68,0.5)'}`,
                    borderRadius: 14, padding: 20, width: 215, zIndex: 20,
                    boxShadow: `0 8px 48px ${selectedPort.vendor === 'meraki'
                        ? 'rgba(0,188,235,0.2)' : 'rgba(255,51,68,0.2)'},
                        inset 0 0 30px ${selectedPort.vendor === 'meraki'
                        ? 'rgba(0,188,235,0.04)' : 'rgba(255,51,68,0.04)'}`,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        paddingBottom: 14,
                        borderBottom: `1px solid ${selectedPort.vendor === 'meraki' ? 'rgba(0,188,235,0.2)' : 'rgba(255,51,68,0.2)'}`,
                        marginBottom: 14,
                    }}>
                        <div style={{
                            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                            background: selectedPort.vendor === 'meraki' ? '#00bceb' : '#ff3344',
                            boxShadow: `0 0 12px ${selectedPort.vendor === 'meraki' ? 'rgba(0,188,235,1)' : 'rgba(255,51,68,1)'}`,
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 700,
                            color: selectedPort.vendor === 'meraki' ? '#00d4ff' : '#ff5566' }}>
                            {selectedPort.vendor === 'meraki' ? 'Cisco Meraki' : 'Huawei'}
                        </span>
                    </div>

                    <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
                        {[
                            ['Port',      String(selectedPort.globalPortNum)],
                            ['Vendor #',  String(selectedPort.portNum)],
                            ['Type',      'SFP+'],
                            ['Speed',     '25 GbE'],
                            ['Protocol',  'IEEE 802.3bj'],
                            ['Status',    selectedPort.active ? '● Active' : '○ Inactive'],
                        ].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: '#4b5563' }}>{k}</span>
                                <span style={{
                                    color: k === 'Status'
                                        ? selectedPort.active ? '#00ff55' : '#ff4444'
                                        : '#e2e8f0',
                                    fontWeight: k === 'Port' ? 700 : 400,
                                    textShadow: k === 'Status' && selectedPort.active
                                        ? '0 0 8px rgba(0,255,85,0.7)' : undefined,
                                }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setSelectedPort(null)} style={{
                        marginTop: 8, width: '100%', padding: 7,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, color: '#6b7280', cursor: 'pointer', fontSize: 11,
                        fontFamily: 'inherit',
                    }}>
                        Dismiss
                    </button>
                </div>
            )}

            {/* ── LEGEND + CONTROLS ─────────────────────────────────── */}
            <div style={{
                position: 'absolute', bottom: 130, right: 24,
                zIndex: 10, pointerEvents: 'none', textAlign: 'right',
            }}>
                <div style={{
                    display: 'inline-flex', flexDirection: 'column', gap: 5,
                    marginBottom: 10, background: 'rgba(4,6,16,0.88)',
                    backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10, padding: '10px 14px',
                }}>
                    {[
                        { color: '#0077a8', glow: '#00bceb', label: 'Cisco Meraki zone' },
                        { color: '#aa1122', glow: '#ff3344', label: 'Huawei zone' },
                        { color: '#55556a', glow: undefined,  label: 'Vendor demarcation' },
                    ].map(({ color, glow, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: 2, background: color,
                                boxShadow: glow ? `0 0 7px ${glow}` : undefined,
                            }} />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.8 }}>
                    <div>Drag to rotate</div>
                    <div>Scroll to zoom</div>
                    <div>Click port for info</div>
                </div>
            </div>

            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
            `}</style>
        </div>
    );
}

export default SwitchDemoPage;
