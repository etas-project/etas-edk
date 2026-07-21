# edk-vector

Initial source modules:

- `edk.vector.effects`
- `edk.vector.types`
- `edk.vector.errors`
- `edk.vector.store`
- `edk.vector.embed`
- `edk.vector.retrieve`
- `edk.vector.pure.similarity`
- `edk.vector.pure.chunking`
- `edk.vector.pure.filter_match`
- `edk.vector.mocks.store`
- `edk.vector.tools.retrieve`
- `edk.vector.policies.vector_policies`

`embed`, `search`, `upsert`, and `retrieve` expose package-owned actions:
`EdkEmbedding.embed`, `EdkVector.search`, and `EdkVector.write`. No default
embedding provider, vector store, or HTTP-backed handler is published yet.

The package must not use removed std actions such as `Agentic.embed`; embedding
is explicitly owned by `EdkEmbedding`.

Provider-specific flows that would depend on `edk-http` are pending until
cross-EDK path dependency materialization and the required provider substrate are
available.

`edk.vector.package_smoke` covers deterministic similarity with dot product,
L1 distance, and squared L2 distance, chunking policy validation, line chunking,
line-only policy chunk aggregation with zero overlap, rejection of overlap
policies for that line-only helper, filter matching, rejection of value-only or
unsafe filters, store/model/record and query shape validation, conservative
store/model/record/metadata token validation, top-k bounds, model-dimension
compatibility, query construction, and mock result/write receipt constructors
without invoking embedding or vector store handlers.
