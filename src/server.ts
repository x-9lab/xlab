"use strict";
import { globalLog } from "./components/log";
import type { Options } from "koa-static";
import { on as cronOn, kill as cronKill } from "./components/cron";
import XConfig from "./default-x-config";
import { processDotFile } from "./dot-file";
import loadConfig, { get as getConfig, log } from "./config";
import { loadCustom, runReady, runShutdown } from "./custom";
import initEnv from "./init-env";
import startCluster, { shutdownWorkers } from "./cluster";
import appRouter from "./router";
import loadMiddleware from "./middlewares";
import badRequest from "./middleware/bad-request";
import { isExecutable } from "@x-drive/utils";
import staticServe from "koa-static";
import type { Server } from "http";
import Router from "koa-router";
import path from "path";
import koa from "koa";

const logger = globalLog.getLogger("system");

/**服务实例 */
const app = new koa();

// 不输出X-Powered-By
// @ts-ignore
app.poweredBy = false;

export { app }

/**
 * 获取应用实例对象
 * @return 实例对象
 */
function getApp() {
    return app;
}
export { getApp }

/**http 服务实例, master fork 模式下为空 */
var server: Server = null;

/**是否已启动 */
var booted = false;

/**是否正在退出 */
var shuttingDown = false;

/**
 * 关闭 http 服务, 等待在途请求结束, 超时强制返回
 * @param timeout 超时时间(毫秒)
 */
function closeServer(timeout: number) {
    return new Promise<void>(function (resolve) {
        const timer = setTimeout(function () {
            logger.warn(`等待在途请求结束超时(${timeout}ms), 强制关闭`);
            resolve();
        }, timeout);
        server.close(function () {
            clearTimeout(timer);
            resolve();
        });
        // 主动断开空闲的 keep-alive 连接, 避免拖住 close 回调
        if (isExecutable((server as any).closeIdleConnections)) {
            (server as any).closeIdleConnections();
        }
    });
}

/**
 * 退出服务

 * 停止定时任务 -> 通知 worker 退出(master) -> 等待在途请求 -> 执行 shutdown 钩子 -> 退出进程
 * @param code 进程退出码
 */
async function shutdown(code = 0) {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    const config = getConfig();
    log("system", `Shutting down (pid ${process.pid}) ...`);
    try {
        cronKill();
        if (config.isMaster && config.workers) {
            await shutdownWorkers(config.shutdownTimeout);
        }
        if (server) {
            await closeServer(config.shutdownTimeout || 10 * 1000);
        }
        await runShutdown();
    } catch (e) {
        logger.error("Shutdown error:", e);
    }
    process.exit(code);
}
export { shutdown }

/**
 * 退出服务
 * @deprecated 请使用 shutdown
 */
function exit() {
    shutdown();
}
export { exit }

/**
 * 启动服务

 * 按固定顺序执行启动阶段:
 * initEnv -> loadConfig -> dotFile -> custom(setup) -> middleware
 * -> router -> static/badRequest -> cron -> listen -> custom(ready)
 */
async function boot() {
    if (booted) {
        return;
    }
    booted = true;

    // 1. 业务环境预处理(@server/@env)
    initEnv();

    // 2. 配置装载
    const config = loadConfig();
    process.env.TZ = config.timezone;

    // 3. .xlab 环境数据
    processDotFile(config.env, logger);

    // 4. 自定义初始化(setup 钩子)
    if (config.custom) {
        await loadCustom();
    }

    // 5. 中间件
    loadMiddleware(app);

    // 6. 业务路由
    const koaRouter = new Router();
    app.use(koaRouter.routes());
    appRouter(koaRouter);

    // 7. 静态文件服务
    var staticServeOpts: Options = {};
    if (config.isProd) {
        staticServeOpts.maxage = config.staticMaxage;
    }
    staticServeOpts.setHeaders = function (res, filePath) {
        if (config.isProd && config.staticHtmlFileMaxage && filePath.endsWith(".html")) {
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

    // 8. 异常状态处理中间件
    app.use(badRequest);

    // 9. 定时任务
    if (config.enableCron) {
        if (config.isMaster || config.enableWorkerCron) {
            cronOn(
                path.resolve(process.cwd(), XConfig.businessDir, "cron")
            );
        }
    }

    // 10. 监听
    server = startCluster(app);

    // 11. 进程信号与异常处理
    process
        .on("SIGTERM", function () {
            shutdown();
        })
        .on("SIGINT", function () {
            shutdown();
        })
        .on("uncaughtException", err => {
            logger.error(`uncaughtException:${err.message}\n`, err.stack);
        })
        .on("unhandledRejection", (err: Error) => {
            logger.error(`unhandledRejection:${err.message}\n`, err.stack);
        });

    // 12. ready 钩子
    await runReady();
}

export { boot };

export default app;

if (require.main === module) {
    boot();
}
