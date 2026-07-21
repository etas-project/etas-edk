module tests.edk.spec_impl_compat_equivalence.main;

spec LocalCapability;

type CanonicalEvidence = {
    value: string,
};

type CompatibilityEvidence = {
    value: string,
};

impl CanonicalEvidence ~ LocalCapability;
impl LocalCapability for CompatibilityEvidence;

flow accepts<T ~ LocalCapability>(value: T) -> i32 ![] {
    return 1;
}

flow main(args: Array<string>) -> i32 ![] {
    let canonical = CanonicalEvidence { value = "canonical" };
    let compatibility = CompatibilityEvidence { value = "compatibility" };
    return accepts(canonical) + accepts(compatibility) - 2;
}
