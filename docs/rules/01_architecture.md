# Architecture & API Contract Rules

## Design Principles

- Modular
- Scalable
- Easy to maintain
- Clear package boundaries
- Independent packages
- Hexagonal Architecture friendly

## Package Responsibilities

| Package | Responsibility |
|----------|----------------|
| core | Shared infrastructure |
| connectors | External communication |
| codec | Encode / Decode protocols |
| client | SDK + React |

## Constraints

- One package = one responsibility.
- Transport is separate from protocol.
- Codecs are pure functions.
- Connectors only move data.
- Business logic never depends on transport.
- Output sinks are interchangeable.
- New protocols should only require adding a new codec.
- New transports should only require adding a new connector.
- All downstream services should consume normalized events, never vendor-specific binary formats.
- Every public API endpoint, route, or shared utility must have an auditable unit test covering success, error, and edge paths.
- Any API change must include an impact check on existing tests; update or add tests before the task is marked complete.
- Tests must be deterministic and isolated; external dependencies (DB, Redis, queue) must be mocked or run in a controlled environment.
- Any code that reads `process.env` must have its variable declared in `.env.example` with a clear comment and, when appropriate, a sensible default or example value. If `.env.example` does not yet exist for an app/package, create one.
- No dead code: unused functions, exports, or files should be removed or reported. The codebase must not accumulate leftover scratch files or commented-out code.
- Avoid duplicate functions and logic (DRY). If the same logic appears in more than one place, extract it to a shared utility or report it.
- Every change must be scanned for newly introduced or exposed dead code and duplicates; findings must be reported to the user.

## Tooling & Lockfile

- Use `bun` for package management. Do not hand-edit `bun.lock`; only `bun install` / `bun add` / `bun remove` should change it.
- After adding, removing, or updating dependencies, commit the updated `bun.lock` and keep it reproducible.
- If formatter/linter/test runner is configured, run it before a task is considered complete.

## Database & Migrations

- Any Drizzle ORM schema change must be followed by generating a migration (`drizzle-kit generate`) and committing the generated files.
- Seeds and fixtures must be deterministic and safe to rerun in a clean environment.
- Migrations should be idempotent and reversible where possible.

## Security & Validation

- Never hardcode secrets, API keys, or credentials; use environment variables only.
- Validate all external input (body, query, params, headers, files) with Zod or equivalent before processing.
- Do not log secrets, tokens, or PII.
- Use ORM/parameterized queries; avoid raw SQL string concatenation.
- Normalize and validate file paths to prevent path traversal; static file handlers must set correct `Content-Type`.
- Authentication and authorization checks must live in middleware/route layer, not only inside business logic.

## Repository & Task Management

- Do not push directly to `main`; use feature branches.
- Branch names should follow convention: `feature/`, `fix/`, `hotfix/`, `refactor/`, or `task/<number>-<short-desc>`.
- Commit messages should be concise and describe the change.
- Keep tasks scoped; split into sub-tasks if a change crosses multiple domains.
- Completed task files stay in `docs/task/YYYY-MM-DD/`; do not delete them. Mark them with `## Status` and green checkboxes.

## Documentation

- Every new public API, shared utility, or schema change must be reflected in the relevant README/module docs.
- `.env.example` must stay in sync with code that reads environment variables.
- Update `CHANGELOG.md` (or equivalent) for user-facing changes.

## Error Handling & Logging

- Use the centralized `ApiError` / `ApiResponse` contract for all HTTP responses.
- Do not leak internal stack traces or sensitive details to the client; log them internally.
- Use structured logging (`pino`) with request/context IDs; avoid logging secrets, tokens, and PII.
- Errors must be observable: log to console and optionally to `app_logs`/observability sink.
- Log levels: `INFO` for business actions, `WARN` for recoverable issues, `ERROR` for failures that need attention.

## Database Transactions & Concurrency

- Use Drizzle ORM transactions for multi-step writes that must be atomic.
- Avoid `read → modify → write` patterns without a row-level lock or idempotency key when concurrent requests can modify the same row.
- Use `for update` or appropriate locks when checking state before acting.
- Make migration files idempotent and reversible where possible.
- Operations should be idempotent when retried (duplicate API calls, job retries).

## Queue / Job Conventions (BullMQ)

- Jobs must be idempotent: processing the same job twice should not corrupt data.
- Validate job payload before processing.
- Configure retries with exponential back-off and a dead-letter queue for persistent failures.
- Workers should log start/finish/failure and not swallow errors.

