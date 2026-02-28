import { useMemo } from 'react';
import * as THREE from 'three';

interface RackData {
  name: string;
  location: string;
  status: 'operational' | 'warning' | 'critical';
  serverCount: number;
  powerDraw: string;
  temperature: string;
  cpuUsage: number;
  memoryUsage: number;
  networkIO: string;
  uptime: string;
}

interface DataCenterSceneProps {
  onRackClick?: (rackData: RackData) => void;
}

// Generate mock data for a rack
const generateRackData = (rackId: string, row: string): RackData => {
  const statuses: RackData['status'][] = [
    'operational',
    'operational',
    'operational',
    'warning',
  ];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return {
    name: `Server Rack ${rackId}`,
    location: `Row ${row}, Position ${rackId}`,
    status: randomStatus,
    serverCount: 18 + Math.floor(Math.random() * 3),
    powerDraw: (2.5 + Math.random() * 1.5).toFixed(1),
    temperature: (22 + Math.random() * 8).toFixed(1),
    cpuUsage: Math.floor(40 + Math.random() * 50),
    memoryUsage: Math.floor(50 + Math.random() * 40),
    networkIO: (1.2 + Math.random() * 2.8).toFixed(1),
    uptime: `${Math.floor(Math.random() * 365)}d ${Math.floor(Math.random() * 24)}h`,
  };
};

