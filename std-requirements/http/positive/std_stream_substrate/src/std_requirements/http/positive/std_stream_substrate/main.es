module std_requirements.http.positive.std_stream_substrate.main;

import std.codec.text.utf8_encode;
import std.http.codec.{HttpHeader, HttpWireRequest, HttpWireResponseHead, decode_response_head, encode_request};
import std.net.tcp.{Host as TcpHost, NetworkError, Port, TcpOptions, TcpStream, connect as tcp_connect};
import std.stream.{ByteLimit, StreamError, Timeout as StreamTimeout, close, flush, read_until_limit, write_all};
import std.tls.{Host as TlsHost, TlsConfig, TlsError, TlsStream, connect as tls_connect};

flow fallback_head() -> HttpWireResponseHead ![] {
    let headers: List<HttpHeader> = [];
    return HttpWireResponseHead {
        version = "HTTP/1.1",
        status = 500,
        reason = "",
        headers = headers,
    };
}

flow tls_round_trip(
    stream: TlsStream,
    request: HttpWireRequest,
    limit: ByteLimit,
    timeout: StreamTimeout,
) -> i32 ![Error<StreamError>] {
    let encoded = match encode_request(request) {
        Ok(bytes) => bytes,
        Err(_) => utf8_encode(""),
    };
    write_all(stream, encoded);
    flush(stream);
    let raw = read_until_limit(stream, limit, Some(timeout));
    close(stream);
    let head = match decode_response_head(raw) {
        Ok(value) => value,
        Err(_) => fallback_head(),
    };
    return head.status;
}

flow tcp_round_trip(
    stream: TcpStream,
    request: HttpWireRequest,
    limit: ByteLimit,
    timeout: StreamTimeout,
) -> i32 ![Error<StreamError>] {
    let encoded = match encode_request(request) {
        Ok(bytes) => bytes,
        Err(_) => utf8_encode(""),
    };
    write_all(stream, encoded);
    flush(stream);
    let raw = read_until_limit(stream, limit, Some(timeout));
    close(stream);
    let head = match decode_response_head(raw) {
        Ok(value) => value,
        Err(_) => fallback_head(),
    };
    return head.status;
}

flow open_tcp() -> TcpStream ![Error<NetworkError>] {
    return tcp_connect(TcpHost { host = "example.com" }, Port { port = 443 }, TcpOptions {});
}

flow wrap_tls(stream: TcpStream) -> TlsStream ![Error<TlsError>] {
    return tls_connect(stream, TlsHost { host = "example.com" }, TlsConfig {});
}

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}
