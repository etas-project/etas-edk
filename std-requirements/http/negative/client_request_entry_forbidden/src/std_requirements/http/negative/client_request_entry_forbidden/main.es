module std_requirements.http.negative.client_request_entry_forbidden.main;

import edk.http.client.delete as client_delete;
import edk.http.client.get;
import edk.http.client.head;
import edk.http.client.patch;
import edk.http.client.post;
import edk.http.client.put;
import edk.http.client.request.request as client_request;

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}
