/**
 * DataCenterGlobe Component
 *
 * Interactive 3D globe showing data center locations worldwide.
 * Uses react-globe.gl for premium 3D visualization with:
 * - Per-marker colors based on health status
 * - Native tooltips on hover
 * - Automatic marker visibility culling (hides markers behind globe)
 * - Smooth animations and interactions
 *
 * Features:
 * - Rotating globe with health-status-colored markers
 * - Hover tooltips with site details
 * - Click to navigate to site
 * - Search/filter sites
 * - Stats panel with totals
 * - Red pulsating markers for unhealthy sites
 * - Green markers for healthy sites
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeSite, SiteHealthStatus } from './types';
import {
    Server,
    HardDrive,
    Cpu,
    Search,
    ChevronRight,
} from 'lucide-react';

// Health status color mapping
const HEALTH_COLORS: Record<SiteHealthStatus, string> = {
    healthy: '#22c55e',    // Green
    warning: '#f59e0b',    // Amber
    unhealthy: '#ef4444',  // Red
    unknown: '#6b7280',    // Gray
};

// Ring colors for pulsating effect (slightly transparent)
const RING_COLORS: Record<SiteHealthStatus, string> = {
    healthy: 'rgba(34, 197, 94, 0.6)',
    warning: 'rgba(245, 158, 11, 0.6)',
    unhealthy: 'rgba(239, 68, 68, 0.8)',
    unknown: 'rgba(107, 114, 128, 0.4)',
};

// CSS keyframes for unhealthy card pulse animation
const unhealthyPulseKeyframes = `
@keyframes unhealthyCardPulse {
    0%, 100% {
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4), 
                    0 0 16px rgba(239, 68, 68, 0.2), 
                    inset 0 0 8px rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.5);
    }
    50% {
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.6), 
                    0 0 24px rgba(239, 68, 68, 0.35), 
                    inset 0 0 12px rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.7);
    }
}
`;

interface DataCenterGlobeProps {
    sites: GlobeSite[];
    onSiteClick: (site: GlobeSite) => void;
    hideNavigation?: boolean;
    /** Hide the site list panel on the right */
    hideSiteListPanel?: boolean;
    /** Hide the stats panel at bottom-left */
    hideStatsPanel?: boolean;
    /** Disable click on markers (tooltip-only mode) */
    disableMarkerClick?: boolean;
    /** Hide the bottom instructions text */
    hideInstructions?: boolean;
}

// Point data structure for react-globe.gl
interface GlobePointData {
    lat: number;
    lng: number;
    size: number;
    color: string;
    site: GlobeSite;
    healthStatus: SiteHealthStatus;
}

// Ring data for pulsating effect on unhealthy/warning sites
interface GlobeRingData {
    lat: number;
    lng: number;
    maxR: number;
    propagationSpeed: number;
    repeatPeriod: number;
    color: string;
    site: GlobeSite;
}

