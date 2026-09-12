#!/usr/bin/env python3
"""Measure one ETAS process reading separate material files; external oracle only."""
import argparse
import json
import os
from pathlib import Path
import resource
import subprocess
import time
from verify_tatqa import compare, digest, package_digest, strict_json
from verify_reader import strict_text


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--materials', type=Path, required=True)
    ap.add_argument('--split', choices=['dev', 'train'], required=True)
    ap.add_argument('--etas', type=Path, required=True)
    ap.add_argument('--mode', choices=['files-json', 'files-read'], required=True)
    ap.add_argument('--limit', type=int)
    ap.add_argument('--output-dir', type=Path, required=True)
    ap.add_argument('--tag', required=True)
    ap.add_argument('--timeout', type=float, default=2400)
    args = ap.parse_args()
    if not args.tag.replace('-', '').replace('_', '').isalnum():
        ap.error('tag must use letters, digits, hyphens or underscores')
    base = args.materials.resolve(strict=True)
    manifest_path = base / f'{args.split}.manifest.json'
    manifest = json.loads(manifest_path.read_text())
    entries = manifest['entries']
    if args.limit is not None:
        if not 0 <= args.limit <= len(entries):
            ap.error('limit must be between zero and group count')
        entries = entries[:args.limit]
    for entry in entries:
        path = (base / entry['path']).resolve(strict=True)
        if not path.is_relative_to(base) or digest(path) != entry['sha256']:
            raise ValueError('Material path/hash mismatch')
    source = Path(manifest['source']).resolve(strict=True)
    if digest(source) != manifest['source_sha256']:
        raise ValueError('Source hash mismatch')
    expected = strict_json(source)[:len(entries)]
    package = Path(__file__).resolve().parents[1]
    cli = args.etas.resolve(strict=True)
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    stdout_path = output_dir / f'{args.tag}.jsonl'
    stderr_path = output_dir / f'{args.tag}.stderr'
    report_path = output_dir / f'{args.tag}.report.json'
    config_path = output_dir / f'{args.tag}.runtime.toml'
    for path in [stdout_path, stderr_path, report_path, config_path]:
        if path.exists():
            raise FileExistsError(f'Refusing to overwrite {path}')
    stdin = ''.join(e['path'] + '\n' for e in entries).encode()
    before = package_digest(package)
    config_path.write_text('[runtime]\ndefault_profile = "material-files"\n\n'
        '[runtime.profiles.material-files.filesystem.regions."edk.json.tatqa.MaterialRoot"]\n'
        'root = ' + json.dumps(str(base)) + '\nread = true\nwrite = false\ndelete = false\n')
    cmd = [str(cli), 'run', str(package), '--allow-effects', '--format', 'text',
           '--runtime-config', str(config_path), '--flow', 'files', '--args', args.mode]
    env = dict(os.environ, ETAS_HOST_MEMORY='memory')
    env.pop('ETAS_HOST_FILESYSTEM', None)
    env.pop('ETAS_HOST_WORKSPACE_ROOT', None)
    report = {'success': False, 'mode': args.mode, 'split': args.split,
              'groups': len(entries), 'material_bytes': sum(e['bytes'] for e in entries),
              'cli': str(cli), 'cli_sha256': digest(cli), 'command': cmd,
              'runtime_config_sha256': digest(config_path),
              'package_sha256_before': before, 'manifest_sha256': digest(manifest_path),
              'source_sha256': digest(source), 'output': str(stdout_path),
              'input_delivery': 'Manifest paths via stdin; ETAS std.fs reads each material in one process.',
              'measurement': 'Whole ETAS process wall time and Linux child peak RSS, after input hash checks (warm-cache); excludes preprocessing and external oracle.'}
    start = time.monotonic()
    try:
        with stdout_path.open('xb') as out, stderr_path.open('xb') as err:
            result = subprocess.run(cmd, input=stdin, stdout=out, stderr=err, env=env, timeout=args.timeout)
        report['process_seconds'] = round(time.monotonic() - start, 3)
        report['maxrss_kib'] = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
        report['process_exit'] = result.returncode
        report['package_sha256_after'] = package_digest(package)
        assert result.returncode == 0 and before == package_digest(package)
        marker = 'EDK_FILES_COMPLETE' if args.mode == 'files-json' else 'EDK_FILES_READ_COMPLETE'
        valid_markers = [[marker]]
        if args.mode == 'files-json':
            valid_markers.append([marker + ' files=' + str(len(entries))])
        assert stderr_path.read_text().splitlines() in valid_markers, 'Missing/extraneous completion diagnostics'
        for entry in entries:
            assert digest(base / entry['path']) == entry['sha256'], 'Input changed during run'
        assert digest(source) == manifest['source_sha256'], 'Source changed during run'
        if args.mode == 'files-json':
            lines = stdout_path.read_text().split('\n')
            if lines and lines[-1] == '':
                lines.pop()
            actual = [strict_text(line) for line in lines]
            compare(expected, actual)
            report['questions'] = sum(len(x['questions']) for x in actual)
        else:
            summary = strict_text(stdout_path.read_text())
            assert summary['files'] == len(entries)
            if 'bytes' in summary:
                assert summary['bytes'] == report['material_bytes']
            report['read_summary'] = {k: int(v) for k, v in summary.items()}
        report['output_sha256'] = digest(stdout_path)
        report['success'] = True
    except (AssertionError, ValueError, OSError, subprocess.TimeoutExpired) as exc:
        report['error'] = str(exc)
    report['including_oracle_seconds'] = round(time.monotonic() - start, 3)
    report_path.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report), flush=True)
    return 0 if report['success'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
