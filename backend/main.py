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
from smolagents.mcp_client import MCPClient
from smolagents.gradio_ui import pull_messages_from_step
from smolagents.memory import FinalAnswerStep
import re  # for sanitizing MCP tool names

load_dotenv()

def run_agent(prompt: str, stream: bool = False):
    model = LiteLLMModel(model_id="anthropic/claude-3-7-sonnet-latest")
    all_tools = []

    # try:
    #     apify_url = f"https://actors-mcp-server.apify.actor/message?token={os.getenv('APIFY_TOKEN')}&session_id=aa86461a-3492-45c5-a073-708531cacace"
    #     with MCPClient({"url": apify_url}) as apify_tools:
    #         print(apify_tools)
    #         all_tools.extend(apify_tools)
    # except Exception:
    #     pass  # Fail silently if Apify isn't available

    try:
        gumloop_url = os.getenv("GUMLOOP_AUTH_URL")
        with MCPClient({"url": gumloop_url}) as gumloop_tools:
            all_tools.extend(gumloop_tools)
    except Exception:
        pass  # Fail silently if Gumloop isn't available

    for tool in all_tools:
        tool.name = re.sub(r'\W|^(?=\d)', '_', tool.name)


    research_agent = CodeAgent(
        model=model,
        tools=all_tools,
        name="research_agent",
        add_base_tools=True,
        description="Researches online and saves output to google sheets",
    )

    manager_agent = CodeAgent(
        tools=[],
        model=model,
        additional_authorized_imports=["time", "numpy", "pandas", "json"],
        managed_agents=[research_agent],
        add_base_tools=not bool(all_tools)
    )

    _run_and_print(manager_agent, prompt, stream)

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
