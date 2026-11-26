#!/usr/bin/env python3
"""External test oracle only. JSON parsing in the library remains pure ETAS."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from decimal import Decimal


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def package_digest(package):
    value = hashlib.sha256()
    for path in sorted([package / 'etas.toml', *package.glob('src/**/*.es')]):
        value.update(str(path.relative_to(package)).encode())
        value.update(b'\0')
        value.update(path.read_bytes())
    return value.hexdigest()


def strict_json(path):
    def constant(value):
        raise ValueError('Non-JSON numeric constant: ' + value)

    def object_pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate object key: ' + key)
            result[key] = value
        return result

    return json.loads(path.read_bytes(), parse_int=Decimal, parse_float=Decimal,
                      parse_constant=constant, object_pairs_hook=object_pairs)


def compare(expected, actual, path='$'):
    if type(expected) is not type(actual):
        raise AssertionError(f'{path}: type differs ({type(expected).__name__}, {type(actual).__name__})')
    if isinstance(expected, dict):
        if expected.keys() != actual.keys():
            raise AssertionError(f'{path}: object keys differ')
        for key in expected:
            compare(expected[key], actual[key], path + '/' + key)
    elif isinstance(expected, list):
        if len(expected) != len(actual):
            raise AssertionError(f'{path}: array lengths differ')
        for index, (left, right) in enumerate(zip(expected, actual)):
            compare(left, right, path + '/' + str(index))
    elif expected != actual:
        raise AssertionError(f'{path}: values differ')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='Unmodified official TAT-QA JSON file')
    parser.add_argument('--split', choices=['dev', 'train'], required=True)
    parser.add_argument('--output', type=Path, required=True, help='ETAS stdout JSON path')
    parser.add_argument('--etas', type=Path, help='ETAS CLI executable; required unless --compare-only')
    parser.add_argument('--timeout', type=float, default=1800)
    parser.add_argument('--compare-only', action='store_true', help='Audit existing output; does not prove which code produced it')
    args = parser.parse_args()
    if not args.compare_only and args.etas is None:
        parser.error('--etas is required for execution')
    package = Path(__file__).resolve().parents[1]
    source = args.input.resolve(strict=True)
    output = args.output.resolve()
    if output == source:
        parser.error('--output must differ from input')
    output.parent.mkdir(parents=True, exist_ok=True)
    report_path = output.with_suffix(output.suffix + '.verification.json')
    error_path = output.with_suffix(output.suffix + '.stderr')
    report = {'success': False, 'split': args.split, 'input': str(source),
              'input_bytes': source.stat().st_size, 'input_sha256': digest(source),
              'output': str(output), 'mode': 'compare-existing-output' if args.compare_only else 'execute-and-compare'}
    started = time.monotonic()
    try:
        expected = strict_json(source)
        if not args.compare_only:
            cli = args.etas.resolve(strict=True)
            before = package_digest(package)
            report.update({'cli': str(cli), 'cli_sha256': digest(cli), 'package_sha256': before})
            command = [str(cli), 'run', str(package), '--allow-effects', '--format', 'text', '--args', args.split]
            report['command'] = command
            with source.open('rb') as stdin, output.open('wb') as stdout, error_path.open('wb') as stderr:
                result = subprocess.run(command, stdin=stdin, stdout=stdout, stderr=stderr,
                                        env=dict(os.environ, ETAS_HOST_MEMORY='memory'), timeout=args.timeout)
            report['process_exit'] = result.returncode
            if result.returncode:
                raise RuntimeError(f'ETAS exited {result.returncode}; diagnostics: {error_path}')
            if before != package_digest(package):
                raise RuntimeError('ETAS source changed during verification; rerun a stable version')
        actual = strict_json(output)
        compare(expected, actual)
        groups = len(actual)
        questions = sum(len(group['questions']) for group in actual)
        expected_counts = {'dev': (278, 1668), 'train': (2201, 13215)}[args.split]
        if (groups, questions) != expected_counts:
            raise AssertionError(f'Unexpected TAT-QA counts: {(groups, questions)}')
        report.update({'success': True, 'groups': groups, 'questions': questions,
                       'output_bytes': output.stat().st_size, 'output_sha256': digest(output)})
    except (AssertionError, ValueError, OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        report['error'] = str(error)
    report['verification_seconds'] = round(time.monotonic() - started, 3)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    return 0 if report['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
