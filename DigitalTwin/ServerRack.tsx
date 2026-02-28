/**
 * ServerRack Component
 *
 * Enhanced 3D server rack with:
 * - Multi-U device support (devices spanning multiple slots)
 * - Rack color coding (Row A = cyan, Row B = orange)
 * - Rack selection state with expanded labels
 * - Device selection with visual highlighting
 * - LED status indicators based on health
 * - Hostname labels on selected rack/devices
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { Device3D, Rack3D } from './types';

// Re-export types for convenience
export type { Device3D, Rack3D };

interface ActiveAgentInfo {
    agentName: string;
    avatarLabel: string;
    avatar: string | null;
    deviceName: string;
    bmcIp: string;
    status: string;
}

interface ServerRackProps {
    rack: Rack3D;
    selectedDeviceIds: Set<string>;
    selectedRackId: string | null;
    onDeviceClick?: (device: Device3D) => void;
    onToggleSelection?: (deviceId: string, isSelected: boolean) => void;
    onRackClick?: (rackId: string) => void;
    activeAgentInfo?: ActiveAgentInfo | null;
}

export function ServerRack({
    rack,
    selectedDeviceIds,
    selectedRackId,
    onDeviceClick,
    onToggleSelection,
    onRackClick,
    activeAgentInfo,
}: ServerRackProps) {
    const isRackSelected = selectedRackId === rack.rack_id;
    
    // Check if this rack contains the device the agent is working on
    const agentWorkingDevice = useMemo(() => {
        if (!activeAgentInfo?.deviceName) return null;
        return rack.devices.find(d => d.hostname === activeAgentInfo.deviceName);
    }, [activeAgentInfo, rack.devices]);

    const materials = useMemo(
        () => ({
            rackFrame: new THREE.MeshStandardMaterial({ color: '#333' }),
            rackBack: new THREE.MeshStandardMaterial({ color: '#222' }),
            rail: new THREE.MeshStandardMaterial({ color: '#555' }),
            serverChassis: new THREE.MeshStandardMaterial({ color: '#1a1a1a' }),
            serverChassisSelected: new THREE.MeshStandardMaterial({
                color: '#00ff88',
                emissive: '#00ff88',
                emissiveIntensity: 0.3,
            }),
            serverChassisCritical: new THREE.MeshStandardMaterial({
                color: '#1f1a1a',
                emissive: '#cc3333',
                emissiveIntensity: 0.35,
                roughness: 0.5,
                metalness: 0.4,
            }),
            serverBezel: new THREE.MeshStandardMaterial({ color: '#111' }),
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
            redLED: new THREE.MeshStandardMaterial({
                color: '#f00',
                emissive: '#f00',
                emissiveIntensity: 1.5,
            }),
            offlineLED: new THREE.MeshStandardMaterial({
                color: '#333',
                emissive: '#333',
                emissiveIntensity: 0.1,
            }),
        }),
        []
    );

    const rackHighlightMaterial = useMemo(() => {
        const color = rack.rack_color || '#00aaff';
        return new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
        });
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

    // Build slot map for 20U rack. Multi-U devices span multiple slots.
    const U_SLOTS = 20;
    const slots: (Device3D | null)[] = Array(U_SLOTS).fill(null);
    const sortedDevices = [...rack.devices].sort(
        (a, b) => a.u_position - b.u_position
    );

    for (const device of sortedDevices) {
        const topIndex = Math.max(0, device.u_position - 1);
        const height = Math.max(1, Math.floor(device.height_u || 1));
        for (let k = 0; k < height && topIndex + k < U_SLOTS; k++) {
            slots[topIndex + k] = device;
        }
    }

    const renderedDevices = new Set<string>();

    const handleDeviceClick = (
        e: React.MouseEvent<HTMLElement> | THREE.Event,
        device: Device3D
    ) => {
        if ('stopPropagation' in e) {
            e.stopPropagation();
        }
        const isSelected = selectedDeviceIds.has(device.device_id);
        if (onToggleSelection) {
            onToggleSelection(device.device_id, !isSelected);
        }
        if (onDeviceClick) {
            onDeviceClick(device);
        }
    };

    const handleRackClick = (e: React.MouseEvent<HTMLElement> | THREE.Event) => {
        if ('stopPropagation' in e) {
            e.stopPropagation();
        }
        if (onRackClick) {
            onRackClick(rack.rack_id);
        }
    };

    return (
        <group position={rack.position} rotation={rack.rotation || [0, 0, 0]}>
            {/* Rack highlight box - Add click handler */}
            <mesh
                position={[0.29, 0, 0.15]}
                material={rackHighlightMaterial}
                onClick={handleRackClick}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                <boxGeometry args={[0.75, 1.95, 1.1]} />
            </mesh>

            {/* Rack frame */}
            <mesh castShadow material={materials.rackFrame}>
                <boxGeometry args={[0.02, 1.8, 0.02]} />
            </mesh>
            <mesh
                position={[0.58, 0, 0]}
                castShadow
                material={materials.rackFrame}
            >
                <boxGeometry args={[0.02, 1.8, 0.02]} />
            </mesh>
            <mesh position={[0.29, 0, -0.43]} material={materials.rackBack}>
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

            {/* Rails */}
            <mesh position={[0.05, 0, 0.4]} material={materials.rail}>
                <boxGeometry args={[0.02, 1.6, 0.03]} />
            </mesh>
            <mesh position={[0.53, 0, 0.4]} material={materials.rail}>
                <boxGeometry args={[0.02, 1.6, 0.03]} />
            </mesh>

            {/* Rack name label - shown when rack is selected */}
            {isRackSelected && (
                <Html
                    position={[0.29, 1.02, 0.05]}
                    center
                    zIndexRange={[100, 0]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            background: '#252528',
                            color: '#fff',
                            padding: '5px 12px',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            border: '1px solid #3f3f46',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }}
                    >
                        {rack.rack_name}
                    </div>
                </Html>
            )}

            {/* Active Agent Card - attached to rack, shown when agent is working on a device in this rack */}
            {agentWorkingDevice && activeAgentInfo && (
                <Html
                    position={[-0.55, 0.15, 0.25]}
                    center
                    zIndexRange={[100, 0]}
                    style={{ pointerEvents: 'none' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(135deg, rgba(15, 15, 18, 0.95) 0%, rgba(25, 25, 30, 0.92) 100%)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '8px',
                            padding: '6px 10px 6px 6px',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset',
                            pointerEvents: 'none',
                            minWidth: '120px',
                        }}
                    >
                        {/* Avatar with status ring */}
                        <div
                            style={{
                                position: 'relative',
                                flexShrink: 0,
                            }}
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(59, 130, 246, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(59, 130, 246, 0.08)',
                                }}
                            >
                                {activeAgentInfo.avatar ? (
                                    <img
                                        src={activeAgentInfo.avatar}
                                        alt={activeAgentInfo.agentName}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '16px', color: '#3b82f6' }}>AI</span>
                                )}
                            </div>
                            {/* Status dot on avatar */}
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: activeAgentInfo.status === 'processing' ? '#22c55e' : '#eab308',
                                    border: '2px solid rgba(15, 15, 18, 0.95)',
                                    boxShadow: activeAgentInfo.status === 'processing'
                                        ? '0 0 8px rgba(34, 197, 94, 0.8)'
                                        : '0 0 8px rgba(234, 179, 8, 0.8)',
                                }}
                            />
                        </div>
                        {/* Agent info */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                minWidth: 0,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', -apple-system, sans-serif",
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: '#f3f4f6',
                                    whiteSpace: 'nowrap',
                                    letterSpacing: '-0.01em',
                                    lineHeight: 1.2,
                                }}
                            >
                                {activeAgentInfo.agentName}
                            </span>
                            <span
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '8px',
                                    fontWeight: 500,
                                    color: activeAgentInfo.status === 'processing' ? '#4ade80' : '#fbbf24',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em',
                                    lineHeight: 1,
                                }}
                            >
                                {activeAgentInfo.status === 'processing' ? 'Working' : 'Pending'}
                            </span>
                        </div>
                    </div>
                </Html>
            )}

            {/* Server slots */}
            {slots.map((device, _slotIndex) => {
                if (!device) return null;
                if (renderedDevices.has(device.device_id)) return null;
                renderedDevices.add(device.device_id);

                const topSlotIndex = Math.max(0, device.u_position - 1);
                const heightU = Math.max(1, Math.floor(device.height_u || 1));
                let firstIndex = topSlotIndex;
                for (let scan = 0; scan < slots.length; scan++) {
                    if (slots[scan]?.device_id === device.device_id) {
                        firstIndex = scan;
                        break;
                    }
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
                    <group
                        key={device.device_id}
                        position={[0.29, yPos, 0.15]}
                        onClick={(e) => handleDeviceClick(e, device)}
                        onPointerOver={() =>
                            (document.body.style.cursor = 'pointer')
                        }
                        onPointerOut={() =>
                            (document.body.style.cursor = 'default')
                        }
                    >
                        <mesh
                            castShadow
                            material={chassisMaterial}
                        >
                            <boxGeometry args={[0.48, meshHeight, 0.62]} />
                        </mesh>

                        <mesh
                            position={[0, 0, 0.31]}
                            material={materials.serverBezel}
                        >
                            <boxGeometry
                                args={[0.5, meshHeight * 1.07, 0.005]}
                            />
                        </mesh>

                        {/* LEDs */}
                        <mesh
                            position={[-0.18, 0, 0.315]}
                            material={getLEDMaterial(device, isSelected)}
                        >
                            <boxGeometry args={[0.015, 0.015, 0.002]} />
                        </mesh>
                        <mesh
                            position={[-0.15, 0, 0.315]}
                            material={
                                device.status === 'online'
                                    ? materials.yellowLED
                                    : materials.offlineLED
                            }
                        >
                            <boxGeometry args={[0.015, 0.015, 0.002]} />
                        </mesh>

                        {/* Handles */}
                        <mesh
                            position={[-0.22, 0, 0.31]}
                            material={materials.handle}
                        >
                            <boxGeometry
                                args={[0.02, Math.max(0.03, meshHeight * 0.6), 0.01]}
                            />
                        </mesh>
                        <mesh
                            position={[0.22, 0, 0.31]}
                            material={materials.handle}
                        >
                            <boxGeometry
                                args={[0.02, Math.max(0.03, meshHeight * 0.6), 0.01]}
                            />
                        </mesh>

                        {/* Device hostname label - clickable when rack is selected */}
                        {isRackSelected && (
                            <Html
                                position={[0, 0, 0.35]}
                                center
                                zIndexRange={[100, 0]}
                            >
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDeviceClick) {
                                            onDeviceClick(device);
                                        }
                                    }}
                                    style={{
                                        background: isSelected
                                            ? '#2563eb'
                                            : device.health_status === 'critical'
                                                ? '#1c1617'
                                                : '#252528',
                                        color: device.health_status === 'critical' ? '#f87171' : '#fff',
                                        padding: '5px 12px',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        letterSpacing: '0.02em',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer',
                                        border: isSelected
                                            ? '1px solid #3b82f6'
                                            : device.health_status === 'critical'
                                                ? '1px solid #dc2626'
                                                : '1px solid #3f3f46',
                                        transition: 'all 0.15s ease',
                                        boxShadow: device.health_status === 'critical'
                                            ? '0 0 12px rgba(220, 38, 38, 0.4)'
                                            : '0 2px 6px rgba(0,0,0,0.4)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isSelected
                                            ? '#1d4ed8'
                                            : device.health_status === 'critical'
                                                ? '#271a1b'
                                                : '#333338';
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isSelected
                                            ? '#2563eb'
                                            : device.health_status === 'critical'
                                                ? '#1c1617'
                                                : '#252528';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
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
