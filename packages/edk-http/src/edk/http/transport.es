module edk.http.transport;

import std.http.codec.{HttpWireResponse, HttpWireResponseHead, decode_response as decode_wire_response, decode_response_head as decode_wire_response_head, encode_request as encode_wire_request};
import std.net.tcp.{NetworkError, Port as TcpPort, TcpStream, connect as tcp_connect};
import std.stream.{ByteLimit as StreamByteLimit, Cancelled, Closed, Interrupted, LimitExceeded, StreamError, TimedOut, Timeout as StreamTimeout, close, flush, read_until_limit, write_all};
import std.text.{from_i32, parse_u16, parse_u128};
import std.tls.{TlsError as StdTlsError, TlsStream, connect as tls_connect};
import edk.http.errors.{codec_error, network_transport_error, response_body_limit_error, stream_cancelled_for_phase, stream_closed_for_phase, stream_host_for_phase, stream_interrupted_for_phase, stream_limit_for_phase, stream_timeout_for_phase, tls_transport_error};
import edk.http.handlers.preflight.preflight_request;
import edk.http.pure.status.is_valid_status;
import edk.http.types.{HttpMethod, HttpRequest, HttpResponse};
import edk.http.url.scope.default_port;
import edk.http.wire.decode_response.http_response_from_wire_bytes_checked;
import edk.http.wire.lower_request.lower_wire_request;

public alias HttpError = {
    kind: string,
    message: string,
};

flow raise_http_error(error: HttpError) -> never ![Error<HttpError>]
{
    return perform Error<HttpError>.raise(error);
}

flow validate_request(method: HttpMethod, host: string, request: HttpRequest) -> unit ![Error<HttpError>]
{
    let preflight = preflight_request(method, host, request);
    if !preflight.ok {
        raise_http_error(preflight.error);
    }
    return;
}

flow encode_checked(request: HttpRequest) -> bytes ![Error<HttpError>]
{
    return match encode_wire_request(lower_wire_request(request)) {
        Ok(encoded) => encoded,
        Err(_) => raise_http_error(codec_error("HTTP request wire encoding failed")),
    };
}

flow decode_response_checked(raw: bytes) -> HttpWireResponse ![Error<HttpError>]
{
    return match decode_wire_response(raw) {
        Ok(decoded) => decoded,
        Err(_) => raise_http_error(codec_error("HTTP response decoding failed")),
    };
}

flow decode_response_head_checked(raw: bytes) -> HttpWireResponseHead ![Error<HttpError>]
{
    return match decode_wire_response_head(raw) {
        Ok(decoded) => decoded,
        Err(_) => raise_http_error(codec_error("HTTP response head decoding failed")),
    };
}

flow validate_response_head(head: HttpWireResponseHead) -> unit ![Error<HttpError>]
{
    if !is_valid_status(head.status) {
        raise_http_error(codec_error("HTTP response status is invalid"));
    }
    return;
}

flow response_from_wire_checked(head: HttpWireResponseHead, response: HttpWireResponse) -> HttpResponse ![Error<HttpError>]
{
    if response.head.status != head.status {
        raise_http_error(codec_error("HTTP response head mismatch"));
    }
    return match http_response_from_wire_bytes_checked(response) {
        Ok(value) => value,
        Err(error) => raise_http_error(error),
    };
}

flow stream_timeout(request: HttpRequest) -> Option<StreamTimeout> ![Error<HttpError>] {
    let millis = match parse_u128(from_i32(request.timeout.millis)) {
        Ok(value) => value,
        Err(_) => raise_http_error(network_transport_error("invalid stream timeout")),
    };
    return Some(std.runtime.time.Duration.from_millis(millis));
}

flow stream_limit(request: HttpRequest) -> StreamByteLimit ![] {
    return std.stream.ByteLimit { bytes = request.body_limit.max_bytes };
}

flow ignore_close_error(err: StreamError) -> unit ![]
{
    return;
}