export function DataCenterGlobe({
    sites,
    onSiteClick,
    hideNavigation = false,
    hideSiteListPanel = false,
    hideStatsPanel = false,
    disableMarkerClick = false,
    hideInstructions = false,
}: DataCenterGlobeProps) {
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Filter sites for the list panel
    const filteredSites = sites.filter(
        (site) =>
            site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            site.regionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            site.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Transform sites to point data for the globe
    const pointsData = useMemo((): GlobePointData[] => {
        return sites.map((site) => {
            const healthStatus = site.healthStatus || 'unknown';
            return {
                lat: site.latitude,
                lng: site.longitude,
                size: 0.4 + Math.min(site.deviceCount * 0.08, 0.6),
                color: HEALTH_COLORS[healthStatus],
                site,
                healthStatus,
            };
        });
    }, [sites]);

    // Create ring data for pulsating effect on unhealthy/warning sites
    const ringsData = useMemo((): GlobeRingData[] => {
        return sites
            .filter((site) => {
                const status = site.healthStatus || 'unknown';
                return status === 'unhealthy' || status === 'warning';
            })
            .map((site) => {
                const healthStatus = site.healthStatus || 'unknown';
                const isUnhealthy = healthStatus === 'unhealthy';
                return {
                    lat: site.latitude,
                    lng: site.longitude,
                    maxR: isUnhealthy ? 4 : 3,
                    propagationSpeed: isUnhealthy ? 3 : 2,
                    repeatPeriod: isUnhealthy ? 800 : 1200,
                    color: RING_COLORS[healthStatus],
                    site,
                };
            });
    }, [sites]);

    // Handle container resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Configure globe on mount
    useEffect(() => {
        if (globeRef.current) {
            // Set initial view
            globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });
            
            // Enable auto-rotation
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.3;
            
            // Enable smooth damping
            globeRef.current.controls().enableDamping = true;
            globeRef.current.controls().dampingFactor = 0.1;
            
            setIsLoaded(true);
        }
    }, []);

    // Handle point click
    const handlePointClick = useCallback(
        (point: GlobePointData) => {
            if (!disableMarkerClick && point.site) {
                onSiteClick(point.site);
            }
        },
        [disableMarkerClick, onSiteClick]
    );

    // Handle ring click (same as point click)
    const handleRingClick = useCallback(
        (ring: GlobeRingData) => {
            if (!disableMarkerClick && ring.site) {
                onSiteClick(ring.site);
            }
        },
        [disableMarkerClick, onSiteClick]
    );

    // Custom tooltip content
    const getPointLabel = useCallback((point: GlobePointData) => {
        const site = point.site;
        const healthStatus = point.healthStatus;
        const statusColor = HEALTH_COLORS[healthStatus];
        const statusBgColor = healthStatus === 'unhealthy' 
            ? 'rgba(239,68,68,0.15)' 
            : healthStatus === 'warning'
                ? 'rgba(245,158,11,0.15)'
                : healthStatus === 'healthy'
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(107,114,128,0.15)';
        
        const issueHtml = site.issueSummary ? `
            <div style="
                margin-top: 10px;
                padding: 10px 12px;
                border-radius: 6px;
                background: ${healthStatus === 'unhealthy' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'};
                border: 1px solid ${healthStatus === 'unhealthy' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'};
                display: flex;
                align-items: flex-start;
                gap: 8px;
            ">
                <span style="color: ${statusColor}; font-size: 14px;">&#9888;</span>
                <span style="
                    font-size: 12px;
                    line-height: 1.4;
                    color: ${healthStatus === 'unhealthy' ? '#fca5a5' : '#fcd34d'};
                ">${site.issueSummary}</span>
            </div>
        ` : '';

        return `
            <div style="
                background: rgba(17,24,39,0.95);
                backdrop-filter: blur(12px);
                border: 1px solid ${healthStatus === 'unhealthy' ? 'rgba(239,68,68,0.5)' : healthStatus === 'warning' ? 'rgba(245,158,11,0.5)' : 'rgba(0,170,255,0.4)'};
                border-radius: 10px;
                padding: 16px;
                min-width: 280px;
                max-width: 320px;
                box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            ">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <div style="
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background: ${statusColor};
                        box-shadow: 0 0 8px ${statusColor};
                    "></div>
                    <span style="font-weight: 600; font-size: 15px; color: white;">${site.name}</span>
                    ${healthStatus !== 'unknown' ? `
                        <span style="
                            margin-left: auto;
                            font-size: 10px;
                            padding: 3px 8px;
                            border-radius: 4px;
                            text-transform: uppercase;
                            font-weight: 600;
                            letter-spacing: 0.05em;
                            background: ${statusBgColor};
                            color: ${statusColor};
                            border: 1px solid ${statusColor}33;
                        ">${healthStatus}</span>
                    ` : ''}
                </div>
                <div style="
                    display: inline-block;
                    font-size: 11px;
                    padding: 3px 10px;
                    border-radius: 4px;
                    border: 1px solid rgba(100,116,139,0.4);
                    color: #94a3b8;
                    background: rgba(51,65,85,0.3);
                    margin-bottom: 12px;
                ">${site.regionName}</div>
                <div style="
                    color: #9ca3af;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                ">
                    <span style="color: #64748b;">&#128205;</span>
                    ${site.address}
                </div>
                ${issueHtml}
                <div style="
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 14px;
                    padding-top: 14px;
                    border-top: 1px solid rgba(55,65,81,0.5);
                ">
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        padding: 10px 6px;
                        border-radius: 8px;
                        background: rgba(31,41,55,0.5);
                    ">
                        <span style="color: #fb923c; font-size: 16px;">&#128451;</span>
                        <span style="font-weight: 700; color: white; font-size: 14px;">${site.rackCount}</span>
                        <span style="font-size: 10px; color: #6b7280;">Racks</span>
                    </div>
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        padding: 10px 6px;
                        border-radius: 8px;
                        background: rgba(31,41,55,0.5);
                    ">
                        <span style="color: #4ade80; font-size: 16px;">&#128421;</span>
                        <span style="font-weight: 700; color: white; font-size: 14px;">${site.deviceCount}</span>
                        <span style="font-size: 10px; color: #6b7280;">Devices</span>
                    </div>
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 4px;
                        padding: 10px 6px;
                        border-radius: 8px;
                        background: rgba(31,41,55,0.5);
                    ">
                        <span style="color: #22d3ee; font-size: 16px;">&#9881;</span>
                        <span style="font-weight: 700; color: white; font-size: 14px;">${site.gpuCount}</span>
                        <span style="font-size: 10px; color: #6b7280;">GPUs</span>
                    </div>
                </div>
                ${!disableMarkerClick ? `
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        color: #22d3ee;
                        margin-top: 12px;
                        font-size: 12px;
                        font-weight: 500;
                    ">
                        <span>Click to explore</span>
                        <span style="font-size: 10px;">&#10095;</span>
                    </div>
                ` : ''}
            </div>
        `;
    }, [disableMarkerClick]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Inject CSS keyframes for unhealthy card pulse animation */}
            <style dangerouslySetInnerHTML={{ __html: unhealthyPulseKeyframes }} />
            
            {/* Background */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#000000',
                }}
            />

            {/* Subtle radial gradient overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(ellipse at center, rgba(10,20,30,0.3) 0%, rgba(0,0,0,0.8) 100%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Grid pattern */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.08,
                    backgroundImage:
                        'linear-gradient(rgba(0,150,200,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,150,200,0.15) 1px, transparent 1px)',
                    backgroundSize: '60px 60px',
                    pointerEvents: 'none',
                }}
            />

            {/* Globe Container */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 0.5s ease-out',
                    opacity: isLoaded ? 1 : 0,
                }}
            >
                <Globe
                    ref={globeRef}
                    width={dimensions.width || 800}
                    height={dimensions.height || 800}
                    backgroundColor="rgba(0,0,0,0)"
                    globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                    bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                    atmosphereColor="rgba(30, 100, 150, 0.4)"
                    atmosphereAltitude={0.2}
                    // Points layer for markers
                    pointsData={pointsData}
                    pointLat={(d: GlobePointData) => d.lat}
                    pointLng={(d: GlobePointData) => d.lng}
                    pointAltitude={0.01}
                    pointRadius={(d: GlobePointData) => d.size}
                    pointColor={(d: GlobePointData) => d.color}
                    pointLabel={getPointLabel}
                    onPointClick={handlePointClick}
                    pointsMerge={false}
                    // Rings layer for pulsating effect
                    ringsData={ringsData}
                    ringLat={(d: GlobeRingData) => d.lat}
                    ringLng={(d: GlobeRingData) => d.lng}
                    ringAltitude={0.015}
                    ringColor={(d: GlobeRingData) => d.color}
                    ringMaxRadius={(d: GlobeRingData) => d.maxR}
                    ringPropagationSpeed={(d: GlobeRingData) => d.propagationSpeed}
                    ringRepeatPeriod={(d: GlobeRingData) => d.repeatPeriod}
                    onRingClick={handleRingClick}
                />
            </div>

            {/* Bottom instructions */}
            {!hideInstructions && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: hideStatsPanel ? '32px' : '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                        transition: 'opacity 0.3s ease-out',
                        opacity: isLoaded ? 1 : 0,
                        zIndex: 10,
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(17,24,39,0.85)',
                            backdropFilter: 'blur(8px)',
                            padding: '12px 24px',
                            borderRadius: '9999px',
                            border: '1px solid rgba(55,65,81,0.5)',
                        }}
                    >
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                            {disableMarkerClick
                                ? 'Drag to rotate - Hover over markers to view details'
                                : 'Drag to rotate - Click on a marker to view the data center'}
                        </p>
                    </div>
                </div>
            )}

            {/* Site list panel */}
            {!hideSiteListPanel && (
                <div
                    style={{
                        position: 'absolute',
                        right: '16px',
                        top: hideNavigation ? '140px' : '16px',
                        width: '288px',
                        background: 'rgba(17,24,39,0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(55,65,81,0.5)',
                        borderRadius: '10px',
                        color: 'white',
                        maxHeight: hideNavigation
                            ? 'calc(100vh - 220px)'
                            : 'calc(100vh - 400px)',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'translateX(0)' : 'translateX(16px)',
                        zIndex: 20,
                    }}
                >
                    <div
                        style={{
                            padding: '16px',
                            borderBottom: '1px solid rgba(55,65,81,0.5)',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px',
                                fontWeight: 600,
                            }}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    boxShadow: '0 0 6px #22c55e',
                                }}
                            />
                            Data Centers
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(75,85,99,1)',
                                    color: '#9ca3af',
                                }}
                            >
                                {sites.length}
                            </span>
                        </div>
                        <div style={{ position: 'relative', marginTop: '10px' }}>
                            <Search
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '16px',
                                    height: '16px',
                                    color: '#6b7280',
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(31,41,55,0.5)',
                                    border: '1px solid rgba(55,65,81,0.5)',
                                    borderRadius: '8px',
                                    paddingLeft: '36px',
                                    paddingRight: '12px',
                                    paddingTop: '8px',
                                    paddingBottom: '8px',
                                    fontSize: '14px',
                                    color: 'white',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            padding: '8px',
                            overflowY: 'auto',
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        {filteredSites.map((site) => {
                            const healthStatus = site.healthStatus || 'unknown';
                            const statusColor = HEALTH_COLORS[healthStatus];
                            const isUnhealthy = healthStatus === 'unhealthy';
                            
                            return (
                                <button
                                    key={site.id}
                                    onClick={() => onSiteClick(site)}
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: isUnhealthy 
                                            ? 'rgba(239, 68, 68, 0.08)' 
                                            : 'rgba(31,41,55,0.3)',
                                        border: isUnhealthy 
                                            ? '1px solid rgba(239, 68, 68, 0.5)' 
                                            : '1px solid transparent',
                                        marginBottom: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: isUnhealthy 
                                            ? '0 0 8px rgba(239, 68, 68, 0.4), 0 0 16px rgba(239, 68, 68, 0.2), inset 0 0 8px rgba(239, 68, 68, 0.08)' 
                                            : 'none',
                                        animation: isUnhealthy 
                                            ? 'unhealthyCardPulse 2s ease-in-out infinite' 
                                            : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                            isUnhealthy ? 'rgba(239, 68, 68, 0.12)' : 'rgba(55,65,81,0.5)';
                                        if (!isUnhealthy) {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                                                'rgba(0,170,255,0.3)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                            isUnhealthy ? 'rgba(239, 68, 68, 0.08)' : 'rgba(31,41,55,0.3)';
                                        if (!isUnhealthy) {
                                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                                                'transparent';
                                        }
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: statusColor,
                                                    boxShadow: healthStatus === 'unhealthy' 
                                                        ? `0 0 8px ${statusColor}` 
                                                        : 'none',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    fontWeight: 500,
                                                    fontSize: '14px',
                                                }}
                                            >
                                                {site.name}
                                            </span>
                                        </div>
                                        <ChevronRight
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                color: '#6b7280',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            marginTop: '2px',
                                            marginLeft: '16px',
                                        }}
                                    >
                                        {site.regionName}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '16px',
                                            marginTop: '8px',
                                            marginLeft: '16px',
                                            fontSize: '12px',
                                            color: '#4b5563',
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <HardDrive
                                                style={{ width: '12px', height: '12px' }}
                                            />
                                            {site.rackCount}
                                        </span>
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <Server
                                                style={{ width: '12px', height: '12px' }}
                                            />
                                            {site.deviceCount}
                                        </span>
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <Cpu
                                                style={{ width: '12px', height: '12px' }}
                                            />
                                            {site.gpuCount}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredSites.length === 0 && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '32px',
                                    color: '#6b7280',
                                    fontSize: '14px',
                                }}
                            >
                                No data centers found
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats panel */}
            {!hideStatsPanel && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '32px',
                        left: '16px',
                        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
                        opacity: isLoaded ? 1 : 0,
                        transform: isLoaded ? 'translateY(0)' : 'translateY(8px)',
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div
                            style={{
                                background: 'rgba(17,24,39,0.85)',
                                backdropFilter: 'blur(8px)',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                border: '1px solid rgba(55,65,81,0.5)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: 'white',
                                }}
                            >
                                {sites.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Data Centers
                            </div>
                        </div>
                        <div
                            style={{
                                background: 'rgba(17,24,39,0.85)',
                                backdropFilter: 'blur(8px)',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                border: '1px solid rgba(55,65,81,0.5)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: '#22d3ee',
                                }}
                            >
                                {sites
                                    .reduce((a, s) => a + s.deviceCount, 0)
                                    .toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Total Devices
                            </div>
                        </div>
                        <div
                            style={{
                                background: 'rgba(17,24,39,0.85)',
                                backdropFilter: 'blur(8px)',
                                padding: '10px 18px',
                                borderRadius: '10px',
                                border: '1px solid rgba(55,65,81,0.5)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: '#4ade80',
                                }}
                            >
                                {sites
                                    .reduce((a, s) => a + s.gpuCount, 0)
                                    .toLocaleString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                Total GPUs
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataCenterGlobe;
