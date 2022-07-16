"use strict";
import type Koa from "koa";

var conf = getSysConfig();

/**
 * 路径处理匹配正则
 */
const replace_reg = new RegExp(conf.pathReplaceRegExp);

/**
 * 处理代理过来多余的地址层级
 */
async function handlPreDir(ctx: Koa.Context, next: Koa.Next) {
    if (replace_reg.test(ctx.url)) {
        ctx.set("X-Pre-Dir", "Hit");
        ctx.url = ctx.url.replace(replace_reg, "");
        if (ctx.url.charAt(0) !== "/") {
            ctx.url = "/" + ctx.url;
        }
    }

    await next();
}

export default handlPreDir;
