"use strict";
import "./global";
import { globalLog } from "./components/log";
import type { Options } from "koa-static";
import { on as cron } from "./components/cron";
import XConfig from "./default-x-config";
import { processDotFile } from "./dot-file";
import staticServe from "koa-static";
import router from "koa-router";
import path from "path";
import koa from "koa";

// 请勿随意调整位置
import config, { log } from "./config";
import processCustom from "./custom";
import appRouter from "./router";
import cluster from "./cluster";
import loadMiddleware from "./middlewares";
import badRequest from "./middleware/bad-request";

process.env.TZ = config.timezone;

const logger = globalLog.getLogger("system");

processDotFile(config.env, logger);

// 只在 master 上输出的日志
global.masterLog = log;

// 服务实例
const app = new koa();

/**
 * 获取应用实例对象
 * @return 实例对象
 */
global.getApp = function () {
    return app;
}

// 不输出X-Powered-By
// @ts-ignore
app.poweredBy = false;

if (config.custom) {
    // 自定义初始化业务
    processCustom();
}

// 加载中间件
loadMiddleware(app);

const koaRouter = new router();

// 路由中间件
app.use(koaRouter.routes());

// 具体路由
appRouter(koaRouter);

// 静态文件服务
var staticServeOpts: Options = {};
if (config.isProd) {
    staticServeOpts.maxage = config.staticMaxage;
}
staticServeOpts.setHeaders = function (res, path) {
    if (config.isProd && config.staticHtmlFileMaxage && path.endsWith(".html")) {
        res.setHeader("Cache-Control", `max-age=${config.staticHtmlFileMaxage}`);
    }
    if (config.staticCros) {
        const { origin } = res.req.headers;
        if (origin) {
            res.setHeader("X-Cros-Static", origin);
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        }
    }
}

app.use(staticServe(
    path.resolve(process.cwd(), config.root)
    , staticServeOpts
));

// 异常状态处理中间件
app.use(badRequest);

if (config.enableCron) {
    // 定时任务
    cron(
        path.resolve(process.cwd(), XConfig.businessDir, "cron")
    );
}

/**启动服务 */
function boot() {
    cluster();
    process
        .on("uncaughtException", err => {
            logger.error("uncaughtException:\n", err.stack);
        })
        .on("unhandledRejection", (err: Error) => {
            logger.error("unhandledRejection:\n", err.stack);
        });
}

export { boot };

/**退出服务 */
function exit() {
    process.exit();
}
export { exit }

export default app;

if (require.main === module) {
    boot();
}
