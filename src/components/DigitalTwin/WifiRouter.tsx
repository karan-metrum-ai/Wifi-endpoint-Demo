/**
 * WifiRouter
 *
 * 3-D WiFi router model:
 * – Flat dark-charcoal rectangular body
 * – Four antennas at the rear, evenly spread and angled outward
 * – WiFi concentric arcs engraved on top surface
 * – Row of green LED indicators on the front face
 * – Hover glow + selection highlight
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export interface WifiRouterProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    label?: string;
    isSelected?: boolean;
    onClick?: () => void;
    /** Number of active LEDs (max 5) */
    activeLeds?: number;
}

// ── Dimensions ───────────────────────────────────────────────────────────────
const BW = 0.82;   // body width
const BH = 0.12;   // body height
const BD = 0.54;   // body depth

const ANT_R  = 0.012;   // antenna cylinder radius
const ANT_H  = 0.32;    // antenna height
const ANT_TILT = 0.18;  // tilt inward (radians, slight outward lean)

// ── WiFi arc helper ───────────────────────────────────────────────────────────
function WifiArc({ radius, y }: { radius: number; y: number }) {
    const geo = useMemo(() => {
        // Half-torus (PI arc) lying flat on the top surface
        return new THREE.TorusGeometry(radius, 0.008, 6, 28, Math.PI);
    }, [radius]);

    return (
        <mesh
            geometry={geo}
            position={[0, y, BD * 0.05]}
            rotation={[Math.PI / 2, 0, 0]}
        >
            <meshStandardMaterial color="#111118" roughness={0.9} />
        </mesh>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function WifiRouter({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    label,
    isSelected = false,
    onClick,
    activeLeds = 4,
}: WifiRouterProps) {
    const [hovered, setHovered] = useState(false);

    const mats = useMemo(() => ({
        body: new THREE.MeshStandardMaterial({
            color: '#1e1e22',
            metalness: 0.45,
            roughness: 0.55,
        }),
        bodyTop: new THREE.MeshStandardMaterial({
            color: '#252528',
            metalness: 0.3,
            roughness: 0.6,
        }),
        antenna: new THREE.MeshStandardMaterial({
            color: '#161618',
            metalness: 0.6,
            roughness: 0.4,
        }),
        antennaTip: new THREE.MeshStandardMaterial({
            color: '#2a2a2e',
            metalness: 0.5,
            roughness: 0.5,
        }),
        frontFace: new THREE.MeshStandardMaterial({
            color: '#1a1a1e',
            metalness: 0.3,
            roughness: 0.7,
        }),
        ledOn: new THREE.MeshStandardMaterial({
            color: '#00ff44',
            emissive: '#00cc33',
            emissiveIntensity: 2.8,
            roughness: 0.4,
        }),
        ledOff: new THREE.MeshStandardMaterial({
            color: '#0a2210',
            roughness: 0.8,
        }),
        selectedGlow: new THREE.MeshBasicMaterial({
            color: '#00bceb',
            transparent: true,
            opacity: 0.10,
            depthWrite: false,
        }),
        bottomRubber: new THREE.MeshStandardMaterial({
            color: '#111114',
            roughness: 1.0,
        }),
        ventSlat: new THREE.MeshStandardMaterial({
            color: '#141416',
            roughness: 0.9,
        }),
    }), []);

    const LEDs = Array.from({ length: 5 }, (_, i) => i < activeLeds);
    const ledSpacing = (BW - 0.25) / 4;   // 5 LEDs across front

    return (
        <group
            position={position}
            rotation={rotation}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e)  => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default'; }}
        >
            {/* ── BODY ─────────────────────────────────────────── */}
            {/* Main chassis */}
            <mesh castShadow receiveShadow material={mats.body}>
                <boxGeometry args={[BW, BH, BD]} />
            </mesh>

            {/* Top face (slightly lighter) */}
            <mesh position={[0, BH / 2 + 0.001, 0]} material={mats.bodyTop}>
                <boxGeometry args={[BW - 0.01, 0.002, BD - 0.01]} />
            </mesh>

            {/* Bottom rubber feet strip */}
            <mesh position={[0, -BH / 2 - 0.005, 0]} material={mats.bottomRubber}>
                <boxGeometry args={[BW - 0.04, 0.008, BD - 0.04]} />
            </mesh>

            {/* Side vent slats (right side) */}
            {Array.from({ length: 4 }, (_, i) => (
                <mesh
                    key={`rv-${i}`}
                    position={[BW / 2 - 0.001, -0.01 + i * 0.026, BD * 0.2]}
                    material={mats.ventSlat}
                >
                    <boxGeometry args={[0.004, 0.018, BD * 0.28]} />
                </mesh>
            ))}

            {/* Side vent slats (left side) */}
            {Array.from({ length: 4 }, (_, i) => (
                <mesh
                    key={`lv-${i}`}
                    position={[-BW / 2 + 0.001, -0.01 + i * 0.026, BD * 0.2]}
                    material={mats.ventSlat}
                >
                    <boxGeometry args={[0.004, 0.018, BD * 0.28]} />
                </mesh>
            ))}

            {/* ── FRONT FACE DETAIL ─────────────────────────────── */}
            <mesh position={[0, 0, BD / 2 + 0.001]} material={mats.frontFace}>
                <boxGeometry args={[BW - 0.01, BH - 0.01, 0.003]} />
            </mesh>

            {/* ── GREEN LEDs (front face) ─────────────────────── */}
            {LEDs.map((on, i) => {
                const x = -((LEDs.length - 1) / 2) * ledSpacing + i * ledSpacing;
                return (
                    <mesh
                        key={`led-${i}`}
                        position={[x, -BH * 0.08, BD / 2 + 0.005]}
                        material={on ? mats.ledOn : mats.ledOff}
                    >
                        <boxGeometry args={[0.022, 0.014, 0.003]} />
                    </mesh>
                );
            })}

            {/* LED point light glow */}
            <pointLight
                position={[0, -BH * 0.08, BD / 2 + 0.08]}
                color="#00ff44"
                intensity={0.25}
                distance={0.8}
            />

            {/* ── WiFi SYMBOL (top surface, 3 concentric arcs) ─── */}
            <WifiArc radius={0.055} y={BH / 2 + 0.003} />
            <WifiArc radius={0.100} y={BH / 2 + 0.003} />
            <WifiArc radius={0.145} y={BH / 2 + 0.003} />
            {/* Center dot */}
            <mesh position={[0, BH / 2 + 0.004, BD * 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.003, 10]} />
                <meshStandardMaterial color="#111118" roughness={0.9} />
            </mesh>

            {/* ── ANTENNAS (4 total: 2 on left side, 2 on right side) ── */}
            {([
                { x: -BW / 2 + 0.01, z: -BD * 0.28, tiltZ: -ANT_TILT },
                { x: -BW / 2 + 0.01, z:  BD * 0.28, tiltZ: -ANT_TILT },
                { x:  BW / 2 - 0.01, z: -BD * 0.28, tiltZ:  ANT_TILT },
                { x:  BW / 2 - 0.01, z:  BD * 0.28, tiltZ:  ANT_TILT },
            ] as { x: number; z: number; tiltZ: number }[]).map(({ x, z, tiltZ }, idx) => (
                <group key={`ant-${idx}`}
                       position={[x, BH / 2, z]}
                       rotation={[0, 0, tiltZ]}>
                    <mesh castShadow material={mats.antenna}>
                        <cylinderGeometry args={[ANT_R, ANT_R * 1.2, ANT_H, 10]} />
                    </mesh>
                    <mesh position={[0, -ANT_H / 2 + 0.02, 0]} material={mats.antennaTip}>
                        <cylinderGeometry args={[ANT_R * 2, ANT_R * 2, 0.024, 10]} />
                    </mesh>
                    <mesh position={[0, ANT_H / 2, 0]} material={mats.antennaTip}>
                        <sphereGeometry args={[ANT_R * 1.3, 8, 6]} />
                    </mesh>
                </group>
            ))}

            {/* ── HOVER / SELECTION GLOW ───────────────────────── */}
            {(hovered || isSelected) && (
                <mesh material={mats.selectedGlow}>
                    <boxGeometry args={[BW + 0.08, BH + 0.08, BD + 0.08]} />
                </mesh>
            )}
            {(hovered || isSelected) && (
                <pointLight
                    position={[0, BH, 0]}
                    color={isSelected ? '#00bceb' : '#ffffff'}
                    intensity={isSelected ? 0.5 : 0.25}
                    distance={1.2}
                />
            )}

            {/* ── LABEL (hover tooltip) ────────────────────────── */}
            {hovered && label && (
                <Html position={[0, BH / 2 + ANT_H + 0.08, 0]} center zIndexRange={[200, 0]}>
                    <div style={{
                        background: 'rgba(4,6,16,0.95)',
                        color: '#00ff44',
                        padding: '5px 12px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        border: '1px solid rgba(0,255,68,0.3)',
                        pointerEvents: 'none',
                        boxShadow: '0 4px 16px rgba(0,255,68,0.15)',
                    }}>
                        📡 {label}
                    </div>
                </Html>
            )}
        </group>
    );
}

export default WifiRouter;
