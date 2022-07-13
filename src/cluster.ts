"use strict";

import * as clusterCom from "./components/cluster";
import type { Server } from "http";
import { get } from "./config";
import cluster from "cluster";
import app from "./server";
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

const logger = log.getLogger("cluster");
const CPUnum = os.cpus().length;
const config = get();

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

/**尝试以 cluster 模式启动服务 */
function start() {
    var server: Server;
    var serverListenConf: Pick<ILab.IConfig, "port" | "host"> = {
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
                cluster.fork();
            }
            // if(!config.isProd){
            cluster.on("listening", function (worker, address) {
                masterLog(
                    "cluster"
                    , "info"
                    , "\tWorker ", worker.process.pid
                    , " online, Address: ", address.address
                    , ":", address.port
                );
            });

            cluster.on("message", masterMessageHandler);

            // }
            cluster.on("exit", function (worker) {
                logger.warn("Worker " + worker.process.pid + " is dead!");
                cluster.fork();
            });

        } else {
            server = app.listen(serverListenConf);
        }

        masterLog(
            "cluster"
            , "info"
            , "[%s] online,listening on %s port %d"
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