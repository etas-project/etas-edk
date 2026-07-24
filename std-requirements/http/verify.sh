#!/usr/bin/env sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
EDK_ROOT=$(CDPATH= cd -- "$ROOT/../.." && pwd)
EDK_HTTP="$EDK_ROOT/packages/edk-http"

cleanup() {
    find "$ROOT" "$EDK_HTTP" -name .etas -type d -prune -exec rm -rf {} +
}

tmpfile() {
    mktemp "${TMPDIR:-/tmp}/etas-http-verify.XXXXXX"
}

run_pass() {
    name=$1
    dir=$2
    shift 2
    printf 'PASS expected: %s\n' "$name"
    (cd "$dir" && "$@")
}

run_pkg_check_pass() {
    name=$1
    dir=$2
    printf 'PASS expected: %s\n' "$name"
    (cd "$dir" && etas pkg update . >/dev/null && etas check .)
}

run_pkg_run_value() {
    name=$1
    dir=$2
    expected=$3
    out=$(tmpfile)
    had_etas=0
    had_lock=0
    if [ -d "$dir/.etas" ]; then
        had_etas=1
    fi
    if [ -e "$dir/etas.lock" ]; then
        had_lock=1
    fi
    printf 'RUN expected: %s\n' "$name"
    (cd "$dir" && etas pkg update . >/dev/null && etas pkg lock . >/dev/null)
    if ! (cd "$dir" && etas run .) >"$out" 2>&1; then
        cat "$out"
        rm -f "$out"
        if [ "$had_etas" -eq 0 ]; then rm -rf "$dir/.etas"; fi
        if [ "$had_lock" -eq 0 ]; then rm -f "$dir/etas.lock"; fi
        return 1
    fi
    if ! grep -F "run value: {\"kind\":\"number\",\"type\":\"i32\",\"value\":\"$expected\"}" "$out" >/dev/null; then
        printf 'missing expected run value: %s\n' "$expected" >&2
        cat "$out" >&2
        rm -f "$out"
        if [ "$had_etas" -eq 0 ]; then rm -rf "$dir/.etas"; fi
        if [ "$had_lock" -eq 0 ]; then rm -f "$dir/etas.lock"; fi
        return 1
    fi
    rm -f "$out"
    if [ "$had_etas" -eq 0 ]; then rm -rf "$dir/.etas"; fi
    if [ "$had_lock" -eq 0 ]; then rm -f "$dir/etas.lock"; fi
}

run_effects_contains() {
    name=$1
    source_file=$2
    shift 2
    out=$(tmpfile)
    printf 'EFFECTS expected: %s\n' "$name"
    if ! (cd "$EDK_HTTP" && etas effects "$source_file") >"$out" 2>&1; then
        cat "$out"
        rm -f "$out"
        return 1
    fi
    for pattern in "$@"; do
        if ! grep -F "$pattern" "$out" >/dev/null; then
            printf 'missing expected effects pattern: %s\n' "$pattern" >&2
            cat "$out" >&2
            rm -f "$out"
            return 1
        fi
    done
    rm -f "$out"
}

run_file_contains() {
    name=$1
    file=$2
    shift 2
    printf 'SOURCE expected: %s\n' "$name"
    for pattern in "$@"; do
        if ! grep -F "$pattern" "$EDK_HTTP/$file" >/dev/null; then
            printf 'missing expected source pattern in %s: %s\n' "$file" "$pattern" >&2
            return 1
        fi
    done
}

run_file_not_contains() {
    name=$1
    file=$2
    shift 2
    printf 'SOURCE forbidden: %s\n' "$name"
    for pattern in "$@"; do
        if grep -F "$pattern" "$EDK_HTTP/$file" >/dev/null; then
            printf 'forbidden source pattern in %s: %s\n' "$file" "$pattern" >&2
            return 1
        fi
    done
}

run_repo_file_contains() {
    name=$1
    file=$2
    shift 2
    printf 'SOURCE expected: %s\n' "$name"
    for pattern in "$@"; do
        if ! grep -F "$pattern" "$EDK_ROOT/$file" >/dev/null; then
            printf 'missing expected source pattern in %s: %s\n' "$file" "$pattern" >&2
            return 1
        fi
    done
}

