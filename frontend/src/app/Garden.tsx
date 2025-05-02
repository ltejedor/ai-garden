import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, PresentationControls } from "@react-three/drei";
import axios from "axios";
import Agent from "./Agent";

interface BackendData {
	// Define your backend data structure here
	message?: string;
	[key: string]: unknown;
}

// Box component with animation
const Box: React.FC<{ position: [number, number, number]; color?: string }> = (
	props,
) => {
	const meshRef = useRef<THREE.Mesh>(null);
	const [hovered, setHovered] = useState(false);
	const [active, setActive] = useState(false);

	// Animation using useFrame hook
	useFrame(() => {
		if (!meshRef.current) return;
		meshRef.current.rotation.x += 0.01;
		meshRef.current.rotation.y += 0.01;
	});

	return (
		<mesh
			ref={meshRef}
			position={props.position}
			scale={active ? 1.5 : 1}
			onClick={() => setActive(!active)}
			onPointerOver={() => setHovered(true)}
			onPointerOut={() => setHovered(false)}
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial
				color={hovered ? "hotpink" : props.color || "green"}
			/>
		</mesh>
	);
};

// Ground plane component
const Ground: React.FC = () => {
	return (
		<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
			<planeGeometry args={[30, 30]} />
			<meshStandardMaterial color="#303030" roughness={0.8} metalness={0.2} />
		</mesh>
	);
};

// Scene component with data fetching
export const Garden: React.FC = () => {
	return (
		<>
			{/* Lights */}
			<ambientLight intensity={0.5} />
			<directionalLight position={[1, 1, 1]} intensity={0.8} castShadow />

			{/* Ground */}
			<Ground />

			<Agent
				position={[0, 0, 1]}
				modelUrl="cat.glb"
				id="1"
				data={{ name: "John" }}
				audioVoice="astra"
				audioText={null}
				scale={2}
			/>
		</>
	);
};

// Preload the model
// useGLTF.preload("/rendercrate-astronaut-rig.glb");
