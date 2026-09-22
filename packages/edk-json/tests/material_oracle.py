#!/usr/bin/env python3
"""Run the ETAS material flow against a fixture and optionally real material."""
import argparse
from decimal import Decimal, ROUND_HALF_UP
import json
import os
from pathlib import Path
import subprocess


def invoke(etas, package, material, args):
    command = [
        etas, "run", "--cache", "off", "--allow-effects", "--format", "text",
        "--flow", "material", str(package), "--args", *args,
    ]
    env = os.environ.copy()
    env["ETAS_HOST_MEMORY"] = "memory"
    process = subprocess.run(
        command, cwd=package.parents[1], input=json.dumps(material, ensure_ascii=False),
        text=True, capture_output=True, check=False, env=env, timeout=60,
    )
    assert process.returncode == 0, (process.returncode, process.stderr)
    assert process.stderr == "", process.stderr
    try:
        return json.loads(process.stdout)
    except json.JSONDecodeError as error:
        raise AssertionError(process.stdout) from error


def expect_error(etas, package, material, args, code):
    result = invoke(etas, package, material, args)
    assert result["ok"] is False, result
    assert result["error"]["code"] == code, result


def fixture():
    return {
        "table": {
            "uid": "fixture-table",
            "table": [
                ["Metric", "2019", "2018"],
                ["Total revenues", "$39,506", "$39,383"],
                ["Other", "100", "90"],
            ],
            "questions": ["answer-secret"],
        },
        "paragraphs": [
            {"uid": "p-1", "order": 1, "text": "Revenue increased."},
            {"uid": "p-2", "order": 2, "text": "No matching phrase."},
        ],
        "answer": "answer-secret",
        "derivation": "derivation-secret",
        "rel_paragraphs": ["relation-secret"],
    }


def check_fixture(etas, package):
    material = fixture()
    found = invoke(etas, package, material, ["search", "REVENUE", "10", "fixture"])
    assert found["ok"] is True
    assert found["count"] == 2
    assert found["matches"][0]["source"] == {
        "material": "fixture", "table": "fixture-table", "row": 1,
    }
    assert found["matches"][0]["text"] == "Total revenues $39,506 $39,383"
    assert found["matches"][1]["source"] == {
        "material": "fixture", "paragraph": "p-1",
    }
    serialized = json.dumps(found, ensure_ascii=False)
    for secret in ("answer-secret", "derivation-secret", "relation-secret"):
        assert secret not in serialized, serialized
    hidden = invoke(etas, package, material, ["search", "secret", "10", "fixture"])
    assert hidden["count"] == 0 and hidden["matches"] == [], hidden

    limited = invoke(etas, package, material, ["search", "revenue", "1", "fixture"])
    assert limited["count"] == 1
    assert limited["matches"][0]["source"]["row"] == 1

    cell = invoke(etas, package, material, ["read", "cell", "fixture-table", "1", "1", "fixture"])
    assert cell["ok"] is True
    assert cell["value"] == "$39,506"
    assert cell["source"] == {
        "material": "fixture", "table": "fixture-table", "row": 1, "column": 1,
    }
    paragraph = invoke(etas, package, material, ["read", "paragraph", "p-1", "fixture"])
    assert paragraph["paragraph"]["text"] == "Revenue increased."
    assert paragraph["source"]["paragraph"] == "p-1"

    expect_error(etas, package, material, ["search", "", "10", "fixture"], "invalid-query")
    expect_error(etas, package, material, ["search", "revenue", "0", "fixture"], "invalid-limit")
    expect_error(etas, package, material, ["read", "paragraph", "", "fixture"], "invalid-reference")
    expect_error(etas, package, material, ["read", "paragraph", "missing", "fixture"], "not-found")
    expect_error(etas, package, material, ["read", "row", "fixture-table", "99", "fixture"], "out-of-range")
    expect_error(etas, package, {"table": {}}, ["search", "x", "1", "fixture"], "missing-field")
    expect_error(etas, package, {"table": {"uid": "t", "table": [[1]]}, "paragraphs": []}, ["search", "x", "1", "fixture"], "invalid-type")


