/**
 * APSSwitchVendor Component
 *
 * APS Networks 50-port switch with dual vendor port configuration:
 *
 *  LEFT ZONE  — 25× Cisco Meraki SFP+ ports  (cyan / blue scheme)
 *  RIGHT ZONE — 25× Huawei SFP+ ports         (red scheme)
 *  CENTER     — Prominent vendor demarcation divider
 *
 * Layout: 13 columns × 2 rows per vendor (13 top + 12 bottom = 25)
 * Ports are paired: column c holds port (2c+1) top and (2c+2) bottom.
 *
 * Interactive: hover shows port tooltip, click fires onPortClick callback.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';

// ── Chassis ───────────────────────────────────────────────────────
const W = 1.20;   // width  (~wide 2U switch)
const H = 0.18;   // height (2U)
const D = 0.44;   // depth

// ── Port grid constants ───────────────────────────────────────────
const COL_STEP   = 0.034;   // column pitch
const PORT_SZ    = 0.026;   // housing square side
const MERAKI_C0  = -0.520;  // col-0 centre-x for Meraki
const HUAWEI_C0  =  0.030;  // col-0 centre-x for Huawei
const ROW_TOP    =  H / 4 + 0.006;   //  ≈ +0.051
const ROW_BOT    = -(H / 4 + 0.006); //  ≈ -0.051

// ── Derived layout values ────────────────────────────────────────
const MERAKI_BG_CX = MERAKI_C0 + 6 * COL_STEP;            // ≈ -0.316
const HUAWEI_BG_CX = HUAWEI_C0 + 6 * COL_STEP;            // ≈ +0.234
const SECTION_BG_W = 12 * COL_STEP + PORT_SZ + 0.04;      // ≈  0.474
const DIV_CX       = (MERAKI_C0 + 12 * COL_STEP + HUAWEI_C0) / 2; // ≈ -0.041

// ── Management area absolute x positions ─────────────────────────
const MX       = 0.478;
const CTRL_X   = MX + 0.017;   // CTRL 1/2 column centre
const CON_X    = MX + 0.057;   // CONSOLE/USB column centre
const LED_X    = W / 2 - 0.036;// status LED column

// ── Active-port sets (20/25 per vendor) ──────────────────────────
const MERAKI_ACTIVE = new Set([1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,19,20,21,22,23]);
const HUAWEI_ACTIVE = new Set([1,2,3,4,6,7,8,9,10,12,13,14,15,17,18,19,20,22,23,24]);

// ── Vendor colour palettes ────────────────────────────────────────
const M = {  // Meraki
    section:    '#010c17',
    topStripe:  '#0077a8',
    port:       '#0c1c2e',
    cavity:     '#020810',
    ledOn:      '#00bceb',
    ledOnEmit:  '#008aaa',
    ledOff:     '#021e2a',
    label:      '#00d4ff',
    accent:     '#0077a8',
};
const H2 = {  // Huawei (renamed to avoid clash with chassis const H)
    section:   '#170106',
    topStripe: '#aa1122',
    port:      '#2e0a10',
    cavity:    '#0a0205',
    ledOn:     '#ff3344',
    ledOnEmit: '#cc1122',
    ledOff:    '#330011',
    label:     '#ff5566',
    accent:    '#aa1122',
};

// ── Port info passed to parent ────────────────────────────────────
export interface PortInfo {
    vendor:        'meraki' | 'huawei';
    portNum:       number;   // 1-25 within vendor
    globalPortNum: number;   // 1-25 Meraki, 26-50 Huawei
    active:        boolean;
}

export interface APSSwitchVendorProps {
    position?:    [number, number, number];
    rotation?:    [number, number, number];
    onPortClick?: (info: PortInfo) => void;
}

// ─────────────────────────────────────────────────────────────────
export function APSSwitchVendor({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    onPortClick,
}: APSSwitchVendorProps) {

    const [hoveredPort, setHoveredPort] = useState<PortInfo | null>(null);

    // ── Materials ────────────────────────────────────────────────
    const mats = useMemo(() => ({
        chassis:     new THREE.MeshStandardMaterial({ color: '#1c1c20', metalness: 0.75, roughness: 0.25 }),
        frontFace:   new THREE.MeshStandardMaterial({ color: '#232328', metalness: 0.5, roughness: 0.5 }),

        merakiBg:    new THREE.MeshStandardMaterial({ color: M.section }),
        merakiStripe:new THREE.MeshStandardMaterial({ color: M.topStripe, emissive: '#003355', emissiveIntensity: 0.6 }),
        merakiPort:  new THREE.MeshStandardMaterial({ color: M.port, metalness: 0.4, roughness: 0.7 }),
        merakiCav:   new THREE.MeshStandardMaterial({ color: M.cavity }),
        merakiOn:    new THREE.MeshStandardMaterial({ color: M.ledOn, emissive: M.ledOnEmit, emissiveIntensity: 2.5 }),
        merakiOff:   new THREE.MeshStandardMaterial({ color: M.ledOff }),

        huaweiBg:    new THREE.MeshStandardMaterial({ color: H2.section }),
        huaweiStripe:new THREE.MeshStandardMaterial({ color: H2.topStripe, emissive: '#550011', emissiveIntensity: 0.6 }),
        huaweiPort:  new THREE.MeshStandardMaterial({ color: H2.port, metalness: 0.4, roughness: 0.7 }),
        huaweiCav:   new THREE.MeshStandardMaterial({ color: H2.cavity }),
        huaweiOn:    new THREE.MeshStandardMaterial({ color: H2.ledOn, emissive: H2.ledOnEmit, emissiveIntensity: 2.5 }),
        huaweiOff:   new THREE.MeshStandardMaterial({ color: H2.ledOff }),

        divPlate:    new THREE.MeshStandardMaterial({ color: '#55556a', metalness: 0.85, roughness: 0.15 }),
        divLeft:     new THREE.MeshStandardMaterial({ color: M.accent, emissive: '#003355', emissiveIntensity: 0.9 }),
        divRight:    new THREE.MeshStandardMaterial({ color: H2.accent, emissive: '#550011', emissiveIntensity: 0.9 }),

        orange:      new THREE.MeshStandardMaterial({ color: '#cc3300', emissive: '#661100', emissiveIntensity: 0.4 }),
        vent:        new THREE.MeshStandardMaterial({ color: '#0d0d11', metalness: 0.3, roughness: 0.8 }),
        screw:       new THREE.MeshStandardMaterial({ color: '#555560', metalness: 0.9, roughness: 0.2 }),
        rj45:        new THREE.MeshStandardMaterial({ color: '#333340', metalness: 0.3, roughness: 0.7 }),
        rj45Cav:     new THREE.MeshStandardMaterial({ color: '#111118' }),
        usbBlue:     new THREE.MeshStandardMaterial({ color: '#1144cc', emissive: '#0033aa', emissiveIntensity: 1.0 }),
        ledGreenOn:  new THREE.MeshStandardMaterial({ color: '#00ff55', emissive: '#00cc44', emissiveIntensity: 2.5 }),
        ledGreenOff: new THREE.MeshStandardMaterial({ color: '#003311' }),
        topLogo:     new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: 0.7, roughness: 0.3 }),
    }), []);

    // ── Port data ────────────────────────────────────────────────
    const portData = useMemo(() => {
        const buildPorts = (
            vendor: 'meraki' | 'huawei',
            c0: number,
            activeSet: Set<number>,
            globalOffset: number
        ) =>
            Array.from({ length: 25 }, (_, i) => {
                const portNum = i + 1;
                const col = Math.floor((portNum - 1) / 2);
                const isTop = (portNum - 1) % 2 === 0;
                return {
                    vendor,
                    portNum,
                    globalPortNum: portNum + globalOffset,
                    x: c0 + col * COL_STEP,
                    y: isTop ? ROW_TOP : ROW_BOT,
                    active: activeSet.has(portNum),
                };
            });

        return {
            meraki: buildPorts('meraki', MERAKI_C0, MERAKI_ACTIVE, 0),
            huawei: buildPorts('huawei', HUAWEI_C0, HUAWEI_ACTIVE, 25),
        };
    }, []);

    // ── Port renderer ────────────────────────────────────────────
    const renderPort = (port: typeof portData.meraki[0]) => {
        const isMeraki = port.vendor === 'meraki';
        const housing  = isMeraki ? mats.merakiPort  : mats.huaweiPort;
        const cavity   = isMeraki ? mats.merakiCav   : mats.huaweiCav;
        const ledMat   = port.active
            ? (isMeraki ? mats.merakiOn : mats.huaweiOn)
            : (isMeraki ? mats.merakiOff : mats.huaweiOff);
        const isHov    = hoveredPort?.vendor === port.vendor && hoveredPort?.portNum === port.portNum;
        const glowCol  = isMeraki ? '#00bceb' : '#ff3344';

        const info: PortInfo = { vendor: port.vendor, portNum: port.portNum, globalPortNum: port.globalPortNum, active: port.active };

        return (
            <group
                key={`${port.vendor}-p${port.portNum}`}
                position={[port.x, port.y, D / 2 + 0.005]}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredPort(info); }}
                onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; setHoveredPort(null); }}
                onClick={(e) => { e.stopPropagation(); onPortClick?.(info); }}
            >
                {/* Port housing */}
                <mesh material={housing}>
                    <boxGeometry args={[PORT_SZ + 0.002, PORT_SZ + 0.002, 0.012]} />
                </mesh>
                {/* Port cavity / recess */}
                <mesh position={[0, 0, 0.001]} material={cavity}>
                    <boxGeometry args={[PORT_SZ - 0.004, PORT_SZ - 0.004, 0.008]} />
                </mesh>
                {/* Left LED */}
                <mesh position={[-0.007, PORT_SZ / 2 + 0.005, 0.003]} material={ledMat}>
                    <boxGeometry args={[0.006, 0.004, 0.002]} />
                </mesh>
                {/* Right LED */}
                <mesh position={[0.007, PORT_SZ / 2 + 0.005, 0.003]} material={ledMat}>
                    <boxGeometry args={[0.006, 0.004, 0.002]} />
                </mesh>
                {/* Hover selection glow */}
                {isHov && (
                    <mesh>
                        <boxGeometry args={[PORT_SZ + 0.012, PORT_SZ + 0.012, 0.018]} />
                        <meshBasicMaterial color={glowCol} transparent opacity={0.22} depthWrite={false} />
                    </mesh>
                )}
                {/* Hover tooltip */}
                {isHov && (
                    <Html position={[0, PORT_SZ + 0.028, 0.01]} center zIndexRange={[200, 0]}>
                        <div style={{
                            background: 'rgba(4,4,12,0.96)',
                            color: glowCol,
                            padding: '5px 9px',
                            borderRadius: '5px',
                            fontSize: '9px',
                            fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'nowrap',
                            border: `1px solid ${glowCol}55`,
                            pointerEvents: 'none',
                            lineHeight: 1.6,
                        }}>
                            <strong>{isMeraki ? '⬛ CISCO MERAKI' : '🔴 HUAWEI'}</strong>
                            <br />Port {port.globalPortNum} &nbsp;·&nbsp; {port.active ? '● Active' : '○ Inactive'}
                            <br />SFP+ &nbsp;·&nbsp; 25GbE
                        </div>
                    </Html>
                )}
            </group>
        );
    };

    return (
        <group position={position} rotation={rotation}>

            {/* ── CHASSIS ─────────────────────────────────────── */}
            <mesh castShadow receiveShadow material={mats.chassis}>
                <boxGeometry args={[W, H, D]} />
            </mesh>
            {/* Front face overlay */}
            <mesh position={[0, 0, D / 2 + 0.001]} material={mats.frontFace}>
                <boxGeometry args={[W, H, 0.001]} />
            </mesh>

            {/* ── ORANGE INDICATOR STRIP (far left) ───────────── */}
            <mesh position={[-W / 2 + 0.008, 0, D / 2 + 0.003]} material={mats.orange}>
                <boxGeometry args={[0.013, H - 0.012, 0.005]} />
            </mesh>

            {/* ── LEFT VENT SLOTS ─────────────────────────────── */}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={`lv-${i}`}
                    position={[-W / 2 + 0.030, -H / 2 + 0.016 + i * 0.020, D / 2 + 0.003]}
                    material={mats.vent}>
                    <boxGeometry args={[0.012, 0.013, 0.005]} />
                </mesh>
            ))}

            {/* ── MERAKI SECTION BACKGROUND ───────────────────── */}
            <mesh position={[MERAKI_BG_CX, 0, D / 2 + 0.001]} material={mats.merakiBg}>
                <boxGeometry args={[SECTION_BG_W, H - 0.006, 0.002]} />
            </mesh>
            {/* Meraki top colour stripe */}
            <mesh position={[MERAKI_BG_CX, H / 2 - 0.007, D / 2 + 0.002]} material={mats.merakiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.009, 0.003]} />
            </mesh>
            {/* Meraki bottom stripe */}
            <mesh position={[MERAKI_BG_CX, -H / 2 + 0.007, D / 2 + 0.002]} material={mats.merakiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.006, 0.003]} />
            </mesh>

            {/* ── HUAWEI SECTION BACKGROUND ───────────────────── */}
            <mesh position={[HUAWEI_BG_CX, 0, D / 2 + 0.001]} material={mats.huaweiBg}>
                <boxGeometry args={[SECTION_BG_W, H - 0.006, 0.002]} />
            </mesh>
            {/* Huawei top colour stripe */}
            <mesh position={[HUAWEI_BG_CX, H / 2 - 0.007, D / 2 + 0.002]} material={mats.huaweiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.009, 0.003]} />
            </mesh>
            {/* Huawei bottom stripe */}
            <mesh position={[HUAWEI_BG_CX, -H / 2 + 0.007, D / 2 + 0.002]} material={mats.huaweiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.006, 0.003]} />
            </mesh>

            {/* ── VENDOR NAME LABELS ──────────────────────────── */}
            <Text position={[MERAKI_BG_CX, H / 2 - 0.022, D / 2 + 0.004]}
                fontSize={0.014} color={M.label} anchorX="center" anchorY="middle" letterSpacing={0.08}>
                CISCO MERAKI
            </Text>
            <Text position={[HUAWEI_BG_CX, H / 2 - 0.022, D / 2 + 0.004]}
                fontSize={0.014} color={H2.label} anchorX="center" anchorY="middle" letterSpacing={0.08}>
                HUAWEI
            </Text>

            {/* Port count sub-labels */}
            <Text position={[MERAKI_BG_CX, -H / 2 + 0.018, D / 2 + 0.003]}
                fontSize={0.009} color="#005577" anchorX="center" anchorY="middle">
                25 PORTS  ·  1 — 25
            </Text>
            <Text position={[HUAWEI_BG_CX, -H / 2 + 0.018, D / 2 + 0.003]}
                fontSize={0.009} color="#771122" anchorX="center" anchorY="middle">
                25 PORTS  ·  26 — 50
            </Text>

            {/* ── MERAKI PORTS (25 × SFP+) ────────────────────── */}
            {portData.meraki.map(renderPort)}

            {/* ── HUAWEI PORTS (25 × SFP+) ────────────────────── */}
            {portData.huawei.map(renderPort)}

            {/* ── AMBIENT GLOW from port LEDs ─────────────────── */}
            <pointLight position={[MERAKI_BG_CX, 0, D / 2 + 0.15]}
                color="#00bceb" intensity={0.35} distance={1.0} />
            <pointLight position={[HUAWEI_BG_CX, 0, D / 2 + 0.15]}
                color="#ff3344" intensity={0.35} distance={1.0} />

            {/* ── VENDOR DEMARCATION DIVIDER ──────────────────── */}
            {/* Main chrome plate */}
            <mesh position={[DIV_CX, 0, D / 2 + 0.007]} material={mats.divPlate}>
                <boxGeometry args={[0.055, H - 0.010, 0.013]} />
            </mesh>
            {/* Left (Meraki) accent bar */}
            <mesh position={[DIV_CX - 0.016, 0, D / 2 + 0.015]} material={mats.divLeft}>
                <boxGeometry args={[0.004, H - 0.014, 0.004]} />
            </mesh>
            {/* Right (Huawei) accent bar */}
            <mesh position={[DIV_CX + 0.016, 0, D / 2 + 0.015]} material={mats.divRight}>
                <boxGeometry args={[0.004, H - 0.014, 0.004]} />
            </mesh>
            {/* "DEMARCATION" label (rotated 90° so it reads bottom-to-top) */}
            <Text
                position={[DIV_CX, 0, D / 2 + 0.016]}
                rotation={[0, 0, Math.PI / 2]}
                fontSize={0.009}
                color="#aaaacc"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.06}
            >
                VENDOR DEMARCATION
            </Text>

            {/* ── MANAGEMENT PORTS ────────────────────────────── */}
            {/* CTRL 1 */}
            <group position={[CTRL_X, ROW_TOP, D / 2 + 0.007]}>
                <mesh material={mats.rj45}><boxGeometry args={[0.034, 0.028, 0.012]} /></mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Cav}><boxGeometry args={[0.028, 0.018, 0.006]} /></mesh>
            </group>
            {/* CTRL 2 */}
            <group position={[CTRL_X, ROW_BOT, D / 2 + 0.007]}>
                <mesh material={mats.rj45}><boxGeometry args={[0.034, 0.028, 0.012]} /></mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Cav}><boxGeometry args={[0.028, 0.018, 0.006]} /></mesh>
            </group>
            {/* CONSOLE */}
            <group position={[CON_X, ROW_TOP, D / 2 + 0.007]}>
                <mesh material={mats.rj45}><boxGeometry args={[0.034, 0.028, 0.012]} /></mesh>
                <mesh position={[0, 0.002, 0.004]} material={mats.rj45Cav}><boxGeometry args={[0.028, 0.018, 0.006]} /></mesh>
            </group>
            {/* USB-A (blue) */}
            <group position={[CON_X, ROW_BOT + 0.010, D / 2 + 0.008]}>
                <mesh material={mats.rj45}><boxGeometry args={[0.022, 0.018, 0.013]} /></mesh>
                <mesh position={[0, 0, 0.004]} material={mats.usbBlue}><boxGeometry args={[0.014, 0.009, 0.006]} /></mesh>
            </group>

            {/* CTRL / CONSOLE labels */}
            <Text position={[CTRL_X, 0, D / 2 + 0.014]} fontSize={0.008} color="#555566" anchorX="center" anchorY="middle">
                CTRL
            </Text>
            <Text position={[CON_X, 0, D / 2 + 0.014]} fontSize={0.008} color="#555566" anchorX="center" anchorY="middle">
                CON
            </Text>

            {/* ── STATUS LEDs ─────────────────────────────────── */}
            {[
                { y: H / 2 - 0.024, mat: mats.ledGreenOn,  label: 'SYS' },
                { y: H / 2 - 0.044, mat: mats.ledGreenOff, label: 'MGT' },
                { y: H / 2 - 0.064, mat: mats.ledGreenOn,  label: 'FAN' },
                { y: H / 2 - 0.084, mat: mats.ledGreenOn,  label: 'PWR' },
            ].map(({ y, mat, label }) => (
                <mesh key={label} position={[LED_X, y, D / 2 + 0.005]} material={mat}>
                    <boxGeometry args={[0.007, 0.007, 0.003]} />
                </mesh>
            ))}

            {/* RESET button */}
            <mesh position={[W / 2 - 0.020, -H / 2 + 0.022, D / 2 + 0.006]}
                rotation={[Math.PI / 2, 0, 0]} material={mats.rj45}>
                <cylinderGeometry args={[0.004, 0.004, 0.008, 8]} />
            </mesh>

            {/* ── RIGHT VENTILATION GRILLE ────────────────────── */}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={`rv-${i}`}
                    position={[W / 2 - 0.024, 0, D / 2 - 0.028 - i * 0.054]}
                    material={mats.vent}>
                    <boxGeometry args={[0.004, H - 0.012, 0.040]} />
                </mesh>
            ))}

            {/* ── TOP SURFACE ─────────────────────────────────── */}
            {/* APS logo marks (3× X shapes) */}
            {[-0.30, -0.18, -0.06].map((xOff, i) => (
                <group key={`lm-${i}`} position={[xOff, H / 2 + 0.0005, -0.06]}>
                    <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.034, 0.004, 0.005]} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.034, 0.004, 0.005]} />
                    </mesh>
                </group>
            ))}
            {/* "APS Networks" on top */}
            <Text position={[0.22, H / 2 + 0.002, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.020} color="#888899" anchorX="center" anchorY="middle" letterSpacing={0.06}>
                APS Networks
            </Text>
            {/* Model label */}
            <Text position={[0.22, H / 2 + 0.002, 0.10]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.010} color="#555566" anchorX="center" anchorY="middle">
                AS7726-50X  ·  50×25GbE
            </Text>

            {/* ── CORNER SCREWS ───────────────────────────────── */}
            {[
                [-W / 2 + 0.020,  H / 2 - 0.013],
                [-W / 2 + 0.020, -H / 2 + 0.013],
                [ W / 2 - 0.020,  H / 2 - 0.013],
                [ W / 2 - 0.020, -H / 2 + 0.013],
            ].map(([sx, sy], i) => (
                <mesh key={`sc-${i}`}
                    position={[sx, sy, D / 2 + 0.005]}
                    rotation={[Math.PI / 2, 0, 0]}
                    material={mats.screw}>
                    <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
                </mesh>
            ))}

            {/* "APS Networks" on front panel right */}
            <Text position={[W / 2 - 0.105, -H / 2 + 0.026, D / 2 + 0.005]}
                fontSize={0.012} color="#999aaa" anchorX="center" anchorY="middle" letterSpacing={0.07}>
                APS Networks
            </Text>

        </group>
    );
}

export default APSSwitchVendor;
