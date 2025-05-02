#!/usr/bin/env python3
import argparse, json, sys, io, contextlib
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure smolagents-ref library is in the Python path for imports
script_dir = Path(__file__).resolve().parent
root_dir = script_dir.parent
sys.path.insert(0, str(root_dir / 'smolagents-ref' / 'src'))
from smolagents import CodeAgent, LiteLLMModel
from smolagents.gradio_ui import pull_messages_from_step
from smolagents.memory import FinalAnswerStep
import re  # for sanitizing MCP tool names

load_dotenv()

def run_agent(prompt: str, stream: bool = False):
    # Initialize the model for Claude
    model = LiteLLMModel(model_id="anthropic/claude-3-7-sonnet-latest")

    # Check for Gumloop MCP server integration via API key
    gumloop_api_key = os.getenv("GUMLOOP_API_KEY")
    if gumloop_api_key:
        from smolagents.mcp_client import MCPClient

        server_url = os.getenv("GUMLOOP_AUTH_URL")

        # Connect to MCP server and retrieve tools
        with MCPClient({"url": server_url}) as tools:
            #print(tools)
            # sanitize tool names to valid Python identifiers
            for tool in tools:
                print(tool.name)
                tool.name = re.sub(r'\W|^(?=\d)', '_', tool.name)
                print(tool.name)
            
            agent = CodeAgent(
                tools=tools,
                model=model,
                additional_authorized_imports=["time", "numpy", "pandas", "json"],
                add_base_tools=False
            )
            _run_and_print(agent, prompt, stream)
    else:
        # No MCP integration; use built-in base tools
        agent = CodeAgent(
            tools=[],
            model=model,
            add_base_tools=True
        )
        _run_and_print(agent, prompt, stream)

def _run_and_print(agent: CodeAgent, prompt: str, stream: bool):
    """Helper to run the agent and print JSON responses."""
    if stream:
        # Prime the run without printing logs
        with contextlib.redirect_stdout(io.StringIO()):
            final_answer = agent.run(prompt)

        # Stream each step as JSON
        for step in agent.run(prompt, stream=True):
            for msg in pull_messages_from_step(step):
                text = msg.content if hasattr(msg, "content") else str(msg)
                print(json.dumps({"stream": text}), flush=True)

            if isinstance(step, FinalAnswerStep):
                final_answer = step.final_answer

        # Emit the overall reply
        print(json.dumps({"reply": str(final_answer)}), flush=True)
    else:
        # Run once without streaming, suppress logs, then emit JSON reply
        with contextlib.redirect_stdout(io.StringIO()):
            result = agent.run(prompt)
        print(json.dumps({"reply": str(result)}), flush=True)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--prompt", required=True)
    p.add_argument("--stream", action="store_true")
    args = p.parse_args()
    prompt = args.prompt + ". Please respond to the user succinctly, in a few short sentences at most."
    run_agent(prompt, args.stream)
