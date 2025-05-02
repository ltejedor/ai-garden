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

// Astronaut model component
const Astronaut: React.FC = () => {
	const { scene } = useGLTF("/rendercrate-astronaut-rig.glb");
	const astronautRef = useRef<THREE.Group>(null);

	// Apply shadows to all meshes in the model
	React.useEffect(() => {
		if (astronautRef.current) {
			astronautRef.current.traverse((child) => {
				if ((child as THREE.Mesh).isMesh) {
					child.castShadow = true;
					child.receiveShadow = true;
				}
			});
		}
	}, []); // Run only once on mount

	// Gentle floating animation
	useFrame(({ clock }) => {
		if (astronautRef.current) {
			// Add subtle floating motion
			astronautRef.current.position.y =
				Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
			// Slow rotation
			astronautRef.current.rotation.y = clock.getElapsedTime() * 0.1;
		}
	});

	return (
		<PresentationControls
			global
			snap
			rotation={[0, 0, 0]}
			polar={[-Math.PI / 4, Math.PI / 4]}
			azimuth={[-Math.PI / 4, Math.PI / 4]}
		>
			<group ref={astronautRef} position={[0, 0, 0]} scale={0.01}>
				<primitive object={scene} />
			</group>
		</PresentationControls>
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
	const [data, setData] = useState<BackendData | null>(null);

	// Fetch data from backend
	React.useEffect(() => {
		const fetchData = async (): Promise<void> => {
			try {
				const response = await axios.get<BackendData>("/api/data");
				console.log("Data from backend:", response.data);
				setData(response.data);
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};

		fetchData();
	}, []);

	return (
		<>
			{/* Lights */}
			<ambientLight intensity={0.5} />
			<directionalLight position={[1, 1, 1]} intensity={0.8} castShadow />

			{/* Ground */}
			<Ground />

			<Agent
				position={[0, 0, 0]}
				modelUrl="chibi.fbx"
				id="1"
				data={{ name: "John" }}
				audioVoice="astra"
				audioText={"hello how are you?"}
				scale={0.001}
			/>

			{/* Display data from backend if available */}
			{data && (
				<group position={[0, 2, 0]}>
					{/* You can visualize your backend data here */}
				</group>
			)}
		</>
	);
};

// Preload the model
// useGLTF.preload("/rendercrate-astronaut-rig.glb");