run_source_absent() {
    name=$1
    path=$2
    printf 'SOURCE absent: %s\n' "$name"
    if [ -e "$EDK_HTTP/$path" ]; then
        printf 'unexpected source path exists: %s\n' "$path" >&2
        return 1
    fi
}

run_expect_fail() {
    name=$1
    dir=$2
    pattern=$3
    shift 3
    out=$(tmpfile)
    printf 'FAIL expected: %s\n' "$name"
    set +e
    (cd "$dir" && "$@") >"$out" 2>&1
    status=$?
    set -e
    if [ "$status" -eq 0 ]; then
        printf 'command unexpectedly succeeded: %s\n' "$name" >&2
        cat "$out" >&2
        rm -f "$out"
        return 1
    fi
    if ! grep -F "$pattern" "$out" >/dev/null; then
        printf 'missing expected failure pattern: %s\n' "$pattern" >&2
        cat "$out" >&2
        rm -f "$out"
        return 1
    fi
    rm -f "$out"
}

run_pkg_expect_fail() {
    name=$1
    dir=$2
    pattern=$3
    shift 3
    (cd "$dir" && etas pkg update . >/dev/null)
    run_expect_fail "$name" "$dir" "$pattern" "$@"
}

run_pkg_expect_fail_patterns() {
    name=$1
    dir=$2
    shift 2
    (cd "$dir" && etas pkg update . >/dev/null)
    out=$(tmpfile)
    printf 'FAIL expected: %s\n' "$name"
    set +e
    (cd "$dir" && etas check .) >"$out" 2>&1
    status=$?
    set -e
    if [ "$status" -eq 0 ]; then
        printf 'command unexpectedly succeeded: %s\n' "$name" >&2
        cat "$out" >&2
        rm -f "$out"
        return 1
    fi
    for pattern in "$@"; do
        if ! grep -F "$pattern" "$out" >/dev/null; then
            printf 'missing expected failure pattern: %s\n' "$pattern" >&2
            cat "$out" >&2
            rm -f "$out"
            return 1
        fi
    done
    rm -f "$out"
}

run_edk_http_probe_check_pass() {
    name=$1
    probe=$2
    probe_tmp=$(mktemp -d "${TMPDIR:-/tmp}/etas-http-probe.XXXXXX")
    probe_pkg="$probe_tmp/edk-http"
    cp -R "$EDK_HTTP" "$probe_pkg"
    find "$probe_pkg" -name .etas -type d -prune -exec rm -rf {} +
    cp "$probe" "$probe_pkg/src/edk/http/root_wrapper_exact_policy_scope_probe.es"
    printf 'PASS expected: %s\n' "$name"
    if ! (cd "$probe_pkg" && etas check --all .); then
        rm -rf "$probe_tmp"
        return 1
    fi
    rm -rf "$probe_tmp"
}

run_loopback_allow_net_if_enabled() {
    if [ "${ETAS_HTTP_RUN_LOOPBACK:-0}" != "1" ]; then
        printf 'SKIP optional: loopback runtime fixture with explicit allow-net (set ETAS_HTTP_RUN_LOOPBACK=1)\n'
        return 0
    fi

    port_file=$(tmpfile)
    server_out=$(tmpfile)
    run_out=$(tmpfile)
    python3 "$ROOT/loopback_server.py" --port-file "$port_file" >"$server_out" 2>&1 &
    server_pid=$!

    i=0
    while [ ! -s "$port_file" ] && [ "$i" -lt 20 ]; do
        sleep 1
        i=$((i + 1))
    done

    if [ ! -s "$port_file" ]; then
        printf 'loopback server did not publish a port\n' >&2
        cat "$server_out" >&2
        kill "$server_pid" 2>/dev/null || true
        wait "$server_pid" 2>/dev/null || true
        rm -f "$port_file" "$server_out" "$run_out"
        return 1
    fi

    port=$(cat "$port_file")
    printf 'RUN expected: loopback runtime fixture with explicit allow-net\n'
    set +e
    (cd "$EDK_HTTP" && etas run . --allow-effects --allow-net "127.0.0.1:$port" --flow check_loopback_runtime_contract --args "$port") >"$run_out" 2>&1
    status=$?
    set -e

    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true

    if [ "$status" -ne 0 ] || ! grep -F 'run value: {"kind":"number","type":"i32","value":"0"}' "$run_out" >/dev/null; then
        cat "$server_out" >&2
        cat "$run_out" >&2
        rm -f "$port_file" "$server_out" "$run_out"
        return 1
    fi

    rm -f "$port_file" "$server_out" "$run_out"
}

