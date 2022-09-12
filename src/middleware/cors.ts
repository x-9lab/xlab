import { isFunction, isString } from "@x-drive/utils";
import type Koa from "koa";

interface ICorsConfig {
    /**检测函数, 与 type 互斥 */
    check?: (origin?: string, url?: string) => boolean;

    /**跨域类型, 与 check 互斥 */
    type?: "sameroot" | "all";

    /**跨域开关 */
    enable?: boolean;
}

/**
一些本地的域名或 ip

`这里只是为开发阶段提供便捷，不应做为常规的控制手段`
 */
const IS_LOCAL: Record<string, boolean> = {
    "localhost": true
    , "127.0.0.1": true
}

/**根域获取正则 */
const ROOT_NAME_REGEXP = /[\w-]*\.(?:com|lo|cc|cn|asia|biz|coop|edu|gov|int|info|jobs|mobi|name|net|org|pro|tel|trave)(\.[a-z]{2})?/im;

/**获取域名根域 */
function getRootName(host: string) {
    const match = host.match(ROOT_NAME_REGEXP);
    if (match && isString(match[0])) {
        return match[0];
    }
    return null;
}

/**系统绑定的域名对应的根域 */
const ServerHostRootName = getRootName(
    getSysConfig("host")
);

/**判断是否允许跨域 */
function isOneOfUs(origin: string, url: string, config: ICorsConfig = {}) {
    if (config && config.enable === false) {
        return false;
    }

    if (isFunction(config.check)) {
        return config.check(origin, url);
    } else if (isString(config.type)) {
        if (config.type === "all") {
            return true;
        } else if (config.type === "sameroot") {
            if (ServerHostRootName && getRootName(origin) === ServerHostRootName) {
                return true;
            } else {
                return false;
            }
        }
    }

    return false;
}

/**跨域请求处理中间件初始化函数 */
export default function (config?: ICorsConfig) {

    /**跨域请求处理中间件 */
    async function cors(ctx: Koa.Context, next: Koa.Next) {
        const { origin } = ctx.headers;
        if (!origin) {
            await next();
            return;
        }

        const originHostURL = new URL(origin);
        const isLocal = IS_LOCAL[originHostURL.hostname];

        if (
            isLocal || isOneOfUs(origin, ctx.url, config)
        ) {
            ctx.set("Access-Control-Allow-Origin", origin);
            ctx.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            ctx.set("Access-Control-Allow-Credentials", "true");
            ctx.set("X-Cors", isLocal ? "local" : config.type || "custom");
        } else {
            ctx.set("X-Cors", "disabled");
        }

        await next();
    }

    return cors;
};