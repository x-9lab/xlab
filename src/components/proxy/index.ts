"use strict";

import httpProxy from "http-proxy";
import type Koa from "koa";

/**代理配置项 */
interface IProxyOption {
    /**代理目标 */
    target: string;

    /**代理域名 */
    host: string;
}

declare module "http" {
    interface IncomingMessage {
        /**代理类型 */
        proxyType: string;
    }
}

const proxy = httpProxy.createProxy();

/**
 * proxy 配置
 */
const proxyOptions: Record<string, IProxyOption> = {};

/**
 * 设置代理配置
 * @param type     代理配置名称
 * @param options  配置信息
 */
function set(type: string, options: IProxyOption | string) {
    if (!proxyOptions[type]) {
        if (typeof options === "string") {
            options = {
                "target": options
                , "host": options.replace("http://", "")
            };
        }
        proxyOptions[type] = options;
    }
    return proxyOptions[type];
};
export { set }

/**
 * web 代理
 */
function web(reqObj: Koa.Context, headers) {
    let options = proxyOptions[reqObj.req.proxyType];
    if (options.host) {
        reqObj.req.headers.host = options.host;
    }
    if (headers) {
        reqObj.req.headers = Object.assign(reqObj.req.headers, headers);
    }
    return new Promise(function (resolve, reject) {
        proxy.web(reqObj.req, reqObj.res, options, function (err: Error) {
            if (err) {
                console.log("proxy err ", err);
                err.name = "Proxy";
                reject(err);
            } else {
                resolve(null);
            }
        });
    });
};

export { web }
