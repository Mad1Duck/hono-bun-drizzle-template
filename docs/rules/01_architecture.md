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

## REST API Response Contract

```ts
export type Meta = {
  code: number;
  status: "SUCCESS" | "ERROR";
  message?: string; // hanya dipakai saat SUCCESS
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
