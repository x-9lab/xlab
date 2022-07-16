import { isArray, isObject, isFunction, isAsyncFunction } from "@x-drive/utils";
import { walk, checkFileStat, getRealDefaultMod } from "./components/common";
import type Router from "koa-router";
import path from "path";

/**生成 api */
function buildApi(api: string) {
    if (!api.startsWith("/")) {
        api = `/${api}`;
    }
    return `/api${api}`;
}

/**加载业务服务接口 */
function appRouter(router: Router) {
    const IS_API_REGEXP = /^\/api\//;

    var processBusiness = function (modPath: string, item: string) {
        var mod = require(
            path.resolve(modPath)
        );
        if (mod) {
            mod = getRealDefaultMod(mod);

            let api_path = modPath.split("business");
            let api;
            let modName: string;

            // 根据路径生成 url 规则
            api = api_path[1].replace(".js", "").split("/");

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
                api = buildApi(
                    api.join("/")
                );
                mod.unshift(api);
            } else {
                // 不是数组则把文件当作正常的 api 地址
                api = buildApi(
                    api.join("/")
                );
            }

            // 是对象则取对应的字段
            if (isObject(mod) && (isFunction(mod.handler) || isAsyncFunction(mod.handler))) {
                modName = mod.method || "get";
                api = mod.api || api;

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

            router[modName].apply(router, mod);

            masterLog("router", `Handling API >>> [${modName}] ${api}`);
        }
    }

    // 业务基本目录
    var _p = path.resolve(__dirname, "business");
    walk(_p, 0, processBusiness);

    // 支持自定义 api
    _p = path.resolve(process.cwd(), "@server", "business");
    if (process.cwd() !== __dirname && checkFileStat(_p)) {
        walk(_p, 0, processBusiness);
    }

    processBusiness = null;

    console.log("");
};

export default appRouter;
