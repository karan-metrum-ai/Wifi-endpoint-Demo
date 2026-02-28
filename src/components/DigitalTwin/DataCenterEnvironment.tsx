/**
 * DataCenterEnvironment Component
 *
 * Renders the 3D environment for the data center floor:
 * - Floor with grid pattern
 * - Walls with transparency
 * - Ceiling with light panels
 * - Region/floor name label
 * - Accent lighting
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface DataCenterEnvironmentProps {
    regionName?: string;
}

export function DataCenterEnvironment({
    regionName = 'US-EAST-1',
}: DataCenterEnvironmentProps) {
    const materials = useMemo(
        () => ({
            floor: new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
            wall: new THREE.MeshStandardMaterial({
                color: '#e0e0e0',
                transparent: true,
                opacity: 0.25,
            }),
            ceiling: new THREE.MeshStandardMaterial({ color: '#2a2a2a' }),
            lightPanel: new THREE.MeshStandardMaterial({
                color: '#fff',
                emissive: '#fff',
                emissiveIntensity: 0.5,
            }),
        }),
        []
    );

    return (
        <group>
            {/* Floor */}
            <mesh
                position={[0, -1.2, 0]}
                receiveShadow
                material={materials.floor}
            >
                <boxGeometry args={[12, 0.1, 8]} />
            </mesh>

            {/* Walls */}
            <mesh
                position={[0, 0.3, -4]}
                receiveShadow
                material={materials.wall}
            >
                <boxGeometry args={[12, 3, 0.1]} />
            </mesh>
            <mesh
                position={[0, 0.3, 4]}
                receiveShadow
                material={materials.wall}
            >
                <boxGeometry args={[12, 3, 0.1]} />
            </mesh>
            <mesh
                position={[-6, 0.3, 0]}
                receiveShadow
                material={materials.wall}
            >
                <boxGeometry args={[0.1, 3, 8]} />
            </mesh>
            <mesh
                position={[6, 0.3, 0]}
                receiveShadow
                material={materials.wall}
            >
                <boxGeometry args={[0.1, 3, 8]} />
            </mesh>

            {/* Region/Floor name label on back wall */}
            <Text
                position={[0, 1.2, -3.9]}
                fontSize={0.35}
                color="#00aaff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.01}
                outlineColor="#003366"
            >
                {`DATA CENTER ${regionName}`}
            </Text>

            {/* Accent line under the text */}
            <mesh position={[0, 0.9, -3.92]}>
                <boxGeometry args={[4, 0.02, 0.01]} />
                <meshStandardMaterial
                    color="#00aaff"
                    emissive="#00aaff"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Ceiling */}
            <mesh position={[0, 1.8, 0]} material={materials.ceiling}>
                <boxGeometry args={[12, 0.02, 8]} />
            </mesh>

            {/* Ceiling lights */}
            {Array.from({ length: 5 }, (_, i) => (
                <group key={i} position={[-4 + i * 2, 1.7, 0]}>
                    <mesh material={materials.lightPanel}>
                        <boxGeometry args={[0.5, 0.03, 0.5]} />
                    </mesh>
                    <pointLight
                        intensity={0.8}
                        distance={6}
                        color="#fff"
                        castShadow={i % 2 === 0}
                    />
                </group>
            ))}

            {/* Ambient blue accent lights in corners */}
            <pointLight
                position={[-5, 0.5, -3]}
                intensity={0.3}
                distance={4}
                color="#00aaff"
            />
            <pointLight
                position={[5, 0.5, -3]}
                intensity={0.3}
                distance={4}
                color="#00aaff"
            />
            <pointLight
                position={[-5, 0.5, 3]}
                intensity={0.3}
                distance={4}
                color="#00aaff"
            />
            <pointLight
                position={[5, 0.5, 3]}
                intensity={0.3}
                distance={4}
                color="#00aaff"
            />
        </group>
    );
}

export default DataCenterEnvironment;
