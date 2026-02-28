/**
 * BuildingExterior Component
 *
 * Renders a 3D exterior view of the data center building:
 * - Multi-floor glass building with clickable floor panels
 * - APS Networks switch mounted on the side of the building at ground level
 * - Building name signage
 * - Ground plane
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';
import { APSSwitchVendor } from './APSSwitchVendor';

// ── Static floor metadata (shown in always-visible side cards) ─────────────
const FLOOR_META = [
    { racks: 12, servers: 48,  role: 'Compute',    status: 'online'  },
    { racks: 10, servers: 40,  role: 'Storage',    status: 'online'  },
    { racks: 14, servers: 56,  role: 'Compute',    status: 'online'  },
    { racks: 8,  servers: 32,  role: 'Networking', status: 'warning' },
    { racks: 12, servers: 48,  role: 'Compute',    status: 'online'  },
    { racks: 10, servers: 40,  role: 'GPU Cluster', status: 'online' },
    { racks: 6,  servers: 24,  role: 'Management', status: 'online'  },
    { racks: 14, servers: 56,  role: 'Compute',    status: 'online'  },
    { racks: 4,  servers: 16,  role: 'DMZ / Edge', status: 'online'  },
];

interface BuildingExteriorProps {
    floors: number;
    floorHeight: number;
    regionName: string;
    currentFloor: number;
    onFloorClick: (floor: number) => void;
    onSwitchClick?: () => void;
}

export function BuildingExterior({
    floors,
    floorHeight,
    regionName,
    currentFloor,
    onFloorClick,
    onSwitchClick,
}: BuildingExteriorProps) {
    const buildingHeight = floors * floorHeight;
    const buildingWidth  = 14;
    const buildingDepth  = 10;

    const materials = useMemo(() => ({
        glass: new THREE.MeshStandardMaterial({
            color: '#1a3a5a', transparent: true, opacity: 0.6,
            metalness: 0.9, roughness: 0.1,
        }),
        frame: new THREE.MeshStandardMaterial({
            color: '#333', metalness: 0.8, roughness: 0.2,
        }),
        concrete: new THREE.MeshStandardMaterial({
            color: '#555', roughness: 0.9,
        }),
        roofDark: new THREE.MeshStandardMaterial({
            color: '#2a2a2e', metalness: 0.6, roughness: 0.4,
        }),
        activeFloor: new THREE.MeshStandardMaterial({
            color: '#00aaff', emissive: '#00aaff', emissiveIntensity: 0.5,
            transparent: true, opacity: 0.8,
        }),
        switchPad: new THREE.MeshStandardMaterial({
            color: '#1c1c22', metalness: 0.7, roughness: 0.3,
        }),
    }), []);

    // APS switch scale on side of building – make it clearly visible
    const switchScale = 5.5;

    return (
        <group>
            {/* Building base/foundation */}
            <mesh position={[0, -0.5, 0]} material={materials.concrete}>
                <boxGeometry args={[buildingWidth + 2, 1, buildingDepth + 2]} />
            </mesh>

            {/* Each floor */}
            {Array.from({ length: floors }, (_, i) => {
                const floorY   = i * floorHeight;
                const isActive = i + 1 === currentFloor;
                const meta     = FLOOR_META[i] ?? { racks: 8, servers: 32, role: 'General', status: 'online' };
                const dotColor = meta.status === 'warning' ? '#ffaa00' : '#00ff88';

                return (
                    <group key={`floor-${i}`} position={[0, floorY, 0]}>
                        {/* Floor slab */}
                        <mesh position={[0, 0, 0]} material={materials.concrete}>
                            <boxGeometry args={[buildingWidth, 0.15, buildingDepth]} />
                        </mesh>

                        {/* Glass – FRONT (clickable to highlight) */}
                        <mesh
                            position={[0, floorHeight / 2, buildingDepth / 2]}
                            material={isActive ? materials.activeFloor : materials.glass}
                            onClick={(e) => { e.stopPropagation(); onFloorClick(i + 1); }}
                            onPointerOver={() => (document.body.style.cursor = 'pointer')}
                            onPointerOut={() => (document.body.style.cursor = 'default')}
                        >
                            <boxGeometry args={[buildingWidth - 0.2, floorHeight - 0.3, 0.05]} />
                        </mesh>

                        {/* Glass – BACK */}
                        <mesh position={[0, floorHeight / 2, -buildingDepth / 2]}
                              material={isActive ? materials.activeFloor : materials.glass}>
                            <boxGeometry args={[buildingWidth - 0.2, floorHeight - 0.3, 0.05]} />
                        </mesh>

                        {/* Glass – LEFT */}
                        <mesh position={[-buildingWidth / 2, floorHeight / 2, 0]}
                              material={isActive ? materials.activeFloor : materials.glass}>
                            <boxGeometry args={[0.05, floorHeight - 0.3, buildingDepth - 0.2]} />
                        </mesh>

                        {/* Glass – RIGHT */}
                        <mesh position={[buildingWidth / 2, floorHeight / 2, 0]}
                              material={isActive ? materials.activeFloor : materials.glass}>
                            <boxGeometry args={[0.05, floorHeight - 0.3, buildingDepth - 0.2]} />
                        </mesh>

                        {/* Corner columns */}
                        {([
                            [-buildingWidth / 2, 0, -buildingDepth / 2],
                            [-buildingWidth / 2, 0,  buildingDepth / 2],
                            [ buildingWidth / 2, 0, -buildingDepth / 2],
                            [ buildingWidth / 2, 0,  buildingDepth / 2],
                        ] as [number,number,number][]).map((pos, idx) => (
                            <mesh key={`col-${i}-${idx}`}
                                  position={[pos[0], floorHeight / 2, pos[2]]}
                                  material={materials.frame}>
                                <boxGeometry args={[0.3, floorHeight, 0.3]} />
                            </mesh>
                        ))}

                        {/* Floor label (on front glass) */}
                        <group position={[0, floorHeight / 2, buildingDepth / 2 + 0.06]}>
                            <mesh position={[0, 0, 0]}>
                                <planeGeometry args={[1.8, 1.2]} />
                                <meshStandardMaterial
                                    color={isActive ? '#003366' : '#1a1a1a'}
                                    emissive={isActive ? '#00aaff' : '#000000'}
                                    emissiveIntensity={isActive ? 0.3 : 0}
                                    transparent opacity={0.9}
                                />
                            </mesh>
                            <Text position={[0, 0, 0.01]} fontSize={0.8}
                                  color={isActive ? '#00ffff' : '#cccccc'}
                                  anchorX="center" anchorY="middle"
                                  sdfGlyphSize={64}>
                                {`F${i + 1}`}
                            </Text>
                        </group>

                        {/* ── Always-visible floor info card (left of building) ── */}
                        <Html
                            position={[-buildingWidth / 2 - 5, floorHeight / 2, 0]}
                            center
                            distanceFactor={20}
                            zIndexRange={[10, 0]}
                        >
                            <div
                                onClick={() => onFloorClick(i + 1)}
                                style={{
                                    background: isActive
                                        ? 'rgba(0,40,80,0.97)'
                                        : 'rgba(8,10,20,0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: isActive
                                        ? '1.5px solid rgba(0,188,235,0.8)'
                                        : '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '12px',
                                    padding: '14px 18px',
                                    minWidth: '200px',
                                    fontFamily: "'Inter', -apple-system, sans-serif",
                                    cursor: 'pointer',
                                    boxShadow: isActive
                                        ? '0 0 24px rgba(0,188,235,0.45), 0 6px 20px rgba(0,0,0,0.6)'
                                        : '0 6px 20px rgba(0,0,0,0.6)',
                                    transition: 'all 0.2s ease',
                                    userSelect: 'none',
                                }}
                            >
                                {/* Floor number row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{
                                        fontSize: 22, fontWeight: 800,
                                        color: isActive ? '#00e8ff' : '#e2e8f0',
                                        letterSpacing: '0.02em',
                                    }}>
                                        Floor {i + 1}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div style={{
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: dotColor,
                                            boxShadow: `0 0 7px ${dotColor}`,
                                        }} />
                                        <span style={{
                                            fontSize: 13, color: dotColor,
                                            fontWeight: 700, letterSpacing: '0.04em',
                                        }}>
                                            {meta.status === 'warning' ? 'WARN' : 'LIVE'}
                                        </span>
                                    </div>
                                </div>

                                {/* Role badge */}
                                <div style={{
                                    display: 'inline-block',
                                    background: isActive ? 'rgba(0,188,235,0.18)' : 'rgba(255,255,255,0.07)',
                                    border: isActive ? '1px solid rgba(0,188,235,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 5, padding: '3px 10px',
                                    fontSize: 12, color: isActive ? '#00bceb' : '#9ca3af',
                                    letterSpacing: '0.07em', fontWeight: 600,
                                    marginBottom: 12,
                                }}>
                                    {meta.role.toUpperCase()}
                                </div>

                                {/* Stats row */}
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: '#00bceb', lineHeight: 1 }}>{meta.racks}</div>
                                        <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.05em', marginTop: 3 }}>RACKS</div>
                                    </div>
                                    <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{meta.servers}</div>
                                        <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.05em', marginTop: 3 }}>SERVERS</div>
                                    </div>
                                </div>
                            </div>
                        </Html>
                    </group>
                );
            })}

            {/* ── ROOFTOP ──────────────────────────────────────── */}
            {/* Roof slab */}
            <mesh position={[0, buildingHeight + 0.1, 0]} material={materials.concrete}>
                <boxGeometry args={[buildingWidth + 0.5, 0.2, buildingDepth + 0.5]} />
            </mesh>

            {/* ── APS Networks Switch on table ──────── */}
            {/* APSSwitchVendor: W=1.20 H=0.18 D=0.44                          */}
            {/* Switch bottom at local y=-0.09. Table top surface at y=-0.09.   */}
            {/* Leg bottom at local y≈-0.435 → world y=2.39+(-0.435×5.5)≈0     */}
            <group
                position={[buildingWidth / 2 + 6.5, 2.39, 0]}
                rotation={[0, 0, 0]}
                scale={[switchScale, switchScale, switchScale]}
            >
                {/* Table top */}
                <mesh castShadow receiveShadow position={[0, -0.1025, 0]}>
                    <boxGeometry args={[1.36, 0.025, 0.58]} />
                    <meshStandardMaterial color="#1e1e26" metalness={0.80} roughness={0.25} />
                </mesh>

                {/* Four table legs */}
                {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]).map(([lx, lz], i) => (
                    <mesh key={`tl-${i}`} castShadow position={[lx * 0.660, -0.275, lz * 0.270]}>
                        <boxGeometry args={[0.028, 0.320, 0.028]} />
                        <meshStandardMaterial color="#2a2a35" metalness={0.85} roughness={0.20} />
                    </mesh>
                ))}

                {/* APSSwitchVendor – full 25+25 dual-vendor detail */}
                {/* Outer group captures chassis clicks for camera focus */}
                <group onClick={(e) => { e.stopPropagation(); onSwitchClick?.(); }}>
                    <APSSwitchVendor position={[0, 0, 0]} />
                </group>
            </group>

            {/* ── Switch lighting (scale 5.5 – switch top ≈ world y 2.89) ─── */}
            {/* Key: directly in front of face, at switch centre height */}
            <pointLight
                position={[buildingWidth / 2 + 6.5, 2.8, 6.0]}
                color="#e8f4ff" intensity={6.0} distance={14}
            />
            {/* Fill: right-side fill */}
            <pointLight
                position={[buildingWidth / 2 + 9.5, 3.2, 5.0]}
                color="#ffffff" intensity={3.5} distance={14}
            />
            {/* Meraki (blue) accent – left half */}
            <pointLight
                position={[buildingWidth / 2 + 3.5, 3.5, 4.0]}
                color="#00bceb" intensity={2.5} distance={12}
            />
            {/* Huawei (red) accent – right half */}
            <pointLight
                position={[buildingWidth / 2 + 9.5, 3.5, 4.0]}
                color="#ff3344" intensity={2.5} distance={12}
            />

            {/* ── Wire Tray System ─────────────────────────────────────────────── */}
            {/* Seg A: vertical tray down building right wall face (x=7.08, z=0)  */}
            {/* Seg B: Z-run along wall base (z: 0 → -1.28, y=0.50, x≈7.10)     */}
            {/* Seg C: outward horizontal run (x: 7.30 → 10.04, z=-1.28, y=0.50) */}
            {/* Seg D: vertical riser to switch table height (y: 0.50 → 1.92)    */}
            {/* Cables: orange (fiber), cyan (network), yellow (power) — visible  */}
            <group>

                {/* ═══ SEGMENT A – Vertical tray on right wall face, full building height ═══ */}
                {/* Runs y=0 → y=buildingHeight (36), one bracket per floor midpoint          */}
                {/* Tray back plate flush to wall */}
                <mesh castShadow position={[7.08, buildingHeight / 2, 0]}>
                    <boxGeometry args={[0.05, buildingHeight, 0.30]} />
                    <meshStandardMaterial color="#252532" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Left rail */}
                <mesh castShadow position={[7.14, buildingHeight / 2, -0.14]}>
                    <boxGeometry args={[0.04, buildingHeight, 0.04]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Right rail */}
                <mesh castShadow position={[7.14, buildingHeight / 2, 0.14]}>
                    <boxGeometry args={[0.04, buildingHeight, 0.04]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.85} roughness={0.25} />
                </mesh>
                {/* Wall clamp brackets – one per floor at floor midpoint */}
                {Array.from({ length: floors }, (_, i) => floorHeight / 2 + i * floorHeight).map((y, bi) => (
                    <mesh key={`va-${bi}`} castShadow position={[7.06, y, 0]}>
                        <boxGeometry args={[0.10, 0.06, 0.32]} />
                        <meshStandardMaterial color="#1a1a22" metalness={0.85} roughness={0.25} />
                    </mesh>
                ))}
                {/* CABLES – orange fiber (runs full height, all floors connected) */}
                <mesh position={[7.15, buildingHeight / 2, -0.07]}>
                    <boxGeometry args={[0.05, buildingHeight, 0.05]} />
                    <meshStandardMaterial color="#ff6600" emissive="#552200" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>
                {/* CABLES – cyan network */}
                <mesh position={[7.15, buildingHeight / 2, 0.00]}>
                    <boxGeometry args={[0.05, buildingHeight, 0.05]} />
                    <meshStandardMaterial color="#00bbff" emissive="#003344" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>
                {/* CABLES – yellow power */}
                <mesh position={[7.15, buildingHeight / 2, 0.07]}>
                    <boxGeometry args={[0.05, buildingHeight, 0.05]} />
                    <meshStandardMaterial color="#ffcc00" emissive="#443300" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>

                {/* ═══ Corner A → B (vertical wall tray to Z-base run) ═══ */}
                <mesh castShadow position={[7.11, 0.50, -0.11]}>
                    <boxGeometry args={[0.18, 0.30, 0.24]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>

                {/* ═══ SEGMENT B – Z-run along wall base (z: 0 → -1.28) ═══ */}
                <mesh castShadow position={[7.08, 0.50, -0.64]}>
                    <boxGeometry args={[0.05, 0.30, 1.28]} />
                    <meshStandardMaterial color="#252532" metalness={0.82} roughness={0.28} />
                </mesh>
                <mesh castShadow position={[7.21, 0.42, -0.64]}>
                    <boxGeometry args={[0.22, 0.04, 1.28]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>
                <mesh castShadow position={[7.21, 0.55, -0.64]}>
                    <boxGeometry args={[0.22, 0.10, 1.28]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Cables in segment B */}
                <mesh position={[7.19, 0.51, -0.64]}>
                    <boxGeometry args={[0.05, 0.05, 1.28]} />
                    <meshStandardMaterial color="#ff6600" emissive="#552200" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>
                <mesh position={[7.21, 0.51, -0.64]}>
                    <boxGeometry args={[0.05, 0.05, 1.28]} />
                    <meshStandardMaterial color="#00bbff" emissive="#003344" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>
                <mesh position={[7.23, 0.51, -0.64]}>
                    <boxGeometry args={[0.05, 0.05, 1.28]} />
                    <meshStandardMaterial color="#ffcc00" emissive="#443300" emissiveIntensity={0.4} roughness={0.65} />
                </mesh>

                {/* ═══ Corner B → C (Z-run to outward X-run) ═══ */}
                <mesh castShadow position={[7.21, 0.50, -1.28]}>
                    <boxGeometry args={[0.24, 0.30, 0.24]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>

                {/* ═══ SEGMENT C – Outward horizontal run (x: 7.33 → 10.04, z=-1.28) ═══ */}
                {/* length=2.71, center x=8.685 */}
                <mesh castShadow position={[8.685, 0.42, -1.28]}>
                    <boxGeometry args={[2.71, 0.04, 0.30]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>
                {/* Far rail */}
                <mesh castShadow position={[8.685, 0.55, -1.43]}>
                    <boxGeometry args={[2.71, 0.12, 0.04]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Near rail */}
                <mesh castShadow position={[8.685, 0.55, -1.13]}>
                    <boxGeometry args={[2.71, 0.12, 0.04]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Mounting brackets */}
                {[7.70, 8.685, 9.67].map((bx, bi) => (
                    <mesh key={`hb-${bi}`} castShadow position={[bx, 0.27, -1.28]}>
                        <boxGeometry args={[0.06, 0.32, 0.34]} />
                        <meshStandardMaterial color="#1c1c26" metalness={0.80} roughness={0.32} />
                    </mesh>
                ))}
                {/* Cables in segment C */}
                <mesh position={[8.685, 0.52, -1.34]}>
                    <boxGeometry args={[2.71, 0.05, 0.05]} />
                    <meshStandardMaterial color="#ff6600" emissive="#552200" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>
                <mesh position={[8.685, 0.52, -1.28]}>
                    <boxGeometry args={[2.71, 0.05, 0.05]} />
                    <meshStandardMaterial color="#00bbff" emissive="#003344" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>
                <mesh position={[8.685, 0.52, -1.22]}>
                    <boxGeometry args={[2.71, 0.05, 0.05]} />
                    <meshStandardMaterial color="#ffcc00" emissive="#443300" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>

                {/* ═══ Corner C → D (horizontal to vertical riser) ═══ */}
                <mesh castShadow position={[10.04, 0.52, -1.28]}>
                    <boxGeometry args={[0.24, 0.24, 0.30]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>

                {/* ═══ SEGMENT D – Vertical riser (y: 0.64 → 1.92, x=10.04, z=-1.28) ═══ */}
                <mesh castShadow position={[10.04, 1.28, -1.28]}>
                    <boxGeometry args={[0.05, 1.28, 0.30]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>
                {/* Far rail */}
                <mesh castShadow position={[10.04, 1.28, -1.43]}>
                    <boxGeometry args={[0.04, 1.28, 0.05]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Near rail */}
                <mesh castShadow position={[10.04, 1.28, -1.13]}>
                    <boxGeometry args={[0.04, 1.28, 0.05]} />
                    <meshStandardMaterial color="#1e1e28" metalness={0.82} roughness={0.28} />
                </mesh>
                {/* Cables in riser */}
                <mesh position={[10.04, 1.28, -1.34]}>
                    <boxGeometry args={[0.05, 1.28, 0.05]} />
                    <meshStandardMaterial color="#ff6600" emissive="#552200" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>
                <mesh position={[10.04, 1.28, -1.28]}>
                    <boxGeometry args={[0.05, 1.28, 0.05]} />
                    <meshStandardMaterial color="#00bbff" emissive="#003344" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>
                <mesh position={[10.04, 1.28, -1.22]}>
                    <boxGeometry args={[0.05, 1.28, 0.05]} />
                    <meshStandardMaterial color="#ffcc00" emissive="#443300" emissiveIntensity={0.5} roughness={0.65} />
                </mesh>

                {/* Top termination fitting */}
                <mesh castShadow position={[10.10, 1.94, -1.28]}>
                    <boxGeometry args={[0.20, 0.18, 0.30]} />
                    <meshStandardMaterial color="#252532" metalness={0.80} roughness={0.30} />
                </mesh>
            </group>

            {/* Roof railing */}
            {([-buildingWidth / 2 - 0.25, buildingWidth / 2 + 0.25] as number[]).map((x, i) => (
                <mesh key={`rail-${i}`}
                      position={[x, buildingHeight + 0.65, 0]}
                      material={materials.frame}>
                    <boxGeometry args={[0.08, 1.1, buildingDepth + 0.5]} />
                </mesh>
            ))}
            {([-buildingDepth / 2 - 0.25, buildingDepth / 2 + 0.25] as number[]).map((z, i) => (
                <mesh key={`railz-${i}`}
                      position={[0, buildingHeight + 0.65, z]}
                      material={materials.frame}>
                    <boxGeometry args={[buildingWidth + 0.5, 0.08, 0.08]} />
                </mesh>
            ))}

            {/* ── BUILDING SIGNAGE ──────────────────────────────── */}
            <Text
                position={[0, buildingHeight - 1, buildingDepth / 2 + 0.12]}
                fontSize={0.65} color="#00aaff" anchorX="center"
            >
                {`DATA CENTER · ${regionName}`}
            </Text>

            {/* APS label above table – raised for scale 5.5 (switch top ≈ y 2.89) */}
            <Text
                position={[buildingWidth / 2 + 6.5, 4.0, 0]}
                fontSize={0.45} color="#00bceb" anchorX="center"
            >
                APS Networks Switch
            </Text>

            {/* Ground plane */}
            <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#111115" metalness={0.2} roughness={0.9} />
            </mesh>

            {/* Ground grid lines */}
            {Array.from({ length: 10 }, (_, i) => i - 5).map(k => (
                <mesh key={`gx-${k}`} position={[k * 3, -0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.03, 50]} />
                    <meshStandardMaterial color="#1a1a2e" />
                </mesh>
            ))}
            {Array.from({ length: 10 }, (_, i) => i - 5).map(k => (
                <mesh key={`gz-${k}`} position={[0, -0.99, k * 3]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[50, 0.03]} />
                    <meshStandardMaterial color="#1a1a2e" />
                </mesh>
            ))}
        </group>
    );
}

export default BuildingExterior;
