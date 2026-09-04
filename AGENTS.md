# Agent Memory — d-pimpinan/backend

You are working in `D:\@kantor\khub\d-pimpinan\backend`.
**At the start of every session, read these files first:**

- `docs/README.md` — task/file conventions and the three rule prompts
- `docs/SETUP.md` — AI workflow, commands, and checklist
- `docs/roles/backend.md` — backend engineer persona and constraints
- `docs/roles/architect.md` — systems architect persona (use for architecture / inter-service communication discussions)
- `docs/rules/01_architecture.md` — architecture, API contract, and quality rules

## Project context

- Stack: Hono + Bun + Drizzle ORM + PostgreSQL + Redis/BullMQ.
- Monorepo under `apps/` (e.g. `auth-service`, `gateway`) and shared `packages/`.
- `apps/gateway/src/proxy/auth.proxy.ts` is a thin wrapper: it only re-exports `createProxy(services.AUTH_SERVICE)`.
- Default role for tasks: `docs/roles/backend.md`.
- Task journal lives in `docs/task/YYYY-MM-DD/NN_description[_done].md`. Always check existing tasks before creating or implementing a new one.
- API response contract and constraints are in `docs/rules/01_architecture.md`.

## Working rules

- Do not ask the user to `Get-Content` a file unless you genuinely need content that is not already described in the docs or this file.
- If `graphify-out/graph.json` exists, query it for codebase questions before re-reading source files.
- Remember completed/pending tasks from `docs/task/` and update task files with `[x]` and `_done` suffix when finished.
- Follow the architecture rules, API contract, and role constraints in every edit.
