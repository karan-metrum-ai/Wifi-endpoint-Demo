/**
 * NetworkingArea Component
 *
 * Renders a dedicated networking corner inside the data center floor:
 * - Metal mounting shelf / stand
 * - Two APS Networks switches side-by-side (duplicated)
 * - Patch cables running from switch ports to rack row cable trays
 * - Status lighting for the networking area
 *
 * Placement: right end of the hot aisle (high-x side) so both rack rows
 * are reachable and the front panels face toward the camera.
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { APSSwitch } from './APSSwitch';

// Cable helper – parabolic sag between two world positions
interface PatchCableProps {
    start: [number, number, number];
    end: [number, number, number];
    color?: string;
    thickness?: number;
    sag?: number;
}

function PatchCable({
    start,
    end,
    color = '#00aaff',
    thickness = 0.012,
    sag = 0.25,
}: PatchCableProps) {
    const geo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const seg = 24;
        const s = new THREE.Vector3(...start);
        const e = new THREE.Vector3(...end);
        for (let i = 0; i <= seg; i++) {
            const t = i / seg;
            pts.push(
                new THREE.Vector3(
                    s.x + (e.x - s.x) * t,
                    s.y + (e.y - s.y) * t - sag * Math.sin(Math.PI * t),
                    s.z + (e.z - s.z) * t
                )
            );
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        return new THREE.TubeGeometry(curve, 24, thickness, 6, false);
    }, [start, end, sag, thickness]);

    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
        </mesh>
    );
}

interface NetworkingAreaProps {
    /** World position of the networking stand centre */
    position?: [number, number, number];
    /** Row A rack x-positions (for cable routing) */
    rowARackXPositions?: number[];
    /** Row B rack x-positions (for cable routing) */
    rowBRackXPositions?: number[];
}

