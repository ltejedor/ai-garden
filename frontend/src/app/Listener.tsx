import { useState, useEffect, useRef } from "react";
import type { FC } from "react";

interface SpeechRecognitionEvent extends Event {
	results: {
		[index: number]: {
			[index: number]: {
				transcript: string;
				confidence: number;
			};
		};
	};
}

interface SpeechRecognitionErrorEvent extends Event {
	error: string;
	message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start: () => void;
	stop: () => void;
	abort: () => void;
	onresult: (event: SpeechRecognitionEvent) => void;
	onerror: (event: SpeechRecognitionErrorEvent) => void;
	onend: (event: Event) => void;
}

declare global {
	interface Window {
		SpeechRecognition: new () => SpeechRecognitionInstance;
		webkitSpeechRecognition: new () => SpeechRecognitionInstance;
	}
}

export const Listener: FC<{ onTranscript: (transcript: string) => void }> = (
	props,
) => {
	const { onTranscript } = props;
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState("");
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

	const setup = () => {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			console.error("Speech recognition not supported in this browser");
			return;
		}
		recognitionRef.current = new SpeechRecognition();
		console.log("Resetting", recognitionRef.current);
		recognitionRef.current.continuous = true;
		recognitionRef.current.interimResults = true;
		recognitionRef.current.lang = "en-US";

		recognitionRef.current.onresult = (event) => {
			console.log("ON RESULT", event);
			const result = event.results[0][0].transcript;
			setTranscript(result);

			recognitionRef.current.onend = () => {
				console.log("ON END");
				onTranscript(transcript);
			};
		};
		recognitionRef.current.onerror = (event) => {
			console.error("Speech recognition error:", event);
		};
	};

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.code === "Space" && !isListening && !e.repeat) {
				setup();
				e.preventDefault(); // Prevent scrolling
				setIsListening(true);
				setTranscript("");
				console.log("STARTING LISTENING", recognitionRef.current);
				recognitionRef.current?.start();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === "Space" && isListening) {
				e.preventDefault();

				recognitionRef.current?.stop();
				setIsListening(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
			recognitionRef.current?.abort();
		};
	}, []);

	// Log transcript when it changes after stopping recognition
	useEffect(() => {
		if (!isListening && transcript) {
			console.log("Recognized speech:", transcript);
		}
	}, [isListening, transcript]);

	return null;

	return (
		<div className="listener">
			<div className="status">
				{isListening ? "Listening..." : "Press and hold space to speak"}
			</div>
			{transcript && (
				<div className="transcript">Last transcript: {transcript}</div>
			)}
		</div>
	);
};

export default Listener;
