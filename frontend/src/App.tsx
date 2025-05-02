import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import "./App.css";
import { Garden } from "./app/Garden";
import { Physics, RigidBody } from "@react-three/rapier";
import { Color, AudioListener, AudioLoader, Audio } from "three";

import { Environment, Fisheye, KeyboardControls } from "@react-three/drei";
import Controller from "ecctrl";
import axios from "axios";
import Listener from "./app/Listener";
import Agent from "./app/Agent";

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

type Message = {
	agent: string;
	text: string;
};

export default function App() {
	const [reply, setReply] = useState<string | null>(null);

	const handleSubmit = async (text: string) => {
		axios
			.post("http://localhost:5001/api/chat", {
				message: text,
			})
			.then((res) => {
				console.log("RES", res.data);
				setReply(res.data.reply);
			});
	};
	const [transcript, setTranscript] = useState("");

	const onTranscript = (transcript: string, done: boolean) => {
		if (done) {
			handleSubmit(transcript);
		} else {
			setTranscript(transcript);
		}
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
							<Agent
								position={[0, 0, 0]}
								modelUrl="ghost_w_tophat-transformed.glb"
								id="user"
								data={{ name: transcript, text: transcript }}
								audioVoice="astra"
								audioText={null}
								scale={0.315}
							/>
						</Controller>
					</KeyboardControls>
					<RigidBody type="fixed" colliders="trimesh">
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

						<Agent
							position={[2, 0, 1]}
							modelUrl="Humanmc.glb"
							id="user"
							data={{ name: "John", text: reply }}
							audioVoice="astra"
							audioText={reply}
							scale={0.2}
						/>
					</RigidBody>
				</Physics>
			</Fisheye>
		</Canvas>
	);
}
