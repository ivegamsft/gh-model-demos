"""Print the cache read ratio for each call in a harness run.

Usage: cache_ratio.py RUNS.jsonl

Each line needs: call (int), prompt_tokens (total, including cached), cached_tokens.
Normalize provider fields to this shape in the harness before running.
"""
import json
import sys


def main(argv):
    if len(argv) != 2:
        print("Usage: cache_ratio.py RUNS.jsonl", file=sys.stderr)
        return 1
    try:
        lines = open(argv[1], encoding="utf-8").read().splitlines()
    except FileNotFoundError:
        print(f"File not found: {argv[1]}", file=sys.stderr)
        return 1
    print("call,prompt_tokens,cached_tokens,ratio")
    for n, line in enumerate(lines, 1):
        if not line.strip():
            continue
        try:
            e = json.loads(line)
            total, cached = int(e["prompt_tokens"]), int(e["cached_tokens"])
            call = e["call"]
        except (json.JSONDecodeError, KeyError, ValueError) as err:
            print(f"line {n}: {type(err).__name__}: {err}", file=sys.stderr)
            return 2
        ratio = cached / total if total else 0.0
        print(f"{call},{total},{cached},{ratio:.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
