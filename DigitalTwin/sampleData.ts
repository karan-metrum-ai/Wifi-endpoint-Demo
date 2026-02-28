/**
 * Sample Data Center Data for Digital Twin Demo
 *
 * This provides mock data for testing the Digital Twin visualization
 * when real API data is not available.
 */

import type { GlobeSite, Location, Rack, Device } from './types';

// Sample devices
const createSampleDevice = (
    id: number,
    name: string,
    rackId: number,
    position: number,
    gpuCount = 0
): Device => ({
    id,
    name,
    status: 'active',
    role: null,
    device_type: gpuCount > 0 ? 'GPU Server' : 'Compute Server',
    manufacturer: ['Dell', 'HP', 'NVIDIA', 'AMD', 'Supermicro'][
        Math.floor(Math.random() * 5)
    ],
    model: `Model-${1000 + Math.floor(Math.random() * 9000)}`,
    serial: `SN-${id}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    asset_tag: `AT-${id}`,
    sku: null,
    site: 'Sample Site',
    site_id: 1,
    location: 'Data Center',
    location_id: 1,
    rack: `Rack-${rackId}`,
    rack_id: rackId,
    position,
    face: null,
    primary_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    primary_ip6: null,
    accelerators: gpuCount > 0 ? 'GPU' : 'CPU Only',
    gpu_count: gpuCount,
    interconnect_type: gpuCount > 0 ? 'InfiniBand' : null,
    cluster_id: `cluster-${Math.floor(Math.random() * 10)}`,
    tenant: 'Default Tenant',
    tenant_id: 1,
    tenant_slug: 'default-tenant',
    connected_devices: [],
    bmc: {
        ip_address: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        type: 'iDRAC',
        username: 'root',
        port: 443,
        vault_secret_path: `secret/bmc/${name}`,
        reachable: true,
    },
    interfaces: [],
    interface_count: 4,
    connection_count: 2,
    tags: ['production'],
    custom_fields: {},
    created: new Date().toISOString(),
    last_updated: new Date().toISOString(),
});

// Sample racks
const createSampleRack = (id: number, name: string, deviceCount: number): Rack => {
    const devices: Device[] = [];
    for (let i = 0; i < deviceCount; i++) {
        const gpuCount = i % 4 === 0 ? 8 : i % 3 === 0 ? 4 : 0;
        devices.push(
            createSampleDevice(
                id * 100 + i,
                `${name}-SRV-${String(i + 1).padStart(2, '0')}`,
                id,
                i + 1,
                gpuCount
            )
        );
    }

    return {
        id,
        name,
        status: 'active',
        role: 'Core Infrastructure',
        u_height: 42,
        serial: `RACK-${id}`,
        site_id: 1,
        location_id: 1,
        tenant: 'Default Tenant',
        tenant_id: 1,
        tenant_slug: 'default-tenant',
        devices,
        device_count: deviceCount,
        total_u_used: deviceCount * 2,
    };
};

// Sample locations
const createSampleLocation = (
    id: number,
    name: string,
    rackCount: number
): Location => {
    const racks: Rack[] = [];
    for (let i = 0; i < rackCount; i++) {
        racks.push(
            createSampleRack(
                id * 10 + i,
                `${name}-R${String(i + 1).padStart(2, '0')}`,
                15
            )
        );
    }

    return {
        id,
        name,
        status: 'active',
        site_id: 1,
        parent_id: null,
        racks,
        devices: [],
        children: [],
        rack_count: rackCount,
        device_count: rackCount * 15,
    };
};

// Sample sites for globe
export const sampleSites: GlobeSite[] = [
    {
        id: 1,
        name: 'HYD-LAB1',
        slug: 'hyd-lab1',
        status: 'active',
        regionName: 'APAC / India / Hyderabad',
        regionSlug: 'hyderabad',
        latitude: 17.4435,
        longitude: 78.3772,
        address: 'Plot 123, HITEC City, Hyderabad, India 500081',
        rackCount: 8,
        deviceCount: 120,
        gpuCount: 48,
        locations: [createSampleLocation(1, 'DC-Room-1', 8)],
    },
    {
        id: 2,
        name: 'DataCenter-US-East-01',
        slug: 'datacenter-us-east-01',
        status: 'active',
        regionName: 'US East',
        regionSlug: 'us-east',
        latitude: 40.7128,
        longitude: -74.006,
        address: '123 Tech Drive, New York, NY 10001',
        rackCount: 12,
        deviceCount: 180,
        gpuCount: 64,
        locations: [createSampleLocation(2, 'Building-East', 12)],
    },
    {
        id: 3,
        name: 'DataCenter-US-West-01',
        slug: 'datacenter-us-west-01',
        status: 'active',
        regionName: 'US West',
        regionSlug: 'us-west',
        latitude: 37.7749,
        longitude: -122.4194,
        address: '456 Cloud Lane, San Francisco, CA 94105',
        rackCount: 10,
        deviceCount: 150,
        gpuCount: 80,
        locations: [createSampleLocation(3, 'Building-West', 10)],
    },
    {
        id: 4,
        name: 'DataCenter-EU-West-01',
        slug: 'datacenter-eu-west-01',
        status: 'active',
        regionName: 'Europe',
        regionSlug: 'europe',
        latitude: 51.5074,
        longitude: -0.1278,
        address: '10 Data Street, London, UK EC2N 4AY',
        rackCount: 6,
        deviceCount: 90,
        gpuCount: 24,
        locations: [createSampleLocation(4, 'Building-London', 6)],
    },
    {
        id: 5,
        name: 'Edge-Site-Austin',
        slug: 'edge-site-austin',
        status: 'active',
        regionName: 'US Central',
        regionSlug: 'us-central',
        latitude: 30.2672,
        longitude: -97.7431,
        address: '789 Innovation Way, Austin, TX 73301',
        rackCount: 4,
        deviceCount: 60,
        gpuCount: 16,
        locations: [createSampleLocation(5, 'Austin-Lab-1', 4)],
    },
    {
        id: 6,
        name: 'DataCenter-Tokyo-01',
        slug: 'datacenter-tokyo-01',
        status: 'active',
        regionName: 'APAC / Japan',
        regionSlug: 'japan',
        latitude: 35.6762,
        longitude: 139.6503,
        address: '1-1 Marunouchi, Chiyoda-ku, Tokyo 100-0005',
        rackCount: 14,
        deviceCount: 210,
        gpuCount: 96,
        locations: [createSampleLocation(6, 'Building-Tokyo', 14)],
    },
    {
        id: 7,
        name: 'DataCenter-Singapore-01',
        slug: 'datacenter-singapore-01',
        status: 'active',
        regionName: 'APAC / Singapore',
        regionSlug: 'singapore',
        latitude: 1.3521,
        longitude: 103.8198,
        address: '1 Changi Business Park, Singapore 486025',
        rackCount: 8,
        deviceCount: 120,
        gpuCount: 40,
        locations: [createSampleLocation(7, 'Building-Singapore', 8)],
    },
    {
        id: 8,
        name: 'DataCenter-Frankfurt-01',
        slug: 'datacenter-frankfurt-01',
        status: 'active',
        regionName: 'Europe / Germany',
        regionSlug: 'germany',
        latitude: 50.1109,
        longitude: 8.6821,
        address: 'Hanauer Landstrasse 123, 60314 Frankfurt',
        rackCount: 10,
        deviceCount: 150,
        gpuCount: 56,
        locations: [createSampleLocation(8, 'Building-Frankfurt', 10)],
    },
];

export default sampleSites;

