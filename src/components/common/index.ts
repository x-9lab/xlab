"use strict";

import { isArray, random } from "@x-drive/utils";
import { getReturnCode } from "../return-code";
import { isObject } from "@x-drive/utils";
import querystring from "querystring";
// import request from "request";
import crypto from "crypto";
import path from "path";
import fs from "fs";

var logger;

function checkLogger() {
    if (!logger) {
        logger = log.getLogger("common");
    }
    return logger;
}

/**
 * ascii字符串转为base64字符串
 * @param  str 要转化的字符串
 * @return     转化后的字符串
 */
function asciiTobase64(str: string) {
    if (typeof (str) === "string") {
        return new Buffer(str).toString("base64");
    }
    return "";
}
export { asciiTobase64 };

/**
 * base64字符串转为ascii字符串
 * @param  str 要转化的字符串
 * @return     转化后的字符串
 */
function base64Toascii(str: string) {
    if (typeof (str) === "string") {
        return new Buffer(str, "base64").toString();
    }
    return "";
}
export { base64Toascii };

/**
 * 序列化请求参数
 * @param  dat 请求参数对象
 * @param  url 要附加请求参数的URL
 * @return     序列化完的参数
 */
function params(dat: Record<string, any>, url: string) {
    var data = dat ? querystring.stringify(dat) : "";
    if (typeof (url) === "string") {
        data = data ? (url + "?" + data) : url;
    }
    return data;
}
export { params };

/**
 * 按位数格式化数字
 * @param  val       要格式化的数字
 * @param  separator 分割符
 * @param  size      分割位数间隔
 * @return           格式化完的字符串
 */
function numberFormat(val: number, separator: string, size: number) {
    if (typeof (val) !== "number") {
        return "0";
    }
    if (!separator) {
        separator = ",";
    }
    if (!size) {
        size = 3;
    }
    var last = size;

    const valStr = val.toString();
    var pos = valStr.indexOf(".");
    var res = "";
    if (pos === -1) {
        pos = valStr.length;
    } else {
        res = valStr.substr(pos);
    }
    if (valStr.charAt(0) === "-") {
        last++;
    }
    while (pos > last) {
        pos -= size;
        res = separator + valStr.substr(pos, size) + res;
    }
    if (pos) {
        res = valStr.substr(0, pos) + res;
    }
    return res;
}
export { numberFormat };


/**
 * 带花括号标签检测正则
 */
const labelReplaceExp = /\{(\w+)\}/g;
/**
 * 批量替换字符串中带花括号标签为指定数据
 * @param  tpl  待处理的字符串
 * @param  data 替换数据
 * @return      替换后端字符串
 */
function labelReplace(tpl: string, data: Record<string, XLab.JsonValue>): string
/**
 * 批量替换字符串中带花括号标签为指定数据
 * @param  tpl  待处理的字符串
 * @param  data 替换数据
 * @return      替换后端字符串
 */
function labelReplace(tpl: string, data: XLab.JsonValue): string
/**
 * 批量替换字符串中带花括号标签为指定数据
 * @param  tpl  待处理的字符串
 * @param  data 替换数据
 * @return      替换后端字符串
 */
function labelReplace(tpl: any, data: any): string {
    return tpl.replace(labelReplaceExp, function (label: string, key: string) {
        return typeof (data) === "object" ? data[key] : data;
    });
}
export { labelReplace }

/**
 * 格式化数字, 自动补0前续
 * @param  number 要格式化的数字
 * @param  size   格式化后出来的数字位数
 * @return        格式化结果
 */
function fix0(number: number, size: number) {
    var num = number.toString();
    while (num.length < size) {
        num = "0" + num;
    }
    return num;
}
export { fix0 }

const format_exp = /[YymndjNwaAghGHis]/g;

/**
 * 格式化时间
 * @param  format 日期格式
 * @param  ts     时间戳
 * @return        格式化后的时间
 */
