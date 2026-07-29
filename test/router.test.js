"use strict";

/**
 * v2 路由行为测试: 文件名即方法约定、defineApi、根级 $ 中间件。
 * 运行前需要先 yarn build。
 */

const { test, before, after } = require("node:test");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");

const PORT = 3230;
const HOST = `http://127.0.0.1:${PORT}`;
const EXAMPLE_DIR = path.resolve(__dirname, "..", "example");
const SERVER_ENTRY = path.resolve(__dirname, "..", "dist", "server.js");

var server = null;

async function waitForReady(timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            await fetch(`${HOST}/`);
            return;
        } catch (e) {
            await new Promise(res => setTimeout(res, 200));
        }
    }
    throw new Error(`服务在 ${timeout}ms 内未就绪`);
}

before(async () => {
    server = spawn(
        process.execPath
        , [SERVER_ENTRY, `PORT=${PORT}`]
        , {
            "cwd": EXAMPLE_DIR
            , "env": Object.assign({}, process.env, { "NODE_ENV": "development" })
            , "stdio": process.env.SMOKE_DEBUG ? "inherit" : "ignore"
        }
    );
    await waitForReady();
});

after(() => {
    if (server) {
        server.kill("SIGTERM");
        setTimeout(() => {
            if (server.exitCode === null) {
                server.kill("SIGKILL");
            }
        }, 2000).unref();
    }
});

test("文件名即方法: post.js 注册为 POST 且文件名不进入 api 路径", async () => {
    const res = await fetch(`${HOST}/api/example/create`, { "method": "POST" });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.deepEqual(body.result, { "created": true });
});

test("文件名即方法: 其他方法访问不会命中", async () => {
    const res = await fetch(`${HOST}/api/example/create`);
    const body = await res.json();
    assert.equal(body.success, false);
});

test("根级 $ 目录中间件: 对全部业务路由生效", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/project/foo`);
    assert.equal(res.status, 200);
    assert.ok(
        res.headers.get("x-api-mid")
        , "business 根下的 \$mws 应对所有路由生效"
    );
});
