module edk.db.transaction;

import edk.db.types.TransactionOptions;

public flow transaction_options(read_only: bool, isolation: string) -> TransactionOptions ![] {
    return TransactionOptions {
        read_only = read_only,
        isolation = isolation,
    };
}

public flow read_write_transaction() -> TransactionOptions ![] {
    return TransactionOptions { read_only = false, isolation = "default" };
}

public flow read_only_transaction() -> TransactionOptions ![] {
    return TransactionOptions { read_only = true, isolation = "default" };
}
