import { isArray, isObject, isFunction, isAsyncFunction, isString } from "@x-drive/utils";
import { checkFileStat, getRealDefaultMod } from "./components/common";
import { log as masterLog } from "./config";
import XConfig from "./default-x-config";
import type Router from "koa-router";
import path from "path";
import fs from "fs";

/**API 服务目录 */
const API_BUSINESS_DIR = "business";

/**API 地址前缀检测 */
const IS_API_REGEXP = /^\/api\//;

/**支持的请求方法, 同时也是「文件名即方法」约定支持的文件名 */
const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "head", "options", "all"] as const;

/**支持的请求方法 */
type HttpMethod = typeof HTTP_METHODS[number];

/**路由定义对象 */
interface IApiDefinition {
    /**API 请求方法, 不指定时由文件名约定或默认 get 决定 */
    method?: HttpMethod;

    /**业务 api 地址, 不指定时由文件路径生成 */
    api?: string;

    /**接口中间件 */
    middleware?: Router.IMiddleware[];

    /**业务处理函数 */
    handler: Router.IMiddleware;

    /**是否忽略 API 名称检测(不强制 /api 前缀) */
    ignoreApiNameCheck?: boolean;
}
export type { IApiDefinition }

/**
 * 定义一个业务接口

 * 运行时恒等返回, 仅为路由模块提供类型推导
 */
function defineApi(def: IApiDefinition) {
    return def;
}
export { defineApi }

/**归一化后的路由注册单元 */
interface INormalizedRoute {
    /**请求方法 */
    method: HttpMethod;

    /**api 地址 */
    api: string;

    /**接口自身声明的中间件 */
    middlewares: Router.IMiddleware[];

    /**业务处理函数 */
    handler: Router.IMiddleware;
}

/**目录级中间件映射: 相对 business 根的 url 风格路径 -> 中间件文件列表 */
type DirMiddlewares = Record<string, string[]>;

/**生成 api */
function buildApi(api: string) {
    if (!api.startsWith("/")) {
        api = `/${api}`;
    }
    return `/api${api}`;
}

/**把相对路径统一为以 / 开头的 url 风格路径 */
function toUrlPath(rel: string) {
    return "/" + rel.split(path.sep).filter(Boolean).join("/");
}

/**
 * 递归收集业务目录下的路由文件与目录级中间件
 * @param dir         当前目录
 * @param root        business 根目录
 * @param middlewares 目录级中间件收集对象
 * @param files       路由文件收集数组
 */
function collect(dir: string, root: string, middlewares: DirMiddlewares, files: string[]) {
    fs.readdirSync(dir).forEach(function (item) {
        if (item.startsWith(".") || item.endsWith(".d.ts")) {
            return;
        }
        const tmpPath = path.join(dir, item);
        const stats = fs.statSync(tmpPath);
        if (stats.isDirectory()) {
            if (item.startsWith("$")) {
                // 目录级中间件, 生效于所在层级及以下; 不递归, 按文件名排序执行
                const mws = fs.readdirSync(tmpPath)
                    .filter(function (name) {
                        return !name.startsWith(".")
                            && !name.endsWith(".d.ts")
                            && fs.statSync(path.join(tmpPath, name)).isFile();
                    })
                    .sort()
                    .map(name => path.join(tmpPath, name));
                const key = toUrlPath(path.relative(root, dir));
                middlewares[key] = (middlewares[key] || []).concat(mws);
            } else if (!item.startsWith("@")) {
                collect(tmpPath, root, middlewares, files);
            }
        } else {
            files.push(tmpPath);
        }
    });
}

/**
 * 把一个路由模块归一化为注册单元

 * 支持的导出形态:
 * 1. 函数: 绑定为处理函数, 方法由文件名约定决定
 * 2. 对象(推荐配合 defineApi): { method?, api?, middleware?, handler, ignoreApiNameCheck? }
 *
 * 文件名约定: `index` 从 api 上去掉; 文件名是请求方法名(get/post/...)时,
 * 从 api 上去掉并作为该接口的请求方法
 * @param modPath 模块文件地址
 * @param root    business 根目录
 */
