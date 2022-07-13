"use strict";

import { isArray, isUndefined, isNull, isFunction, isObject, labelReplace } from "@x-drive/utils";
import type Koa from "koa";

const conf = getSysConfig();
// 注入字段
const injectVars = conf.injection;
// 错误代码管理模块
const returnCode = requireMod("return-code").getCodeDetail();

/**
 * 注入数据存储对象
 */
var INJECTIONS = {
    "errCode": {}
    , "apis": conf.apis
    , "biServer": conf.biServer ? (conf.protocol + "://" + conf.biServer) : ""
    , "navMap": {}
};

Object.keys(returnCode).forEach(function (key) {
    let code = returnCode[key];
    INJECTIONS.errCode[code.errorcode] = code.msg;
});

/**
 * 数据注入方法
 * @param  html 待处理的字符串
 * @param  req  请求对象
 * @return      处理完的字符串
 */
function inject(html: string, req: Koa.Context) {
    if (isArray(injectVars) && injectVars.length) {
        let processorData = {};
        injectVars.forEach((key: string) => {
            // 优先在模块內的缓存对象中找
            let dat = INJECTIONS[key];
            // 找不到再去配置中找
            if (isUndefined(dat) || isNull(dat)) {
                dat = conf[key];
            }

            // 如果找出来的是个函数，则尝试执行函数得到返回结果
            if (isFunction(dat)) {
                dat = dat(key, req);
            }

            if (isObject(dat) || Array.isArray(dat)) {
                dat = JSON.stringify(dat);
            }

            processorData[key] = dat;
        });
        return labelReplace(html, processorData);
    }
    return html;
}
export { inject }

/**
 * 添加一个字段到缓存对象
 * @param  key 字段名
 * @param  val 数据
 * @return     存储的数据
 */
function add(key: string, val: ILab.JsonValue) {
    INJECTIONS[key] = val;
    injectVars.push(key);
    return INJECTIONS[key];
}
export { add }

/**
 * 修改一个字段
 * @param  key 字段名
 * @param  val 数据
 * @return     存储的数据
 */
function modify(key: string, val: ILab.JsonValue) {
    var re = INJECTIONS.hasOwnProperty(key)
    if (re) {
        INJECTIONS[key] = val;
    }
    return re
}
export { modify }
