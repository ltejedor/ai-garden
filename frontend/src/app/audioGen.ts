export type Voice =
	| "luna"
	| "celeste"
	| "orion"
	| "ursa"
	| "astra"
	| "esther"
	| "estelle"
	| "andromeda";

export async function genText(voice: Voice, text: string) {
	const options = {
		method: "POST",
		headers: {
			Accept: "audio/wav",
			Authorization: "Bearer adgQkEJe9VkmyFMU6UfLSFSbHhGjzNMtKmjXRs39hgI",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			speaker: voice,
			text,
			modelId: "arcana",
			repetition_penalty: 1.5,
			temperature: 0.5,
			top_p: 0.5,
			max_tokens: 1200,
		}),
	};

	console.log("sending");
	const res = await fetch("https://users.rime.ai/v1/rime-tts", options);
	console.log(res);
	const blob = await res.blob();
	return window.URL.createObjectURL(blob);
}
