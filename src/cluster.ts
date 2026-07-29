"use strict";

import * as clusterCom from "./components/cluster";
import { globalLog } from "./components/log";
import type { Server } from "http";
import type Koa from "koa";
import { get } from "./config";
import cluster from "cluster";
import os from "os";

interface IMsgItem<R = any> {
    /**消息名称 */
    cmd: string;

    /**worker id */
    wid: number;

    /**消息操作需要用到的参数 */
    args: any[];

    /**附加参数，会默认追加到消息处理函数的最后，会回传到消息源 */
    returnData: R;
}

const logger = globalLog.getLogger("cluster");
const CPUnum = os.cpus().length;

/**判定为快速失败的存活时间窗口(毫秒) */
const QUICK_DEATH_MS = 10 * 1000;

/**连续快速失败达到该次数后停止自动拉起 */
const MAX_QUICK_DEATHS = 5;

/**worker 启动时间记录 */
const FORK_AT = new Map<number, number>();

/**连续快速失败计数 */
var quickDeaths = 0;

/**是否正在退出流程中 */
var stopping = false;

/**
 * 消息处理函数
 * @param  msg 消息配置对象
 */
function masterMessageHandler(msg: IMsgItem) {
    if (msg && msg.cmd) {
        let handler = clusterCom.get(msg.cmd);
        if (handler) {
            let args = msg.args || [];
            args.push(msg.returnData);
            let re = handler.apply(handler, args);
            if (msg.wid) {
                let worker = cluster.workers[msg.wid];
                if (worker) {
                    worker.send({
                        "cmd": msg.cmd
                        , "data": re
                        , "returnData": msg.returnData
                    });
                }
                worker = null;
            }
            args = null;
        }
    }
}

/**fork 一个 worker 并记录启动时间 */
function forkWorker() {
    const worker = cluster.fork();
    FORK_AT.set(worker.id, Date.now());
}

/**
 * 启动服务监听

 * master 且配置了 workers 时 fork 集群, 否则当前进程直接 listen
 * @param app Koa 实例
 * @return    直接监听时返回 http.Server, master fork 模式下无返回
 */
function start(app: Koa) {
    const config = get();
    var server: Server;
    var serverListenConf: Pick<XLab.IConfig, "port" | "host"> = {
        "port": config.port
    }
    if (config.ip) {
        serverListenConf.host = config.ip;
    }
    if (config.isMaster) {
        if (config.workers) {
            // 小于使用数则取一半
            let num = CPUnum < config.workers ? Math.ceil(CPUnum / 2) : config.workers;
            for (var i = 0; i < num; i++) {
                forkWorker();
            }
            cluster.on("listening", function (worker, address) {
                logger.info(
                    "\tWorker ", worker.process.pid
                    , " online, Address: ", address.address
                    , ":", address.port
                );
            });

            cluster.on("message", masterMessageHandler);

            cluster.on("exit", function (worker) {
                const bornAt = FORK_AT.get(worker.id);
                FORK_AT.delete(worker.id);
                if (stopping) {
                    return;
                }
                const uptime = Date.now() - (bornAt || 0);
                if (bornAt && uptime < QUICK_DEATH_MS) {
                    quickDeaths += 1;
                } else {
                    quickDeaths = 0;
                }
                if (quickDeaths >= MAX_QUICK_DEATHS) {
                    logger.error(
                        `Worker ${worker.process.pid} is dead! 连续 ${quickDeaths} 次快速退出, 停止自动拉起, 请排查业务异常`
                    );
                    return;
                }
                logger.warn(`Worker ${worker.process.pid} is dead! Reforking.`);
                forkWorker();
            });

        } else {
            server = app.listen(serverListenConf);
        }

        logger.info(
            "[%s] online,listening on %s port %d"
            , config.env
            , config.ip || "localhost"
            , config.port
        );
    } else {
        server = app.listen(serverListenConf);
    }

    return server;
}

export default start;

/**
 * 通知全部 worker 退出并等待其结束
 * @param timeout 等待超时(毫秒), 超时后不再等待
 */
function shutdownWorkers(timeout = 10 * 1000) {
    stopping = true;
    return new Promise<void>(function (resolve) {
        const workers = Object.values(cluster.workers || {}).filter(Boolean);
        if (!workers.length) {
            resolve();
            return;
        }
        var alive = workers.length;
        const timer = setTimeout(function () {
            logger.warn(`等待 worker 退出超时(${timeout}ms)`);
            resolve();
        }, timeout);
        workers.forEach(function (worker) {
            worker.once("exit", function () {
                alive -= 1;
                if (alive === 0) {
                    clearTimeout(timer);
                    resolve();
                }
            });
            worker.process.kill("SIGTERM");
        });
    });
}
export { shutdownWorkers }
