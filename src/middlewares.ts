"use strict";

import { getRealDefaultMod } from "./components/common";
import { isArray, isString } from "@x-drive/utils";
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

// ［最后3个中间件固定是 系统路由，静态文件服务，错误请求处理模块］
/**加载中间件 */
function loadMiddleware(app: koa) {
    const config = getSysConfig<ILab.IConfig>();
    if (isArray(config.middleware) && config.middleware.length) {
        config.middleware.forEach(item => {
            const isSrtItem = isString(item);
            let name = isSrtItem ? item : item[0];
            const conf = isSrtItem ? null : item[1];
            if (INTERNAL_MIDDLEWARE[name as string]) {
                app.use(
                    getRealDefaultMod(
                        require(`./middleware/${name}`)
                    )(conf)
                );
            } else {
                app.use(
                    getRealDefaultMod(
                        require(`${cwd}/@server/middleware/${name}`)
                    )(conf)
                );
            }

            masterLog(`MIDDLEWARE >>> [${name}] launch`);
        });
        console.log("");
    }
}

export default loadMiddleware;
