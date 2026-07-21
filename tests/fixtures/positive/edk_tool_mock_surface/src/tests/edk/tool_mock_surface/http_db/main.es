module tests.edk.tool_mock_surface.http_db.main;

import edk.db.mocks.in_memory.empty_query_result;
import edk.db.pure.sql_check.{classify_command, classify_query};
import edk.db.sql.{sql_command, sql_query};
import edk.db.tools.query.explain_query;
import edk.http.client.defaults.default_request;
import edk.http.errors.HttpError;
import edk.http.headers.is_valid_header_name;
import edk.http.mocks.server.text_response;
import edk.http.pure.method.{get_method, http_method_value};
import edk.http.types.PublicHttpUrl;
import edk.http.url.{https, is_supported_scheme, public_url_value};

flow must_url(result: Result<PublicHttpUrl, HttpError>) -> PublicHttpUrl ![Error<HttpError>] {
    return match result {
        Ok(url) => url,
        Err(error) => perform Error<HttpError>.raise(error),
    };
}

flow main(args: Array<string>) -> i32 ![Error<HttpError>] {
    let url = must_url(https("example.com", "/health"));
    let url_value = public_url_value(url);
    let request = default_request(get_method(), url);
    let mock = text_response("ok");
    let readonly_query = sql_query("select 1");
    let plan = classify_query(readonly_query);
    let explained = explain_query(readonly_query);
    let mutation = classify_command(sql_command("delete from queue"));
    let result = empty_query_result();
    let body = mock.body.text;

    if !is_supported_scheme(url_value.scheme) { return 1; }
    if !is_valid_header_name("x-edk-test") { return 1; }
    if http_method_value(request.method) != "GET" { return 1; }
    if request.timeout.millis != 30000 { return 1; }
    if !request.redirect.follow { return 1; }
    if mock.status != 200 { return 1; }
    if mock.body.media_type != "text/plain" { return 1; }
    if !plan.readonly { return 1; }
    if explained.kind != "readonly" { return 1; }
    if !mutation.mutation { return 1; }
    if mutation.readonly { return 1; }
    if result.row_count != 0 { return 1; }
    if body != "ok" { return 1; }
    return 0;
}
