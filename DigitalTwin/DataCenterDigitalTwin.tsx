/**
 * DataCenterDigitalTwin Page Component
 *
 * Complete data center digital twin experience with three view modes:
 * 1. Globe View - Interactive world map with site markers
 * 2. Exterior View - 3D building with clickable floors
 * 3. Interior View - Data center floor with racks and devices
 *
 * Supports animated transitions between views.
 */

import { useState, Suspense, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import headerStyles from '../../styles/TeamBuilderPanel.module.css';
import { useOnboardingStatus } from '../../hooks/useOnboardingStatus';
import ProfileAvatar from '../shared/ProfileAvatar';

import { ServerRack } from './ServerRack';
import { DataCenterEnvironment } from './DataCenterEnvironment';
import { NetworkCables } from './NetworkCables';
import { NetworkingArea } from './NetworkingArea';
import { BuildingExterior } from './BuildingExterior';
import { DataCenterGlobe } from './DataCenterGlobe';
import type {
    GlobeSite,
    Rack3D,
    Device3D,
    ViewMode,
    TransitionState,
    Location,
    Rack,
    Device,
} from './types';

import {
    Building2,
    Eye,
    ArrowLeft,
} from 'lucide-react';
import ServerDetailsCard from '../dashboard/ServerDetailsCard';
import DeviceHealthPanel from '../dashboard/DeviceHealthPanel';
import { useGetDeviceAgentActivityQuery } from '../../store/slices/digitalTwinApiSlice';
import { getAvatar } from '../../lib/avatars';

// Constants
const TOTAL_FLOORS = 9;
const FLOOR_HEIGHT = 4;
const AGENT_ACTIVITY_POLLING_INTERVAL = 5000;

/**
 * Map API agent names to display names and avatar labels.
 */
function getAgentDisplayInfo(agentName: string): { displayName: string; avatarLabel: string } {
  const agentMapping: Record<string, { displayName: string; avatarLabel: string }> = {
    'systems_admin_hardware': {
      displayName: 'Hardware Operations',
      avatarLabel: 'Hardware Operations',
    },
    'systems_admin_os': {
      displayName: 'OS Operations',
      avatarLabel: 'OS Operations',
    },
    'noc_analyst': {
      displayName: 'Level 1 Support',
      avatarLabel: 'Level 1 Support',
    },
    'operations_manager': {
      displayName: 'Operations Manager',
      avatarLabel: 'Operations Manager',
    },
    'wlan_network_agent': {
      displayName: 'WLAN Network Specialist',
      avatarLabel: 'WLAN Network Specialist',
    },
    'vastai_agent': {
      displayName: 'NeoCloud Provisioning',
      avatarLabel: 'NeoCloud Provisioning Agent',
    },
    'metrumai_insights_agent': {
      displayName: 'MetrumAI Insights',
      avatarLabel: 'MetrumAI Insights Agent',
    },
  };

  const info = agentMapping[agentName];
  if (info) {
    return info;
  }

  // Fallback: Convert snake_case to Title Case
  const displayName = agentName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { displayName, avatarLabel: displayName };
}

interface GlobalInfrastructurePanelProps {
    onBack: () => void;
}

function GlobalInfrastructurePanel({ onBack }: GlobalInfrastructurePanelProps) {
    return (
        <div className={headerStyles.teamBuilderPanel}>
            <div className={headerStyles.teamHeader}>
                <button
                    onClick={onBack}
                    className={headerStyles.backButton}
                    title="Go to onboarding"
                    aria-label="Go to onboarding"
                >
                    <ArrowLeft className={headerStyles.backIcon} />
                </button>
                <h3 className={headerStyles.title}>Global Infrastructure</h3>
                <div className={headerStyles.divider} />
            </div>
        </div>
    );
}

// Convert API device to 3D device format
function convertToDevice3D(
    device: Device,
    index: number,
    affectedDevice?: string | null
): Device3D {
    // Determine health status based on whether this device is the affected one
    const isAffectedDevice = affectedDevice && device.name === affectedDevice;
    const healthStatus: 'ok' | 'warning' | 'critical' = isAffectedDevice
        ? 'critical'
        : 'ok';

    // Determine device status based on API status and health
    const deviceStatus: 'online' | 'offline' | 'degraded' =
        device.status !== 'active'
            ? 'offline'
            : isAffectedDevice
                ? 'degraded'
                : 'online';

    return {
        device_id: String(device.id),
        hostname: device.name,
        ip_address:
            device.bmc?.ip_address ||
            `192.168.1.${100 + index}`,
        device_type: device.accelerators === 'GPU' ? 'server' : 'storage',
        status: deviceStatus,
        temperature: 35 + (index % 10),
        power_consumption: 200 + (index * 20),
        rack_position: `U${device.position || index + 1}`,
        u_position: device.position || index + 1,
        height_u: device.gpu_count > 4 ? 4 : device.gpu_count > 0 ? 2 : 1,
        health_status: healthStatus,
        manufacturer: device.manufacturer,
        model: device.model,
        gpu_count: device.gpu_count,
        accelerators: device.accelerators,
        tenant: device.tenant,
        cluster_id: device.cluster_id,
        tags: device.tags,
        serial: device.serial,
        asset_tag: device.asset_tag,
    };
}

// Generate mock devices for a rack if it has no real devices
// Mock devices are always healthy since they're not real
function generateMockDevices(rackId: string, count: number): Device3D[] {
    const manufacturers = ['Dell', 'HP', 'Lenovo', 'NVIDIA', 'AMD'];

    return Array.from({ length: count }, (_, i) => ({
        device_id: `${rackId}-dev-${i + 1}`,
        hostname: `SRV-${rackId}-${String(i + 1).padStart(2, '0')}`,
        ip_address: `192.168.1.${100 + i}`,
        device_type: i % 3 === 0 ? 'storage' : 'server',
        status: 'online' as const,
        temperature: 35 + (i % 10),
        power_consumption: 200 + (i * 20),
        rack_position: `U${i + 1}`,
        u_position: i + 1,
        height_u: i % 5 === 0 ? 2 : 1,
        health_status: 'ok' as const,
        manufacturer: manufacturers[i % manufacturers.length],
        model: `Model-${1000 + (i * 111)}`,
    }));
}

// Convert API racks to 3D rack format
function convertToRack3D(
    racks: Rack[],
    floorNumber = 1,
    affectedDevice?: string | null
): Rack3D[] {
    // If we have real racks, use them
    if (racks.length > 0) {
        return racks.map((rack, index) => {
            const row = index % 2 === 0 ? 'A' : 'B';
            const position = Math.floor(index / 2);
            const devices =
                rack.devices.length > 0
                    ? rack.devices.map((d, i) => convertToDevice3D(d, i, affectedDevice))
                    : generateMockDevices(rack.name, 18);

            return {
                rack_id: rack.name,
                rack_name: rack.name,
                rack_color: row === 'A' ? '#00aaff' : '#ff6600',
                row_name: `Row ${row}`,
                devices,
                position: [-4 + position * 2, -0.25, row === 'A' ? -2 : 2] as [
                    number,
                    number,
                    number,
                ],
                rotation:
                    row === 'B'
                        ? ([0, Math.PI, 0] as [number, number, number])
                        : undefined,
            };
        });
    }

    // Generate default racks if none exist (mock data - always healthy)
    return [
        ...['A1', 'A2', 'A3', 'A4', 'A5'].map((id, i) => ({
            rack_id: `F${floorNumber}-${id}`,
            rack_name: `F${floorNumber} Rack ${id}`,
            rack_color: '#00aaff',
            row_name: 'Row A',
            devices: generateMockDevices(`F${floorNumber}-${id}`, 18),
            position: [-4 + i * 2, -0.25, -2] as [number, number, number],
        })),
        ...['B1', 'B2', 'B3', 'B4', 'B5'].map((id, i) => ({
            rack_id: `F${floorNumber}-${id}`,
            rack_name: `F${floorNumber} Rack ${id}`,
            rack_color: '#ff6600',
            row_name: 'Row B',
            devices: generateMockDevices(`F${floorNumber}-${id}`, 18),
            position: [-4 + i * 2, -0.25, 2] as [number, number, number],
            rotation: [0, Math.PI, 0] as [number, number, number],
        })),
    ];
}


// Get racks from a site's locations
function getRacksFromSite(site: GlobeSite): Rack[] {
    const racks: Rack[] = [];

    function extractRacks(locations: Location[]) {
        for (const location of locations) {
            racks.push(...location.racks);
            extractRacks(location.children);
        }
    }

    extractRacks(site.locations);
    return racks;
}

// Props interface
interface DataCenterDigitalTwinProps {
    sites?: GlobeSite[];
    initialViewMode?: ViewMode;
    onDeviceSelect?: (device: Device3D) => void;
    hideNavigation?: boolean;
    clusterId?: string | null;
}

export function DataCenterDigitalTwin({
    sites = [],
    initialViewMode = 'globe',
    onDeviceSelect,
    hideNavigation = false,
    clusterId,
}: DataCenterDigitalTwinProps) {
    const navigate = useNavigate();
    const { markStepComplete } = useOnboardingStatus();
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const [selectedSite, setSelectedSite] = useState<GlobeSite | null>(null);
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(
        new Set()
    );
    const [selectedDevice, setSelectedDevice] = useState<Device3D | null>(null);
    const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
    const [currentFloor, setCurrentFloor] = useState(1);
    // State for full health panel
    const [healthPanelDeviceId, setHealthPanelDeviceId] = useState<number | null>(
        null
    );
    const [healthPanelDeviceName, setHealthPanelDeviceName] = useState<string>(
        ''
    );
    const [transitionState, setTransitionState] =
        useState<TransitionState>('idle');
    const [showContent, setShowContent] = useState(true);

    // Fetch device agent activity for the cluster
    const { data: agentActivityData } = useGetDeviceAgentActivityQuery(
        clusterId || '',
        {
            skip: !clusterId,
            pollingInterval: AGENT_ACTIVITY_POLLING_INTERVAL,
        }
    );

    // Find active agent from the response (first device with an active agent)
    const activeAgentInfo = useMemo(() => {
        if (!agentActivityData?.devices) return null;

        for (const device of agentActivityData.devices) {
            if (device.active_agent) {
                const { displayName, avatarLabel } = getAgentDisplayInfo(
                    device.active_agent.agent_name
                );
                return {
                    agentName: displayName,
                    avatarLabel,
                    avatar: getAvatar(avatarLabel) || null,
                    deviceName: device.device_name,
                    bmcIp: device.bmc_ip,
                    status: device.active_agent.status,
                };
            }
        }
        return null;
    }, [agentActivityData]);

    // Get racks for selected site
    const siteRacks = useMemo(() => {
        if (!selectedSite) return [];
        return getRacksFromSite(selectedSite);
    }, [selectedSite]);

    // Determine affected device from site data or agent activity
    const affectedDevice = useMemo(() => {
        // First check if site has affected device info
        if (selectedSite?.affectedDevice) {
            return selectedSite.affectedDevice;
        }
        // Fallback to agent activity data (device where agent is working)
        if (activeAgentInfo?.deviceName) {
            return activeAgentInfo.deviceName;
        }
        return null;
    }, [selectedSite, activeAgentInfo]);

    // Convert to 3D format, passing affected device for health status
    const currentFloorRacks = useMemo(() => {
        return convertToRack3D(siteRacks, currentFloor, affectedDevice);
    }, [siteRacks, currentFloor, affectedDevice]);

    const handleSiteClick = useCallback((site: GlobeSite) => {
        setTransitionState('zooming-in');
        setShowContent(false);

        // Start zoom animation
        setTimeout(() => {
            setSelectedSite(site);
            setTransitionState('loading');
        }, 400);

        // Show data center view
        setTimeout(() => {
            setViewMode('interior');
            setCurrentFloor(1);
            setSelectedRackId(null);
            setSelectedDevice(null);
            setTransitionState('idle');
            setShowContent(true);
        }, 800);
    }, []);

    const handleBackToGlobe = useCallback(() => {
        setTransitionState('zooming-out');
        setShowContent(false);

        setTimeout(() => {
            setViewMode('globe');
            setSelectedSite(null);
            setSelectedRackId(null);
            setSelectedDevice(null);
            setTransitionState('idle');
            setShowContent(true);
        }, 600);
    }, []);

    const handleBackToOnboarding = useCallback(() => {
        navigate('/onboarding');
    }, [navigate]);

    const handleContinueToWorkflows = useCallback(() => {
        // Mark topology step as complete before navigating to workflows
        markStepComplete('topology');
        navigate('/workflows');
    }, [navigate, markStepComplete]);

    const handleToggleSelection = useCallback(
        (deviceId: string, isSelected: boolean) => {
            setSelectedDeviceIds((prev) => {
                const next = new Set(prev);
                if (isSelected) {
                    next.add(deviceId);
                } else {
                    next.delete(deviceId);
                }
                return next;
            });
        },
        []
    );

    const handleDeviceClick = useCallback(
        (device: Device3D) => {
            setSelectedDevice(device);
            if (onDeviceSelect) {
                onDeviceSelect(device);
            }
        },
        [onDeviceSelect]
    );

    /**
     * Open the health panel for a device.
     * Extracts numeric ID from device_id string.
     */
    const handleOpenHealthPanel = useCallback((device: Device3D) => {
        const numericId = parseInt(device.device_id, 10);
        if (!isNaN(numericId)) {
            setHealthPanelDeviceId(numericId);
            setHealthPanelDeviceName(device.hostname);
        }
    }, []);

    /**
     * Close the health panel.
     */
    const handleCloseHealthPanel = useCallback(() => {
        setHealthPanelDeviceId(null);
        setHealthPanelDeviceName('');
    }, []);

    const handleRackClick = useCallback((rackId: string) => {
        setSelectedRackId((prev) => (prev === rackId ? null : rackId));
    }, []);

    const handleFloorChange = useCallback((floor: number) => {
        if (floor >= 1 && floor <= TOTAL_FLOORS) {
            setCurrentFloor(floor);
            setSelectedRackId(null);
            setSelectedDevice(null);
        }
    }, []);

    const handleFloorClickFromExterior = useCallback((floor: number) => {
        setCurrentFloor(floor);
        setViewMode('interior');
    }, []);

    const totalRacks = currentFloorRacks.length * TOTAL_FLOORS;
    const totalServers =
        currentFloorRacks.reduce((acc, r) => acc + r.devices.length, 0) *
        TOTAL_FLOORS;

    // Transition overlay component
    const TransitionOverlay = () => {
        if (transitionState === 'idle') return null;

        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                {/* Radial zoom effect */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#030712',
                        transition: 'opacity 0.5s',
                        opacity:
                            transitionState === 'zooming-in' ||
                            transitionState === 'zooming-out'
                                ? 1
                                : 0,
                    }}
                />

                {/* Center loading indicator */}
                {transitionState === 'loading' && (
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                border: '4px solid rgba(0,170,255,0.3)',
                                borderTopColor: '#00aaff',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <div
                            style={{
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: 500,
                            }}
                        >
                            Loading {selectedSite?.name}...
                        </div>
                    </div>
                )}

                {/* Zoom in effect */}
                {transitionState === 'zooming-in' && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                background: '#00aaff',
                                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    // Globe view
    if (viewMode === 'globe') {
        return (
            <div
                style={{
                    width: '100%',
                    height: '100vh',
                    background: 'black',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <TransitionOverlay />

                {!hideNavigation && <GlobalInfrastructurePanel onBack={handleBackToOnboarding} />}

                {/* Profile Avatar - Top Right */}
                {!hideNavigation && <ProfileAvatar position="fixed" />}

                {/* Globe component */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        transition: 'all 0.5s',
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? 'scale(1)' : 'scale(1.1)',
                    }}
                >
                    <DataCenterGlobe sites={sites} onSiteClick={handleSiteClick} hideNavigation={hideNavigation} />
                </div>

                {/* Continue with team building button - Bottom right */}
                {!hideNavigation && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 1000,
                        transition: 'all 0.5s 0.2s',
                        opacity: showContent ? 1 : 0,
                        transform: showContent ? 'translateY(0)' : 'translateY(16px)',
                        pointerEvents: showContent ? 'auto' : 'none',
                    }}
                >
                    <button
                        onClick={handleContinueToWorkflows}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            letterSpacing: '-0.01em',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)';
                        }}
                    >
                        Continue with team building
                    </button>
                </div>
                )}
            </div>
        );
    }

    // Data center view (interior/exterior)
    const regionName = selectedSite?.name || 'Unknown';

    return (
        <div
            style={{
                width: '100%',
                height: '100vh',
                background: 'black',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <TransitionOverlay />

            {/* Profile Avatar - Top Right */}
            {!hideNavigation && <ProfileAvatar position="fixed" />}

            {/* 3D Canvas with fade in */}
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    transition: 'all 0.7s',
                    opacity: showContent ? 1 : 0,
                }}
            >
                <Canvas shadows>
                    <PerspectiveCamera
                        makeDefault
                        position={
                            viewMode === 'interior' ? [8, 5, 8] : [25, 20, 25]
                        }
                        fov={50}
                    />
                    <OrbitControls
                        enablePan
                        enableZoom
                        enableRotate
                        minDistance={viewMode === 'interior' ? 3 : 15}
                        maxDistance={viewMode === 'interior' ? 20 : 100}
                        maxPolarAngle={Math.PI / 2}
                        enableDamping
                        dampingFactor={0.05}
                    />

                    <ambientLight intensity={0.3} />
                    <directionalLight
                        position={[10, 20, 10]}
                        intensity={0.6}
                        castShadow
                    />
                    <pointLight
                        position={[-5, 3, 0]}
                        intensity={0.3}
                        color="#00aaff"
                    />
                    <pointLight
                        position={[5, 3, 0]}
                        intensity={0.3}
                        color="#ff6600"
                    />

                    <Suspense fallback={null}>
                        {viewMode === 'interior' ? (
                            <>
                                <DataCenterEnvironment
                                    regionName={`${regionName} - Floor ${currentFloor}`}
                                />
                                <NetworkCables racks={currentFloorRacks} />
                                <NetworkingArea
                                    position={[5.3, -0.88, 0]}
                                    rowARackXPositions={[-4, -2, 0, 2, 4]}
                                    rowBRackXPositions={[-4, -2, 0, 2, 4]}
                                />
                                {currentFloorRacks.map((rack) => (
                                    <ServerRack
                                        key={rack.rack_id}
                                        rack={rack}
                                        selectedDeviceIds={selectedDeviceIds}
                                        selectedRackId={selectedRackId}
                                        onRackClick={handleRackClick}
                                        onDeviceClick={handleDeviceClick}
                                        onToggleSelection={handleToggleSelection}
                                        activeAgentInfo={activeAgentInfo}
                                    />
                                ))}
                            </>
                        ) : (
                            <BuildingExterior
                                floors={TOTAL_FLOORS}
                                floorHeight={FLOOR_HEIGHT}
                                regionName={regionName}
                                currentFloor={currentFloor}
                                onFloorClick={handleFloorClickFromExterior}
                            />
                        )}
                    </Suspense>
                </Canvas>
            </div>

            {/* Top header bar - pill style like TeamBuilderPanel */}
            {!hideNavigation && (
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    pointerEvents: 'none',
                    transition: 'all 0.5s 0.1s',
                    opacity: showContent ? 1 : 0,
                    transform: showContent
                        ? 'translateY(0)'
                        : 'translateY(-16px)',
                }}
            >
                {/* Left side - Back button pill */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        pointerEvents: 'auto',
                    }}
                >
                    {/* Back button - pill style */}
                    <button
                        onClick={handleBackToGlobe}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#f8fafc',
                            background: 'rgba(26, 26, 26, 0.95)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            border: '1px solid rgba(55, 65, 81, 0.5)',
                            padding: '10px 16px',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            width: 'fit-content',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(26, 26, 26, 0.95)';
                            e.currentTarget.style.borderColor = 'rgba(55, 65, 81, 0.5)';
                        }}
                    >
                        <ArrowLeft style={{ width: '16px', height: '16px' }} />
                        Back to Globe
                    </button>

                    {/* Site info card */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }}
                    >
                        {/* Main info panel */}
                        <div
                            style={{
                                background: 'rgba(12, 12, 16, 0.9)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#e5e7eb',
                                    fontFamily: "'Inter', sans-serif",
                                    margin: '0 0 6px 0',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {regionName}
                            </h1>
                            <p
                                style={{
                                    color: '#71717a',
                                    fontSize: '12px',
                                    fontFamily: "'Inter', sans-serif",
                                    margin: 0,
                                    lineHeight: 1.4,
                                }}
                            >
                                {selectedSite?.address || 'Unknown location'}
                            </p>
                        </div>

                        {/* Hint panel */}
                        <div
                            style={{
                                background: 'rgba(12, 12, 16, 0.75)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                            }}
                        >
                            <p
                                style={{
                                    color: '#52525b',
                                    fontSize: '11px',
                                    fontFamily: "'Inter', sans-serif",
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                {viewMode === 'interior'
                                    ? `Floor ${currentFloor} of ${TOTAL_FLOORS}  ·  Click rack to see details  ·  Scroll to zoom`
                                    : 'Click on a floor to enter  ·  Scroll to zoom  ·  Drag to rotate'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right side - Row indicators (commented out for now) */}
                {/* <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif",
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#e2e8f0',
                            background: 'rgba(10, 10, 15, 0.85)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            padding: '8px 14px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(55, 65, 81, 0.4)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <div
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                                boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
                            }}
                        />
                        <span>Row A</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#e2e8f0',
                            background: 'rgba(10, 10, 15, 0.85)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            padding: '8px 14px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(55, 65, 81, 0.4)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <div
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f97316, #fb923c)',
                                boxShadow: '0 0 8px rgba(249, 115, 22, 0.5)',
                            }}
                        />
                        <span>Row B</span>
                    </div>
                </div> */}
            </div>
            )}

            {/* Floor selector - Premium vertical slider */}
            <div
                style={{
                    position: 'absolute',
                    left: '24px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(10, 10, 15, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    transition: 'all 0.5s 0.2s',
                    opacity: showContent ? 1 : 0,
                    padding: '16px 12px',
                    display: 'flex',
                    flexDirection: 'row',
                    maxHeight: '400px',
                    alignItems: 'stretch',
                    gap: '12px',
                }}
            >
                {/* Gradient progress bar */}
                <div
                    style={{
                        width: '8px',
                        background: 'rgba(55, 65, 81, 0.3)',
                        borderRadius: '3px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${(currentFloor / TOTAL_FLOORS) * 100}%`,
                            background: 'linear-gradient(to top, #3b82f6, #8b5cf6, #ec4899)',
                            borderRadius: '3px',
                            transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
                        }}
                    />
                </div>

                {/* Floor buttons container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        width: '44px',
                    }}
                >
                    {Array.from(
                        { length: TOTAL_FLOORS },
                        (_, i) => TOTAL_FLOORS - i
                    ).map((floor) => (
                        <button
                            key={floor}
                            onClick={() => handleFloorChange(floor)}
                            style={{
                                width: '30px',
                                height: '28px',
                                fontSize: '13px',
                                fontWeight: currentFloor === floor ? 700 : 500,
                                fontFamily: "'Inter', sans-serif",
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                background:
                                    currentFloor === floor
                                        ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                                        : 'transparent',
                                color:
                                    currentFloor === floor
                                        ? 'white'
                                        : '#6b7280',
                                boxShadow:
                                    currentFloor === floor
                                        ? '0 4px 12px rgba(139, 92, 246, 0.4)'
                                        : 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: currentFloor === floor ? 'scale(1.05)' : 'scale(1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                                if (currentFloor !== floor) {
                                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                                    e.currentTarget.style.color = '#a78bfa';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentFloor !== floor) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#6b7280';
                                }
                            }}
                        >
                            F{floor}
                        </button>
                    ))}
                </div>
            </div>

            {/* View mode toggle - Premium pill style */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: '24px',
                    background: 'rgba(10, 10, 15, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '9999px',
                    border: '1px solid rgba(55, 65, 81, 0.4)',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    padding: '6px',
                    display: 'flex',
                    gap: '4px',
                    transition: 'all 0.5s 0.3s',
                    opacity: showContent ? 1 : 0,
                }}
            >
                <button
                    onClick={() => setViewMode('interior')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                        background:
                            viewMode === 'interior'
                                ? 'linear-gradient(135deg, #3b82f6, #0ea5e9)'
                                : 'transparent',
                        color: viewMode === 'interior' ? 'white' : '#9ca3af',
                        boxShadow:
                            viewMode === 'interior'
                                ? '0 4px 12px rgba(59, 130, 246, 0.4)'
                                : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Eye style={{ width: '16px', height: '16px' }} />
                    Interior
                </button>
                <button
                    onClick={() => setViewMode('exterior')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        fontWeight: 500,
                        background:
                            viewMode === 'exterior'
                                ? 'linear-gradient(135deg, #3b82f6, #0ea5e9)'
                                : 'transparent',
                        color: viewMode === 'exterior' ? 'white' : '#9ca3af',
                        boxShadow:
                            viewMode === 'exterior'
                                ? '0 4px 12px rgba(59, 130, 246, 0.4)'
                                : 'none',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    <Building2 style={{ width: '16px', height: '16px' }} />
                    Exterior
                </button>
            </div>

            {/* Server Details Card - Positioned on right side */}
            {/* Only show when device is selected AND health panel is NOT open */}
            {viewMode === 'interior' && selectedDevice && healthPanelDeviceId === null && (() => {
                const numericDeviceId = parseInt(selectedDevice.device_id, 10);
                // Only render if we have a valid numeric ID
                if (isNaN(numericDeviceId)) return null;
                return (
                    <div
                        style={{
                            position: 'absolute',
                            top: '80px',
                            right: '16px',
                            bottom: '80px',
                            width: '380px',
                            zIndex: 100,
                        }}
                    >
                        <ServerDetailsCard
                            deviceId={numericDeviceId}
                            deviceName={selectedDevice.hostname}
                            onClose={() => setSelectedDevice(null)}
                            onViewFullDetails={() => handleOpenHealthPanel(selectedDevice)}
                            variant="right"
                        />
                    </div>
                );
            })()}

            {/* Full Device Health Panel - Positioned on right side */}
            {healthPanelDeviceId !== null && (
                <div
                    style={{
                        position: 'absolute',
                        top: '80px',
                        right: '16px',
                        bottom: '80px',
                        width: '400px',
                        zIndex: 100,
                    }}
                >
                    <DeviceHealthPanel
                        deviceId={healthPanelDeviceId}
                        deviceName={healthPanelDeviceName}
                        onClose={handleCloseHealthPanel}
                        variant="right"
                    />
                </div>
            )}

            {/* Building stats - Premium glass panel */}
            {!hideNavigation && (
            <div
                style={{
                    position: 'absolute',
                    top: '100px',
                    right: '20px',
                    width: '220px',
                    background: 'rgba(10, 10, 15, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(55, 65, 81, 0.4)',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    padding: '18px',
                    transition: 'all 0.5s 0.4s',
                    opacity: showContent ? 1 : 0,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(55, 65, 81, 0.3)',
                        marginBottom: '14px',
                    }}
                >
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                        }}
                    />
                    Building Stats
                </div>
                <div style={{ fontSize: '13px', fontFamily: "'Inter', sans-serif" }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>Total Floors</span>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{TOTAL_FLOORS}</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>Total Racks</span>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{totalRacks}</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span style={{ color: '#6b7280' }}>Total Servers</span>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{totalServers}</span>
                    </div>
                    <div
                        style={{
                            borderTop: '1px solid rgba(55, 65, 81, 0.3)',
                            paddingTop: '14px',
                            marginTop: '14px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>
                                Current Floor
                            </span>
                            <span
                                style={{
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                F{currentFloor}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '8px',
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>Floor Racks</span>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                                {currentFloorRacks.length}
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span style={{ color: '#6b7280' }}>
                                Floor Servers
                            </span>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                                {currentFloorRacks.reduce(
                                    (a, r) => a + r.devices.length,
                                    0
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* CSS for animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50%) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(-50%) scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

export default DataCenterDigitalTwin;

