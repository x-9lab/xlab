"use strict";

/**
 * 冒烟测试:以 example 为 fixture 启动真实服务,验证框架对外行为。
 * 运行前需要先 yarn build。
 */

const { test, before, after } = require("node:test");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const PORT = 3210;
const HOST = `http://127.0.0.1:${PORT}`;
const EXAMPLE_DIR = path.resolve(__dirname, "..", "example");
const SERVER_ENTRY = path.resolve(__dirname, "..", "dist", "server.js");

/**
 * config.lo 按约定不提交仓库, 由测试自行创建以验证本地配置合并,
 * 结束后仅清理由测试创建的文件
 */
const LO_CONFIG_PATH = path.resolve(EXAMPLE_DIR, "@server", "@config", "config.lo.js");
const LO_CONFIG_CONTENT = `"use strict";
/**@type {XLab.IConfig} */
module.exports = {
    "middlewares": {
        "service-mark": true
        , "request-filter": true
        , "fresh-filter": true
        , "cors": {
            "config": {
                "type": "all"
            }
        }
    }
};
`;

/**是否由本测试创建了 config.lo */
var createdLoConfig = false;

/**服务子进程 */
var server = null;

/**等待服务就绪 */
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
    if (!fs.existsSync(LO_CONFIG_PATH)) {
        fs.writeFileSync(LO_CONFIG_PATH, LO_CONFIG_CONTENT);
        createdLoConfig = true;
    }
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
    if (createdLoConfig) {
        fs.rmSync(LO_CONFIG_PATH, { "force": true });
    }
    if (server) {
        server.kill("SIGTERM");
        // 兜底强杀,防止残留进程占用端口
        setTimeout(() => {
            if (server.exitCode === null) {
                server.kill("SIGKILL");
            }
        }, 2000).unref();
    }
});

test("函数形态路由: 路径参数与标准返回结构", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/project/foo`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.code, 0);
    assert.deepEqual(body.result, { "name": "foo" });
});

test("service-mark 中间件: 输出 X-Mark 服务标识", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/project/foo`);
    assert.match(res.headers.get("x-mark"), /@x-9lab\/xlab-example@/);
});

test("$ 目录中间件: 生效于所在层级及以下", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/some/other/bar`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("x-api-mid"), "some/other 层的 $mws 应生效");
    assert.ok(res.headers.get("x-some-test"), "some/other 层中间件应设置 X-Some-Test");
    const body = await res.json();
    assert.deepEqual(body.result, { "name": "bar" });
});

test("$ 目录中间件: 多层级叠加执行", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/some/other/deep/42`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("x-some-test"), "父层中间件应生效");
    assert.ok(res.headers.get("x-some-deep-test"), "本层中间件应生效");
    const body = await res.json();
    assert.equal(body.success, true);
});

test("静态文件服务: 返回 root 目录下的 index.html", async () => {
    const res = await fetch(`${HOST}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/html/);
    const text = await res.text();
    assert.match(text, /<!DOCTYPE html>/i);
});

test("未匹配的 API: 返回标准失败结构", async () => {
    const res = await fetch(`${HOST}/api/not-exist`);
    assert.match(res.headers.get("content-type"), /application\/json/);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.code, -1);
});

test("配置合并: config.lo 覆盖生效(cors type=all 允许任意来源)", async () => {
    const res = await fetch(`${HOST}/api/example/6.6.6/project/foo`, {
        "headers": { "Origin": "http://any-site.example" }
    });
    assert.equal(res.headers.get("access-control-allow-origin"), "http://any-site.example");
    assert.equal(res.headers.get("x-cors"), "all");
});
