import { Fbx, Gltf, PositionalAudio, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Vector3 } from "three";
import { genText, Voice } from "./audioGen";

export default function Agent(props: {
	position: [number, number, number];
	modelUrl: string;
	id: string;
	scale?: number;
	data: {
		name: string;
	};
	audioVoice: Voice;
	audioText: string | null;
}) {
	const { position, modelUrl, id, data, audioVoice, audioText, scale } = props;
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	useEffect(() => {
		if (audioText) {
			genText(audioVoice, audioText).then(setAudioUrl);
		}
	}, [audioVoice, audioText]);
	console.log("AUDIO URL", audioUrl);
	return (
		<group position={position}>
			<Text
				scale={[1, 1, 1]}
				color="black" // default
				anchorX="center" // default
				anchorY="middle" // default
				position={[0, 4, 0]}
			>
				{data.name}
			</Text>
			{modelUrl.endsWith(".glb") && <Gltf src={modelUrl} scale={scale} />}
			{modelUrl.endsWith(".fbx") && <Fbx scale={scale} path={modelUrl} />}
			{audioUrl && (
				<PositionalAudio
					url={audioUrl}
					autoplay={true}
					loop={false}
					distance={100}
				/>
			)}
		</group>
	);
}
