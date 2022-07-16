"use strict";
import { local as Cache } from "../cache";
import * as header from "../header";
import { MIME } from "../mime";
import { md5 } from "../md5";
import path from "path";
import fs from "fs";
import type Koa from "koa";

var conf: XLab.IConfig;

// combo 文件缓存时间单位
// 默认一周
// @todo 上 cdn 的话需要根据 cdn 的情况调整这个时间
const COMBO_CACHE_TIME = 1000 * 60 * 60 * 24 * 7;

// combo 组合缓存
const comboCache = Cache(
    "JS_CACHE"
    , {
        "maxAge": COMBO_CACHE_TIME
        , "max": 200
    }
);

// 单独的文件缓存
// 因为会存在大量公共组件，且有多个入口，当用户从不同的入口进来时会因为组合问题多次调用文件读取
// 增加单独缓存用于减少应用启动初期或 dns 回源时的瞬间压力
const fileCache = Cache(
    "JS_FILE_CACHE"
    , {
        "maxAge": COMBO_CACHE_TIME
        , "max": 500
    }
);

var logger;

// 扩展名对应的 mime 头
const extMap = {};
Object.keys(MIME).forEach(ext => {
    extMap["." + ext] = MIME[ext];
});

// 处理合并请求，合并请求以两个问号开头
// 请求示例：http://127.0.0.1:5000/??page-manager/1.0.0/page-manager.js,router/1.0.0/router.js,event/1.0.0/event.js,mobile/1.0.0/message/message.js,envi/1.0.0/envi.js,underscore/1.5.2/underscore.js
async function handle(ctx: Koa.Context, next: Koa.Next) {
    let parsedUrl = ctx.url;
    let search = ctx.query;
    // combo 请求对应的缓存 key
    let cacheKey: string;
    // combo 返回内入
    let content: string;

    // 如果不是合并请求，则不进行处理，交给下一步
    if (!search || parsedUrl.indexOf("??") < 0) {
        await next();
        return
    }

    let filesStr = Object.keys(search)[0].substr(1);

    // 设置文件类型，以便正确返回
    if (filesStr.indexOf(".js") > -1) {
        ctx.set("Content-Type", extMap[".js"]);
    } else {
        for (let ext in extMap) {
            if (filesStr.indexOf(ext) > -1) {
                ctx.set("Content-Type", extMap[ext]);
                break;
            }
        }
    }

    // 生成缓存 key
    cacheKey = md5(filesStr);

    // 检查是否有缓存
    content = comboCache.get(cacheKey);
    // 没有缓存内容，需要读取并且拼接
    if (!content) {
        // 按照逗号拆分成模块 uri
        let uris = filesStr.split(",");

        uris = uris.map(uri => {
            let searchIndex = uri.indexOf("?");
            if (searchIndex > -1) {
                uri = uri.substring(0, searchIndex);
            }
            return uri;
        });

        // 根据 uri 查找文件并拼合
        var files = [];
        // 读取相关文件
        uris.forEach(uri => {
            // 优先从文件缓存中读
            let file = fileCache.get(uri);
            if (file) {
                files.push(file);
            } else {
                try {
                    file = fs.readFileSync(path.resolve(conf.root, "c", uri), "utf8");
                } catch (e) {
                    logger.error("READ COMBO FILE ERROR", uri, e);
                }
                if (file) {
                    files.push(file);
                    fileCache.set(uri, file);
                }
            }
        });

        // 合并文件
        content = files.join("\n");
        // 设置缓存
        comboCache.set(cacheKey, content);
    } else {
        ctx.set("Hit-Combo", cacheKey);
    }

    // 无法正确读取文件
    // 交给后续的 404 处理
    if (content === undefined || content === null) {
        await next();
        return;
    }

    if (conf.enableComboCache) {
        // 生产环境默认开启缓存
        // 缓存时间固定为 6 天
        header.cacheControl("6d", ctx);
        header.expire("6d", ctx);
        header.lastModified(null, ctx);
    }

    // 返回数据
    ctx.body = content;
}

function init() {
    conf = getSysConfig();
    logger = log.getLogger("common");

    return handle;
}

export { init };
