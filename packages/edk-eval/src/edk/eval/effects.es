module edk.eval.effects;

import edk.eval.types.{EvalFixture, EvalResult, EvalSuiteRef, EvalWriteReceipt};

public effect EdkEval extends FileIO {
    action read(suite: EvalSuiteRef) -> EvalFixture;
    action write(suite: EvalSuiteRef, result: EvalResult) -> EvalWriteReceipt;
}
