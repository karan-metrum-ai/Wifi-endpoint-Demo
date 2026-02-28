/**
 * APSSwitch Component
 *
 * Detailed 3D model of an APS Networks rack-mountable switch.
 * Modeled after the physical hardware shown in product imagery:
 * - 2U chassis in dark charcoal
 * - Orange indicator strip on left edge
 * - 12x SFP+ ports (2 rows of 6) with green/orange LEDs
 * - 6x QSFP28 ports (2 rows of 3) with module indicators
 * - CTRL 1/2 and CONSOLE RJ45 management ports
 * - USB-A port (blue)
 * - SYS / MGT / FAN / PWR status LEDs
 * - RESET button
 * - Right-side ventilation grille
 * - APS Networks branding on top surface
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

// Physical dimensions: 2U rack-mountable switch
const W = 0.62;    // Width  (~19" rack unit)
const H = 0.145;   // Height (2U)
const D = 0.42;    // Depth

export interface APSSwitchProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
    onClick?: () => void;
    isSelected?: boolean;
    label?: string;
}

export function APSSwitch({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    onClick,
    isSelected = false,
    label = 'APS-SW',
}: APSSwitchProps) {
    const mats = useMemo(
        () => ({
            chassis: new THREE.MeshStandardMaterial({
                color: '#1c1c20',
                metalness: 0.75,
                roughness: 0.25,
            }),
            chassisSel: new THREE.MeshStandardMaterial({
                color: '#1c2535',
                metalness: 0.75,
                roughness: 0.25,
                emissive: '#002244',
                emissiveIntensity: 0.5,
            }),
            frontFace: new THREE.MeshStandardMaterial({
                color: '#232328',
                metalness: 0.5,
                roughness: 0.5,
            }),
            portSFP: new THREE.MeshStandardMaterial({
                color: '#15151a',
                metalness: 0.4,
                roughness: 0.7,
            }),
            portCavity: new THREE.MeshStandardMaterial({
                color: '#080808',
            }),
            portQSFP: new THREE.MeshStandardMaterial({
                color: '#1a1a22',
                metalness: 0.5,
                roughness: 0.5,
            }),
            sfpModule: new THREE.MeshStandardMaterial({
                color: '#2a2a3a',
                metalness: 0.85,
                roughness: 0.15,
            }),
            orangeBar: new THREE.MeshStandardMaterial({
                color: '#cc3300',
                emissive: '#661100',
                emissiveIntensity: 0.4,
            }),
            ledGreenOn: new THREE.MeshStandardMaterial({
                color: '#00ff55',
                emissive: '#00cc44',
                emissiveIntensity: 2.5,
            }),
            ledGreenDim: new THREE.MeshStandardMaterial({
                color: '#003311',
                emissive: '#001108',
                emissiveIntensity: 0.2,
            }),
            ledOrangeOn: new THREE.MeshStandardMaterial({
                color: '#ff8800',
                emissive: '#cc6600',
                emissiveIntensity: 2.0,
            }),
            rj45Body: new THREE.MeshStandardMaterial({
                color: '#333340',
                metalness: 0.3,
                roughness: 0.7,
            }),
            rj45Port: new THREE.MeshStandardMaterial({
                color: '#111118',
            }),
            usbBlue: new THREE.MeshStandardMaterial({
                color: '#1144cc',
                emissive: '#0033aa',
                emissiveIntensity: 1.0,
            }),
            ventSlat: new THREE.MeshStandardMaterial({
                color: '#0d0d11',
                metalness: 0.3,
                roughness: 0.8,
            }),
            screw: new THREE.MeshStandardMaterial({
                color: '#555560',
                metalness: 0.9,
                roughness: 0.2,
            }),
            topLogo: new THREE.MeshStandardMaterial({
                color: '#2a2a30',
                metalness: 0.7,
                roughness: 0.3,
            }),
            divider: new THREE.MeshStandardMaterial({
                color: '#3a3a44',
                metalness: 0.5,
            }),
        }),
        []
    );

    const body = isSelected ? mats.chassisSel : mats.chassis;

    return (
        <group position={position} rotation={rotation}>

            {/* ─── MAIN CHASSIS ─────────────────────────────── */}
            <mesh castShadow receiveShadow material={body}>
                <boxGeometry args={[W, H, D]} />
            </mesh>

            {/* Front face panel */}
            <mesh position={[0, 0, D / 2 + 0.001]} material={mats.frontFace}>
                <boxGeometry args={[W, H, 0.001]} />
            </mesh>

            {/* ─── ORANGE INDICATOR STRIP (far left edge) ───── */}
            <mesh
                position={[-W / 2 + 0.008, 0, D / 2 + 0.003]}
                material={mats.orangeBar}
            >
                <boxGeometry args={[0.013, H - 0.012, 0.005]} />
            </mesh>

            {/* ─── LEFT VENTILATION AREA ────────────────────── */}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh
                    key={`lv-${i}`}
                    position={[-W / 2 + 0.027, -H / 2 + 0.014 + i * 0.02, D / 2 + 0.003]}
                    material={mats.ventSlat}
                >
                    <boxGeometry args={[0.01, 0.012, 0.005]} />
                </mesh>
            ))}

            {/* ─── SFP+ PORTS (2 rows × 6) ─────────────────── */}
            {Array.from({ length: 6 }, (_, col) => {
                const x = -W / 2 + 0.054 + col * 0.039;
                return [1, -1].map((sign, rowIdx) => {
                    const y = sign * (H / 4 + 0.002);
                    const active = col % 2 === 0;
                    return (
                        <group key={`sfp-${col}-${rowIdx}`}>
                            {/* Housing */}
                            <mesh position={[x, y, D / 2 + 0.007]} material={mats.portSFP}>
                                <boxGeometry args={[0.029, 0.029, 0.012]} />
                            </mesh>
                            {/* Cavity */}
                            <mesh position={[x, y, D / 2 + 0.007]} material={mats.portCavity}>
                                <boxGeometry args={[0.022, 0.022, 0.007]} />
                            </mesh>
                            {/* Left LED (green) */}
                            <mesh
                                position={[x - 0.006, y + 0.02, D / 2 + 0.005]}
                                material={active ? mats.ledGreenOn : mats.ledGreenDim}
                            >
                                <boxGeometry args={[0.005, 0.004, 0.002]} />
                            </mesh>
                            {/* Right LED (orange) */}
                            <mesh
                                position={[x + 0.006, y + 0.02, D / 2 + 0.005]}
                                material={active ? mats.ledOrangeOn : mats.ledGreenDim}
                            >
                                <boxGeometry args={[0.005, 0.004, 0.002]} />
                            </mesh>
                        </group>
                    );
                });
            })}

            {/* SFP / QSFP section divider */}
            <mesh
                position={[-W / 2 + 0.054 + 6 * 0.039 + 0.012, 0, D / 2 + 0.003]}
                material={mats.divider}
            >
                <boxGeometry args={[0.002, H - 0.014, 0.004]} />
            </mesh>

            {/* ─── QSFP28 PORTS (2 rows × 3) ───────────────── */}
            {Array.from({ length: 3 }, (_, col) => {
                const qsfpStartX = -W / 2 + 0.054 + 6 * 0.039 + 0.032;
                const x = qsfpStartX + col * 0.058;
                return [1, -1].map((sign, rowIdx) => {
                    const y = sign * (H / 4 + 0.002);
                    const active = col === 0;
                    return (
                        <group key={`qsfp-${col}-${rowIdx}`}>
                            {/* Cage */}
                            <mesh position={[x, y, D / 2 + 0.009]} material={mats.portQSFP}>
                                <boxGeometry args={[0.048, 0.046, 0.016]} />
                            </mesh>
                            {/* Cavity */}
                            <mesh position={[x, y, D / 2 + 0.008]} material={mats.portCavity}>
                                <boxGeometry args={[0.040, 0.038, 0.009]} />
                            </mesh>
                            {/* Inserted module (when active) */}
                            {active && (
                                <mesh position={[x, y, D / 2 + 0.006]} material={mats.sfpModule}>
                                    <boxGeometry args={[0.038, 0.036, 0.005]} />
                                </mesh>
                            )}
                            {/* Left LED */}
                            <mesh
                                position={[x - 0.007, y + 0.030, D / 2 + 0.007]}
                                material={active ? mats.ledGreenOn : mats.ledGreenDim}
                            >
                                <boxGeometry args={[0.006, 0.005, 0.002]} />
                            </mesh>
                            {/* Right LED */}
                            <mesh
                                position={[x + 0.007, y + 0.030, D / 2 + 0.007]}
                                material={active ? mats.ledOrangeOn : mats.ledGreenDim}
                            >
                                <boxGeometry args={[0.006, 0.005, 0.002]} />
                            </mesh>
                        </group>
                    );
                });
            })}

            {/* QSFP / Management section divider */}
            <mesh
                position={[W / 2 - 0.215, 0, D / 2 + 0.003]}
                material={mats.divider}
            >
                <boxGeometry args={[0.002, H - 0.014, 0.004]} />
            </mesh>

            {/* ─── MANAGEMENT PORTS ─────────────────────────── */}
            {/* CTRL 1 */}
            <group position={[W / 2 - 0.185, H * 0.22, D / 2 + 0.007]}>
                <mesh material={mats.rj45Body}>
                    <boxGeometry args={[0.034, 0.028, 0.012]} />
                </mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Port}>
                    <boxGeometry args={[0.027, 0.017, 0.006]} />
                </mesh>
            </group>
            {/* CTRL 2 */}
            <group position={[W / 2 - 0.185, -H * 0.22, D / 2 + 0.007]}>
                <mesh material={mats.rj45Body}>
                    <boxGeometry args={[0.034, 0.028, 0.012]} />
                </mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Port}>
                    <boxGeometry args={[0.027, 0.017, 0.006]} />
                </mesh>
            </group>
            {/* CONSOLE (upper) */}
            <group position={[W / 2 - 0.135, H * 0.22, D / 2 + 0.007]}>
                <mesh material={mats.rj45Body}>
                    <boxGeometry args={[0.034, 0.028, 0.012]} />
                </mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Port}>
                    <boxGeometry args={[0.027, 0.017, 0.006]} />
                </mesh>
            </group>
            {/* CONSOLE (lower) */}
            <group position={[W / 2 - 0.135, -H * 0.22, D / 2 + 0.007]}>
                <mesh material={mats.rj45Body}>
                    <boxGeometry args={[0.034, 0.028, 0.012]} />
                </mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Port}>
                    <boxGeometry args={[0.027, 0.017, 0.006]} />
                </mesh>
            </group>

            {/* ─── USB-A PORT (blue) ────────────────────────── */}
            <group position={[W / 2 - 0.085, H * 0.18, D / 2 + 0.008]}>
                <mesh material={mats.rj45Body}>
                    <boxGeometry args={[0.022, 0.02, 0.014]} />
                </mesh>
                <mesh position={[0, 0, 0.004]} material={mats.usbBlue}>
                    <boxGeometry args={[0.014, 0.009, 0.006]} />
                </mesh>
            </group>

            {/* ─── STATUS LEDs (SYS / MGT / FAN / PWR) ─────── */}
            {[
                { label: 'SYS', y: H / 2 - 0.022, mat: mats.ledGreenOn },
                { label: 'MGT', y: H / 2 - 0.042, mat: mats.ledGreenDim },
                { label: 'FAN', y: H / 2 - 0.062, mat: mats.ledGreenOn },
                { label: 'PWR', y: H / 2 - 0.082, mat: mats.ledGreenOn },
            ].map(({ label: ledLabel, y, mat }) => (
                <mesh
                    key={ledLabel}
                    position={[W / 2 - 0.05, y, D / 2 + 0.005]}
                    material={mat}
                >
                    <boxGeometry args={[0.007, 0.007, 0.003]} />
                </mesh>
            ))}

            {/* ─── RESET BUTTON ─────────────────────────────── */}
            <mesh
                position={[W / 2 - 0.032, -H / 2 + 0.022, D / 2 + 0.006]}
                rotation={[Math.PI / 2, 0, 0]}
                material={mats.rj45Body}
            >
                <cylinderGeometry args={[0.004, 0.004, 0.008, 8]} />
            </mesh>

            {/* ─── RIGHT VENTILATION GRILLE ─────────────────── */}
            {Array.from({ length: 7 }, (_, i) => (
                <mesh
                    key={`rv-${i}`}
                    position={[W / 2 - 0.026, 0, D / 2 - 0.03 - i * 0.052]}
                    material={mats.ventSlat}
                >
                    <boxGeometry args={[0.004, H - 0.012, 0.038]} />
                </mesh>
            ))}

            {/* ─── TOP SURFACE: APS LOGO MARKS (X shapes) ───── */}
            {[-0.14, -0.06, 0.02].map((xOff, i) => (
                <group key={`lm-${i}`} position={[xOff, H / 2 + 0.0005, -0.05]}>
                    <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.032, 0.004, 0.006]} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.032, 0.004, 0.006]} />
                    </mesh>
                </group>
            ))}

            {/* ─── CORNER SCREWS ────────────────────────────── */}
            {[
                [-W / 2 + 0.02, H / 2 - 0.013],
                [-W / 2 + 0.02, -H / 2 + 0.013],
                [W / 2 - 0.02, H / 2 - 0.013],
                [W / 2 - 0.02, -H / 2 + 0.013],
            ].map(([sx, sy], i) => (
                <mesh
                    key={`sc-${i}`}
                    position={[sx, sy, D / 2 + 0.005]}
                    rotation={[Math.PI / 2, 0, 0]}
                    material={mats.screw}
                >
                    <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
                </mesh>
            ))}

            {/* ─── APS NETWORKS LABEL (front panel, right area) */}
            <Text
                position={[W / 2 - 0.115, -H / 2 + 0.025, D / 2 + 0.005]}
                fontSize={0.012}
                color="#999aaa"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.07}
            >
                APS Networks
            </Text>

            {/* Switch hostname label below chassis */}
            <Text
                position={[0, -H / 2 - 0.014, D / 2]}
                fontSize={0.018}
                color="#00aaff"
                anchorX="center"
                anchorY="top"
            >
                {label}
            </Text>

            {/* ─── INTERACTION ──────────────────────────────── */}
            <mesh
                visible={false}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                <boxGeometry args={[W + 0.04, H + 0.04, D + 0.04]} />
            </mesh>

            {/* Selection glow */}
            {isSelected && (
                <mesh>
                    <boxGeometry args={[W + 0.024, H + 0.024, D + 0.024]} />
                    <meshBasicMaterial
                        color="#00aaff"
                        transparent
                        opacity={0.1}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
}

export default APSSwitch;
