import { asciiTobase64 } from "../components/common";
import { date } from "@x-drive/utils";
import { get } from "../config";
import type Koa from "koa";

const serverPackge = require("../../package.json");

export default function () {
    const conf = get();
    // 业务名称与版本
    const CLIENT_MARK = `${conf.mark || conf.name}@${conf.version}`;
    // 服务端版本
    const SERVER_MARK = `${serverPackge.name}@${serverPackge.version}`;
    // 业务启动时间
    // FIX ME : 服务器不是北京时间的时候这个数据跟实际启动的时间存在时差
    const MARK = asciiTobase64(`${CLIENT_MARK};${SERVER_MARK};Startup@${date(new Date(), "Y-m-d H:i:s")}`);

    /**
     * 处理函数
     */
    return async function handler(ctx: Koa.Context, next: Koa.Next) {
        ctx.set("X-Mark", MARK);
        await next();
    }
};
