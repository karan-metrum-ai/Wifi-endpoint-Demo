/**
 * ServerRack Component (standalone – no Redux/agent deps)
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Device3D, Rack3D } from './types';

export type { Device3D, Rack3D };

interface ServerRackProps {
    rack: Rack3D;
    selectedDeviceIds: Set<string>;
    selectedRackId: string | null;
    onDeviceClick?: (device: Device3D) => void;
    onToggleSelection?: (deviceId: string, isSelected: boolean) => void;
    onRackClick?: (rackId: string) => void;
}

export function ServerRack({
    rack,
    selectedDeviceIds,
    selectedRackId,
    onDeviceClick,
    onToggleSelection,
    onRackClick,
}: ServerRackProps) {
    const isRackSelected = selectedRackId === rack.rack_id;

    const materials = useMemo(() => ({
        rackFrame: new THREE.MeshStandardMaterial({ color: '#333' }),
        rackBack: new THREE.MeshStandardMaterial({ color: '#222' }),
        rail: new THREE.MeshStandardMaterial({ color: '#555' }),
        serverChassis: new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
        serverChassisSelected: new THREE.MeshStandardMaterial({
            color: '#00ff88', emissive: '#00ff88', emissiveIntensity: 0.3,
        }),
        serverChassisCritical: new THREE.MeshStandardMaterial({
            color: '#1f1a1a', emissive: '#cc3333', emissiveIntensity: 0.35,
            roughness: 0.5, metalness: 0.4,
        }),
        serverBezel: new THREE.MeshStandardMaterial({ color: '#111' }),
        handle: new THREE.MeshStandardMaterial({ color: '#666' }),
        greenLED: new THREE.MeshStandardMaterial({ color: '#0f0', emissive: '#0f0', emissiveIntensity: 1.5 }),
        yellowLED: new THREE.MeshStandardMaterial({ color: '#ff0', emissive: '#ff0', emissiveIntensity: 1.2 }),
        redLED: new THREE.MeshStandardMaterial({ color: '#f00', emissive: '#f00', emissiveIntensity: 1.5 }),
        offlineLED: new THREE.MeshStandardMaterial({ color: '#333', emissive: '#333', emissiveIntensity: 0.1 }),
    }), []);

    const rackHighlightMaterial = useMemo(() => {
        const color = rack.rack_color || '#00aaff';
        return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, depthWrite: false });
    }, [rack.rack_color]);

    const getLEDMaterial = (device: Device3D | null, isSelected: boolean) => {
        if (isSelected) return materials.greenLED;
        if (!device) return materials.offlineLED;
        const health = device.health_status || 'unknown';
        if (health === 'critical') return materials.redLED;
        if (health === 'warning') return materials.yellowLED;
        if (device.status === 'online') return materials.greenLED;
        return materials.offlineLED;
    };

    const U_SLOTS = 20;
    const slots: (Device3D | null)[] = Array(U_SLOTS).fill(null);
    const sortedDevices = [...rack.devices].sort((a, b) => a.u_position - b.u_position);

    for (const device of sortedDevices) {
        const topIndex = Math.max(0, device.u_position - 1);
        const height = Math.max(1, Math.floor(device.height_u || 1));
        for (let k = 0; k < height && topIndex + k < U_SLOTS; k++) {
            slots[topIndex + k] = device;
        }
    }

    const renderedDevices = new Set<string>();

    const handleDeviceClick = (e: { stopPropagation?: () => void }, device: Device3D) => {
        e.stopPropagation?.();
        const isSelected = selectedDeviceIds.has(device.device_id);
        onToggleSelection?.(device.device_id, !isSelected);
        onDeviceClick?.(device);
    };

    const handleRackClick = (e: { stopPropagation?: () => void }) => {
        e.stopPropagation?.();
        onRackClick?.(rack.rack_id);
    };

    return (
        <group position={rack.position} rotation={rack.rotation || [0, 0, 0]}>
            {/* Rack highlight / click target */}
            <mesh position={[0.29, 0, 0.15]} material={rackHighlightMaterial}
                onClick={handleRackClick}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}>
                <boxGeometry args={[0.75, 1.95, 1.1]} />
            </mesh>

            {/* Frame */}
            <mesh castShadow material={materials.rackFrame}><boxGeometry args={[0.02, 1.8, 0.02]} /></mesh>
            <mesh position={[0.58, 0, 0]} castShadow material={materials.rackFrame}><boxGeometry args={[0.02, 1.8, 0.02]} /></mesh>
            <mesh position={[0.29, 0, -0.43]} material={materials.rackBack}><boxGeometry args={[0.6, 1.8, 0.02]} /></mesh>
            <mesh position={[0.29, 0.88, 0]} castShadow material={materials.rackFrame}><boxGeometry args={[0.6, 0.02, 0.9]} /></mesh>
            <mesh position={[0.29, -0.88, 0]} castShadow material={materials.rackFrame}><boxGeometry args={[0.6, 0.02, 0.9]} /></mesh>

            {/* Rails */}
            <mesh position={[0.05, 0, 0.4]} material={materials.rail}><boxGeometry args={[0.02, 1.6, 0.03]} /></mesh>
            <mesh position={[0.53, 0, 0.4]} material={materials.rail}><boxGeometry args={[0.02, 1.6, 0.03]} /></mesh>

            {/* Rack name label */}
            {isRackSelected && (
                <Html position={[0.29, 1.02, 0.05]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        background: '#252528', color: '#fff', padding: '5px 12px',
                        borderRadius: '3px', fontSize: '11px', fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
                        whiteSpace: 'nowrap', border: '1px solid #3f3f46',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    }}>{rack.rack_name}</div>
                </Html>
            )}

            {/* Server slots */}
            {slots.map((device, _slotIndex) => {
                if (!device) return null;
                if (renderedDevices.has(device.device_id)) return null;
                renderedDevices.add(device.device_id);

                const heightU = Math.max(1, Math.floor(device.height_u || 1));
                let firstIndex = Math.max(0, device.u_position - 1);
                for (let scan = 0; scan < slots.length; scan++) {
                    if (slots[scan]?.device_id === device.device_id) { firstIndex = scan; break; }
                }

                const slotSpacing = 0.076;
                const baseY = -0.76 + firstIndex * slotSpacing;
                const centerOffset = ((heightU - 1) * slotSpacing) / 2;
                const yPos = baseY + centerOffset;
                const meshHeight = 0.07 * heightU;
                const isSelected = selectedDeviceIds.has(device.device_id);

                const chassisMaterial = isSelected
                    ? materials.serverChassisSelected
                    : device.health_status === 'critical'
                        ? materials.serverChassisCritical
                        : materials.serverChassis;

                return (
                    <group key={device.device_id} position={[0.29, yPos, 0.15]}
                        onClick={(e) => handleDeviceClick(e, device)}
                        onPointerOver={() => (document.body.style.cursor = 'pointer')}
                        onPointerOut={() => (document.body.style.cursor = 'default')}>
                        <mesh castShadow material={chassisMaterial}>
                            <boxGeometry args={[0.48, meshHeight, 0.62]} />
                        </mesh>
                        <mesh position={[0, 0, 0.31]} material={materials.serverBezel}>
                            <boxGeometry args={[0.5, meshHeight * 1.07, 0.005]} />
                        </mesh>
                        <mesh position={[-0.18, 0, 0.315]} material={getLEDMaterial(device, isSelected)}>
                            <boxGeometry args={[0.015, 0.015, 0.002]} />
                        </mesh>
                        <mesh position={[-0.15, 0, 0.315]}
                            material={device.status === 'online' ? materials.yellowLED : materials.offlineLED}>
                            <boxGeometry args={[0.015, 0.015, 0.002]} />
                        </mesh>
                        <mesh position={[-0.22, 0, 0.31]} material={materials.handle}>
                            <boxGeometry args={[0.02, Math.max(0.03, meshHeight * 0.6), 0.01]} />
                        </mesh>
                        <mesh position={[0.22, 0, 0.31]} material={materials.handle}>
                            <boxGeometry args={[0.02, Math.max(0.03, meshHeight * 0.6), 0.01]} />
                        </mesh>

                        {isRackSelected && (
                            <Html position={[0, 0, 0.35]} center zIndexRange={[100, 0]}>
                                <div onClick={(e) => { e.stopPropagation(); onDeviceClick?.(device); }}
                                    style={{
                                        background: isSelected ? '#2563eb' : '#252528',
                                        color: '#fff', padding: '5px 12px', borderRadius: '3px',
                                        fontSize: '10px', fontWeight: 600,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        whiteSpace: 'nowrap', cursor: 'pointer',
                                        border: isSelected ? '1px solid #3b82f6' : '1px solid #3f3f46',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                    }}>
                                    {device.hostname}
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </group>
    );
}

export default ServerRack;
