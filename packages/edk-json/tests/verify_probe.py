#!/usr/bin/env python3
"""Execute the ETAS reader probe and audit its interpreter report, not its exit status."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from verify_tatqa import digest, package_digest


def result_code(report):
    value = report.get('value')
    if not isinstance(value, dict):
        raise AssertionError('interpreter report has no value object')
    if value.get('kind') != 'number' or value.get('type') != 'i32':
        raise AssertionError(f'flow did not return an i32 number: {value!r}')
    raw = value.get('value')
    if isinstance(raw, bool) or not isinstance(raw, (int, str)):
        raise AssertionError(f'non-numeric i32 payload: {raw!r}')
    if isinstance(raw, str) and not re.fullmatch(r'-?[0-9]+', raw):
        raise AssertionError(f'non-numeric i32 payload: {raw!r}')
    return int(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--etas', type=Path, required=True, help='ETAS CLI executable')
    parser.add_argument('--timeout', type=float, default=300)
    parser.add_argument('--report', type=Path, help='Optional JSON report output path')
    args = parser.parse_args()
    package = Path(__file__).resolve().parents[1]
    cli = args.etas.resolve(strict=True)
    command = [str(cli), 'run', str(package), '--allow-effects',
               '--format', 'json', '--args', 'probe']
    report = {'success': False, 'command': command, 'cli': str(cli),
              'cli_sha256': digest(cli)}
    started = time.monotonic()
    try:
        before = package_digest(package)
        report['package_sha256_before'] = before
        result = subprocess.run(command, capture_output=True,
                                env=dict(os.environ, ETAS_HOST_MEMORY='memory'),
                                timeout=args.timeout)
        report['process_exit'] = result.returncode
        report['stderr'] = result.stderr.decode('utf-8', 'replace').strip()
        if result.returncode != 0:
            raise AssertionError(f'ETAS exited {result.returncode}; stderr: {report["stderr"]}')
        try:
            interpreter = json.loads(result.stdout.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise AssertionError(f'stdout is not one interpreter JSON report: {error}') from error
        if not isinstance(interpreter, dict):
            raise AssertionError(f'interpreter JSON is not an object: {type(interpreter).__name__}')
        if 'diagnostics' in interpreter and interpreter['diagnostics'] != []:
            raise AssertionError(f'interpreter diagnostics present: {interpreter["diagnostics"]!r}')
        outcome = interpreter.get('outcome')
        if outcome is not None:
            if not isinstance(outcome, dict):
                raise AssertionError(f'outcome is not an object: {outcome!r}')
            if outcome.get('kind') != 'completed':
                raise AssertionError(f'flow did not complete: {outcome!r}')
        code = result_code(interpreter)
        report['value'] = code
        if code != 0:
            raise AssertionError(f'reader probe returned {code}; expected 0')
        after = package_digest(package)
        report['package_sha256_after'] = after
        if before != after:
            raise AssertionError('ETAS source changed during verification')
        report.update({'success': True, 'outcome': outcome,
                       'schema': interpreter.get('schema')})
    except (AssertionError, OSError, subprocess.TimeoutExpired) as error:
        report['error'] = str(error)
    report['verification_seconds'] = round(time.monotonic() - started, 3)
    text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        report_path = args.report.resolve()
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(text, encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
