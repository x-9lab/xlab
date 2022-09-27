"use strict";

import { getRealDefaultMod } from "./components/common";
import { isArray, isBoolean, isNumber, isString } from "@x-drive/utils";
import XConfig from "./default-x-config";
import type koa from "koa";

const cwd = process.cwd();

/**内部中间件 */
const INTERNAL_MIDDLEWARE = {
    "combo": true
    , "bad-request": true
    , "fresh-filter": true
    , "handle-pre-dir": true
    , "request-filter": true
    , "service-mark": true
    , "compress": true
    , "cors": true
};

type OldMiddlewareList = (string | (string | Record<string, any>)[])[];

/**兼容老的中间件声明 */
function compatibleWithOldVer(list: OldMiddlewareList) {
    const middlewares: Pick<XLab.IConfig, "middlewares"> = {};
    list.forEach((item, index) => {
        var subject: XLab.MiddlewareConfig;
        var name: string;
        subject = {
            index
        }
        if (isString(item)) {
            name = item as string;
        } else if (isArray(item)) {
            name = item[0] as string;
            if (item[1]) {
                subject.config = item[1] as Record<string, XLab.JsonValue>;
            }
        }
        middlewares[name] = subject;
    });

    return middlewares;
}

/**获取中间件加载执行列表 */
function getExeList(): XLab.MiddlewareConfig[] {
    const config = getSysConfig();
    var mConfig: Pick<XLab.IConfig, "middlewares">;

    if (config.middlewares) {
        mConfig = config.middlewares;
    } else if (isArray(config.middleware) && config.middleware.length) {
        masterLog("middlewares", "warn", "middleware 配置已弃用并将在 v1.3.0 之后删除，请使用 middlewares 配置中间件");
        mConfig = compatibleWithOldVer(config.middleware);
    } else {
        mConfig = null;
    }
    if (mConfig) {
        return Object
            .keys(mConfig)
            .filter(key => (isBoolean(mConfig[key]) ? mConfig[key] : true))
            .map((key, index) => {
                if (isBoolean(mConfig[key])) {
                    mConfig[key] = {};
                }
                if (!isString(mConfig[key].name)) {
                    mConfig[key].name = key;
                }
                if (!isNumber(mConfig[key].index)) {
                    mConfig[key].index = index;
                }
                return mConfig[key];
            })
            .sort((now: XLab.MiddlewareConfig, next: XLab.MiddlewareConfig) => (now.index - next.index))
    }
    return [];
}

// ［最后3个中间件固定是 系统路由，静态文件服务，错误请求处理模块］
/**加载中间件 */
function loadMiddleware(app: koa) {
    const list = getExeList();
    if (isArray(list) && list.length) {
        list.forEach(item => {
            if (INTERNAL_MIDDLEWARE[item.name]) {
                app.use(
                    getRealDefaultMod(
                        require(`./middleware/${item.name}`)
                    )(item.config)
                );
            } else {
                app.use(
                    getRealDefaultMod(
                        require(`${cwd}/${XConfig.businessDir}/middleware/${item.name}`)
                    )(item.config)
                );
            }

            masterLog(`MIDDLEWARE >>> [${item.name}] launch`);
        });
        console.log("");
    }
}

export default loadMiddleware;
