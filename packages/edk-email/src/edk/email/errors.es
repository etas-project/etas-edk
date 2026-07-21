module edk.email.errors;

public type EmailError = {
    code: string,
    message: string,
};

public type AddressError = {
    input: string,
    message: string,
};

public type MimeError = {
    message: string,
};

public type SmtpError = {
    host: string,
    message: string,
};

public type ProviderError = {
    provider: string,
    message: string,
};

public type RateLimitError = {
    provider: string,
    retry_after_millis: i32,
    message: string,
};
