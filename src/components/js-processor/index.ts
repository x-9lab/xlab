import { local as Cache } from "../cache";
import { inject } from "../injection";
import { md5 } from "../md5";
import path from "path";
import fs from "fs";

import type Koa from "koa";

var conf: ILab.IConfig;
var logger;

var js_cache = Cache(
    "JS_CACHE"
    , {
        "maxAge": 1000 * 60 * 60 * 24
        , "max": 20
    }
);

function processorVar(html: string, req: Koa.Context) {
    return inject(html, req);
}

// 处理 JS 文件
function jsProcessor(pathname: string, context: Koa.Context) {
    const filename = path.resolve(conf.root + pathname);
    var cacheKey: string;
    var js: string;

    // 生成缓存 key
    cacheKey = md5(pathname);

    // 检查是否有缓存
    // 如果有缓存直接返回
    try {
        js = js_cache.get(cacheKey);
        if (!js) {
            js = fs.readFileSync(filename, "utf8");
            js_cache.set(cacheKey, js);
        }
    } catch (e) {
        logger.error("JS Process Error", e);
        return null;
    }

    // 无法正确读取 JS
    // 交给后续的 404 处理
    if (!js) {
        return null;
    }

    // 进行参数处理
    js = processorVar(js, context);

    return js
}

function init() {
    conf = getSysConfig();
    logger = log.getLogger("js-processor");
};
export { init }

export { jsProcessor };
