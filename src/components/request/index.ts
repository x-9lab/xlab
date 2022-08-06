import { isObject, isUndefined, labelReplace, addQuery, copy, isString, extend, isNumber } from "@x-drive/utils";
import type { RequestInit, Response } from "node-fetch";
import { isExecutable } from "@x-drive/utils";
import resolve from "./resolve-uri";
import { sleep } from "../common";
import fetch from "node-fetch";

const reqLog = log.getLogger("Request");

/**支持的返回数据类型 */
type IFetchType = "text" | "json" | "blob" | "buffer" | "arrayBuffer";

/**请求配置 */
interface IFetchConfig extends Partial<Omit<RequestInit, "body" | "method">> {
    /**数据返回类型 */
    type?: IFetchType;

    /**是否强制同源 */
    sameOrigin?: boolean;

    /**请求自动重试次数 */
    retry?: number;

    /**自动重试间隔时间 */
    retryDelay?: number;

    /**是否自动追加随机数retry，默认 false */
    random?: boolean;

    /**数据返回时的钩子 */
    onResponse?: (res?: Response) => Promise<unknown>;
}

export type { IFetchConfig }

/**给指定对象增加一个随机字符串 */
function setRandomStr(query: any) {
    if (isObject(query) && isUndefined(query._)) {
        query._ = Date.now().toString(16);
    }
}

export { setRandomStr }

/**
 * 处理请求地址上的参数
 * @param uri    待处理地址
 * @param params 地址 param 参数
 */
function processParams(uri: string, params?: Record<string, any>) {
    if (isObject(params)) {
        uri = labelReplace(uri, params, true, true);
    }
    return uri;
}

/**
 * 处理请求上的 search 参数
 * @param uri    待处理地址
 * @param query  参数对象
 */
function processQuery(uri: string, query?: Record<string, any>) {
    if (isObject(query)) {
        uri = addQuery(uri, query);
    }
    return uri;
}

/**
 * 预处理请求地址
 * @param uri   请求地址
 * @param query 请求参数
 */
function preProcessor(uri: string, query?: Record<string, any>, random: boolean = false) {
    if (random === true) {
        setRandomStr(query);
    }
    return processQuery(
        processParams(
            uri
            , query
        )
        , query
    )
}

/**默认 Headers */
const DEF_HEADERS = {
}
/**设置默认 Headers */
function setDefHeaders(headers: Record<string, any>) {
    if (isObject(headers)) {
        Object.keys(headers).forEach(key => DEF_HEADERS[key] = headers[key]);
    }
}
export { setDefHeaders }

/**获取待发送的请求的 headers */
function getHeaders(headers?: Record<string, any>, uri?: string) {
    headers = extend(
        copy(DEF_HEADERS)
        , headers || {}
    );
    if (isString(uri)) {
        const url = new URL(uri);
        headers.Host = url.host;
        headers.Origin = url.origin;
    }
    return headers
}

const DEF_CONFIG: IFetchConfig = {
    "type": "json"
    , "sameOrigin": false
}

/**
 * 获取数据
 * @param type              请求类型
 * @param uri               请求地址
 * @param query             请求参数
 * @param data              发送数据
 * @param config            请求配置
 * @param needProcessConfig 是否需要处理配置
 */
async function httpFetch<T = unknown>(
    type: string
    , uri: string
    , query?: Record<string, any>
    , data?: any
    , config?: IFetchConfig
    , retry?: number
    , needProcessConfig: boolean = true
): Promise<T> {

    if (needProcessConfig) {
        config = extend(
            copy(DEF_CONFIG)
            , config || {}
        );
        if (isNumber(config.retry) && config.retry > 0) {
            retry = config.retry;
        }
    }

    try {
        const method = type.toUpperCase();
        const options: Partial<RequestInit> = {
            method
        }
        Object.keys(config).forEach(key => {
            if (key !== "headers") {
                options[key] = config[key];
            }
        });
        options.headers = getHeaders(config.headers, config.sameOrigin ? uri : null);

        const url = preProcessor(
            resolve(uri)
            , query
            , config?.random
        );

        if (data) {
            options.body = data;
        }

        const resp = await fetch(url, options);
        if (resp) {
            if (isExecutable(config.onResponse)) {
                await config.onResponse(resp);
            }
            const data = await resp[config.type]();
            return data as T;
        }
        return null;
    } catch (e) {
        reqLog.error(e);
        if (retry && retry > 0) {
            if (isNumber(config.retryDelay) && config.retryDelay > 0) {
                await sleep(config.retryDelay, reqLog);
            }
            retry -= 1;
            return await httpFetch(
                type
                , uri
                , query
                , data
                , config
                , retry
                , false
            );
        }
        return null;
    }
}
export { httpFetch as fetch }

/**
 * 发起一个 get 请求
 * @param uri   请求地址
 * @param query 请求参数
 */
async function requsetGet<T = unknown>(uri: string, query?: Record<string, any>, config?: IFetchConfig) {
    return await httpFetch<T>(
        "get"
        , uri
        , query
        , null
        , config
    );
}
export { requsetGet as get };

/**
 * 发起一个 post 请求
 * @param uri   请求地址
 * @param query 请求参数
 * @param data  请求数据
 */
async function requestPost<T>(uri: string, query?: any, data?: any, config?: IFetchConfig) {
    if (query && isUndefined(data)) {
        data = query;
        query = {};
    }
    if (isUndefined(query)) {
        query = {};
    }
    if (isUndefined(data)) {
        data = {};
    }

    return await httpFetch<T>(
        "post"
        , uri
        , query
        , data
        , config
    );
}
export { requestPost as post };