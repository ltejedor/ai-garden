#!/usr/bin/env python3
import argparse, json, sys, io, contextlib
import os
from pathlib import Path

# Ensure smolagents-ref library is in the Python path for imports
script_dir = Path(__file__).resolve().parent
root_dir = script_dir.parent
sys.path.insert(0, str(root_dir / 'smolagents-ref' / 'src'))
from smolagents import CodeAgent, HfApiModel
from smolagents.gradio_ui import pull_messages_from_step
from smolagents.memory import FinalAnswerStep


def run_agent(prompt: str, stream: bool = False):
    agent = CodeAgent(tools=[], model=HfApiModel(), add_base_tools=True)

    if stream:
        # 1️⃣ prime the run (hidden) without printing logs
        with contextlib.redirect_stdout(io.StringIO()):
            final_answer = agent.run(prompt)

        # 2️⃣ replay steps as a generator and emit clean JSON
        for step in agent.run(prompt, stream=True):
            for msg in pull_messages_from_step(step):
                text = msg.content if hasattr(msg, "content") else str(msg)
                print(json.dumps({"stream": text}), flush=True)

            if isinstance(step, FinalAnswerStep):
                final_answer = step.final_answer

        # finally emit the overall reply
        print(json.dumps({"reply": str(final_answer)}), flush=True)

    else:
        # run once without streaming, suppress logs, then emit JSON reply
        with contextlib.redirect_stdout(io.StringIO()):
            result = agent.run(prompt)
        print(json.dumps({"reply": str(result)}), flush=True)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--prompt", required=True)
    p.add_argument("--stream", action="store_true")
    args = p.parse_args()
    run_agent(args.prompt, args.stream)
