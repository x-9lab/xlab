v2 升级设计方案
========

> 状态:执行中。本文档记录 v2 (breaking change) 的设计决策与实施计划,业务方升级请看仓库根目录的 `MIGRATION.md`。

## 背景与目标

v1 的三个核心问题同出一源:**初始化依赖模块加载副作用,而非显式流程**。

1. API 通过 `global` 挂载(`log`、`getSysConfig`、`requireModel` 等),内部模块在 require 时读取全局,导致 `server.ts` 顶部 import 顺序不可调整;
2. 缺少生命周期管理:没有 ready 信号、没有优雅退出(SIGTERM 直接死)、cluster worker 崩溃后无条件立即重启;
3. 路由定义形态过多(函数 / 数组 / 对象),router 实现边解析边注册、难以维护。

v2 目标:在**不增加依赖、保持轻量与约定式风格**的前提下解决以上问题。明确不做的事:不迁移 ESM(服务端 CJS 无实际痛点,单独评估)、不换日志库(保持 log4js,升级到 6.x;pino 后续评估)、不引测试框架(用 `node:test`)。

## 一、API 表面:global 挂载 → 模块导出

**Breaking**。移除所有 `global.*` 运行时挂载,新增包入口 `src/index.ts`(`main` 指向 `dist/index.js`),显式导出:

| v1(global) | v2(从 `@x-9lab/xlab` 导入) |
|---|---|
| `log.getLogger(cat)` | `getLogger(cat)` |
| `masterLog(cat, type?, ...msg)` | `masterLog(cat, type?, ...msg)`(语义不变,仅 master 输出) |
| `getSysConfig()` / `setSysConfig()` | 同名导出 |
| `requireMod` / `requireModel` / `requireService` | 同名导出 |
| `getApp()` | `getApp()`(不再标记废弃) |
| `XLAB`(`.xlab` 数据) | `getXlabEnv()` |
| — | `boot()` / `shutdown()`(生命周期入口) |
| — | `defineApi()`(路由类型帮助函数) |

保留:`XLab` 全局 **类型** 命名空间及 declaration merging 扩展方式(`IModels` / `IServices` / `IConfig`)——类型层面的全局没有运行时代价,是合理的轻量扩展机制。

内部代码一律改为模块 import,禁止读 global。import 顺序耦合随之消失。

单实例前提:业务文件 `require("@x-9lab/xlab")` 必须解析到与运行中服务同一个模块实例。经由 `node_modules/.bin/xlab` 启动的正常消费者天然满足;example 项目将依赖协议改为 `link:../` 保证 realpath 一致。

## 二、生命周期:显式 phase + 优雅退出

`boot()` 按固定顺序执行显式函数(取代 v1 的 import 副作用链):

```
initEnv → loadConfig → loadDotFile → createApp → custom(setup)
→ middleware → routes → static/badRequest → cron → listen → custom(ready)
```

`custom` 目录模块升级为生命周期钩子载体:

- 导出函数(v1 形态)→ 视为 `setup`,兼容;
- 导出 `{ setup?, ready?, shutdown? }` → 分别在建 app 后、listen 成功后、退出前调用,均支持 async。

优雅退出(`shutdown()`,自动挂到 SIGTERM/SIGINT):

- 单进程 / worker:停止 cron 定时器 → `server.close()` 等待在途请求(默认 10s 超时强制)→ 执行 `shutdown` 钩子 → 退出;
- master:转发信号给全部 worker,等待其退出后自身退出;
- worker 崩溃重启加退避:fork 后 10s 内退出计为快速失败,连续 5 次停止拉起并输出错误(替代 v1 的无条件立即 refork)。

`config/index.ts` 顶层副作用(argv 解析、读配置文件、打印)收进 `loadConfig()`;`CONFIG` 对象保持稳定引用,`get()`/`update()` 不变。所有在 require 时读配置的模块(fresh-filter、handle-pre-dir、service-mark、cron 组件等)改为调用时读取。

## 三、路由:归一化内核,收敛定义形态

**Breaking**:移除数组导出形态(文件名当 method、隐式 unshift 的那种)。保留两种:

1. 导出函数 → 绑定为 GET,api 由文件路径生成(不变);
2. 导出对象 `{ method?, api?, middleware?, handler, ignoreApiNameCheck? }`(推荐形态)。

新增 `defineApi()`:运行时恒等返回,仅提供类型推导,配合对象形态使用。

router 实现重写为两段式:walk 阶段把所有模块 **归一化** 为 `{ method, path, middlewares, handler }` 列表,再统一注册。同时修复:

- `dir.split("business")` 按字符串切路径的 bug → `path.relative`;
- `.replace(".js", "")` → 按扩展名截断;
- 路径分隔统一用 `path.sep` 切、`/` 拼,不再依赖平台巧合。

`@` 前缀(普通模块)与 `$` 前缀(层级中间件)目录约定不变。

## 四、依赖与构建

运行依赖:

| 依赖 | v1 | v2 | 说明 |
|---|---|---|---|
| koa / koa-compress / minimist | 3.1.2 / 5.2.1 / 1.2.6 | 最新 patch/minor | 无痛 |
| liftoff | 4.0.0 | ^5 | API 兼容 |
| log4js | ^1.1.1 | ^6.9 | `clearAppenders` 等 API 已移除,重写 log 组件 |
| cron | 1.8.2 | **删除** | 从未被使用(cron 组件是 setTimeout 实现) |
| koa-router / koa-static / @x-drive/utils | — | 不变 | 已是最新 |

watch 模式修复:`cross-spawn`(未声明!)→ `child_process.spawn`;`colors`(devDep 却被运行时 require)→ 内置 ANSI;`chokidar` 保持可选依赖(缺失时提示安装,行为不变)。

开发依赖:typescript 4.3 → ^5,@swc/core / @swc/cli 升最新,@types/node 对齐目标 Node。删除 nodemon(watch 自实现)、should(无测试遗留)、tslib(swc 不走 importHelpers)。

`engines` 声明改为 `>=20`(koa 3 要求 ≥18,Node 18 已 EOL),swc target 同步。

## 五、测试

`node:test` + `fetch`,以 `example/` 为 fixture 起真实服务跑冒烟用例:各路由形态、`$` 中间件层级顺序、静态文件、异常请求、配置合并。作为整个重构的安全网,先于一切改动落地。

## 实施顺序(每步一个可独立回滚的 commit)

1. 冒烟测试(v1 基线)
2. watch 依赖修复
3. 依赖与构建链更新
4. log4js 6 + 日志组件重写
5. 生命周期显式化 + 优雅退出
6. 移除 global 挂载 → 模块导出,迁移 example
7. 路由归一化 + `defineApi`
8. MIGRATION.md / README / CLAUDE.md
9. 版本号 2.0.0
