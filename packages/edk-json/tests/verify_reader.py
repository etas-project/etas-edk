#!/usr/bin/env python3
"""Strict external oracle for edk-json top-level array reader JSONL output."""

import argparse
import json
import os
from decimal import Decimal
from pathlib import Path
import subprocess
import sys
import time

from verify_tatqa import compare, digest, package_digest, strict_json


def strict_text(text):
    def constant(value):
        raise ValueError("Non-JSON numeric constant: " + value)

    def object_pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("Duplicate object key: " + key)
            result[key] = value
        return result

    return json.loads(text, parse_int=Decimal, parse_float=Decimal,
                      parse_constant=constant, object_pairs_hook=object_pairs)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Unmodified official TAT-QA JSON file")
    parser.add_argument("--split", choices=["dev", "train"], required=True)
    parser.add_argument("--output", type=Path, required=True,
                        help="Reader JSONL output path")
    parser.add_argument("--stderr", type=Path, required=True,
                        help="Reader stderr path containing the completion marker")
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--etas", type=Path,
                        help="ETAS CLI executable; required unless --compare-only")
    parser.add_argument("--timeout", type=float, default=3600)
    parser.add_argument("--time", type=Path,
                        help="Optional external /usr/bin/time output")
    parser.add_argument("--compare-only", action="store_true",
                        help="Audit existing output; does not prove its producer")
    args = parser.parse_args()
    if not args.compare_only and args.etas is None:
        parser.error("--etas is required for execution")

    package = Path(__file__).resolve().parents[1]
    source = args.input.resolve(strict=True)
    output = args.output.resolve()
    stderr_path = args.stderr.resolve()
    report_path = args.report.resolve()
    paths = {
        "input": source,
        "output": output,
        "stderr": stderr_path,
        "report": report_path,
    }
    if len(set(paths.values())) != len(paths):
        parser.error("input, output, stderr and report paths must be distinct")
    output.parent.mkdir(parents=True, exist_ok=True)
    report = {
        "success": False,
        "split": args.split,
        "input": str(source),
        "output": str(output),
        "stderr": str(stderr_path),
        "mode": "compare-existing-output" if args.compare_only else "execute-and-compare",
        "input_bytes": source.stat().st_size,
        "input_sha256": digest(source),
    }
    started = time.monotonic()
    try:
        expected = strict_json(source)
        if not isinstance(expected, list):
            raise ValueError("source JSON root is not an array")
        expected_counts = {"dev": (278, 1668), "train": (2201, 13215)}[args.split]

        if not args.compare_only:
            cli = args.etas.resolve(strict=True)
            before = package_digest(package)
            command = [str(cli), "run", str(package), "--allow-effects",
                       "--format", "text", "--args", "reader-json"]
            report.update({"command": command, "cli": str(cli),
                           "cli_sha256": digest(cli),
                           "package_sha256_before": before})
            with source.open("rb") as stdin:
                with output.open("wb") as stdout:
                    with stderr_path.open("wb") as stderr:
                        result = subprocess.run(
                            command, stdin=stdin, stdout=stdout, stderr=stderr,
                            env=dict(os.environ, ETAS_HOST_MEMORY="memory"),
                            timeout=args.timeout,
                        )
            report["process_exit"] = result.returncode
            if result.returncode:
                raise RuntimeError(f"ETAS exited {result.returncode}; see {stderr_path}")
            after = package_digest(package)
            report["package_sha256_after"] = after
            if before != after:
                raise RuntimeError("ETAS source changed during verification")
        else:
            report["package_sha256_observed"] = package_digest(package)
            report["compare_only_note"] = "Existing output was audited; producer and run-start source are not proven."

        if not output.is_file():
            raise OSError(f"missing output: {output}")
        def lf_lines(path):
            lines = path.read_text(encoding="utf-8").split("\n")
            if lines and lines[-1] == "":
                lines.pop()
            return lines

        output_lines = lf_lines(output)
        stderr_lines = lf_lines(stderr_path)
        report["complete_marker"] = "EDK_READER_COMPLETE" in stderr_lines
        if not report["complete_marker"]:
            raise AssertionError("missing EDK_READER_COMPLETE marker")
        if len(output_lines) != len(expected):
            raise AssertionError(f"output groups differ: {len(output_lines)} != {len(expected)}")

        for line_number, (want, line) in enumerate(zip(expected, output_lines), 1):
            try:
                got = strict_text(line)
            except (ValueError, json.JSONDecodeError) as error:
                raise AssertionError(f"$[{line_number - 1}]: invalid JSONL item: {error}") from error
            compare(want, got, f"$[{line_number - 1}]")

        groups = len(expected)
        questions = sum(len(group["questions"]) for group in expected)
        if (groups, questions) != expected_counts:
            raise AssertionError(f"Unexpected TAT-QA counts: {(groups, questions)}")
        report.update({"success": True, "groups": groups, "questions": questions,
                       "output_lines": len(output_lines),
                       "output_bytes": output.stat().st_size,
                       "output_sha256": digest(output),
                       "stderr_sha256": digest(stderr_path)})
        if args.time:
            report["external_time"] = args.time.read_text(encoding="utf-8").strip()
    except (AssertionError, ValueError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        report["error"] = str(error)
    report["verification_seconds"] = round(time.monotonic() - started, 3)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                           encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report["success"] else 1


if __name__ == "__main__":
    sys.exit(main())
