import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const InClick = () => {
	const [isClicked, setIsClicked] = useState(false);

	if (isClicked) {
		return <App />;
	}

	return (
		<div
			style={{ width: "100%", height: "100%", backgroundColor: "red" }}
			onClick={() => setIsClicked(true)}
		>
			CLICK
		</div>
	);
};
ReactDOM.createRoot(rootElement).render(
	<div style={{ width: "100vw", height: "100vh" }}>
		<InClick />
	</div>,
);
