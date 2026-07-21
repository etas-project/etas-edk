module edk.db.pool;

import edk.db.types.PoolOptions;

public flow pool_options(max_connections: i32, connect_timeout_millis: i32) -> PoolOptions ![] {
    return PoolOptions {
        max_connections = max_connections,
        connect_timeout_millis = connect_timeout_millis,
    };
}

public flow default_pool_options() -> PoolOptions ![] {
    return PoolOptions {
        max_connections = 8,
        connect_timeout_millis = 30000,
    };
}