trap cleanup EXIT INT TERM

run_pass "edk-http package check" "$EDK_HTTP" etas check --all .
run_pass "edk-http package smoke" "$EDK_HTTP" etas run .
run_pass "public request rejects unsupported method before transport" \
    "$EDK_HTTP" \
    etas run . --flow check_public_preflight_error_contract
run_pass "public request rejects invalid URL before transport" \
    "$EDK_HTTP" \
    etas run . --flow check_public_invalid_url_error_contract
run_pass "public string URL wrapper rejects invalid URL before transport" \
    "$EDK_HTTP" \
    etas run . --flow check_public_invalid_url_string_error_contract
run_pass "managed Connection header is injected and caller value is stripped" \
    "$EDK_HTTP" \
    etas run . --flow check_connection_header_contract
run_pass "public request rejects body limit before transport" \
    "$EDK_HTTP" \
    etas run . --flow check_public_body_limit_error_contract

run_file_contains "default handler delegates to source transport" \
    src/edk/http/api.es \
    "let EdkHttpApiDefault: ![EdkHttp => Error<HttpError> for HttpActionResponse] = handler" \
    "let internal = raise_request(request);" \
    "resume lower_response(execute_request(method, host, internal));"

run_source_absent "dry-run handler is not published as an empty shell" \
    src/edk/http/handlers/dry_run.es

run_file_contains "EdkHttp action is package-owned scoped contract" \
    src/edk/http/policy.es \
    "module edk.http.policy;" \
    "public alias HttpActionRequest = {" \
    "public alias HttpActionResponse = {" \
    "public effect EdkHttp extends Network" \
    "action request(request: HttpActionRequest) -> HttpActionResponse;"

run_file_not_contains "EdkHttp action has no private host binding" \
    src/edk/http/policy.es \
    "std.http.request" \
    "etas_host" \
    "intrinsic" \
    "handler {}"

run_file_not_contains "root API has no mock or private host fallback" \
    src/edk/http.es \
    "edk.http.mocks" \
    "mock_response" \
    "etas_host" \
    "intrinsic" \
    "handler {}"

run_file_not_contains "API implementation has no mock or private host fallback" \
    src/edk/http/api.es \
    "edk.http.mocks" \
    "mock_response" \
    "etas_host" \
    "intrinsic" \
    "handler {}"

run_file_contains "root facade delegates to API module" \
    src/edk/http.es \
    "import edk.http.api.{delete as api_delete, delete_url as api_delete_url, get as api_get, get_url as api_get_url, head as api_head, head_url as api_head_url, patch as api_patch, patch_url as api_patch_url, post as api_post, post_url as api_post_url, put as api_put, put_url as api_put_url};" \
    "return api_get(url, options);" \
    "return api_post(url, body, options);" \
    "return api_put(url, body, options);" \
    "return api_patch(url, body, options);" \
    "return api_delete(url, options);" \
    "return api_head(url, options);" \
    "return api_get_url(url, options);" \
    "return api_post_url(url, body, options);"

run_file_contains "API method wrappers delegate to request" \
    src/edk/http/api.es \
    "flow parse_request_url(value: string) -> PublicHttpUrl ![Error<HttpError>]" \
    "flow request(req: HttpRequest) -> HttpResponse ![EdkHttp.request, Error<HttpError>]" \
    "let response = perform EdkHttp.request(lower_request(normalized)) with EdkHttpApiDefault;" \
    "return raise_response(response);" \
    'return get_url(parse_request_url(url), options);' \
    'return post_url(parse_request_url(url), body, options);' \
    'return put_url(parse_request_url(url), body, options);' \
    'return patch_url(parse_request_url(url), body, options);' \
    'return delete_url(parse_request_url(url), options);' \
    'return head_url(parse_request_url(url), options);'

run_file_contains "internal std.json probe is source-visible without public HTTP JSON API" \
    src/edk/http/json_probe.es \
    "module edk.http.json_probe;" \
    "import std.json.{JsonError, JsonValue, parse, stringify};" \
    "flow parse_probe(input: string) -> Result<JsonValue, JsonError> ![]" \
    "flow stringify_probe(value: JsonValue) -> Result<string, JsonError> ![]"

