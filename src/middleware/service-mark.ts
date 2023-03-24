import { date } from "@x-drive/utils";
import type Koa from "koa";

const serverPackge = require("../../package.json");
var info: Record<string, string> = {};
// 业务名称
info.mark = getSysConfig("mark") || getSysConfig("name");
// 业务版本
info.version = getSysConfig("version");
// 服务端版本
info.serverVer = serverPackge.version;
info.serverName = serverPackge.name;
// 业务启动时间
// FIX ME : 服务器不是北京时间的时候这个数据跟实际启动的时间存在时差
info.date = date(new Date(), "Y-m-d H:i:s");

// 模块版本信息
const CLIENT_MARK = `${info.mark}@${info.version}`;
const SERVER_MARK = `${info.serverName}@${info.serverVer}`;
const MARK = `${CLIENT_MARK},${SERVER_MARK};Startup@${info.date}`;
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
