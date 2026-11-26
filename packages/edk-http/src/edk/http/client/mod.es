module edk.http.client;

import edk.http.types.{HttpClient, HttpClientConfig};

public flow new(config: HttpClientConfig) -> HttpClient ![] {
    return { config = config };
}