run_file_not_contains "URL parser does not leak IndexError into string root API" \
    src/edk/http/url/parse.es \
    "Error<IndexError>" \
    "scheme_parts[" \
    "query_parts[" \
    "rest_parts[" \
    "authority_parts[" \
    "parts[index]"

run_file_not_contains "root wrappers do not perform method-specific actions directly" \
    src/edk/http.es \
    'perform EdkHttp.request("GET"' \
    'perform EdkHttp.request("POST"' \
    'perform EdkHttp.request("PUT"' \
    'perform EdkHttp.request("PATCH"' \
    'perform EdkHttp.request("DELETE"' \
    'perform EdkHttp.request("HEAD"'

run_file_not_contains "API wrappers do not perform method-specific actions directly" \
    src/edk/http/api.es \
    'perform EdkHttp.request("GET"' \
    'perform EdkHttp.request("POST"' \
    'perform EdkHttp.request("PUT"' \
    'perform EdkHttp.request("PATCH"' \
    'perform EdkHttp.request("DELETE"' \
    'perform EdkHttp.request("HEAD"'

run_file_not_contains "transport has no mock or private host fallback" \
    src/edk/http/transport.es \
    "edk.http.mocks" \
    "mock_response" \
    "etas_host" \
    "intrinsic" \
    "handler {}"

run_file_contains "transport dogfoods public std substrate calls" \
    src/edk/http/transport.es \
    "std.net.tcp" \
    "connect as tcp_connect" \
    "std.tls" \
    "connect as tls_connect" \
    "std.stream" \
    "write_all" \
    "read_until_limit" \
    "flush" \
    "close" \
    "std.http.codec" \
    "encode_request as encode_wire_request" \
    "decode_response_head as decode_wire_response_head" \
    "decode_response as decode_wire_response"

run_file_contains "body helpers preserve raw bytes" \
    src/edk/http/types.es \
    "raw: bytes" \
    "text: string" \
    "length_bytes: usize"

run_file_contains "raw byte request bodies compute length internally" \
    src/edk/http/body/bytes.es \
    "import std.bytes.len as bytes_len;" \
    "length_bytes = bytes_len(raw)"

run_file_not_contains "raw byte request bodies do not fall back to zero length" \
    src/edk/http/body/bytes.es \
    "Err(_) => 0" \
    "raw_length_bytes"

run_file_contains "request bodies lower as bytes not text fallback" \
    src/edk/http/wire/lower_request.es \
    "body = request.body.raw"

run_file_contains "wire lowering injects checked content length" \
    src/edk/http/wire/lower_request.es \
    "content-length" \
    "to_string_usize(body_length)" \
    "lower_wire_headers(request.headers, request.url, request.body.length_bytes)"

run_file_contains "wire lowering requests connection close" \
    src/edk/http/wire/lower_request.es \
    'name = "connection"' \
    'value = "close"'

run_file_contains "package smoke checks content length injection" \
    src/edk/http/package_smoke.es \
    'count_wire_header(body_wire.headers, "content-length") != 1' \
    'count_wire_header(managed_wire.headers, "content-length") != 0' \
    'flow check_connection_header_contract' \
    'count_wire_header(wire.headers, "connection") != 1' \
    'count_wire_header(wire.headers, "Connection") != 0'

run_file_contains "request body limit uses byte length" \
    src/edk/http/wire/body_limit.es \
    "length_bytes <= limit.max_bytes" \
    "body.length_bytes"

run_file_contains "transport returns decoded response bytes" \
    src/edk/http/transport.es \
    "http_response_from_wire_bytes_checked" \
    "return response_from_wire_checked(head, response);"

run_file_contains "response body bytes decode through std text codec" \
    src/edk/http/wire/decode_response.es \
    "import std.codec.text.{InvalidUtf8, Replace, Strict, utf8_decode, utf8_encode};" \
    "let decoded = match utf8_decode(raw, Replace)" \
    "text = decoded" \
    "match utf8_decode(raw, Strict)" \
    "Err(InvalidUtf8) => Err(codec_error(\"HTTP response body is not valid UTF-8\"))"

