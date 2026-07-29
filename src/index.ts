"use strict";

/**
 * `@x-9lab/xlab` 包入口
 *
 * v2 起框架 API 由此显式导出, 不再挂载到 global。
 * 业务代码使用 `require("@x-9lab/xlab")` / `import ... from "@x-9lab/xlab"` 获取。
 */

// 应用与生命周期
export { app, getApp, boot, shutdown, exit } from "./server";

// 框架 API
export {
    requireMod
    , requireModel
    , requireService
    , getSysConfig
    , setSysConfig
} from "./global";

// 日志
export { Log, globalLog, getLogger } from "./components/log";
export { log as masterLog } from "./config";

// `.xlab` 环境数据
export { getXlabEnv } from "./dot-file";

// 路由
export { defineApi } from "./router";
export type { IApiDefinition } from "./router";

// 类型
export type { ICustomHooks } from "./custom";
export type { ICronJob } from "./components/cron";
export type { InternalComponents } from "./components";

import app from "./server";
export default app;
