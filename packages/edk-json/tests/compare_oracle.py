#!/usr/bin/env python3
"""Development-only differential oracle for the ETAS comparator."""
import json, os, re, subprocess, tempfile, math, random
from pathlib import Path
PACKAGE=Path(__file__).resolve().parents[1]
ROOT=PACKAGE.parents[1]
out=PACKAGE/"tmp";assert out.resolve().is_relative_to(ROOT.resolve());out.mkdir(exist_ok=True)
probe=Path(tempfile.mkdtemp(prefix="native-compare-",dir=out)).resolve()
def put(rel,text):
    path=probe/rel;assert path.resolve().is_relative_to(ROOT.resolve())
    path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
for name in ("arena","parser","serializer","types","util","unicode","compare","binary64"):
    put(f"src/edk/json/{name}.es",(PACKAGE/f"src/edk/json/{name}.es").read_text())
cases=[
 ('{"a":1,"b":[true,null]}','{"b":[true,null],"a":1}'),
 ('[1,2]','[2,1]'),('1','1.0'),('1.0','1e0'),('-0','0'),('-0.0','0.0'),
 ('true','1'),('"1"','1'),('9007199254740993','9007199254740992'),
 ('9007199254740993.0','9007199254740992.0'),
 ('1.00000000000000001','1.0'),('1e-300','0.0001e-296'),
 ('{"a":0,"a":2}','{"a":2}'),('{"a":2}','{"a":0,"a":2}'),
 ('"中文"','"中文"'),('1e20','100000000000000000000.0'),
 ('-1e-999','-0.0'),('1e-999','0.0'),
]
def canonical(raw):return json.dumps(json.loads(raw),sort_keys=True,separators=(",",":"),ensure_ascii=False)
calls=[]
for i,(a,b) in enumerate(cases):
    expected=canonical(a)==canonical(b)
    calls.append(f'if equivalent({json.dumps(a,ensure_ascii=False)},{json.dumps(b,ensure_ascii=False)}) != {str(expected).lower()} {{ println("FAIL {i}"); }}')
numbers=["0.0","-0.0","1e400","-1e400","5e-324","2.2250738585072014e-308","1.7976931348623157e308","1.7976931348623159e308","9007199254740993.0","1.00000000000000011102230246251565404236316680908203125","1.00000000000000033306690738754696212708950042724609375"]
rng=random.Random(812)
numbers += [str(rng.randrange(1,10**18))+"e"+str(rng.randrange(-30,20)) for _ in range(12)]
for i,raw in enumerate(numbers):
    value=float(raw); sign="-" if math.copysign(1,value)<0 else "+"
    if math.isinf(value): expected=sign+"inf"
    elif value==0: expected=sign+"0"
    else:
        n,d=abs(value).as_integer_ratio(); power=-(d.bit_length()-1)
        while n%2==0:n//=2;power+=1
        expected=sign+str(n)+"@"+str(power)
    calls.append(f'if key({json.dumps(raw)}) != {json.dumps(expected)} {{ println("KEY FAIL {i}"); }}')
put("src/review/main.es",'module review.main;\nimport edk.json.compare.equivalent;\nimport edk.json.binary64.key;\nimport std.io.println;\nflow main(args:Array<string>)->i32 ![Error<IndexError>,Error<IOError>] {\n'+"\n".join(calls)+'\nreturn 0;\n}\n')
put("etas.toml",'[package]\nname="compare-review"\nversion="0.1.0"\nedition="2026"\n[source]\nroot="src"\n[dependencies]\nstd={version="0.1"}\n[[bin]]\nname="review"\nmodule="review.main"\nflow="main"\n')
etas=os.environ.get("ETAS","/home/zhangpuyang/etas-project/interpreter-recheck.ttaidz/target/release/etas")
env={k:v for k,v in os.environ.items() if not k.startswith("ETAS_HOST_MODEL")}
env["ETAS_HOST_MEMORY"]="memory"
for args in (["pkg","lock",str(probe)],["run","--cache","off","--allow-effects","--format","text",str(probe)]):
    p=subprocess.run([etas,*args],text=True,capture_output=True,cwd=probe,env=env,timeout=300)
    if p.returncode or "FAIL" in p.stdout:raise AssertionError(p.stdout+"\n"+p.stderr)
put("acceptance.json",json.dumps({"passed":True,"cases":cases,"binary64_cases":numbers},ensure_ascii=False,indent=2))
print(json.dumps({"passed":True,"cases":len(cases),"binary64_cases":len(numbers),"probe":str(probe)}))