run_file_contains "package smoke covers decoded raw response bytes" \
    src/edk/http/package_smoke.es \
    "http_response_from_wire_bytes" \
    "HttpWireResponse {" \
    'raw_wire_response.body.text != "raw-body"'

run_file_not_contains "transport does not block decoded response bytes" \
    src/edk/http/transport.es \
    "response_body_substrate_blocked" \
    "response_body_blocked"

run_file_contains "transport maps substrate failures to HttpError" \
    src/edk/http/transport.es \
    'network_transport_error("TCP connect failed")' \
    'tls_transport_error("TLS handshake failed")' \
    'stream_transport_error("TLS stream write failed")' \
    'stream_transport_error("TLS stream flush failed")' \
    'stream_transport_error("TLS stream close failed")' \
    'stream_transport_error("TCP stream write failed")' \
    'stream_transport_error("TCP stream flush failed")' \
    'stream_transport_error("TCP stream close failed")' \
    'response_body_limit_error("TLS response body exceeded configured body limit")' \
    'response_body_limit_error("TCP response body exceeded configured body limit")' \
    'response_body_read_error("TLS response body read failed or timed out")' \
    'response_body_read_error("TCP response body read failed or timed out")' \
    'codec_error("HTTP request wire encoding failed")' \
    'codec_error("HTTP response head decoding failed")' \
    'codec_error("HTTP response decoding failed")' \
    'codec_error("HTTP response status is invalid")'

run_file_contains "transport closes open streams before raising source-visible errors" \
    src/edk/http/transport.es \
    "close_tls_after_error(stream);" \
    "close_tcp_after_error(stream);" \
    "close_tcp_after_error(tcp);" \
    "finish raise_http_error(stream_transport_error" \
    "finish raise_http_error(response_body_read_error" \
    "finish raise_http_error(tls_transport_error"

run_file_contains "transport enforces response body limit at read boundary" \
    src/edk/http/transport.es \
    "flow stream_limit(request: HttpRequest) -> StreamByteLimit ![Error<HttpError>]" \
    "parse_i32(to_string_usize(request.body_limit.max_bytes))" \
    'response_body_limit_error("response body limit exceeds std.stream ByteLimit range")' \
    "let limit = stream_limit(request);" \
    "read_until_limit(stream, limit, stream_timeout(request))" \
    "Error<StreamError>.raise(LimitExceeded)" \
    'response_body_limit_error("TLS response body exceeded configured body limit")' \
    'response_body_limit_error("TCP response body exceeded configured body limit")'

run_file_not_contains "transport does not use unbounded response reads" \
    src/edk/http/transport.es \
    "read_all" \
    "StreamByteLimit { bytes = 0" \
    "StreamByteLimit { bytes = -"

run_file_not_contains "default handler has no mock or private host fallback" \
    src/edk/http/handlers/default.es \
    "edk.http.mocks" \
    "mock_response" \
    "etas_host" \
    "intrinsic" \
    "handler {}"

run_file_contains "unmatched mocks return errors not fake responses" \
    src/edk/http/mocks/routes.es \
    "matched = false" \
    "response_status = -1" \
    'message = "mock route not matched"'

run_file_not_contains "unmatched mocks do not use status zero" \
    src/edk/http/mocks/routes.es \
    "response_status = 0" \
    "status = 0"

run_repo_file_contains "loopback server fixture covers real HTTP success and error routes" \
    std-requirements/http/loopback_server.py \
    "class LoopbackHandler" \
    'self.path == "/hello"' \
    '"x-edk-loopback": "yes"' \
    '"/echo"' \
    'self.path == "/large"' \
    'self.path == "/malformed"'

run_effects_contains "root API requests EdkHttp.request" \
    src/edk/http/package_api_contract.es \
    "flow check_get_url" \
    "flow check_api_get" \
    "flow check_api_post" \
    "flow check_get" \
    "EdkHttp.request" \
    "Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]" \
    "Tls.handshake[std.tls.server_name]" \
    "Stream.write[std.stream.stream]" \
    "Stream.flush[std.stream.stream]" \
    "Stream.read[std.stream.stream]" \
    "Stream.close[std.stream.stream]" \
    "requires-orchestration[host=Tcp, Stream, Tls; features=EffectHandler]" \
    "flow check_post"