function normalize(modPath: string, root: string): INormalizedRoute {
    var mod = getRealDefaultMod(
        require(
            path.resolve(modPath)
        )
    );
    if (!mod) {
        return null;
    }

    if (isArray(mod)) {
        throw new Error(
            `[xlab] 数组形式的路由定义已在 v2 移除: ${modPath}\n`
            + "请改用 defineApi 对象形式或「文件名即方法」约定, 参见 MIGRATION.md"
        );
    }

    const rel = path.relative(root, modPath);
    const ext = path.extname(rel);
    const parts = rel.slice(0, rel.length - ext.length).split(path.sep).filter(Boolean);

    const fileName = parts[parts.length - 1];
    var method: HttpMethod = "get";
    if (fileName === "index") {
        parts.pop();
    } else if ((HTTP_METHODS as readonly string[]).indexOf(fileName) !== -1) {
        method = fileName as HttpMethod;
        parts.pop();
    }

    var api = buildApi(parts.join("/"));
    var middlewares: Router.IMiddleware[] = [];
    var handler: Router.IMiddleware = null;

    if (isFunction(mod) || isAsyncFunction(mod)) {
        handler = mod;
    } else if (isObject(mod)) {
        const def: IApiDefinition = mod;
        if (isFunction(def.handler) || isAsyncFunction(def.handler)) {
            handler = def.handler;
            method = def.method || method;
            if (isString(def.api)) {
                api = def.api;
                if (!api.startsWith("/")) {
                    api = `/${api}`;
                }
                // 如果没有声明忽略检测则保证接口一定是以 api 开头的
                if (!def.ignoreApiNameCheck && !IS_API_REGEXP.test(api)) {
                    api = buildApi(api);
                }
            }
            if (isArray(def.middleware)) {
                middlewares = def.middleware;
            }
        }
    }

    if (!handler) {
        return null;
    }

    return { method, api, middlewares, handler };
}

/**
 * 解析一个 api 命中的目录级中间件链
 * @param api         api 地址
 * @param middlewares 目录级中间件映射
 */
function resolveDirMiddlewares(api: string, middlewares: DirMiddlewares) {
    var chain: string[] = [];
    if (middlewares["/"]) {
        chain = chain.concat(middlewares["/"]);
    }
    const parts = api.split("/").filter(part => part && part !== "api");
    var prev = "";
    for (const part of parts) {
        prev = `${prev}/${part}`;
        if (middlewares[prev]) {
            chain = chain.concat(middlewares[prev]);
        }
    }
    return chain.map(file => getRealDefaultMod(require(file)));
}

/**加载业务服务接口 */
function appRouter(router: Router) {

    function register(root: string) {
        const middlewares: DirMiddlewares = {};
        const files: string[] = [];
        collect(root, root, middlewares, files);

        files.forEach(function (modPath) {
            const route = normalize(modPath, root);
            if (!route) {
                masterLog("router", "warn", `Ignore invalid api module: ${modPath}`);
                return;
            }
            const dirMws = resolveDirMiddlewares(route.api, middlewares);
            router[route.method === "delete" ? "del" : route.method].apply(
                router
                , [route.api, ...dirMws, ...route.middlewares, route.handler]
            );
            masterLog("router", `Handling API >>> [${route.method}] ${route.api}`);
        });
    }

    // 框架内置业务
    var _p = path.resolve(__dirname, API_BUSINESS_DIR);
    if (checkFileStat(_p)) {
        register(_p);
    }

    // 业务自定义业务
    _p = path.resolve(process.cwd(), XConfig.businessDir, API_BUSINESS_DIR);
    if (process.cwd() !== __dirname && checkFileStat(_p)) {
        register(_p);
    }

    console.log("");
};

export default appRouter;
