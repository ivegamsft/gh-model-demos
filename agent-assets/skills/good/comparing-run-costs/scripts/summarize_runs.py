"""Summarize harness runs by configuration.

Usage: summarize_runs.py RUNS.jsonl [--json]

Each line must be a JSON object with: task_id, config_id, input_tokens,
cached_tokens, output_tokens, accepted. Exit codes: 0 ok, 1 usage, 2 invalid log.
"""
import json
import sys
from collections import defaultdict

REQUIRED = ("task_id", "config_id", "input_tokens", "cached_tokens", "output_tokens", "accepted")
MAX_ERRORS_SHOWN = 10  # enough to diagnose a log without flooding context


def load(path):
    rows, errors = [], []
    with open(path, encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                errors.append(f"line {n}: invalid JSON")
                continue
            missing = [k for k in REQUIRED if k not in event]
            if missing:
                errors.append(f"line {n}: missing {missing}")
                continue
            rows.append(event)
    return rows, errors


def summarize(rows):
    groups = defaultdict(lambda: {"runs": 0, "accepted": 0, "input_tokens": 0, "cached_tokens": 0, "output_tokens": 0})
    tasks = defaultdict(set)
    for r in rows:
        g = groups[r["config_id"]]
        g["runs"] += 1
        g["accepted"] += bool(r["accepted"])
        for k in ("input_tokens", "cached_tokens", "output_tokens"):
            g[k] += r[k]
        tasks[r["config_id"]].add(r["task_id"])
    result = []
    for config_id in sorted(groups):
        g = groups[config_id]
        total = g["input_tokens"] + g["output_tokens"]
        g["tokens_per_accepted"] = round(total / g["accepted"]) if g["accepted"] else None
        result.append({"config_id": config_id, "task_ids": sorted(tasks[config_id]), **g})
    return result


def main(argv):
    if len(argv) < 2:
        print(__doc__.strip().splitlines()[2], file=sys.stderr)
        return 1
    try:
        rows, errors = load(argv[1])
    except FileNotFoundError:
        print(f"File not found: {argv[1]}", file=sys.stderr)
        return 1
    if errors:
        print("\n".join(errors[:MAX_ERRORS_SHOWN]), file=sys.stderr)
        print(f"{len(errors)} invalid lines; fix the log before comparing.", file=sys.stderr)
        return 2
    summary = summarize(rows)
    if "--json" in argv:
        print(json.dumps(summary, separators=(",", ":")))
    else:
        for s in summary:
            print(" | ".join(f"{k}={v}" for k, v in s.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