function date(format: string, ts: number): string
/**
 * 格式化时间
 * @param  format 日期格式
 * @param  ts     日期字符串
 * @return        格式化后的时间
 */
function date(format: string, ts: string): string
/**
 * 格式化时间
 * @param  format 日期格式
 * @param  ts     日期对象
 * @return        格式化后的时间
 */
function date(format: string, ts: Date): string
/**
 * 格式化时间
 * @param  format 日期格式
 * @param  ts     日期数据(时间戳, 字符串)
 * @return        格式化后的时间
 */
function date(format: any, ts: any): string {
    ts = new Date(ts);
    return format.replace(format_exp, function (tag) {
        switch (tag) {
            case "Y":
                return ts.getFullYear();
            case "y":
                return ts.getFullYear() % 100;
            case "m":
                return fix0(ts.getMonth() + 1, 2);
            case "n":
                return ts.getMonth() + 1;
            case "d":
                return fix0(ts.getDate(), 2);
            case "j":
                return ts.getDate();
            case "N":
                return ts.getDay();
            case "w":
                return ts.getDay() % 7;
            case "a":
                return ts.getHours() < 12 ? "am" : "pm";
            case "A":
                return ts.getHours() < 12 ? "AM" : "PM";
            case "g":
                return ts.getHours() % 12 + 1;
            case "h":
                return fix0(ts.getHours() % 12 + 1, 2);
            case "G":
                return ts.getHours();
            case "H":
                return fix0(ts.getHours(), 2);
            case "i":
                return fix0(ts.getMinutes(), 2);
            case "s":
                return fix0(ts.getSeconds(), 2);
        }
        return tag;
    });
}
export { date }

/**
 * 生成操作结果数据对象
 * @param  status 返回码
 * @param  result 返回的数据，数据格式根据具体模块而定
 * @param  msg    返回的提示性信息
 * @return        数据对象
 */
function responseResult<T = any>(status: number, result?: T, msg?: string): XLab.IStdRes

/**
 * 生成操作结果数据对象
 * @param  status 操作结果
 * @param  result 返回的数据，数据格式根据具体模块而定
 * @param  msg    返回的提示性信息
 * @return        数据对象
 */
function responseResult<T = any>(status: boolean, result?: T, msg?: string): XLab.IStdRes

/**
 * 生成操作结果数据对象
 * @param  status 返回结果数据
 * @param  result 返回的数据，数据格式根据具体模块而定
 * @param  msg    返回的提示性信息
 * @return        数据对象
 */
function responseResult<T = any>(status: XLab.ICodeItem, result?: T, msg?: string): XLab.IStdRes

/**
 * 生成操作结果数据对象
 * @param  status 布尔，操作结果
 * @param  result 返回的数据，数据格式根据具体模块而定
 * @param  msg    返回的提示性信息
 * @return        数据对象
 */
function responseResult<T = any>(status: any, result?: T, msg?: string): XLab.IStdRes {
    var code: XLab.ICodeItem = isObject(status) ? status : getReturnCode(status);
    var dat: Partial<XLab.IStdRes<T>> = {
        "success": code.errorcode === 0
        , "code": code.errorcode
        , "msg": msg || code.msg
    };
    dat.result = result || null;
    return dat as XLab.IStdRes;
}
export { responseResult }

/**
 * 根据传入的参数生成一个 MD5 值
 */
function getMD5(...args: any[]) {
    const conditions: XLab.JsonObject = {};
    args.forEach(function (item, index) {
        conditions[index] = item;
    });
    return crypto.createHash("md5")
        .update(JSON.stringify(conditions), "utf8")
        .digest("hex");
}
export { getMD5 }

/**
 * 对象值转化为数组
 * @param  obj 待转的对象
 * @return     转化后的数组
 */
function object2Array(obj: XLab.JsonObject) {
    var arr = [];
    Object.keys(obj).forEach(function (key) {
        arr.push(
            obj[key]
        );
    });
    return arr;
}
export { object2Array };

/**
 * 默认 Promise 处理函数
 * @param resolve Promise 成功处理函数
 * @param reject  Promise 异常处理函数
 */
