"use strict";

import type Koa from "koa";

var info: Record<string, string> = {};
// 业务名称
info.mark = getSysConfig("mark") || getSysConfig("name");
// 业务版本
info.version = getSysConfig("version");
// 服务端版本
info.serverVer = require("../../package.json").version;
// 业务启动时间
// FIX ME : 服务器不是北京时间的时候这个数据跟实际启动的时间存在时差
info.date = requireMod("common").date("Y-m-d h:i:s", Date.now());

// 模块版本信息
const MARK = `${info.mark}@${info.version}&${info.serverVer} (${info.date})`;

info = null;

/**
 * 处理函数
 */
async function handler(ctx: Koa.Context, next: Koa.Next) {
    ctx.set("X-Mark", MARK);
    await next();
}

export default function () {
    return handler;
};