run_effects_contains "transport requests std substrate actions" \
    src/edk/http/transport.es \
    "flow close_tls_after_error" \
    "flow close_tcp_after_error" \
    "flow execute_request" \
    "Net.tcp_connect[std.net.tcp.host, std.net.tcp.port]" \
    "Tls.handshake[std.tls.server_name]" \
    "Stream.write[std.stream.stream]" \
    "Stream.flush[std.stream.stream]" \
    "Stream.read[std.stream.stream]" \
    "Stream.close[std.stream.stream]" \
    "requires-orchestration[host=Tcp, Stream, Tls; features=EffectHandler]"

run_pkg_check_pass "request construction and body preservation" "$ROOT/positive/edk_http_request_contract"
run_pkg_check_pass "HTTP error mapping contract" "$ROOT/positive/edk_http_error_mapping_contract"
run_pkg_run_value "std.bytes.len is runtime-callable" "$ROOT/positive/std_bytes_len_runtime" 5
run_pkg_run_value "HTTP codec Result matches Ok and Err(MalformedMessage)" "$ROOT/positive/http_codec_result_match" 0
run_pkg_run_value "std.codec.text Strict and Replace values decode text" "$ROOT/positive/http_text_decode_modes" 0
run_pkg_run_value "HTTP response body bytes decode to text" "$ROOT/positive/http_response_body_text_decode" 0
run_pkg_run_value "directly imported Stream LimitExceeded value is source-visible" "$ROOT/positive/stream_error_limit_import" 7
run_pkg_run_value "qualified StreamError.LimitExceeded value is source-visible" "$ROOT/positive/stream_error_limit_variant" 0
run_pkg_run_value "positive pure HTTP fixture executes full preflight rejections" \
    "$EDK_ROOT/tests/fixtures/positive/edk_http_pure_surface" \
    0
run_pass "TcpStream and TlsStream satisfy std.stream substrate" "$ROOT/positive/std_stream_substrate" etas check .
run_pass "HttpWireRequest headers and body bytes are source-visible" "$ROOT/positive/http_wire_request_shape" etas check .
run_pkg_check_pass "external root API checked-effect facts replay" "$ROOT/positive/external_root_api_effect_facts"

run_expect_fail "private std.http.request binding is unavailable" \
    "$ROOT/negative/private_host_binding_forbidden" \
    'missing imported module `std.http.request`' \
    etas check .

run_pkg_expect_fail_patterns "client execution entries are unavailable" \
    "$ROOT/negative/client_request_entry_forbidden" \
    'missing exported item `delete` in module `edk.http.client`' \
    'missing exported item `get` in module `edk.http.client`' \
    'missing exported item `head` in module `edk.http.client`' \
    'missing exported item `patch` in module `edk.http.client`' \
    'missing exported item `post` in module `edk.http.client`' \
    'missing exported item `put` in module `edk.http.client`' \
    'missing exported item `request.request` in module `edk.http.client`'

run_pkg_expect_fail_patterns "opinionated HTTP shortcuts are unavailable" \
    "$ROOT/negative/opinionated_api_forbidden" \
    'missing exported item `post_json` in module `edk.http`' \
    'missing exported item `post_json` in module `edk.http.api`' \
    'missing exported item `tools.fetch_json` in module `edk.http`' \
    'missing exported item `tools.fetch_text` in module `edk.http`' \
    'missing exported item `tools.submit_json` in module `edk.http`'

run_expect_fail "empty EdkHttp handler fails closed at runtime" \
    "$ROOT/negative/empty_handler_forbidden" \
    "type::EmptyHandler" \
    etas run .

run_expect_fail "loopback runtime fixture fails closed without allow-net" \
    "$EDK_HTTP" \
    "analysis::MissingHostHandler" \
    etas run . --flow check_loopback_runtime_contract --args 1
run_loopback_allow_net_if_enabled

run_pkg_check_pass "direct EdkHttp action checks without handler" "$ROOT/negative/unhandled_action_no_handler"
run_expect_fail "direct EdkHttp action does not run without handler" \
    "$ROOT/negative/unhandled_action_no_handler" \
    "analysis::UnhandledEffectAction" \
    etas run .

printf 'HTTP std requirement verification completed.\n'
