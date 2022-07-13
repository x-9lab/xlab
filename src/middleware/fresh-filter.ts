"use strict";

import { lastModified as setLastModified } from "../components/header";
import type Koa from "koa";

const conf = getSysConfig();

async function handle(ctx: Koa.Context, next: Koa.Next) {
    // 头部字段
    var pageUrl = ctx.state.parsedUrl && ctx.state.parsedUrl.pathname || ctx.url;
    var queryMap = ctx.query;
    var modifiedSince = ctx.headers["if-modified-since"];
    var modifiedSinceTime;
    // var noneMatch = ctx.headers["if-none-match"];
    // var lastModified = ctx.headers["last-modified"];
    // var etag = ctx.headers["etag"];
    // var cc = ctx.headers["cache-control"];
    var nowTime = (new Date()).getTime();
    var nowDateString = (new Date()).toUTCString();

    var isIndexPage = (/\/$/).test(pageUrl);
    isIndexPage = isIndexPage || (/[\/]?index\.html/).test(pageUrl);

    // 没有最后修改时间，附加上当前时间并继续
    // 或者有nocache参数的话，也直接响应 200 操作
    if (!conf["304"] || !!queryMap.no_cache || !modifiedSince) {
        setLastModified(nowDateString, ctx);

        await next();
        // 发现有修改时间，直接返回304头
    } else {
        modifiedSinceTime = (new Date(modifiedSince)).getTime();
        // 如果是首页，则进行半小时的缓存时间（时间可配置）
        if (isIndexPage) {
            // 如果没有超过半小时的缓存时间，则直接返回304，否则返回200，并重新设置last-modify
            if (nowTime - modifiedSinceTime < conf.indexPageCacheTime) {
                ctx.set("X-304-Filter", "HIT");
                ctx.status = 304;
                ctx.body = "";
            } else {
                setLastModified(nowDateString, ctx);
                next();
            }
            // 其他的js/css/image静态资源设置两周的缓存时间（可配置）
        } else if (
            ctx.state.srcType.js ||
            ctx.state.srcType.css ||
            ctx.state.srcType.img ||
            ctx.state.srcType.tpl ||
            ctx.state.srcType.font
        ) {
            if (nowTime - modifiedSinceTime < conf.staticResourceCacheTime) {
                ctx.set("X-304-Filter", "HIT");
                ctx.status = 304;
                ctx.body = "";
            } else {
                setLastModified(nowDateString, ctx);
                await next();
            }
            //其他类型的请求，比如Server API等等
        } else {
            setLastModified(nowDateString, ctx);
            await next();
        }
    }
}

export default function () {
    return handle;
};
