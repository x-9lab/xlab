"use strict";
import { isFunction } from "@x-drive/utils";
import { local as Cache } from "../cache";
import { inject } from "../injection";
import { md5 } from "../md5";
import path from "path";
import fs from "fs";
import type Koa from "koa";

type RouteOption = Record<string, string | string[]>;
interface HtmlProcessorOptions {
    route?: RouteOption;
}

var conf: XLab.IConfig;
var logger;

const html_cache = Cache(
    "HTML_CACHE"
    , {
        "maxAge": 1000 * 60 * 60
        , "max": 10
    }
);

function processorVar(html: string, req: Koa.Context) {
    return inject(html, req);
}

// 处理 HTML
//   读取 HTML 文件，如果没有缓存则缓存
//   填充相关字段
//   根据配置可以设置为清除本地缓存
//   设置缓存头
//   根据配置设置相应头部
function htmlProcessor(pathname: string, options: HtmlProcessorOptions, context: Koa.Context) {

    var filename = path.resolve(conf.root + pathname);
    // ua = req.get('user-agent'),
    var cacheKey: string;
    var html: string;
    var route: RouteOption;
    // 发送访问统计
    // serverTrack(req, 'normal');

    // 取出参数
    if (options) {
        route = options.route;
    }

    // 生成缓存 key
    cacheKey = md5(pathname);

    try {
        html = html_cache.get(cacheKey);
        if (!html) {
            html = fs.readFileSync(filename, 'utf8');
            html_cache.set(cacheKey, html);
        }
    } catch (e) {
        logger.error('HTML Process Error', e);
        return null;
    }

    // 无法正确读取 HTML
    // 交给后续的 404 处理
    if (!html) {
        return null;
    }

    // 进行参数处理
    html = processorVar(html, context);

    // 按照配置清空 localStorage
    if (conf.clearLocalStorage || context && context.query.no_cache) {
        html = html.replace('<head>', '<head><script>if(window.localStorage) {window.localStorage.clear()}<\/script>');
    }

    // 读取 route 的配置并设置对应的 headers 信息
    var headers = route && route.headers;
    if (headers && context) {
        Object.keys(headers).forEach(key => {
            let val: string | string[];
            if (isFunction(headers[key])) {
                val = headers[key].call();
            } else {
                val = headers[key];
            }
            context.set(key, val);
        });
    }

    // 返回网页
    return html;
}

function init() {
    conf = getSysConfig();
    logger = log.getLogger("html-processor");
};

export { init };

export { htmlProcessor };
