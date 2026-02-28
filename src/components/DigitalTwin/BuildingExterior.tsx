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
import { Text } from '@react-three/drei';
import { APSSwitchVendor } from './APSSwitchVendor';

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
                const floorY = i * floorHeight;
                const isActive = i + 1 === currentFloor;

                return (
                    <group key={`floor-${i}`} position={[0, floorY, 0]}>
                        {/* Floor slab */}
                        <mesh position={[0, 0, 0]} material={materials.concrete}>
                            <boxGeometry args={[buildingWidth, 0.15, buildingDepth]} />
                        </mesh>

                        {/* Glass – FRONT (clickable) */}
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

                        {/* Floor label */}
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
                                  fontWeight={isActive ? 700 : 500}
                                  outlineWidth={isActive ? 0.02 : 0}
                                  outlineColor={isActive ? '#003366' : '#000000'}>
                                {`F${i + 1}`}
                            </Text>
                        </group>
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
