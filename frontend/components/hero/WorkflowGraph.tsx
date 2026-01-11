"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox, MeshTransmissionMaterial, OrthographicCamera, Html, Center, Environment, PresentationControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { User, Sparkles as SparklesIcon, Zap, Terminal, AppWindow } from "lucide-react";

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
                        roughness={0.1} // Smoother glass
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                        transmission={0.4}
                        chromaticAberration={0.06} // Higher for "LiveKit" look
                        anisotropy={0.1}
                        color="#1a1a1a" // Darker glass
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
            const tangent = curve.getTangentAt(t);
            packetRef.current.position.copy(point);
            // Orient packet to face direction of travel (tangent)
            // Capsule is Y-aligned, so we need to rotate it to align Y with tangent
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
            packetRef.current.setRotationFromQuaternion(quaternion);
        }
    });

    return (
        <>
            <mesh>
                <tubeGeometry args={[curve, 64, 0.015, 8, false]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
            <mesh ref={packetRef}>
                <capsuleGeometry args={[0.04, 0.15, 8, 16]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
        </>
    );
}

export function WorkflowGraph() {
    // 1. Get the exact pixel width of the canvas
    const { size } = useThree();

    // 2. Calculate Zoom dynamically
    // The graph is approx 13 units wide.
    // We want: Zoom = (Canvas Pixels) / (Visible World Units)
    // On Desktop (800px wide): 800 / 13 = ~61 zoom
    // On Mobile (350px wide): 350 / 13 = ~27 zoom
    // We cap it at 65 so it doesn't get ridiculously huge on massive monitors
    const adaptiveZoom = Math.min(size.width / 13, 65);

    return (
        <>
            <OrthographicCamera
                makeDefault
                // 3. Lowered Y from 5 to 2 to make it look less "top-down" and more "head-on"
                position={[0, 2, 20]}
                zoom={adaptiveZoom}
                near={-50}
                far={200}
                onUpdate={c => c.lookAt(0, 0, 0)}
            />

            <Environment preset="city" />

            {/* 2. ATMOSPHERE */}
            <Sparkles count={40} scale={12} size={2} opacity={0.4} color="#1FD5F9" />

            <PresentationControls
                global={false}
                cursor={false}
                snap={true} // Snap back to center
                speed={1}
                zoom={1}
                rotation={[0, 0, 0]}
                polar={[-0.1, 0.1]} // Limit vertical tilt
                azimuth={[-0.1, 0.1]} // Limit horizontal tilt
            >
                {/* 3. MAGIC CENTER COMPONENT 
                   This forces the entire graph to be centered at [0,0,0].
                   No more guessing x/y positions.
                */}
                <Center top>
                    <group>
                        {/* NODES - Coordinates kept relative to each other */}
                        <Node position={[-4.5, 0, 0]} label="User" icon={User} color="#A3A3A3" />
                        <Node position={[-1.5, 1.3, 0]} label="Gemini 3.0 Pro" icon={SparklesIcon} color="#1FD5F9" />
                        <Node position={[-1.5, -1.3, 0]} label="FastAPI" icon={Zap} color="#FFDD00" />
                        <Node position={[1.8, 0, 0]} label="Playwright" icon={Terminal} color="#FF6352" size={1.4} />
                        <Node position={[5, 0, 0]} label="Browser" icon={AppWindow} color="#10B981" />

                        {/* CONNECTIONS */}
                        <Connection start={[-4.5, 0, 0]} end={[-1.5, 1.3, 0]} color="#1FD5F9" speed={0.4} />
                        <Connection start={[-4.5, 0, 0]} end={[-1.5, -1.3, 0]} color="#FFDD00" speed={0.4} />
                        <Connection start={[-1.5, 1.3, 0]} end={[1.8, 0, 0]} color="#FF6352" speed={0.5} />
                        <Connection start={[-1.5, -1.3, 0]} end={[1.8, 0, 0]} color="#FF6352" speed={0.5} />
                        <Connection start={[1.8, 0, 0]} end={[5, 0, 0]} color="#10B981" speed={0.6} />

                        {/* LIGHTS */}
                        <ambientLight intensity={2} />
                        <pointLight position={[10, 10, 10]} intensity={4} color="#ffffff" />
                        <rectAreaLight position={[0, 10, 0]} width={20} height={20} intensity={2} color="#1FD5F9" />
                    </group>
                </Center>
            </PresentationControls>

            <EffectComposer>
                <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={0.4} />
            </EffectComposer>
        </>
    );
}