def check_real(etas, package, path):
    with path.open(encoding="utf-8") as handle:
        material = json.load(handle)
    table = material["table"]["table"]
    result = invoke(etas, package, material, ["read", "table", material["table"]["uid"], "dev/000014"])
    assert result["ok"] is True
    assert result["values"] == table
    for column, expected in ((1, "$39,506"), (2, "$39,383")):
        cell = invoke(etas, package, material, [
            "read", "cell", material["table"]["uid"], "3", str(column), "dev/000014",
        ])
        assert cell["value"] == expected
        assert cell["source"]["row"] == 3 and cell["source"]["column"] == column
    growth = invoke(etas, package, material, [
        "calculate", "growth", material["table"]["uid"], "3", "1", "$",
        "3", "2", "$",
    ])
    expected = ((Decimal("39506") - Decimal("39383")) / Decimal("39383") * 100)
    expected = expected.quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
    assert growth["result"] == format(expected, "f"), growth
    assert growth["unit"] == "percent"
    assert growth["operands"][0]["raw"] == "$39,506"
    assert growth["operands"][0]["source"]["row"] == 3


def check_calculations(etas, package):
    material = fixture()
    uid = material["table"]["uid"]
    difference = invoke(etas, package, material, [
        "calculate", "difference", uid, "1", "1", "$", "1", "2", "$",
    ])
    assert difference["result"] == "123", difference
    ratio = invoke(etas, package, material, [
        "calculate", "ratio", uid, "1", "1", "$", "1", "2", "$",
    ])
    expected_ratio = (Decimal("39506") / Decimal("39383")).quantize(
        Decimal("0.000001"), rounding=ROUND_HALF_UP,
    )
    assert ratio["result"] == format(expected_ratio, "f"), ratio
    total = invoke(etas, package, material, [
        "calculate", "sum", uid, "2", "1", "amount", "2", "2", "amount",
    ])
    assert total["result"] == "190" and total["unit"] == "amount", total

    negative = json.loads(json.dumps(material))
    negative["table"]["table"].append(["Loss", "(1,234.50)", "-12.5"])
    neg = invoke(etas, package, negative, [
        "calculate", "difference", uid, "3", "1", "amount", "3", "2", "amount",
    ])
    assert neg["result"] == "-1222", neg

    rates = json.loads(json.dumps(material))
    rates["table"]["table"].append(["Rates", "12%", "8%"])
    percent = invoke(etas, package, rates, [
        "calculate", "sum", uid, "3", "1", "percent", "3", "2", "percent",
    ])
    assert percent["result"] == "20" and percent["unit"] == "percent", percent
    assert percent["operands"][0]["parsed"] == "0.12"

    zero_current = json.loads(json.dumps(material))
    zero_current["table"]["table"].append(["Zero", "$0", "$100"])
    zero_growth = invoke(etas, package, zero_current, [
        "calculate", "growth", uid, "3", "1", "$", "3", "2", "$",
    ])
    assert zero_growth["result"] == "-100", zero_growth
    zero_base = json.loads(json.dumps(material))
    zero_base["table"]["table"].append(["Zero", "$100", "$0"])
    expect_error(etas, package, zero_base, [
        "calculate", "growth", uid, "3", "1", "$", "3", "2", "$",
    ], "division-by-zero")
    expect_error(etas, package, material, [
        "calculate", "difference", uid, "1", "1", "$", "1", "2", "amount",
    ], "unit-mismatch")
    expect_error(etas, package, material, [
        "calculate", "sum", uid, "1", "1", "amount", "dangling",
    ], "usage")
    for bad in ("", "-", "N/A", "1,23", "1."):
        invalid = json.loads(json.dumps(material))
        invalid["table"]["table"].append(["Bad", bad])
        expect_error(etas, package, invalid, [
            "calculate", "sum", uid, "3", "1", "amount",
        ], "invalid-number")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--etas", default=os.environ.get("ETAS", "etas"))
    parser.add_argument("--material", type=Path)
    options = parser.parse_args()
    package = Path(__file__).parents[1]
    check_fixture(options.etas, package)
    check_calculations(options.etas, package)
    if options.material:
        check_real(options.etas, package, options.material)
    print("material ETAS regression ok")


if __name__ == "__main__":
    main()