## Rate Limiting & Timeouts

- Apply rate limiting per user/IP/route; fail-open if Redis is unavailable unless security-critical.
- Set sensible timeouts on external HTTP calls and long-running operations.
- Add circuit breaker pattern for unreliable external services if possible.

## API Versioning & Backward Compatibility

- Prefer path/header versioning for breaking changes.
- Do not remove or rename response fields without deprecation period; keep old clients working.
- Document breaking changes in `CHANGELOG.md` and migration guide if needed.

## Pagination, Sorting & Filtering

- List endpoints must support pagination: `offset`/`limit` or `cursor` based.
- Standard query params: `sort`, `order`, `search`, and `filter[<field>]=<value>`.
- Always return list response with `data`, `meta`, and pagination info.

## Dependency & Package Boundaries

- Add dependencies only when necessary; prefer existing packages.
- Do not cross-import between `apps/*` packages; shared code goes to `packages/core` or `packages/<shared>`.
- Avoid circular dependencies.
- Keep `peerDependencies` and workspace protocol consistent in a monorepo.

## Observability & Health Checks

- Expose `/health` (liveness) and `/ready` (readiness) endpoints in every service.
- Include request/context IDs in logs and responses for traceability.
- Use structured logging (`pino`) and aggregate logs to an observable sink.
- Track key metrics: request latency, error rate, queue depth, DB connection pool, active WebSocket connections.
- Implement graceful shutdown: close HTTP server, DB/Redis/BullMQ connections, and flush logs on `SIGTERM`/`SIGINT`.

## Testing Strategy

- Prefer unit tests for pure logic and services; mock DB/Redis/external HTTP.
- Use integration tests for DB/Redis interactions; reset state between tests.
- Use E2E tests for critical user flows; run against a real-ish environment with seeded data.
- Factories/fixtures must be deterministic and safe to rerun.
- Each bug fix must include a regression test.

## Performance & Caching

- Cache read-heavy data in Redis with a clear TTL and invalidation strategy.
- Avoid N+1 queries; use Drizzle `with` relations or batched loaders.
- Set pagination defaults/max limits to prevent unbounded responses.
- Optimize hot paths; do not optimize prematurely without profiling data.

## Security Middleware & Headers

- Apply CORS, Helmet-like security headers, and CSP where appropriate.
- Order middleware carefully: RequestID -> Logger -> Security -> CORS -> Compression -> Timeout -> Rate Limit -> Auth -> Route handler.
- Validate and sanitize all input; never trust client-provided file paths.
- Keep dependencies up to date; audit for known vulnerabilities.

## Backup & Rollback

- Schedule automated database backups and test restores periodically.
- Keep migration files reversible where possible; document rollback steps for risky migrations.
- Version artifacts (Docker images, lockfile) per release for fast rollback.

## Client Contract for WS / SSE

- WebSocket/SSE endpoints must include the API version in the path (`/v1/ws/:topic`, `/v1/events/:topic`) or as a sub-protocol/header.
- Every event/message must carry a versioned envelope: `{ version, topic, payload, timestamp }`.
- Clients should send heartbeats and handle reconnections with exponential back-off.
- Document accepted message formats and topic semantics for SDK consumers.

## API Versioning & Backward Compatibility (All Protocols)

- **REST**: prefix paths with `/v1` (or `/v2`) and/or accept `X-API-Version` header.
- **WebSocket**: version in path (`/v1/ws/:topic`) and in every event envelope.
- **SSE**: version in path (`/v1/events/:topic`) and in event data envelope.
- **GraphQL**: version via URL segment (`/v1/graphql`) or schema directive; avoid breaking existing queries without deprecation.
- **tRPC**: version routers and procedure paths (`v1.user.list`) and expose under `/api/v1/trpc`.
- **gRPC**: encode version in package/proto file or service name.
- Do not remove or rename response fields without a deprecation period and `CHANGELOG` entry.
- Keep old clients working by supporting at least one previous major version during transition.

## REST API Response Contract

```ts
export type ApiVersion = "v1";

export type Meta = {
  code: number;
  status: "SUCCESS" | "ERROR";
  message?: string; // hanya dipakai saat SUCCESS
  version: ApiVersion;
};

export type ApiSuccess<T> = {
  data: T;
  error: null;
  meta: Meta & {
    status: "SUCCESS";
    message: string;
  };
};

export type ApiError = {
  data: null;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
  meta: Meta & {
    status: "ERROR";
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```
