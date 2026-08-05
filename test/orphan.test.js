"use strict";

/**
 * 孤儿进程防护测试: watch 守护进程信号级联、master 异常死亡后 worker 自清理。
 * 运行前需要先 yarn build。
 */

const { test } = require("node:test");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");

const EXAMPLE_DIR = path.resolve(__dirname, "..", "example");
const SERVER_ENTRY = path.resolve(__dirname, "..", "dist", "server.js");
const XLAB_BIN = path.resolve(__dirname, "..", "dist", "bin", "xlab");

/**等待端口可访问 */
async function waitForReady(port, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await fetch(`http://127.0.0.1:${port}/`);
            return;
        } catch (e) {
            await new Promise(res => setTimeout(res, 200));
        }
    }
    throw new Error(`服务在 ${timeout}ms 内未就绪`);
}

/**等待端口不再可访问 */
async function waitForDown(port, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await fetch(`http://127.0.0.1:${port}/`);
            await new Promise(res => setTimeout(res, 300));
        } catch (e) {
            return;
        }
    }
    throw new Error(`端口 ${port} 在 ${timeout}ms 后仍在提供服务, 存在孤儿进程`);
}

/**等待进程退出 */
function waitForExit(child, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error(`进程未在 ${timeout}ms 内退出`))
            , timeout
        );
        child.on("exit", code => {
            clearTimeout(timer);
            resolve(code);
        });
    });
}

test("watch 守护进程: SIGINT 级联到业务进程, 不残留监听", async () => {
    // sandbox 环境 workers=2, 覆盖 watch 下的 cluster 场景
    const supervisor = spawn(
        process.execPath
        , [XLAB_BIN, "-w", "PORT=3271"]
        , {
            "cwd": EXAMPLE_DIR
            , "env": Object.assign({}, process.env, { "NODE_ENV": "sandbox" })
            , "stdio": "ignore"
        }
    );
    await waitForReady(3271);

    supervisor.kill("SIGINT");
    await waitForExit(supervisor);
    await waitForDown(3271);
});

test("watch 守护进程: SIGTERM 同样级联", async () => {
    const supervisor = spawn(
        process.execPath
        , [XLAB_BIN, "-w", "PORT=3272"]
        , {
            "cwd": EXAMPLE_DIR
            , "env": Object.assign({}, process.env, { "NODE_ENV": "development" })
            , "stdio": "ignore"
        }
    );
    await waitForReady(3272);

    supervisor.kill("SIGTERM");
    await waitForExit(supervisor);
    await waitForDown(3272);
});

test("worker 孤儿防护: master 被 SIGKILL 后 worker 自行退出", async () => {
    const master = spawn(
        process.execPath
        , [SERVER_ENTRY, "PORT=3273"]
        , {
            "cwd": EXAMPLE_DIR
            , "env": Object.assign({}, process.env, { "NODE_ENV": "sandbox" })
            , "stdio": "ignore"
        }
    );
    await waitForReady(3273);

    // 模拟 master 异常死亡, 无优雅退出机会
    master.kill("SIGKILL");
    await waitForExit(master);
    await waitForDown(3273);
});