flow close_tls_best_effort(stream: TlsStream) -> unit ![]
{
    close(stream) with {
        Error<StreamError>.raise(err) => {
            finish ignore_close_error(err);
        }
    };
    return;
}

flow close_tcp_best_effort(stream: TcpStream) -> unit ![]
{
    close(stream) with {
        Error<StreamError>.raise(err) => {
            finish ignore_close_error(err);
        }
    };
    return;
}

flow stream_failure(error: StreamError, phase: string) -> HttpError ![] {
    return match error {
        TimedOut => stream_timeout_for_phase(phase),
        Cancelled => stream_cancelled_for_phase(phase),
        Closed => stream_closed_for_phase(phase),
        Interrupted => stream_interrupted_for_phase(phase),
        LimitExceeded => stream_limit_for_phase(phase),
        _ => stream_host_for_phase(phase),
    };
}

flow exchange_tls(stream: TlsStream, encoded: bytes, request: HttpRequest) -> HttpResponse ![Error<HttpError>]
{
    write_all(stream, encoded) with {
        Error<StreamError>.raise(error) => {
            close_tls_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TLS request write"));
        }
    };
    flush(stream) with {
        Error<StreamError>.raise(error) => {
            close_tls_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TLS request flush"));
        }
    };
    let limit = stream_limit(request);
    let raw = read_until_limit(stream, limit, stream_timeout(request)) with {
        Error<StreamError>.raise(error) => {
            close_tls_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TLS response read"));
        }
    };
    close_tls_best_effort(stream);
    let head = decode_response_head_checked(raw);
    validate_response_head(head);
    let response = decode_response_checked(raw);
    return response_from_wire_checked(head, response);
}

flow exchange_tcp(stream: TcpStream, encoded: bytes, request: HttpRequest) -> HttpResponse ![Error<HttpError>]
{
    write_all(stream, encoded) with {
        Error<StreamError>.raise(error) => {
            close_tcp_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TCP request write"));
        }
    };
    flush(stream) with {
        Error<StreamError>.raise(error) => {
            close_tcp_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TCP request flush"));
        }
    };
    let limit = stream_limit(request);
    let raw = read_until_limit(stream, limit, stream_timeout(request)) with {
        Error<StreamError>.raise(error) => {
            close_tcp_best_effort(stream);
            finish raise_http_error(stream_failure(error, "TCP response read"));
        }
    };
    close_tcp_best_effort(stream);
    let head = decode_response_head_checked(raw);
    validate_response_head(head);
    let response = decode_response_checked(raw);
    return response_from_wire_checked(head, response);
}

flow execute_transport(encoded: bytes, request: HttpRequest) -> HttpResponse ![Error<HttpError>]
{
    let host = match std.net.tcp.Host.parse(request.url.host) {
        Ok(value) => value,
        Err(err) => raise_http_error(network_transport_error(err.message)),
    };
    let port_number = match parse_u16(from_i32(default_port(request.url))) {
        Ok(value) => value,
        Err(_) => raise_http_error(network_transport_error("invalid TCP port")),
    };
    let port = match std.net.tcp.Port.new(port_number) {
        Ok(value) => value,
        Err(err) => raise_http_error(network_transport_error(err.message)),
    };
    let tcp = tcp_connect(host, port) with {
        Error<NetworkError>.raise(err) => {
            finish raise_http_error(network_transport_error("TCP connect failed"));
        }
    };

    if request.url.scheme == "https" {
        let tls = tls_connect(tcp, host) with {
            Error<StdTlsError>.raise(err) => {
                close_tcp_best_effort(tcp);
                finish raise_http_error(tls_transport_error("TLS handshake failed"));
            }
        };
        return exchange_tls(tls, encoded, request);
    }
    return exchange_tcp(tcp, encoded, request);
}

public flow execute_request(method: HttpMethod, host: string, request: HttpRequest) -> HttpResponse ![Error<HttpError>]
{
    validate_request(method, host, request);
    let encoded = encode_checked(request);
    return execute_transport(encoded, request);
}
