#!/usr/bin/env python3
"""Development oracle for Unicode and every JSON C0 control escape."""
import json, os, subprocess, tempfile
from pathlib import Path
PACKAGE=Path(__file__).resolve().parents[1];ROOT=PACKAGE.parents[1]
out=PACKAGE/"tmp";assert out.resolve().is_relative_to(ROOT.resolve());out.mkdir(exist_ok=True)
probe=Path(tempfile.mkdtemp(prefix="native-unicode-",dir=out)).resolve()
def put(rel,text):
    p=probe/rel;assert p.resolve().is_relative_to(ROOT.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
for name in ("arena","parser","serializer","types","util","unicode"):
    put(f"src/edk/json/{name}.es",(PACKAGE/f"src/edk/json/{name}.es").read_text())
valid=[json.dumps(chr(i),ensure_ascii=True) for i in range(32)]+['"\\u4e2d\\u6587"','"\\uD83D\\uDE00"','"\\u0022"','"\\u005c"','"\\u002f"','"\\b\\f\\n\\r\\t"']
invalid=['"\\uD800"','"\\uDC00"','"\\uD800\\u0041"','"\\uGGGG"','"\\u123"','"\\uD800abcdef"']
calls=[]
for i,raw in enumerate(valid):
    calls.append(f'let p{i}=parse(read_line()); if !p{i}.cursor.ok {{ println("FAIL valid {i}"); }} else {{ println(stringify(p{i}.cursor.document)); }}')
for i,raw in enumerate(invalid):
    calls.append(f'if parse(read_line()).cursor.ok {{ println("FAIL invalid {i}"); }}')
calls.append('var i=0; while i<32 limit Iterations(32) { if parse("\\\"" + control(i) + "\\\"").cursor.ok { println("FAIL raw control"); } i=i+1; }')
put("src/review/main.es",'module review.main;\nimport edk.json.parser.parse;\nimport edk.json.serializer.stringify;\nimport edk.json.unicode.control;\nimport std.io.{println,read_line};\nflow main(args:Array<string>)->i32 ![Error<IndexError>,Error<IOError>] {\n'+"\n".join(calls)+'\nreturn 0;\n}\n')
put("etas.toml",'[package]\nname="unicode-review"\nversion="0.1.0"\nedition="2026"\n[source]\nroot="src"\n[dependencies]\nstd={version="0.1"}\n[[bin]]\nname="review"\nmodule="review.main"\nflow="main"\n')
etas=os.environ.get("ETAS","/home/zhangpuyang/etas-project/interpreter-recheck.ttaidz/target/release/etas")
env={k:v for k,v in os.environ.items() if not k.startswith("ETAS_HOST_MODEL")};env["ETAS_HOST_MEMORY"]="memory"
for args in (["pkg","lock",str(probe)],["run","--cache","off","--allow-effects","--format","text",str(probe)]):
    p=subprocess.run([etas,*args],input="\n".join(valid+invalid)+"\n",cwd=probe,env=env,text=True,capture_output=True,timeout=120)
    if p.returncode or "FAIL" in p.stdout:raise AssertionError(p.stdout+"\n"+p.stderr)
result=[json.loads(s) for s in p.stdout.splitlines()]
assert result==[json.loads(s) for s in valid],(result,valid)
put("acceptance.json",json.dumps({"passed":True,"valid":len(valid),"invalid":len(invalid)+32},indent=2))
print(json.dumps({"passed":True,"valid":len(valid),"invalid":len(invalid)+32,"probe":str(probe)}))