export function NetworkingArea({
    position = [5.3, -0.88, 0],
    rowARackXPositions = [-4, -2, 0, 2, 4],
    rowBRackXPositions = [-4, -2, 0, 2, 4],
}: NetworkingAreaProps) {
    const [sel, setSel] = useState<string | null>(null);

    const mats = useMemo(
        () => ({
            shelfMetal: new THREE.MeshStandardMaterial({
                color: '#2a2a2e',
                metalness: 0.85,
                roughness: 0.2,
            }),
            shelfFrame: new THREE.MeshStandardMaterial({
                color: '#333338',
                metalness: 0.8,
                roughness: 0.3,
            }),
            legMetal: new THREE.MeshStandardMaterial({
                color: '#222228',
                metalness: 0.9,
                roughness: 0.15,
            }),
            patchPanel: new THREE.MeshStandardMaterial({
                color: '#18181c',
                metalness: 0.5,
                roughness: 0.5,
            }),
            stripLight: new THREE.MeshStandardMaterial({
                color: '#002244',
                emissive: '#001133',
                emissiveIntensity: 1.0,
            }),
        }),
        []
    );

    // Stand dimensions
    const shelfW = 1.6;   // wide enough for 2 switches side by side (each ~0.62 after rotation)
    const shelfD = 0.55;  // depth
    const shelfH = 0.02;  // shelf thickness
    const legH   = 0.32;  // height from floor to shelf top (floor is -1.2, shelf top will be at ~-0.9)

    // The two switches face -X (front = away from right wall), rotation [0, PI/2, 0]
    const switchRot: [number, number, number] = [0, Math.PI / 2, 0];

    // Each switch, after rotation PI/2 around Y:
    //   original width (W=0.62) lies along world Z
    //   original depth (D=0.42) lies along world X
    // Switch centres along Z:  ±0.38 → span Z from -0.38±0.31
    const sw1Z = -0.38;
    const sw2Z =  0.38;

    // Front-face world-x of the switches (switches centred at position[0])
    // After rotation, "front" (local+Z) becomes world -X, so front-x = position[0] - D/2
    const switchFrontX = position[0] - 0.21;  // 0.42 / 2

    // Cable tray height (from NetworkCables component)
    const trayY = 1.5;

    // Patch cable colours
    const cableColours = ['#00aaff', '#ff6600', '#00ff88', '#ffcc00', '#ff44ff'];

    return (
        <group position={position}>

            {/* ─── STAND / SHELF ──────────────────────────────── */}
            {/* Horizontal shelf top */}
            <mesh
                position={[0, 0, 0]}
                castShadow
                receiveShadow
                material={mats.shelfMetal}
            >
                <boxGeometry args={[shelfD, shelfH, shelfW]} />
            </mesh>

            {/* Shelf lip – front edge */}
            <mesh position={[shelfD / 2, shelfH / 2 + 0.015, 0]} material={mats.shelfFrame}>
                <boxGeometry args={[0.01, 0.03, shelfW]} />
            </mesh>

            {/* LED strip along front lip */}
            <mesh position={[shelfD / 2 - 0.002, shelfH / 2 + 0.02, 0]} material={mats.stripLight}>
                <boxGeometry args={[0.004, 0.004, shelfW - 0.04]} />
            </mesh>

            {/* Four legs */}
            {[
                [-shelfD / 2 + 0.04,  shelfW / 2 - 0.07],
                [-shelfD / 2 + 0.04, -shelfW / 2 + 0.07],
                [ shelfD / 2 - 0.04,  shelfW / 2 - 0.07],
                [ shelfD / 2 - 0.04, -shelfW / 2 + 0.07],
            ].map(([lx, lz], i) => (
                <mesh
                    key={`leg-${i}`}
                    position={[lx, -legH / 2 - shelfH / 2, lz]}
                    material={mats.legMetal}
                    castShadow
                >
                    <boxGeometry args={[0.025, legH, 0.025]} />
                </mesh>
            ))}

            {/* Cross-brace between legs */}
            <mesh position={[0, -legH * 0.6, 0]} material={mats.legMetal}>
                <boxGeometry args={[shelfD - 0.08, 0.015, shelfW - 0.14]} />
            </mesh>

            {/* Shelf label */}
            <Text
                position={[shelfD / 2 + 0.01, 0.025, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                fontSize={0.02}
                color="#00aaff"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.05}
            >
                NETWORK CORE
            </Text>

            {/* ─── PATCH PANEL (thin strip above shelf) ───────── */}
            <mesh position={[-shelfD / 2 + 0.015, 0.06, 0]} material={mats.patchPanel}>
                <boxGeometry args={[0.01, 0.08, shelfW - 0.04]} />
            </mesh>

            {/* ─── SWITCH 1 (facing -X, upper position on shelf) */}
            <APSSwitch
                position={[-0.01, 0.10, sw1Z]}
                rotation={switchRot}
                label="APS-SW-01"
                isSelected={sel === 'sw1'}
                onClick={() => setSel(sel === 'sw1' ? null : 'sw1')}
            />

            {/* ─── SWITCH 2 (facing -X, lower position) ──────── */}
            <APSSwitch
                position={[-0.01, 0.10, sw2Z]}
                rotation={switchRot}
                label="APS-SW-02"
                isSelected={sel === 'sw2'}
                onClick={() => setSel(sel === 'sw2' ? null : 'sw2')}
            />

            {/* ─── CABLES: Switch → Row A rack cable tray ─────── */}
            {rowARackXPositions.slice(0, 4).map((rackX, i) => (
                <PatchCable
                    key={`sw1-rowa-${i}`}
                    start={[
                        switchFrontX - position[0],
                        0.10,
                        sw1Z + (i % 3) * 0.04 - 0.04,
                    ]}
                    end={[
                        rackX - position[0],
                        trayY - position[1],
                        -1.5 - position[2],
                    ]}
                    color={cableColours[i % cableColours.length]}
                    thickness={0.011}
                    sag={0.4}
                />
            ))}

            {/* ─── CABLES: Switch → Row B rack cable tray ─────── */}
            {rowBRackXPositions.slice(0, 4).map((rackX, i) => (
                <PatchCable
                    key={`sw2-rowb-${i}`}
                    start={[
                        switchFrontX - position[0],
                        0.10,
                        sw2Z + (i % 3) * 0.04 - 0.04,
                    ]}
                    end={[
                        rackX - position[0],
                        trayY - position[1],
                        1.5 - position[2],
                    ]}
                    color={cableColours[(i + 2) % cableColours.length]}
                    thickness={0.011}
                    sag={0.4}
                />
            ))}

            {/* ─── CROSS-CONNECT: SW1 ↔ SW2 uplink ───────────── */}
            <PatchCable
                start={[switchFrontX - position[0] + 0.05, 0.12, sw1Z + 0.05]}
                end={[switchFrontX - position[0] + 0.05, 0.12, sw2Z - 0.05]}
                color="#ff44ff"
                thickness={0.013}
                sag={0.05}
            />
            <PatchCable
                start={[switchFrontX - position[0] + 0.08, 0.10, sw1Z]}
                end={[switchFrontX - position[0] + 0.08, 0.10, sw2Z]}
                color="#ffcc00"
                thickness={0.013}
                sag={0.05}
            />

            {/* Status indicator light above the shelf */}
            <pointLight
                position={[0, 0.3, 0]}
                color="#00aaff"
                intensity={0.4}
                distance={3}
            />
        </group>
    );
}

export default NetworkingArea;
