"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox, MeshTransmissionMaterial, OrthographicCamera, Html, Center, Text } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { User, Sparkles, Zap, Terminal, AppWindow } from "lucide-react";

// Micro-Tile Node
function Node({
    position,
    label,
    icon: Icon,
    color = "#ffffff",
    size = 1,
}: {
    position: [number, number, number];
    label: string;
    icon: any;
    color?: string;
    size?: number;
}) {
    const nodeSize = size;
    const rimSize = nodeSize * 1.02;
    
    return (
        <group position={position}>
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
                {/* The Chip (Flat Tile) - Made slightly larger */}
                <RoundedBox args={[nodeSize, 0.12, nodeSize]} radius={0.05} smoothness={4}>
                    <MeshTransmissionMaterial
                        backside
                        backsideThickness={1}
                        thickness={1}
                        roughness={0.2}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        transmission={0.6}
                        chromaticAberration={0.05}
                        anisotropy={0.1}
                        color="#1a1a1a"
                        resolution={512}
                    />
                </RoundedBox>

                {/* Colored Rim/Glow */}
                <mesh position={[0, -0.05, 0]}>
                    <boxGeometry args={[rimSize, 0.1, rimSize]} />
                    <meshBasicMaterial color={color} transparent opacity={0.4} />
                </mesh>

                {/* Icon Overlay (3D styled HTML or just HTML) */}
                {/* Centering HTML on the tile */}
                <Html transform position={[0, 0.2, 0]} center className="pointer-events-none select-none">
                    <div className="flex flex-col items-center justify-center gap-2">
                        {/* Icon Bubble */}
                        <div
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 border backdrop-blur-sm shadow-xl"
                            style={{ borderColor: `${color}60`, boxShadow: `0 0 10px -2px ${color}40` }}
                        >
                            <Icon className="w-4 h-4" style={{ color: color }} />
                        </div>
                        {/* Label */}
                        <div className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 backdrop-blur-md">
                            <p className="text-[8px] font-mono tracking-wider font-bold text-white/90 whitespace-nowrap uppercase">
                                {label}
                            </p>
                        </div>
                    </div>
                </Html>
            </Float>
        </group>
    );
}

// Data Connection
function Connection({ start, end, color = "#22d3ee", speed = 0.5 }: { start: [number, number, number]; end: [number, number, number]; color?: string; speed?: number }) {
    const curve = useMemo(() => {
        // Create smooth curves for branching pattern
        // Calculate distance to determine curve height
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // For horizontal connections, use minimal arc
        // For branching connections, use more pronounced arc
        const arcHeight = Math.abs(dy) > 0.5 ? 0.8 : 0.3;
        
        const mid = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2 + arcHeight,
            (start[2] + end[2]) / 2,
        ];
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(...start),
            new THREE.Vector3(...mid),
            new THREE.Vector3(...end),
        ]);
    }, [start, end]);

    const packetRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (packetRef.current) {
            const t = (state.clock.getElapsedTime() * speed) % 1;
            const point = curve.getPointAt(t);
            packetRef.current.position.copy(point);
        }
    });

    return (
        <>
            <mesh>
                <tubeGeometry args={[curve, 64, 0.005, 8, false]} />
                <meshBasicMaterial color={color} transparent opacity={0.2} />
            </mesh>
            <mesh ref={packetRef}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
        </>
    );
}

export function WorkflowGraph() {
    return (
        <>
            {/* Isometric Camera Setup - Adjusted for larger view */}
            <OrthographicCamera makeDefault position={[10, 10, 10]} zoom={40} near={-50} far={200} onUpdate={c => c.lookAt(0, 0, 0)} />

            <group position={[0, -1, 0]}>
                {/* 1. User - Left Node */}
                <Node
                    position={[-5, 0, 0]}
                    label="User"
                    icon={User}
                    color="#A3A3A3"
                />

                {/* 2. Gemini - Top Middle Node */}
                <Node
                    position={[-1.5, 1.5, 0]}
                    label="Gemini 2.0"
                    icon={Sparkles}
                    color="#1FD5F9"
                />

                {/* 3. FastAPI - Bottom Middle Node */}
                <Node
                    position={[-1.5, -1.5, 0]}
                    label="FastAPI"
                    icon={Zap}
                    color="#FFDD00"
                />

                {/* 4. Playwright - Right Middle Node (Larger) */}
                <Node
                    position={[2.5, 0, 0]}
                    label="Playwright"
                    icon={Terminal}
                    color="#FF6352"
                    size={1.4}
                />

                {/* 5. Browser - Rightmost Node */}
                <Node
                    position={[6, 0, 0]}
                    label="Browser"
                    icon={AppWindow}
                    color="#10B981"
                />

                {/* Connections - Branching Pattern */}
                {/* Left to Top Middle (curved up) */}
                <Connection start={[-5, 0, 0]} end={[-1.5, 1.5, 0]} color="#1FD5F9" speed={0.4} />
                {/* Left to Bottom Middle (curved down) */}
                <Connection start={[-5, 0, 0]} end={[-1.5, -1.5, 0]} color="#FFDD00" speed={0.4} />
                {/* Top Middle to Right Middle (curved) */}
                <Connection start={[-1.5, 1.5, 0]} end={[2.5, 0, 0]} color="#FF6352" speed={0.5} />
                {/* Bottom Middle to Right Middle (curved) */}
                <Connection start={[-1.5, -1.5, 0]} end={[2.5, 0, 0]} color="#FF6352" speed={0.5} />
                {/* Right Middle to Rightmost (straight) */}
                <Connection start={[2.5, 0, 0]} end={[6, 0, 0]} color="#10B981" speed={0.6} />

                {/* Lighting for Glass */}
                <ambientLight intensity={1} />
                <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
                <rectAreaLight position={[0, 10, 0]} width={20} height={20} intensity={1} color="#1FD5F9" />
            </group>

            <EffectComposer>
                <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={0.4} />
            </EffectComposer>
        </>
    );
}

