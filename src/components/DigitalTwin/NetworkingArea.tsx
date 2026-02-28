/**
 * NetworkingArea Component
 *
 * Dedicated networking stand showing the APS Networks 50-port multi-vendor
 * switch (APSSwitchVendor) with patch cables to rack rows.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { APSSwitchVendor } from './APSSwitchVendor';

interface PatchCableProps {
    start: [number, number, number];
    end: [number, number, number];
    color?: string;
    thickness?: number;
    sag?: number;
}

function PatchCable({ start, end, color = '#00aaff', thickness = 0.012, sag = 0.25 }: PatchCableProps) {
    const geo = useMemo(() => {
        const pts: THREE.Vector3[] = [];
        const seg = 24;
        const s = new THREE.Vector3(...start);
        const e = new THREE.Vector3(...end);
        for (let i = 0; i <= seg; i++) {
            const t = i / seg;
            pts.push(new THREE.Vector3(
                s.x + (e.x - s.x) * t,
                s.y + (e.y - s.y) * t - sag * Math.sin(Math.PI * t),
                s.z + (e.z - s.z) * t,
            ));
        }
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, thickness, 6, false);
    }, [start, end, sag, thickness]);

    return (
        <mesh geometry={geo}>
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
        </mesh>
    );
}

interface NetworkingAreaProps {
    position?: [number, number, number];
    rowARackXPositions?: number[];
    rowBRackXPositions?: number[];
}

export function NetworkingArea({
    position = [5.3, -0.88, 0],
    rowARackXPositions = [-4, -2, 0, 2, 4],
    rowBRackXPositions = [-4, -2, 0, 2, 4],
}: NetworkingAreaProps) {

    const mats = useMemo(() => ({
        shelfMetal:  new THREE.MeshStandardMaterial({ color: '#2a2a2e', metalness: 0.85, roughness: 0.2 }),
        shelfFrame:  new THREE.MeshStandardMaterial({ color: '#333338', metalness: 0.8,  roughness: 0.3 }),
        legMetal:    new THREE.MeshStandardMaterial({ color: '#222228', metalness: 0.9,  roughness: 0.15 }),
        patchPanel:  new THREE.MeshStandardMaterial({ color: '#18181c', metalness: 0.5,  roughness: 0.5 }),
        stripLight:  new THREE.MeshStandardMaterial({ color: '#001133', emissive: '#001133', emissiveIntensity: 1.2 }),
    }), []);

    // Shelf large enough for the vendor switch (W=1.20 after rotation)
    const shelfW = 1.40;
    const shelfD = 0.60;
    const shelfH = 0.025;
    const legH   = 0.32;

    // Switch sits rotated 90° so its width (1.20) spans World-Z
    const switchRot: [number, number, number] = [0, Math.PI / 2, 0];

    // Front-face X of the switch after rotation (depth = 0.44 → half = 0.22)
    const switchFrontX = position[0] - 0.22;
    const trayY = 1.5;
    const cableColours = ['#00aaff', '#ff6600', '#00ff88', '#ffcc00', '#ff44ff'];

    return (
        <group position={position}>

            {/* ── SHELF ───────────────────────────────────── */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow material={mats.shelfMetal}>
                <boxGeometry args={[shelfD, shelfH, shelfW]} />
            </mesh>
            {/* Front lip */}
            <mesh position={[shelfD / 2, shelfH / 2 + 0.015, 0]} material={mats.shelfFrame}>
                <boxGeometry args={[0.012, 0.035, shelfW]} />
            </mesh>
            {/* LED strip */}
            <mesh position={[shelfD / 2 - 0.003, shelfH / 2 + 0.022, 0]} material={mats.stripLight}>
                <boxGeometry args={[0.005, 0.005, shelfW - 0.04]} />
            </mesh>
            {/* Legs */}
            {([
                [-shelfD / 2 + 0.04,  shelfW / 2 - 0.08],
                [-shelfD / 2 + 0.04, -shelfW / 2 + 0.08],
                [ shelfD / 2 - 0.04,  shelfW / 2 - 0.08],
                [ shelfD / 2 - 0.04, -shelfW / 2 + 0.08],
            ] as [number, number][]).map(([lx, lz], i) => (
                <mesh key={`leg-${i}`} position={[lx, -legH / 2 - shelfH / 2, lz]}
                    material={mats.legMetal} castShadow>
                    <boxGeometry args={[0.025, legH, 0.025]} />
                </mesh>
            ))}
            {/* Cross-brace */}
            <mesh position={[0, -legH * 0.6, 0]} material={mats.legMetal}>
                <boxGeometry args={[shelfD - 0.08, 0.015, shelfW - 0.16]} />
            </mesh>

            {/* Shelf label */}
            <Text position={[shelfD / 2 + 0.012, 0.028, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                fontSize={0.022} color="#00bceb"
                anchorX="center" anchorY="middle" letterSpacing={0.05}>
                NETWORK CORE — APS Networks
            </Text>

            {/* Patch panel strip above shelf */}
            <mesh position={[-shelfD / 2 + 0.015, 0.07, 0]} material={mats.patchPanel}>
                <boxGeometry args={[0.012, 0.10, shelfW - 0.04]} />
            </mesh>

            {/* ── APS 50-PORT VENDOR SWITCH ────────────────── */}
            <APSSwitchVendor
                position={[0, 0.14, 0]}
                rotation={switchRot}
            />

            {/* ── PATCH CABLES → Row A ─────────────────────── */}
            {rowARackXPositions.slice(0, 5).map((rackX, i) => (
                <PatchCable
                    key={`rowa-${i}`}
                    start={[switchFrontX - position[0], 0.14, -0.40 + (i % 5) * 0.05]}
                    end={[rackX - position[0], trayY - position[1], -1.5 - position[2]]}
                    color={cableColours[i % cableColours.length]}
                    thickness={0.011}
                    sag={0.45}
                />
            ))}

            {/* ── PATCH CABLES → Row B ─────────────────────── */}
            {rowBRackXPositions.slice(0, 5).map((rackX, i) => (
                <PatchCable
                    key={`rowb-${i}`}
                    start={[switchFrontX - position[0], 0.14, 0.40 - (i % 5) * 0.05]}
                    end={[rackX - position[0], trayY - position[1], 1.5 - position[2]]}
                    color={cableColours[(i + 2) % cableColours.length]}
                    thickness={0.011}
                    sag={0.45}
                />
            ))}

            {/* Status light */}
            <pointLight position={[0, 0.5, 0]} color="#00bceb" intensity={0.5} distance={3.5} />
            <pointLight position={[0, 0.5, 0]} color="#ff3344" intensity={0.3} distance={2.5} />
        </group>
    );
}

export default NetworkingArea;
