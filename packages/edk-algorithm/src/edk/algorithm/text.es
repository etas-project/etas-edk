module edk.algorithm.text;

public flow clamp_i32(value: i32, low: i32, high: i32) -> i32 ![] {
    if value < low {
        return low;
    }
    if value > high {
        return high;
    }
    return value;
}
