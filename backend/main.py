#!/usr/bin/env python3
import argparse, json, sys, io, contextlib
from smolagents import CodeAgent, HfApiModel
from smolagents.gradio_ui import pull_messages_from_step
from smolagents.memory import FinalAnswerStep

def quiet_run(agent, prompt):
    """Run once, discarding the Rich banners + debug prints."""
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return agent.run(prompt)

def run_agent(prompt: str, stream: bool = False):
    agent = CodeAgent(tools=[], model=HfApiModel(), add_base_tools=True)

    if stream:
        # 1️⃣ prime the run (hidden)
        final_answer = quiet_run(agent, prompt)

        # 2️⃣ now replay it as a generator and emit clean JSON
        for step in agent.run(prompt, stream=True):
            for msg in pull_messages_from_step(step):
                text = msg.content if hasattr(msg, "content") else str(msg)
                print(json.dumps({"stream": text}), flush=True)

            if isinstance(step, FinalAnswerStep):
                final_answer = step.final_answer

        print(json.dumps({"reply": str(final_answer)}), flush=True)

    else:
        result = quiet_run(agent, prompt)
        print(json.dumps({"reply": str(result)}), flush=True)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--prompt", required=True)
    p.add_argument("--stream", action="store_true")
    args = p.parse_args()
    run_agent(args.prompt, args.stream)