export default function DataCenterScene({ onRackClick }: DataCenterSceneProps) {
  // Shared geometries and materials to reduce overhead
  const materials = useMemo(
    () => ({
      floor: new THREE.MeshStandardMaterial({ color: '#2a2a2a' }),
      wall: new THREE.MeshStandardMaterial({
        color: '#f0f0f0',
        transparent: true,
        opacity: 0.3,
      }),
      rackFrame: new THREE.MeshStandardMaterial({ color: '#444' }),
      rackBack: new THREE.MeshStandardMaterial({ color: '#333' }),
      rail: new THREE.MeshStandardMaterial({ color: '#777' }),
      serverChassis: new THREE.MeshStandardMaterial({ color: '#2a2a2a' }),
      serverBezel: new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
      handle: new THREE.MeshStandardMaterial({ color: '#666' }),
      greenLED: new THREE.MeshStandardMaterial({
        color: '#0f0',
        emissive: '#0f0',
        emissiveIntensity: 1.5,
      }),
      yellowLED: new THREE.MeshStandardMaterial({
        color: '#ff0',
        emissive: '#ff0',
        emissiveIntensity: 1.2,
      }),
      vent: new THREE.MeshStandardMaterial({ color: '#000' }),
      label: new THREE.MeshStandardMaterial({ color: '#333' }),
    }),
    []
  );

  // Single server rack component with merged geometries
  const ServerRack = ({
    position,
    rotation = [0, 0, 0],
    onClick,
  }: {
    position: [number, number, number];
    rotation?: [number, number, number];
    onClick?: () => void;
  }) => {
    const handleClick = (e: any) => {
      e.stopPropagation();
      if (onClick) onClick();
    };

    const handlePointerOver = (e: any) => {
      e.stopPropagation();
      document.body.style.cursor = 'pointer';
    };

    const handlePointerOut = (e: any) => {
      e.stopPropagation();
      document.body.style.cursor = 'default';
    };

    return (
      <group position={position} rotation={rotation}>
        {/* Invisible clickable bounding box */}
        <mesh
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          visible={false}
        >
          <boxGeometry args={[0.7, 2, 1]} />
        </mesh>

        {/* Rack frame - only outer structure casts shadows */}
        <mesh castShadow receiveShadow material={materials.rackFrame}>
          <boxGeometry args={[0.02, 1.8, 0.02]} />
        </mesh>
        <mesh
          position={[0.58, 0, 0]}
          castShadow
          receiveShadow
          material={materials.rackFrame}
        >
          <boxGeometry args={[0.02, 1.8, 0.02]} />
        </mesh>
        <mesh
          position={[0.29, 0, -0.43]}
          receiveShadow
          material={materials.rackBack}
        >
          <boxGeometry args={[0.6, 1.8, 0.02]} />
        </mesh>
        <mesh
          position={[0.29, 0.88, 0]}
          castShadow
          material={materials.rackFrame}
        >
          <boxGeometry args={[0.6, 0.02, 0.9]} />
        </mesh>
        <mesh
          position={[0.29, -0.88, 0]}
          castShadow
          material={materials.rackFrame}
        >
          <boxGeometry args={[0.6, 0.02, 0.9]} />
        </mesh>

        {/* Mounting rails - no shadows */}
        <mesh position={[0.05, 0, 0.4]} material={materials.rail}>
          <boxGeometry args={[0.02, 1.6, 0.03]} />
        </mesh>
        <mesh position={[0.53, 0, 0.4]} material={materials.rail}>
          <boxGeometry args={[0.02, 1.6, 0.03]} />
        </mesh>

        {/* Simplified servers - only main chassis casts shadow */}
        {Array.from({ length: 20 }, (_, j) => (
          <group key={j} position={[0.29, -0.76 + j * 0.076, 0.15]}>
            {/* SERVER CHASSIS - main body only */}
            <mesh castShadow receiveShadow material={materials.serverChassis}>
              <boxGeometry args={[0.48, 0.07, 0.62]} />
            </mesh>

            {/* FRONT BEZEL - no shadow */}
            <mesh position={[0, 0, 0.31]} material={materials.serverBezel}>
              <boxGeometry args={[0.5, 0.075, 0.005]} />
            </mesh>

            {/* LED details on all servers */}
            <mesh position={[-0.18, 0, 0.315]} material={materials.greenLED}>
              <boxGeometry args={[0.015, 0.015, 0.002]} />
            </mesh>
            <mesh position={[-0.15, 0, 0.315]} material={materials.yellowLED}>
              <boxGeometry args={[0.015, 0.015, 0.002]} />
            </mesh>

            {/* Server handle outlines for visibility */}
            <mesh position={[-0.22, 0, 0.31]} material={materials.handle}>
              <boxGeometry args={[0.02, 0.04, 0.01]} />
            </mesh>
            <mesh position={[0.22, 0, 0.31]} material={materials.handle}>
              <boxGeometry args={[0.02, 0.04, 0.01]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  };

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -1.2, 0]} receiveShadow material={materials.floor}>
        <boxGeometry args={[10, 0.1, 6]} />
      </mesh>

      {/* Walls - no shadows */}
      <mesh position={[0, 0.3, -3]} receiveShadow material={materials.wall}>
        <boxGeometry args={[10, 3, 0.1]} />
      </mesh>
      <mesh position={[0, 0.3, 3]} receiveShadow material={materials.wall}>
        <boxGeometry args={[10, 3, 0.1]} />
      </mesh>
      <mesh position={[-5, 0.3, 0]} receiveShadow material={materials.wall}>
        <boxGeometry args={[0.1, 3, 6]} />
      </mesh>
      <mesh position={[5, 0.3, 0]} receiveShadow material={materials.wall}>
        <boxGeometry args={[0.1, 3, 6]} />
      </mesh>
      <mesh position={[0, 1.8, 0]} receiveShadow material={materials.wall}>
        <boxGeometry args={[10, 0.02, 6]} />
      </mesh>

      {/* Ceiling lights - reduced shadows */}
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i} position={[-3 + i * 2, 1.7, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.03, 0.4]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <pointLight intensity={1} distance={5} castShadow={i % 2 === 0} />
        </group>
      ))}

      {/* Front racks */}
      {[-3, -1.5, 0, 1.5, 3].map((xPos, i) => (
        <ServerRack
          key={`front-${i}`}
          position={[xPos, -0.25, -1.5]}
          onClick={() =>
            onRackClick && onRackClick(generateRackData(`A${i + 1}`, 'Front'))
          }
        />
      ))}

      {/* Back racks */}
      {[-3, -1.5, 0, 1.5, 3].map((xPos, i) => (
        <ServerRack
          key={`back-${i}`}
          position={[xPos, -0.25, 1.5]}
          rotation={[0, Math.PI, 0]}
          onClick={() =>
            onRackClick && onRackClick(generateRackData(`B${i + 1}`, 'Back'))
          }
        />
      ))}
    </group>
  );
}

