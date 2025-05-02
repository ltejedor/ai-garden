import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import "./App.css";
import { Garden } from "./app/Garden";
import { Physics, RigidBody } from "@react-three/rapier";
import { Color, AudioListener, AudioLoader, Audio } from "three";

import {
	Gltf,
	Environment,
	Fisheye,
	KeyboardControls,
} from "@react-three/drei";
import Controller from "ecctrl";
import axios from "axios";
import Listener from "./app/Listener";

interface BackendData {
	// Define your backend data structure here
	message?: string;
	[key: string]: unknown;
}

const keyboardMap = [
	{ name: "forward", keys: ["ArrowUp", "KeyW"] },
	{ name: "backward", keys: ["ArrowDown", "KeyS"] },
	{ name: "leftward", keys: ["ArrowLeft", "KeyA"] },
	{ name: "rightward", keys: ["ArrowRight", "KeyD"] },
	{ name: "jump", keys: ["Space"] },
	{ name: "run", keys: ["Shift"] },
];

function AudioComponent() {
	const { camera } = useThree();
	useEffect(() => {
		const listener = new AudioListener();
		camera.add(listener);
	}, []);

	return null;
}

export default function App() {
	const [messages, setMessages] = useState([
		{
			sender: "bot",
			text: "Hello! This is a test chat. Type a message and press Send.",
		},
	]);
	const [input, setInput] = useState("Go hunt some aliens");
	const handleSubmit = async (text: string) => {
		if (!text) return;
		// Add user message
		console.log("calling with", text);
		setMessages((prev) => [...prev, { sender: "user", text }]);
		setInput("");
		try {
			const { data } = await axios.post("http://localhost:5001/api/chat", {
				message: text,
			});
			console.log(data);
			setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]); // <‑‑ new shape
		} catch (error) {
			console.error("Error sending message:", error);
			setMessages((prev) => [
				...prev,
				{ sender: "bot", text: "Error: failed to send message" },
			]);
		}
	};

	const onTranscript = (transcript: string) => {
		handleSubmit(transcript);
	};

	return (
		<Canvas shadows>
			<Listener onTranscript={onTranscript} />
			<Fisheye zoom={0.4}>
				<Environment
					files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/evening_road_01_2k.hdr"
					ground={{ height: 5, radius: 40, scale: 20 }}
				/>
				<directionalLight
					intensity={0.7}
					castShadow
					shadow-bias={-0.0004}
					position={[-20, 20, 20]}
				>
					<orthographicCamera
						attach="shadow-camera"
						args={[-20, 20, 20, -20]}
					/>
				</directionalLight>
				<ambientLight intensity={0.2} />
				<Physics timeStep="vary">
					<KeyboardControls map={keyboardMap}>
						<Controller maxVelLimit={5}>
							<Gltf
								castShadow
								receiveShadow
								scale={0.315}
								position={[0, -0.55, 0]}
								src={"ghost_w_tophat-transformed.glb"}
							/>
						</Controller>
					</KeyboardControls>
					<RigidBody type="fixed" colliders="trimesh">
						{/* <Gltf
							castShadow
							receiveShadow
							rotation={[-Math.PI / 2, 0, 0]}
							scale={0.11}
							src="/fantasy_game_inn2-transformed.glb"
						/> */}
						<mesh
							rotation={[-Math.PI / 2, 0, 0]}
							position={[0, -1, 0]}
							receiveShadow
						>
							<planeGeometry args={[50, 50]} />
							<meshStandardMaterial
								color="#303030"
								roughness={0.8}
								metalness={0.2}
							/>
						</mesh>

						<Garden />
					</RigidBody>
				</Physics>
			</Fisheye>
		</Canvas>
	);
}
