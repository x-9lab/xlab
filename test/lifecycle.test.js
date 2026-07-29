"use strict";

/**
 * 生命周期测试: custom 钩子(setup/ready/shutdown)、优雅退出、cluster 模式退出。
 * 运行前需要先 yarn build。
 */

const { test } = require("node:test");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");

const EXAMPLE_DIR = path.resolve(__dirname, "..", "example");
const SERVER_ENTRY = path.resolve(__dirname, "..", "dist", "server.js");

/**
 * 启动一个服务子进程并收集输出
 * @param {number} port 监听端口
 * @param {string} env  NODE_ENV
 */
function bootServer(port, env = "development") {
    const child = spawn(
        process.execPath
        , [SERVER_ENTRY, `PORT=${port}`]
        , {
            "cwd": EXAMPLE_DIR
            , "env": Object.assign({}, process.env, { "NODE_ENV": env })
        }
    );
    let output = "";
    child.stdout.on("data", chunk => output += chunk);
    child.stderr.on("data", chunk => output += chunk);
    return {
        child
        , "getOutput": () => output
    };
}

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

/**等待进程退出, 返回退出码 */
function waitForExit(child, timeout = 8000) {
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

test("custom 钩子: setup 收到配置参数, ready 在启动后执行", async () => {
    const { child, getOutput } = bootServer(3221);
    try {
        await waitForReady(3221);
        assert.match(getOutput(), /\[lifecycle-demo\] setup \{"from":"config"\}/);
        assert.match(getOutput(), /\[lifecycle-demo\] ready/);
    } finally {
        child.kill("SIGTERM");
        await waitForExit(child).catch(() => child.kill("SIGKILL"));
    }
});

test("优雅退出: SIGTERM 触发 shutdown 钩子并以 0 退出", async () => {
    const { child, getOutput } = bootServer(3222);
    await waitForReady(3222);
    child.kill("SIGTERM");
    const code = await waitForExit(child);
    assert.equal(code, 0);
    assert.match(getOutput(), /\[lifecycle-demo\] shutdown/);
});

test("cluster 模式: master 收到 SIGTERM 后 worker 全部退出", async () => {
    const { child } = bootServer(3223, "sandbox");
    await waitForReady(3223);

    // 服务可用
    const res = await fetch("http://127.0.0.1:3223/api/example/6.6.6/project/cluster");
    assert.equal(res.status, 200);

    child.kill("SIGTERM");
    const code = await waitForExit(child, 15000);
    assert.equal(code, 0);

    // master 退出后端口应不再可访问(worker 没有残留)
    await new Promise(res => setTimeout(res, 300));
    await assert.rejects(fetch("http://127.0.0.1:3223/"));
});
