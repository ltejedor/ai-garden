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

export const Listener: FC<{
	onTranscript: (transcript: string, done: boolean) => void;
}> = (props) => {
	const { onTranscript } = props;
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState("");
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
	const transcriptRef = useRef<string>("");

	const setup = () => {
		console.log("SETTING up");
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			console.error("Speech recognition not supported in this browser");
			return;
		}
		recognitionRef.current = new SpeechRecognition();
		recognitionRef.current.continuous = true;
		recognitionRef.current.interimResults = true;
		recognitionRef.current.lang = "en-US";

		recognitionRef.current.onresult = (event) => {
			const result = event.results[0][0].transcript;
			transcriptRef.current = result;
			onTranscript(result, false);
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
				recognitionRef.current?.start();
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.code === "Space") {
				e.preventDefault();

				recognitionRef.current?.stop();
				setIsListening(false);

				onTranscript(transcriptRef.current, true);
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
};

export default Listener;
