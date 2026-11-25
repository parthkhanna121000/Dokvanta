# Decisions

1. Backend: new TypeScript backend in `backend/src`; legacy JS kept intact. Frontend switches only after integration tests pass.
2. Document Intelligence retrieval stays in Node for now. The Python service focuses on AI Visual Edit. Boundaries stay modular so retrieval can move later.
3. Python PDF library: undecided. Evaluate candidates (extraction accuracy, coordinates, fonts, replacement, layout, performance, commercial licensing) in `tools/pdf-eval`, behind an adapter.
4. Vector storage: open. No dedicated vector DB until requirements justify one.
5. Legacy security: quarantined, not repaired. See `backend/LEGACY.md`.
6. Build only the infrastructure each module needs. Redis, S3 and the Python service wait for their modules.