function defPromiseHandler<T = any>(resolve: Function, reject: Function) {
    return function (err: Error, re: T) {
        if (err) {
            console.error(err);
            reject(err);
        } else if (re) {
            resolve(re);
        } else {
            reject("No result.");
        }
    }
}
export { defPromiseHandler }

/**Promise 包装函数 */
function promiseWapper(...args: any[]) {
    var handler = args.pop();
    handler = handler;
    var p = new Promise(handler);
    return p;
}
export { promiseWapper }

/**
 * 封装一个 promise 形式的 request 方法
 * @deprecated 请直接使用 component 中的 request 模块
 */
function requestWapper<T = any>(...args: any[]) {
    return new Promise(function (_, reject) {
        reject(
            new Error("请直接使用 component 中的 request 模块")
        );
    });
}
export { requestWapper }


/**
 * 格式化 JSON 数据
 * @param  data 原始数据字符串
 * @return      格式化后的数据
 */
function formatJson<T = XLab.JsonObject>(data: string) {
    var re: T;
    try {
        re = JSON.parse(data);
    } catch (err) {
        checkLogger();
        logger.error("Pares create menu return data fail.", data);
        return null;
    }
    return re;
}
export { formatJson }

/**
 * 输出 sjonp 格式
 * @param  data  待处理数据
 * @param  jsonp jsonp 回调函数名称
 * @return       当是 jsonp 格式时返回 String, 不是时返回原始数据
 */
function toJsonp(data: XLab.JsonObject, jsonp: string) {
    return jsonp ? jsonp + "(" + JSON.stringify(data) + ")" : data;
}
export { toJsonp }

/**
 * 查找到文件时的处理函数
 * @param tmpPath 文件地址
 */
type WalkCallback = (tmpPath: string, item: string) => void;

/**
 * 递归处理文件夹
 * @param  path      文件目录
 * @param  floor     层级
 * @param  callback  查找到文件时的处理函数
 */
function walk(path: string, floor: number, callback: WalkCallback) {
    floor++;
    var files = fs.readdirSync(path);
    files.forEach(function (item) {
        if (!item.startsWith(".") && !item.endsWith(".d.ts")) {
            var tmpPath = path + "/" + item;
            var stats = fs.statSync(tmpPath);
            if (stats.isDirectory() && item.indexOf("@") === -1) {
                walk(tmpPath, floor, callback);
            } else if (!stats.isDirectory()) {
                callback(tmpPath, item);
            }
        }
    });
}
export { walk }


/**
 * 检测指定文件是否存在
 * @param  pathStr    文件路径
 * @param  resolve    是否使用 path 模块重新处理路径
 * @return            文件信息，文件不存在为 null
 */
function checkFileStat(pathStr: string, resolve?: boolean) {
    if (resolve) {
        pathStr = path.resolve(__dirname, pathStr);
    }
    var stat: fs.Stats;
    try {
        stat = fs.statSync(pathStr);
    } catch (e) {
        stat = null;
    }
    return stat;
}
export { checkFileStat }

/**获取真正可执行的模块 */
function getRealDefaultMod(mod: any) {
    if (mod) {
        if (
            (mod.__esModule && mod.default) || mod.default
        ) {
            return mod.default;
        }
    }
    return mod;
}
export { getRealDefaultMod };

/**
* 休眠随机时间
* @param time 随机时间范围
* @property min 最小时间(ms)
* @property max 最大时间(ms)
*/
async function sleep(time: [min: number, max: number]): Promise<boolean>
/**
 * 休眠
 * @param time 休眠时间(ms)
 */
async function sleep(time: number): Promise<boolean>
async function sleep(time: unknown) {
    const delay: number = isArray(time) ? random(time[1], time[0]) : time as number;
    checkLogger();
    logger.log(`Sleep ${delay} ms`);
    return await new Promise(res => {
        setTimeout(() => {
            res(true);
        }, delay);
    });
}

export { sleep };