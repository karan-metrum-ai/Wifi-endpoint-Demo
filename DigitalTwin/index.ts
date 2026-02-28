/**
 * Digital Twin Components
 *
 * Complete data center visualization system with:
 * - Interactive 3D globe view
 * - Building exterior view
 * - Data center interior view
 * - Server rack visualization
 * - Network cable infrastructure
 */

// Main page component
export { default as DataCenterDigitalTwin } from './DataCenterDigitalTwin';

// Core scene components
export { default as DataCenterScene } from './DataCenterScene';
export { default as DataCenterSceneReal } from './DataCenterSceneReal';
export { default as DataCenterEnvironment } from './DataCenterEnvironment';
export { default as DataCenterFloor } from './DataCenterFloor';
export { default as DataCenterGlobe } from './DataCenterGlobe';

// Infrastructure components
export { default as ServerRack } from './ServerRack';
export { default as NetworkCables } from './NetworkCables';
export { default as BuildingExterior } from './BuildingExterior';

// UI components
export { default as RackInfoCard } from './RackInfoCard';
export { default as SceneMonitor } from './SceneMonitor';

// Types
export type {
    // API types
    BMC,
    DeviceInterface,
    Device,
    Rack,
    Location,
    Site,
    Region,
    DataCenterSummary,
    DataCenterAPIResponse,
    GlobeSite,
    SiteHealthStatus,
    // 3D types
    Device3D,
    Rack3D,
    DeviceData,
    // View types
    ViewMode,
    TransitionState,
} from './types';

// Legacy exports for backwards compatibility
export type { DeviceData as DeviceDataFromScene } from './RackInfoCard';
