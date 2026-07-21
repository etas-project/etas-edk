module tests.edk.spec_impl_canonical_evidence.main;

spec LocalCapability;

type CanonicalEvidence = {
    value: string,
};

impl CanonicalEvidence ~ LocalCapability;

flow accepts<T ~ LocalCapability>(value: T) -> i32 ![] {
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    let canonical = CanonicalEvidence { value = "canonical" };
    return accepts(canonical) - 1;
}
