# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@x-9lab/xlab` is a convention-over-configuration Koa server framework published to npm. Consumer projects depend on it and run the `xlab` CLI (defined in `src/bin/xlab`), which boots a server that auto-discovers the consumer's config, routes, middleware, cron jobs, and custom init logic from a `@server` directory in the consumer's project root. The `example/` directory is a working consumer project that runs against the local build.

Documentation, comments, and commit messages are written in Chinese.

## Commands

- `yarn dev` — swc compile `src` → `dist` in watch mode
- `yarn compile` — one-off swc compile
- `yarn build` — compile + emit type declarations (`tsc --emitDeclarationOnly` → `@types/`)
- `yarn test` — run `node --test` suites in `test/` (requires `yarn build` first; tests boot real servers from `example/`)
- `yarn changelog` — generate CHANGELOG.md (via `@x-drive/changelog`)
- Run the example app against local build: `yarn build`, then `cd example && yarn && yarn start-dev` (serves on port 3001)

There is no linter. `dist/` and `@types/` are gitignored build outputs but are both published to npm (`files` in package.json); entry points are `dist/index.js` / `@types/index.d.ts`. `example/node_modules/@x-9lab/xlab` is a `link:` symlink to the repo root so business code and the running server share one module instance.

## Build pipeline

swc compiles TypeScript to CommonJS (`.swcrc`, targets Node 20; engines `>=20`); tsc is used only for declaration emit into `@types/`. `tsconfig.json` has `strict: false` and `noImplicitAny: false`. `--copy-files` carries the extensionless CLI shim `src/bin/xlab` into `dist/`; `--strip-leading-paths` keeps the `dist/` layout flat.

## Architecture

### Boot flow

`src/bin/xlab` (Liftoff CLI) → reads consumer's `xlab.config.js` (options: `watch`, `businessDir`) → either `src/bin/watch.js` (auto-restart mode) or `server.boot()` → `src/cluster.ts` forks workers via Node cluster (or listens directly when `workers` is 0) → Koa app.

`src/server.ts` `boot()` runs explicit phases in order: `initEnv` (consumer `@env` module) → `loadConfig` → `.xlab` dot-files → custom `setup` hooks → middlewares → router → static serving → bad-request → cron → listen (`cluster.ts`) → custom `ready` hooks. Import order carries no initialization semantics; nothing reads config at require time. `shutdown()` (wired to SIGTERM/SIGINT) stops cron timers, has the master SIGTERM its workers, waits for in-flight requests (`shutdownTimeout`, default 10s), runs `shutdown` hooks, then exits. Worker refork uses backoff: 5 consecutive quick deaths (<10s uptime) stop the auto-restart.

### Public API (`src/index.ts`)

Nothing is installed on `global` (v2 breaking change; see MIGRATION.md). The package entry `src/index.ts` exports: `boot` / `shutdown`, `app` / `getApp`, `getSysConfig` / `setSysConfig`, `requireMod` / `requireModel` / `requireService`, `getLogger` / `masterLog` / `Log` / `globalLog`, `getXlabEnv` (`.xlab` data, ex-`XLAB`), and `defineApi`. Consumer business files import these from `@x-9lab/xlab` — which must resolve to the same module instance as the running server (true for normal installs; `example/` uses a `link:` dep for this).

Type support still lives in the global `XLab` namespace (types only); consumers extend `XLab.IModels` / `XLab.IServices` / `XLab.IConfig` via declaration merging. Internal components also augment `XLab.IConfig` this way (see `src/components/cron/index.ts`), so config typing is spread across component files.

New internal components must be registered in the `InternalComponents` interface in `src/components/index.ts` to be reachable through `requireMod`.

Custom modules (`@server/custom/`, enabled via the `custom` config array) export either a function (treated as `setup`) or a `{ setup, ready, shutdown }` hooks object.

### Config resolution (`src/config/`)

Environment comes from `ENV=` CLI arg or `NODE_ENV`: development / sandbox / production (numeric aliases `0`/`1`/`2`). Merge order: built-in defaults → consumer's `@server/@config/config.js` → env variant (`config.dev` / `config.sand`) → `config.lo` (local, never committed) → CLI args like `PORT=3001`. Separately, `.xlab` / `.xlab.<env>` dot-files (`key=value` lines, JSON-parsed values) load into `global.XLAB` for secrets. `src/default-x-config.ts` holds the `businessDir` setting (default `@server`), mutable by the CLI before the server module loads.

### Convention routing (`src/router.ts`)

Two-pass: `collect` walks the consumer's `@server/business/` tree gathering route files and `$`-dir middleware, then every module is normalized to `{ method, api, middlewares, handler }` before registration. Export shapes: a function, or an object `{ method?, api?, middleware?, handler, ignoreApiNameCheck? }` (`defineApi()` is an identity helper for typing). The array export form was removed in v2 — `normalize` throws on it. Filename rules: `index` is dropped from the path; a filename that is an HTTP verb (`get`/`post`/...) is dropped from the path and becomes the route's method. Special directories: `@`-prefixed are excluded from routing and used as plain modules; `$`-prefixed hold middleware applied to all routes at that level and below, including the business root (not recursive within the `$` dir; files run in filename sort order). Path params use `:name` directory names.

### Middleware (`src/middlewares.ts`)

Enabled and ordered via the `middlewares` config map (`{ name: true | {index, name, config} }`). Names matching the `INTERNAL_MIDDLEWARE` whitelist load from `src/middleware/`; anything else loads from the consumer's `@server/middleware/`. Router, static serving, and bad-request are always appended last, outside this mechanism.

### Cluster and cron

In cluster mode, workers talk to the master via messages dispatched to handlers registered in `src/components/cluster`. Cron jobs (`@server/cron/`, gated by `enableCron`) run only on the master unless `enableWorkerCron` is set; per-job interval/enable comes from the `crons` config keyed by filename (`delay` in seconds), with fallbacks to the job module's own `getDelay()` (ms) / `enable()` exports. The cron component is a `setTimeout` chain, not cron-expression based.

## Conventions

Coding style:

- TypeScript preferred for new frontend code
- 4-space indentation, camelCase identifiers, arrow functions, comma-first style in objects/imports
- Chinese comments are acceptable when they add local context
- **One commit = one independently revertible feature point.** Cross-area changes (backend/frontend/infra) must be split into separate commits.
- Commit subject format: `<type>(<scope>): <subject>` with `feat|fix|docs|style|refactor|perf|test|chore`.
- Commit body should include `Feature-Point:` and `Rollback-Plan:` lines.
- 使用中文进行编写中提交信息
- 不要带上 Anthropic 或 Claude 或 Claude Code 的信息

## Important

Use first-principles thinking: start from the raw requirements and the essence of the problem, not from conventions or templates.

1. Don’t assume I know exactly what I want. If the motivation or goal is unclear, pause and discuss it.
2. If the goal is clear but the path isn’t the shortest, tell me directly and suggest a better approach.
3. When problems arise, get to the root cause—don’t slap on patches. Every decision should be able to answer “why.”
4. Get to the point. Cut anything that doesn’t change the decision.
