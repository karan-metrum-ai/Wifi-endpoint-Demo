/**
 * Data Center Digital Twin Type Definitions
 *
 * These types support the multi-level data center visualization:
 * Globe -> Site -> Building -> Floor -> Rack -> Device
 */

// BMC (Baseboard Management Controller) information
export interface BMC {
    ip_address: string;
    type: string;
    username: string;
    port: number;
    vault_secret_path: string;
    reachable: boolean | null;
}

// Device interface (network ports)
export interface DeviceInterface {
    id: number;
    name: string;
    type: string;
    mac_address?: string;
    enabled: boolean;
}

// Full device from API
export interface Device {
    id: number;
    name: string;
    status: string;
    role: string | null;
    device_type: string;
    manufacturer: string;
    model: string;
    serial: string;
    asset_tag: string;
    sku: string | null;
    site: string;
    site_id: number;
    location: string;
    location_id: number;
    rack: string;
    rack_id: number;
    position: number;
    face: string | null;
    primary_ip: string | null;
    primary_ip6: string | null;
    accelerators: string;
    gpu_count: number;
    interconnect_type: string | null;
    cluster_id: string;
    tenant: string;
    tenant_id: number;
    tenant_slug: string;
    connected_devices: string[];
    bmc: BMC;
    interfaces: DeviceInterface[];
    interface_count: number;
    connection_count: number;
    tags: string[];
    custom_fields: Record<string, unknown>;
    created: string;
    last_updated: string;
}

// Rack from API
export interface Rack {
    id: number;
    name: string;
    status: string;
    role: string;
    u_height: number;
    serial: string;
    site_id: number;
    location_id: number;
    tenant: string | null;
    tenant_id: number | null;
    tenant_slug: string | null;
    devices: Device[];
    device_count: number;
    total_u_used: number;
}

// Location (hierarchical - can contain child locations)
export interface Location {
    id: number;
    name: string;
    status: string;
    site_id: number;
    parent_id: number | null;
    racks: Rack[];
    devices: Device[];
    children: Location[];
    rack_count: number;
    device_count: number;
}

// Site (data center building)
export interface Site {
    id: number;
    name: string;
    slug: string;
    status: string;
    region_id: number;
    latitude: number;
    longitude: number;
    physical_address: string;
    locations: Location[];
    racks: Rack[];
    devices: Device[];
    location_count: number;
    rack_count: number;
    device_count: number;
}

// Region (geographical grouping)
export interface Region {
    id: number;
    name: string;
    slug: string;
    description: string;
    parent_id: number | null;
    sites: Site[];
    children: Region[];
    site_count: number;
    device_count: number;
}

// Summary statistics
export interface DataCenterSummary {
    regions: number;
    sites: number;
    locations: number;
    racks: number;
    devices: number;
    interfaces: number;
    connections: number;
    clusters: number;
    total_gpus: number;
    devices_by_role: Record<string, number>;
    devices_by_manufacturer: Record<string, number>;
    devices_by_accelerator: Record<string, number>;
    connections_by_type: Record<string, number>;
}

// Full API response
export interface DataCenterAPIResponse {
    summary: DataCenterSummary;
    regions: Region[];
}

// Health status for sites (from live cluster data)
export type SiteHealthStatus = 'healthy' | 'unhealthy' | 'warning' | 'unknown';

// Flattened site for globe markers
export interface GlobeSite {
    id: number;
    name: string;
    slug: string;
    status: string;
    regionName: string;
    regionSlug: string;
    latitude: number;
    longitude: number;
    address: string;
    rackCount: number;
    deviceCount: number;
    gpuCount: number;
    locations: Location[];
    healthStatus?: SiteHealthStatus;
    issueSummary?: string | null;
    affectedDevice?: string | null;
}

// 3D Device representation (for Three.js scene)
export interface Device3D {
    device_id: string;
    hostname: string;
    ip_address: string;
    device_type: string;
    status: 'online' | 'offline' | 'degraded';
    temperature?: number;
    power_consumption?: number;
    rack_position: string;
    u_position: number;
    height_u?: number;
    health_status?: 'ok' | 'warning' | 'critical' | 'unknown';
    manufacturer?: string;
    model?: string;
    firmware_version?: string;
    management_interface?: string;
    protocols_found?: string[];
    ports_count?: number;
    bmc_ip?: string;
    bmc_type?: string;
    bmc_username?: string;
    accelerators?: string;
    gpu_count?: number;
    cluster_id?: string;
    tenant?: string;
    tags?: string[];
    serial?: string;
    asset_tag?: string;
}

// 3D Rack representation (for Three.js scene)
export interface Rack3D {
    rack_id: string;
    rack_name: string;
    rack_color?: string;
    row_name: string;
    devices: Device3D[];
    position: [number, number, number];
    rotation?: [number, number, number];
    u_height?: number;
}

// Device data for info card display
export interface DeviceData {
    device_id: string;
    hostname: string;
    ip_address: string;
    device_type: string;
    status: 'online' | 'offline' | 'degraded';
    manufacturer: string;
    model: string;
    firmware_version?: string;
    location?: string;
    rack_position: string;
    power_consumption?: number;
    temperature?: number;
    health_status?: 'ok' | 'warning' | 'critical' | 'unknown';
    management_interface?: string;
    protocols_found?: string[];
    ports_count?: number;
    bmc_ip?: string;
    bmc_type?: string;
    bmc_username?: string;
    accelerators?: string;
    gpu_count?: number;
    cluster_id?: string;
    tenant?: string;
    tags?: string[];
    serial?: string;
    asset_tag?: string;
}

// View modes for the digital twin
export type ViewMode = 'globe' | 'exterior';

// Transition states for view changes
export type TransitionState = 'idle' | 'zooming-in' | 'zooming-out' | 'loading';

