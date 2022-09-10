"use strict";

import init, { filter as htmlFilter } from "./@bin/html-filter";
import type Koa from "koa";
import url from "url";

/**资源类型 */
interface ISrcType {
    /**是否是 js 文件 */
    js: boolean;
    /**是否是 html 文件 */
    html: boolean;
    /**是否是图片文件 */
    img: boolean;
    /**是否是 css 文件 */
    css: boolean;
    /**是否是文件夹 */
    dir: boolean;
    /**是否是静态文件 */
    static: boolean;
    /**是否是模板文件 */
    tpl: boolean;
    /**是否是字体文件 */
    font: boolean;
}

declare module "koa" {
    /**系统默认 state */
    interface DefaultState {
        /**资源类型 */
        srcType: ISrcType;

        /**请求域名 */
        originHost: string | string[];

        /**请求版本 */
        ver: Record<string, string>;
    }
}

const IS_STATIC_RE = /^\/.*\.(ttf|woff|eot|html|css|js|json|png|jpeg|jpg|gif|bmp|handlebars|mp3|mp4|m3u8|avi|mpg|mpeg|xml|json|tpl)$/i;
const IS_IMG_RE = /\.(jpg|jpeg|png|gif)$/i;
const IS_CSS_RE = /\.css$/i;
const IS_JS_RE = /\.js$/i;
const IS_HTML_RE = /\.html$/i;
const IS_DIR_RE = /(\/|[\.\d\/]+)$/i;
const IS_TPL_RE = /\.tpl$/i;
const IS_FONT_RE = /\.(ttf|woff|eot|woff2)$/i;

// 判断是否是 JS 文件路径
function isJS(url: string) {
    return url && IS_JS_RE.test(url);
}

// 判断是否是 HTML 文件路径
function isHtml(url: string) {
    return url && IS_HTML_RE.test(url);
}

// 判断是否是图片路径
function isImg(url: string) {
    return url && IS_IMG_RE.test(url);
}

// 判断是否目录路径
function isDir(url: string) {
    return url && IS_DIR_RE.test(url) && !IS_FONT_RE.test(url);
}

// 判断是否是 css 文件路径
function isCss(url: string) {
    return url && IS_CSS_RE.test(url);
}

// 判断是否文件
function isStatic(url: string) {
    return url && IS_STATIC_RE.test(url);
}

// 判断是否模板
function isTpl(url: string) {
    return url && IS_TPL_RE.test(url);
}

// 判断是否字体
function isFont(url: string) {
    return url && IS_FONT_RE.test(url);
}

// 请求过滤器
// 用于补充识别一些必要信息
async function filter(ctx: Koa.Context, next: Koa.Next) {
    var parsedUrl = url.parse(ctx.url);
    var pathname = parsedUrl.pathname;
    ctx.state.parsedUrl = parsedUrl;

    var srcType: ISrcType = {
        "js": false
        , "html": false
        , "img": false
        , "css": false
        , "dir": false
        , "static": false
        , "tpl": false
        , "font": false
    };

    // 辨别请求资源类型
    if (isDir(pathname)) {
        srcType.dir = true;
        // 提取页面必要的信息
        // 由于 dir 也可能直接返回 HTML 页面
        // 所以这里也需要经过 HTML 的过滤器处理
        ctx.state.originHost = ctx.headers["x-forwarded-host"] || ctx.headers.host;
        ctx.state.ver = htmlFilter(ctx.url);
    } else if (isStatic(pathname)) {
        srcType.static = true;

        if (isHtml(pathname)) {
            srcType.html = true;

            // 提取页面必要的信息
            ctx.state.originHost = ctx.headers["x-forwarded-host"] || ctx.headers.host;
            ctx.state.ver = htmlFilter(ctx.url);
        } else if (isJS(pathname)) {
            srcType.js = true;

        } else if (isImg(pathname)) {
            srcType.img = true;

        } else if (isCss(pathname)) {
            srcType.css = true;
        } else if (isTpl(pathname)) {
            srcType.tpl = true;
        } else if (isFont(pathname)) {
            srcType.font = true;
        }
    }
    ctx.state.srcType = srcType;
    await next();
}

export default function () {
    init();
    return filter;
};
