# edk-eval

Initial source modules:

- `edk.eval.effects`
- `edk.eval.types`
- `edk.eval.errors`
- `edk.eval.golden`
- `edk.eval.trace`
- `edk.eval.assertions`
- `edk.eval.pure.diff`
- `edk.eval.pure.trace_match`
- `edk.eval.mocks.eval_store`
- `edk.eval.tools.eval`

`golden.read_fixture` and `golden.write_result` perform package-owned
`EdkEval.*` actions and declare the underlying `EdkWorkspace.*` requirement in
their public effect rows. Pure diff, assertion, and trace-match helpers are
implemented without host bindings.

The pure/mock surface covers stable assertion and text-diff diagnostics,
including newline/carriage-return escaping for single-line golden and diff
messages, trace expectation validation, trace action-name token validation with
tab/URL-token rejection, strict ordered trace matching, non-increasing order
rejection, duplicate expectation occurrence matching, suite/case/result token
validation with tab/URL-token rejection, suite root escape rejection for
absolute paths, `..` segments, backslashes, colon-style path tokens, and tab
control characters, deterministic fixture/result/receipt constructors, write
receipt path validation, and in-memory fixture summaries. Pure
`compare_golden`/
`summarize_eval_result` tool delegation is covered by source fixtures rather
than by the executable package smoke entry, because tools are model-callable
boundaries and are not ordinary runtime call targets. These helpers do not read
or write golden files and do not execute test cases. `run_eval_case` is not part
of the pure surface because it exposes `EdkEval.read` and `EdkWorkspace.read`.

Package-mode verification now passes with `etas pkg update .`, `etas pkg lock
.`, `etas check --all .`, and `etas run .`. This verifies the source package
and pure package smoke flow; it does not publish an eval-store runtime handler,
hidden filesystem IO, or a fake evaluation runner.

No default eval-store handler is published in this slice.
