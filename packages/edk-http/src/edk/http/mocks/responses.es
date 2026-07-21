module edk.http.mocks.responses;

import edk.http.mocks.server.text_response;
import edk.http.types.HttpResponse;

public flow deterministic_text(body: string) -> HttpResponse ![] {
    return text_response(body);
}
