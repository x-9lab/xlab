import { isArray, isObject, isFunction, isAsyncFunction } from "@x-drive/utils";
import { checkFileStat, getRealDefaultMod } from "./components/common";
import XConfig from "./default-x-config";
import type Router from "koa-router";
import path from "path";
import fs from "fs";

/**
 * 查找到文件时的处理函数
 * @param tmpPath 文件地址
 */
type WalkCallback = (tmpPath: string, item: string, middlewares: Record<string, string[]>) => void;

/**API 服务目录 */
const API_BUSINESS_DIR = "business";

/**生成 api */
function buildApi(api: string) {
    if (!api.startsWith("/")) {
        api = `/${api}`;
    }
    return `/api${api}`;
}

/**
 * 递归处理文件夹
 * @param  path         文件目录
 * @param  middlewares  接口中间件
 * @param  callback     查找到文件时的处理函数
 */
function walk(dir: string, middlewares: Record<string, string[]>, callback: WalkCallback) {
    var files = fs.readdirSync(dir);
    files.forEach(function (item) {
        if (!item.startsWith(".") && !item.endsWith(".d.ts")) {
            var tmpPath = path.join(dir, item);
            var stats = fs.statSync(tmpPath);
            if (stats.isDirectory() && item.startsWith("$")) {
                // 接口级别中间件
                let middlewaresFiles = fs.readdirSync(tmpPath);
                let mws = [];
                middlewaresFiles.forEach(function (name) {
                    let tmpMwPath = path.join(tmpPath, name);
                    let fileStat = fs.statSync(tmpMwPath);
                    if (!fileStat.isDirectory() && !item.startsWith(".") && !item.endsWith(".d.ts")) {
                        mws.push(tmpMwPath);
                    }
                });
                // 简单做下排序
                mws.sort();
                const partPath = dir.split(API_BUSINESS_DIR)[1] || path.posix.sep;
                middlewares[partPath] = mws;
            }
            if (stats.isDirectory() && !item.startsWith("@") && !item.startsWith("$")) {
                walk(tmpPath, middlewares, callback);
            } else if (!stats.isDirectory()) {
                callback(tmpPath, item, middlewares);
            }
        }
    });
}

/**加载业务服务接口 */
function appRouter(router: Router) {
    const IS_API_REGEXP = /^\/api\//;

    var processBusiness: WalkCallback = function (modPath, item, middlewares) {
        var mod = require(
            path.resolve(modPath)
        );
        if (mod) {
            mod = getRealDefaultMod(mod);

            let api_path = modPath.split(API_BUSINESS_DIR);
            let api;
            let apiPart: string[];
            let modName: string;

            // 根据路径生成 url 规则
            api = api_path[1].replace(".js", "").split(path.posix.sep);

            // 文件名是 index
            const lastIsIndex = api[api.length - 1] === "index";

            // 文件名是 index 的则会被从 api 上先强行去掉
            // 如果需要命名成 index 的需要自己用 object 形式，用 api 字段定义
            if (lastIsIndex) {
                api.pop();
            }

            // 如果模块返回的是数组，则使用文件名做为方法名，并在 api 上去掉文件名
            if (isArray(mod)) {
                if (!lastIsIndex) {
                    api.pop();
                }
                apiPart = api;
                api = buildApi(
                    api.join("/")
                );
                mod.unshift(api);
            } else {
                apiPart = api;
                // 不是数组则把文件当作正常的 api 地址
                api = buildApi(
                    api.join("/")
                );
            }

            // 是对象则取对应的字段
            if (isObject(mod) && (isFunction(mod.handler) || isAsyncFunction(mod.handler))) {
                modName = mod.method || "get";
                api = mod.api || api;
                apiPart = api.split("/");
                if (apiPart[0] !== "") {
                    apiPart.unshift("");
                }
                // 保证一定是以 api 开头的
                if (!IS_API_REGEXP.test(api)) {
                    api = buildApi(api);
                }

                if (isArray(mod.middleware)) {
                    mod = [api, ...mod.middleware, mod.handler];
                } else {
                    mod = [api, mod.handler];
                }
            }

            var dirMws = [];
            var prevPart = "";
            for (let i = 2; i < apiPart.length; i++) {
                const part = `${prevPart}${path.posix.sep}${apiPart[i]}`;
                if (middlewares[part]) {
                    dirMws = dirMws.concat(middlewares[part]);
                }
                prevPart = part;
            }

            // 直接返回函数则直接绑定
            if (isFunction(mod) || isAsyncFunction(mod)) {
                mod = [api, mod];
            }

            if (!modName) {
                modName = item.replace(".js", "");
                if (modName === "index") {
                    modName = "get";
                }
            }

            if (dirMws && dirMws.length) {
                let mws = dirMws.map(name => getRealDefaultMod(require(name)));
                mod.splice.apply(mod, [1, 0, ...mws]);
                mws = null;
            }

            router[modName].apply(router, mod);

            masterLog("router", `Handling API >>> [${modName}] ${api}`);
        }
    }

    // 业务基本目录
    var _p = path.resolve(__dirname, API_BUSINESS_DIR);
    walk(_p, {}, processBusiness);

    // 支持自定义 api
    _p = path.resolve(process.cwd(), XConfig.businessDir, API_BUSINESS_DIR);
    if (process.cwd() !== __dirname && checkFileStat(_p)) {
        walk(_p, {}, processBusiness);
    }

    processBusiness = null;

    console.log("");
};

export default appRouter;
