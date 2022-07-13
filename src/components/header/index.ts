"use strict";
import { isString, isNumber } from "@x-drive/utils";
import { string2seconds } from "./time";
import type Koa from "koa";
import mime from "../mime";

/**
 * 设置 Cache-Control
 * @param options max-age 缓存时间字符串
 * @param res 请求上下文
 */
function cacheControl(options: string, res: Koa.Context): void
/**
 * 设置 Cache-Control
 * @param options max-age 缓存时间数
 * @param res 请求上下文
 */
function cacheControl(options: number, res: Koa.Context): void
/**
 * 设置 Cache-Control
 * @param options max-age 缓存时间
 * @param res 请求上下文
 */
function cacheControl(options: any, res: Koa.Context): void {
    var age: string;

    if (isString(options)) {
        if (options.indexOf("max-age") === -1) {
            age = options;
        } else {
            age = "max-age=" + string2seconds(options);
        }
    } else if (isNumber(options)) {
        age = "max-age=" + options;
    }

    if (age) {
        res.set("Cache-Control", age);
    }
}
export { cacheControl }

/**
 * 设置 Expires
 * @param options Expires 缓存时间字符串
 * @param res 请求上下文
 */
function expire(options: string, res: Koa.Context): void
/**
 * 设置 Expires
 * @param options Expires 缓存时间
 * @param res 请求上下文
 */
function expire(options: number, res: Koa.Context): void
/**
 * 设置 Expires
 * @param options Expires 缓存时间
 * @param res 请求上下文
 */
function expire(options: any, res: Koa.Context): void {
    var exp: Date;

    if (isString(options)) {
        exp = new Date(Date.now() + (string2seconds(options) * 1000));
    } else if (isNumber(options)) {
        exp = new Date(Date.now() + (options * 1000));
    }

    if (exp) {
        res.set("Expires", exp.toUTCString());
    }
}
export { expire }

/**
 * 设置 Content-Type
 * @param options 类型
 * @param res 请求上下文
 */
function contentType(options: string, res: Koa.Context) {
    var type: string;

    if (isString(options)) {
        type = mime[options];
    }

    if (type) {
        res.set("Content-Type", `${type}; charset=utf-8`);
    }
}
export { contentType }

/**
 * 设置 Last-Modified
 * @param options 最后更新时间，传入非 String 类型时会使用当前时间
 * @param res 请求上下文
 */
function lastModified(options: string, res: Koa.Context) {
    var time: string = isString(options) ? options : (new Date()).toUTCString();
    res.set('Last-Modified', time);
}
export { lastModified }

