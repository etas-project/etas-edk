#!/usr/bin/env python3
"""External preprocessing: preserve each original TAT-QA element's UTF-8 bytes."""
import argparse
import hashlib
import json
from decimal import Decimal
from pathlib import Path
from verify_tatqa import compare, strict_json


def sha(data):
    return hashlib.sha256(data).hexdigest()


def split_dataset(source, output, split):
    source = source.resolve(strict=True)
    output = output.resolve()
    folder = output / split
    if folder.exists():
        raise FileExistsError(f'Refusing to overwrite existing split: {folder}')
    raw = source.read_bytes()
    text = raw.decode('utf-8')
    expected = strict_json(source)
    counts = {'dev': (278, 1668), 'train': (2201, 13215)}[split]
    assert (len(expected), sum(len(x['questions']) for x in expected)) == counts
    decoder = json.JSONDecoder(parse_int=Decimal, parse_float=Decimal)
    def skip(pos):
        while pos < len(text) and text[pos] in ' \t\r\n':
            pos += 1
        return pos
    pos = skip(0)
    if pos >= len(text) or text[pos] != '[':
        raise ValueError('Expected top-level array')
    pos = skip(pos + 1)
    spans = []
    for i, want in enumerate(expected):
        value, end = decoder.raw_decode(text, pos)
        compare(want, value, f'$[{i}]')
        spans.append((pos, end))
        pos = skip(end)
        if i + 1 < len(expected):
            if pos >= len(text) or text[pos] != ',':
                raise ValueError('Missing array separator')
            pos = skip(pos + 1)
    if pos >= len(text) or text[pos] != ']' or skip(pos + 1) != len(text):
        raise ValueError('Invalid array end or trailing content')
    output.mkdir(parents=True, exist_ok=True)
    folder.mkdir()
    entries = []
    for i, (start, end) in enumerate(spans):
        name = f'{i:06d}.json'
        path = folder / name
        data = text[start:end].encode('utf-8')
        with path.open('xb') as stream:
            stream.write(data)
        compare(expected[i], strict_json(path), f'$[{i}]')
        entries.append({'index': i, 'path': f'{split}/{name}',
                        'table_uid': expected[i]['table'].get('uid'),
                        'questions': len(expected[i]['questions']),
                        'bytes': len(data), 'sha256': sha(data)})
    manifest = {'split': split, 'source': str(source), 'source_bytes': len(raw),
                'source_sha256': sha(raw), 'groups': counts[0], 'questions': counts[1],
                'material_bytes': sum(x['bytes'] for x in entries),
                'format': 'Original element text, no reserialization; only outer array/separators removed.',
                'entries': entries}
    with (output / f'{split}.manifest.json').open('x', encoding='utf-8') as stream:
        json.dump(manifest, stream, ensure_ascii=False, indent=2)
        stream.write('\n')
    with (output / f'{split}.paths.txt').open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(''.join(x['path'] + '\n' for x in entries))
    return {k: v for k, v in manifest.items() if k != 'entries'} | {
        'minimum_file_bytes': min(x['bytes'] for x in entries),
        'maximum_file_bytes': max(x['bytes'] for x in entries)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--split', choices=['dev', 'train'], required=True)
    args = parser.parse_args()
    print(json.dumps(split_dataset(args.input, args.output, args.split), ensure_ascii=False))
