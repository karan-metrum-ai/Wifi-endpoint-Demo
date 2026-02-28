/**
 * APSSwitchVendor
 *
 * APS Networks 50-port switch with dual-vendor port sections:
 *   LEFT  ZONE — 25× Cisco Meraki SFP+  (cyan / navy)
 *   RIGHT ZONE — 25× Huawei SFP+         (red / maroon)
 *   CENTER     — prominent vendor demarcation divider
 *
 * Port layout per vendor: 13 columns × 2 rows
 *   col c → top port  = 2c+1,  bottom port = 2c+2   (max 25)
 *
 * Hover shows tooltip. Click fires onPortClick.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';

// ── Chassis ───────────────────────────────────────────────────────
const W = 1.20;
const H = 0.18;
const D = 0.44;

// ── Port grid ────────────────────────────────────────────────────
const COL_STEP  = 0.034;
const PORT_SZ   = 0.026;
const MERAKI_C0 = -0.520;
const HUAWEI_C0 =  0.030;
const ROW_TOP   =  H / 4 + 0.006;
const ROW_BOT   = -(H / 4 + 0.006);

// ── Derived layout ────────────────────────────────────────────────
const MERAKI_BG_CX  = MERAKI_C0 + 6 * COL_STEP;
const HUAWEI_BG_CX  = HUAWEI_C0 + 6 * COL_STEP;
const SECTION_BG_W  = 12 * COL_STEP + PORT_SZ + 0.04;
const DIV_CX        = (MERAKI_C0 + 12 * COL_STEP + HUAWEI_C0) / 2;

// ── Management x positions ────────────────────────────────────────
const CTRL_X = 0.495;
const CON_X  = 0.535;
const LED_X  = W / 2 - 0.036;

// ── Active ports (20 / 25 per vendor) ────────────────────────────
const MERAKI_ACTIVE = new Set([1,2,3,4,5,7,8,9,10,11,12,14,15,16,17,19,20,21,22,23]);
const HUAWEI_ACTIVE = new Set([1,2,3,4,6,7,8,9,10,12,13,14,15,17,18,19,20,22,23,24]);

export const MERAKI_ACTIVE_COUNT = MERAKI_ACTIVE.size;
export const HUAWEI_ACTIVE_COUNT = HUAWEI_ACTIVE.size;

export interface PortInfo {
    vendor:        'meraki' | 'huawei';
    portNum:       number;
    globalPortNum: number;
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

    const mats = useMemo(() => ({
        chassis:      new THREE.MeshStandardMaterial({ color: '#1c1c20', metalness: 0.75, roughness: 0.25 }),
        frontFace:    new THREE.MeshStandardMaterial({ color: '#232328', metalness: 0.5, roughness: 0.5 }),

        merakiBg:     new THREE.MeshStandardMaterial({ color: '#010c17' }),
        merakiStripe: new THREE.MeshStandardMaterial({ color: '#0077a8', emissive: '#003355', emissiveIntensity: 0.6 }),
        merakiPort:   new THREE.MeshStandardMaterial({ color: '#0c1c2e', metalness: 0.4, roughness: 0.7 }),
        merakiCav:    new THREE.MeshStandardMaterial({ color: '#020810' }),
        merakiOn:     new THREE.MeshStandardMaterial({ color: '#00bceb', emissive: '#008aaa', emissiveIntensity: 2.5 }),
        merakiOff:    new THREE.MeshStandardMaterial({ color: '#021e2a' }),

        huaweiBg:     new THREE.MeshStandardMaterial({ color: '#170106' }),
        huaweiStripe: new THREE.MeshStandardMaterial({ color: '#aa1122', emissive: '#550011', emissiveIntensity: 0.6 }),
        huaweiPort:   new THREE.MeshStandardMaterial({ color: '#2e0a10', metalness: 0.4, roughness: 0.7 }),
        huaweiCav:    new THREE.MeshStandardMaterial({ color: '#0a0205' }),
        huaweiOn:     new THREE.MeshStandardMaterial({ color: '#ff3344', emissive: '#cc1122', emissiveIntensity: 2.5 }),
        huaweiOff:    new THREE.MeshStandardMaterial({ color: '#330011' }),

        divPlate:     new THREE.MeshStandardMaterial({ color: '#55556a', metalness: 0.85, roughness: 0.15 }),
        divLeft:      new THREE.MeshStandardMaterial({ color: '#0077a8', emissive: '#003355', emissiveIntensity: 0.9 }),
        divRight:     new THREE.MeshStandardMaterial({ color: '#aa1122', emissive: '#550011', emissiveIntensity: 0.9 }),

        orange:       new THREE.MeshStandardMaterial({ color: '#cc3300', emissive: '#661100', emissiveIntensity: 0.4 }),
        vent:         new THREE.MeshStandardMaterial({ color: '#0d0d11', metalness: 0.3, roughness: 0.8 }),
        screw:        new THREE.MeshStandardMaterial({ color: '#555560', metalness: 0.9, roughness: 0.2 }),
        rj45:         new THREE.MeshStandardMaterial({ color: '#333340', metalness: 0.3, roughness: 0.7 }),
        rj45Cav:      new THREE.MeshStandardMaterial({ color: '#111118' }),
        usbBlue:      new THREE.MeshStandardMaterial({ color: '#1144cc', emissive: '#0033aa', emissiveIntensity: 1.0 }),
        ledOn:        new THREE.MeshStandardMaterial({ color: '#00ff55', emissive: '#00cc44', emissiveIntensity: 2.5 }),
        ledOff:       new THREE.MeshStandardMaterial({ color: '#003311' }),
        topLogo:      new THREE.MeshStandardMaterial({ color: '#2a2a30', metalness: 0.7, roughness: 0.3 }),
    }), []);

    const portData = useMemo(() => {
        const build = (
            vendor: 'meraki' | 'huawei',
            c0: number,
            active: Set<number>,
            offset: number
        ) => Array.from({ length: 25 }, (_, i) => {
            const n   = i + 1;
            const col = Math.floor((n - 1) / 2);
            const top = (n - 1) % 2 === 0;
            return { vendor, portNum: n, globalPortNum: n + offset,
                     x: c0 + col * COL_STEP, y: top ? ROW_TOP : ROW_BOT,
                     active: active.has(n) };
        });
        return {
            meraki: build('meraki', MERAKI_C0, MERAKI_ACTIVE, 0),
            huawei: build('huawei', HUAWEI_C0, HUAWEI_ACTIVE, 25),
        };
    }, []);

    const renderPort = (port: typeof portData.meraki[0]) => {
        const isMeraki = port.vendor === 'meraki';
        const housing  = isMeraki ? mats.merakiPort : mats.huaweiPort;
        const cavity   = isMeraki ? mats.merakiCav  : mats.huaweiCav;
        const led      = port.active ? (isMeraki ? mats.merakiOn : mats.huaweiOn)
                                     : (isMeraki ? mats.merakiOff : mats.huaweiOff);
        const isHov    = hoveredPort?.vendor === port.vendor && hoveredPort?.portNum === port.portNum;
        const glow     = isMeraki ? '#00bceb' : '#ff3344';
        const info: PortInfo = { vendor: port.vendor, portNum: port.portNum,
                                  globalPortNum: port.globalPortNum, active: port.active };

        return (
            <group
                key={`${port.vendor}-${port.portNum}`}
                position={[port.x, port.y, D / 2 + 0.005]}
                onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; setHoveredPort(info); }}
                onPointerOut={e  => { e.stopPropagation(); document.body.style.cursor = 'default';  setHoveredPort(null); }}
                onClick={e       => { e.stopPropagation(); onPortClick?.(info); }}
            >
                <mesh material={housing}>
                    <boxGeometry args={[PORT_SZ + 0.002, PORT_SZ + 0.002, 0.012]} />
                </mesh>
                <mesh position={[0, 0, 0.001]} material={cavity}>
                    <boxGeometry args={[PORT_SZ - 0.004, PORT_SZ - 0.004, 0.008]} />
                </mesh>
                <mesh position={[-0.007, PORT_SZ / 2 + 0.005, 0.003]} material={led}>
                    <boxGeometry args={[0.006, 0.004, 0.002]} />
                </mesh>
                <mesh position={[ 0.007, PORT_SZ / 2 + 0.005, 0.003]} material={led}>
                    <boxGeometry args={[0.006, 0.004, 0.002]} />
                </mesh>

                {isHov && (
                    <mesh>
                        <boxGeometry args={[PORT_SZ + 0.012, PORT_SZ + 0.012, 0.018]} />
                        <meshBasicMaterial color={glow} transparent opacity={0.22} depthWrite={false} />
                    </mesh>
                )}
                {isHov && (
                    <Html position={[0, PORT_SZ + 0.030, 0.01]} center zIndexRange={[200, 0]}>
                        <div style={{
                            background: 'rgba(4,4,12,0.97)', color: glow,
                            padding: '5px 10px', borderRadius: '5px',
                            fontSize: '10px', fontFamily: 'monospace',
                            whiteSpace: 'nowrap', pointerEvents: 'none',
                            border: `1px solid ${glow}55`, lineHeight: 1.7,
                        }}>
                            <strong>{isMeraki ? '🔵 CISCO MERAKI' : '🔴 HUAWEI'}</strong><br />
                            Port {port.globalPortNum} · {port.active ? '● Active' : '○ Inactive'}<br />
                            SFP+ · 25 GbE
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
            <mesh position={[0, 0, D / 2 + 0.001]} material={mats.frontFace}>
                <boxGeometry args={[W, H, 0.001]} />
            </mesh>

            {/* ── ORANGE STRIP (far left) ─────────────────────── */}
            <mesh position={[-W / 2 + 0.008, 0, D / 2 + 0.003]} material={mats.orange}>
                <boxGeometry args={[0.013, H - 0.012, 0.005]} />
            </mesh>

            {/* ── LEFT VENT ────────────────────────────────────── */}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={`lv-${i}`}
                    position={[-W / 2 + 0.030, -H / 2 + 0.016 + i * 0.020, D / 2 + 0.003]}
                    material={mats.vent}>
                    <boxGeometry args={[0.012, 0.013, 0.005]} />
                </mesh>
            ))}

            {/* ── MERAKI SECTION BG ───────────────────────────── */}
            <mesh position={[MERAKI_BG_CX, 0, D / 2 + 0.001]} material={mats.merakiBg}>
                <boxGeometry args={[SECTION_BG_W, H - 0.006, 0.002]} />
            </mesh>
            <mesh position={[MERAKI_BG_CX, H / 2 - 0.007, D / 2 + 0.002]} material={mats.merakiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.009, 0.003]} />
            </mesh>
            <mesh position={[MERAKI_BG_CX, -H / 2 + 0.007, D / 2 + 0.002]} material={mats.merakiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.006, 0.003]} />
            </mesh>

            {/* ── HUAWEI SECTION BG ───────────────────────────── */}
            <mesh position={[HUAWEI_BG_CX, 0, D / 2 + 0.001]} material={mats.huaweiBg}>
                <boxGeometry args={[SECTION_BG_W, H - 0.006, 0.002]} />
            </mesh>
            <mesh position={[HUAWEI_BG_CX, H / 2 - 0.007, D / 2 + 0.002]} material={mats.huaweiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.009, 0.003]} />
            </mesh>
            <mesh position={[HUAWEI_BG_CX, -H / 2 + 0.007, D / 2 + 0.002]} material={mats.huaweiStripe}>
                <boxGeometry args={[SECTION_BG_W, 0.006, 0.003]} />
            </mesh>

            {/* ── VENDOR LABELS ───────────────────────────────── */}
            <Text position={[MERAKI_BG_CX, H / 2 - 0.022, D / 2 + 0.004]}
                fontSize={0.020} color="#00e8ff" anchorX="center" anchorY="middle" letterSpacing={0.08}
                outlineWidth={0.001} outlineColor="#003355">
                CISCO MERAKI
            </Text>
            <Text position={[HUAWEI_BG_CX, H / 2 - 0.022, D / 2 + 0.004]}
                fontSize={0.020} color="#ff6677" anchorX="center" anchorY="middle" letterSpacing={0.08}
                outlineWidth={0.001} outlineColor="#550011">
                HUAWEI
            </Text>
            <Text position={[MERAKI_BG_CX, -H / 2 + 0.018, D / 2 + 0.003]}
                fontSize={0.013} color="#0077aa" anchorX="center" anchorY="middle">
                25 PORTS  ·  1 — 25
            </Text>
            <Text position={[HUAWEI_BG_CX, -H / 2 + 0.018, D / 2 + 0.003]}
                fontSize={0.013} color="#aa2233" anchorX="center" anchorY="middle">
                25 PORTS  ·  26 — 50
            </Text>

            {/* ── PORTS ───────────────────────────────────────── */}
            {portData.meraki.map(renderPort)}
            {portData.huawei.map(renderPort)}

            {/* ── LED GLOW (ambient point lights) ─────────────── */}
            <pointLight position={[MERAKI_BG_CX, 0, D / 2 + 0.15]} color="#00bceb" intensity={0.35} distance={1.0} />
            <pointLight position={[HUAWEI_BG_CX, 0, D / 2 + 0.15]} color="#ff3344" intensity={0.35} distance={1.0} />

            {/* ── DEMARCATION DIVIDER ──────────────────────────── */}
            <mesh position={[DIV_CX, 0, D / 2 + 0.007]} material={mats.divPlate}>
                <boxGeometry args={[0.055, H - 0.010, 0.013]} />
            </mesh>
            <mesh position={[DIV_CX - 0.016, 0, D / 2 + 0.015]} material={mats.divLeft}>
                <boxGeometry args={[0.004, H - 0.014, 0.004]} />
            </mesh>
            <mesh position={[DIV_CX + 0.016, 0, D / 2 + 0.015]} material={mats.divRight}>
                <boxGeometry args={[0.004, H - 0.014, 0.004]} />
            </mesh>
            <Text position={[DIV_CX, 0, D / 2 + 0.016]}
                rotation={[0, 0, Math.PI / 2]}
                fontSize={0.012} color="#ccccee" anchorX="center" anchorY="middle" letterSpacing={0.06}>
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
            {/* USB-A */}
            <group position={[CON_X, ROW_BOT + 0.010, D / 2 + 0.008]}>
                <mesh material={mats.rj45}><boxGeometry args={[0.022, 0.018, 0.013]} /></mesh>
                <mesh position={[0, 0, 0.004]} material={mats.usbBlue}><boxGeometry args={[0.014, 0.009, 0.006]} /></mesh>
            </group>

            {/* ── STATUS LEDs ──────────────────────────────────── */}
            {(['SYS','MGT','FAN','PWR'] as const).map((lbl, i) => (
                <mesh key={lbl} position={[LED_X, H / 2 - 0.024 - i * 0.020, D / 2 + 0.005]}
                    material={lbl === 'MGT' ? mats.ledOff : mats.ledOn}>
                    <boxGeometry args={[0.007, 0.007, 0.003]} />
                </mesh>
            ))}

            {/* RESET */}
            <mesh position={[W / 2 - 0.020, -H / 2 + 0.022, D / 2 + 0.006]}
                rotation={[Math.PI / 2, 0, 0]} material={mats.rj45}>
                <cylinderGeometry args={[0.004, 0.004, 0.008, 8]} />
            </mesh>

            {/* ── RIGHT VENT ───────────────────────────────────── */}
            {Array.from({ length: 6 }, (_, i) => (
                <mesh key={`rv-${i}`}
                    position={[W / 2 - 0.024, 0, D / 2 - 0.028 - i * 0.054]}
                    material={mats.vent}>
                    <boxGeometry args={[0.004, H - 0.012, 0.040]} />
                </mesh>
            ))}

            {/* ── TOP: APS logo marks ──────────────────────────── */}
            {[-0.30, -0.18, -0.06].map((xOff, i) => (
                <group key={`lm-${i}`} position={[xOff, H / 2 + 0.0005, -0.06]}>
                    <mesh rotation={[-Math.PI / 2, 0,  Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.034, 0.004, 0.005]} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, -Math.PI / 4]} material={mats.topLogo}>
                        <boxGeometry args={[0.034, 0.004, 0.005]} />
                    </mesh>
                </group>
            ))}
            <Text position={[0.22, H / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.025} color="#aaaacc" anchorX="center" anchorY="middle" letterSpacing={0.06}>
                APS Networks
            </Text>
            <Text position={[0.22, H / 2 + 0.002, 0.10]} rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.013} color="#666677" anchorX="center" anchorY="middle">
                AS7726-50X · 50×25GbE
            </Text>

            {/* ── CORNER SCREWS ────────────────────────────────── */}
            {[[-W/2+0.020, H/2-0.013], [-W/2+0.020, -H/2+0.013],
              [ W/2-0.020, H/2-0.013], [ W/2-0.020, -H/2+0.013]].map(([sx, sy], i) => (
                <mesh key={`sc-${i}`} position={[sx, sy, D / 2 + 0.005]}
                    rotation={[Math.PI / 2, 0, 0]} material={mats.screw}>
                    <cylinderGeometry args={[0.006, 0.006, 0.008, 8]} />
                </mesh>
            ))}

            {/* Front panel brand text */}
            <Text position={[W / 2 - 0.105, -H / 2 + 0.026, D / 2 + 0.005]}
                fontSize={0.016} color="#bbbbcc" anchorX="center" anchorY="middle" letterSpacing={0.07}>
                APS Networks
            </Text>

        </group>
    );
}

export default APSSwitchVendor;
