module tests.edk.negative.old_trait_keyword_forbidden.main;

trait LegacyCapability;

type LegacyEvidence;

impl LegacyEvidence ~ LegacyCapability;

flow main(args: Array<string>) -> i32 ![] {
    return 0;
}
