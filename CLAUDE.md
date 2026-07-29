# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@x-9lab/xlab` is a convention-over-configuration Koa server framework published to npm. Consumer projects depend on it and run the `xlab` CLI (defined in `src/bin/xlab`), which boots a server that auto-discovers the consumer's config, routes, middleware, cron jobs, and custom init logic from a `@server` directory in the consumer's project root. The `example/` directory is a working consumer project that runs against the local build.

Documentation, comments, and commit messages are written in Chinese.

## Commands

- `yarn dev` — swc compile `src` → `dist` in watch mode
- `yarn compile` — one-off swc compile
- `yarn build` — compile + emit type declarations (`tsc --emitDeclarationOnly` → `@types/`)
- `yarn changelog` — generate CHANGELOG.md (via `@x-drive/changelog`)
- Run the example app against local build: `yarn build`, then `cd example && yarn && yarn start-dev` (serves on port 3001)

There is no test suite and no linter. `dist/` and `@types/` are gitignored build outputs but are both published to npm (`files` in package.json); the types entry point is `@types/global.d.ts`.

## Build pipeline

swc compiles TypeScript to CommonJS (`.swcrc`, targets Node 16); tsc is used only for declaration emit into `@types/`. `tsconfig.json` has `strict: false` and `noImplicitAny: false`. The `-D ./src/bin` flag in the compile scripts copies `src/bin/` (the CLI shim and watch runner, plain JS) into `dist/` untranspiled.

## Architecture

### Boot flow

`src/bin/xlab` (Liftoff CLI) → reads consumer's `xlab.config.js` (options: `watch`, `businessDir`) → either `src/bin/watch.js` (auto-restart mode) or `server.boot()` → `src/cluster.ts` forks workers via Node cluster (or listens directly when `workers` is 0) → Koa app.

`src/server.ts` assembles the app in a fixed order — the import order at its top is load-bearing (marked "请勿随意调整位置"): `global.ts` side-effects first, then `init-env`, then config, then custom init, middlewares, router, static serving, bad-request handler, cron. Many modules assume globals exist at require time (e.g. `log`, `getSysConfig`), so reordering imports breaks boot.

### Globals (`src/global.ts`)

The framework's API surface for consumers is installed on `global` rather than exported: `log`, `masterLog`, `getApp`, `requireMod` (internal components), `requireModel` / `requireService` (consumer's `business/@models` / `business/@services`), `getSysConfig` / `setSysConfig`, and `XLAB` (populated from `.xlab` dot-files). Type support lives in the global `XLab` namespace; consumers extend `XLab.IModels` / `XLab.IServices` / `XLab.IConfig` via declaration merging. Internal components also augment `XLab.IConfig` this way (see `src/components/cron/index.ts`), so config typing is spread across component files.

New internal components must be registered in the `InternalComponents` interface in `src/components/index.ts` to be reachable through `requireMod`.

### Config resolution (`src/config/`)

Environment comes from `ENV=` CLI arg or `NODE_ENV`: development / sandbox / production (numeric aliases `0`/`1`/`2`). Merge order: built-in defaults → consumer's `@server/@config/config.js` → env variant (`config.dev` / `config.sand`) → `config.lo` (local, never committed) → CLI args like `PORT=3001`. Separately, `.xlab` / `.xlab.<env>` dot-files (`key=value` lines, JSON-parsed values) load into `global.XLAB` for secrets. `src/default-x-config.ts` holds the `businessDir` setting (default `@server`), mutable by the CLI before the server module loads.

### Convention routing (`src/router.ts`)

Walks the consumer's `@server/business/` tree and registers each file as a route under `/api/...` derived from its path (filename `index` is dropped). Module export shapes: a function (bound directly as GET), an array (filename becomes the HTTP method), or an object `{ method, api, middleware, handler, ignoreApiNameCheck }`. Special directories: `@`-prefixed (e.g. `@models`) are excluded from routing and used as plain modules; `$`-prefixed hold middleware applied to all routes at that path level and below (not recursive within the `$` dir; files run in filename sort order). Path params use `:name` directory names.

### Middleware (`src/middlewares.ts`)

Enabled and ordered via the `middlewares` config map (`{ name: true | {index, name, config} }`). Names matching the `INTERNAL_MIDDLEWARE` whitelist load from `src/middleware/`; anything else loads from the consumer's `@server/middleware/`. Router, static serving, and bad-request are always appended last, outside this mechanism.

### Cluster and cron

In cluster mode, workers talk to the master via messages dispatched to handlers registered in `src/components/cluster`. Cron jobs (`@server/cron/`, gated by `enableCron`) run only on the master unless `enableWorkerCron` is set; per-job interval/enable comes from the `crons` config keyed by filename, with fallbacks to the job module's own `getDelay()` / `enable()` exports.

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
