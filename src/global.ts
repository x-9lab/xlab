export type { IPlat } from "./components/platform";
import { update, get } from "./config";
import type Koa from "koa";
import path from "path";

/**内置组件 */
interface InternalComponents {
    assets: typeof import("./components/assets");
    cache: typeof import("./components/cache");
    cluster: typeof import("./components/cluster");
    header: typeof import("./components/header");
    "html-processor": typeof import("./components/html-processor");
    injection: typeof import("./components/injection");
    "js-processor": typeof import("./components/js-processor");
    md5: typeof import("./components/md5");
    mime: typeof import("./components/mime");
    platform: typeof import("./components/platform");
    querystring: typeof import("./components/querystring");
    redirect: typeof import("./components/redirect");
    uuid: typeof import("./components/uuid");
    version: typeof import("./components/version");
    cron: typeof import("./components/cron");
    log: typeof import("./components/log");
    "return-code": typeof import("./components/return-code");
    common: typeof import("./components/common");
    request: typeof import("./components/request");
}

declare global {
    /**全局日志对象 */
    var log: any;

    /**只在 master 上输出的日志 */
    var masterLog: any;

    /**
    * 获取应用实例对象
    */
    function getApp(): Koa;

    /**
    * 获取内置组件
    * @param  name 模块名
    * @return      模块对象
    */
    function requireMod<T extends InternalComponents[K], K extends keyof InternalComponents>(name: K): T;

    /**
    * 全局获取 model 的方法
    * @param  name model 名称
    * @return      model 模块
    */
    function requireModel<T = any>(name: string): T;

    /**
    * 全局获取 service 的方法
    * @param  name service 名称
    * @return      service 模块
    */
    function requireService<T = any>(name: string): T;

    /**
     * 获取系统配置
     */
    function getSysConfig(): XLab.IConfig;
    /**
     * 获取系统配置
     * @param  key 配置项
     */
    function getSysConfig<T extends XLab.IConfig[K], K extends keyof XLab.IConfig>(key?: K): T;
    /**
     * 获取系统配置
     * @param  key 配置项
     */
    function getSysConfig(key?: any): any;

    /**
    * 更新系统配置
    * @param  conf 配置项
    */
    function setSysConfig(conf: XLab.IConfig): void;

    namespace XLab {

        /**JSON 基本数据类型 */
        type JsonValue = boolean | string | number | null | undefined | JsonArray | JsonObject;
        /**包含 JSON 的数组 */
        type JsonArray = JsonValue[];
        /**包含 JSON 数据的 JSON */
        interface JsonObject {
            [key: string]: JsonValue;
        }

        /**包含复合值的数组 */
        type CompositeArray = CompositeValue[];

        /**复合值 */
        type CompositeValue = JsonValue | CompositeArray | CompositeObject;

        /**包含复合值的对象 */
        interface CompositeObject {
            [key: string]: CompositeValue;
        }

        /**标准返回数据 */
        interface IStdRes<T = any> {
            /**业务执行状态码 */
            code: number;

            /**业务数据 */
            result: T;

            /**操作信息 */
            msg?: string;

            /**操作结果 */
            success?: boolean;
        }

        interface IConfig {
            /**服务(应用)名称 */
            name?: string;

            /**版本 */
            version?: string;

            /**环境标识 */
            env?: string;

            /**业务绑定的域名 */
            host?: string;

            /**是否开启 304 协商缓存 */
            304?: boolean;

            /**Worker 数量 */
            workers?: number;

            /**业务服务器地址 */
            biServer?: string;

            /**业务服务器协议 */
            protocol?: string;

            /**是否开启 debug 模式 */
            debug?: boolean;

            /**静态文件缓存时间 */
            staticMaxage?: number;

            /**静态 html 文件缓存时间 */
            staticHtmlFileMaxage?: number;

            /**是否开启 Combo 缓存 */
            enableComboCache?: boolean;

            /**是否开启定时任务 */
            enableCron?: boolean;

            /**开启的中间件列表 */
            middleware?: (string | (string | Record<string, any>)[])[];

            /**自定模块配置 */
            custom?: string[];

            /**是否启用严格 ssl */
            strictSSL?: boolean;

            /**页端注入的 api 设置 */
            apis?: Record<string, string>;

            /**内部服务域名 */
            internalServers?: Record<string, string>;

            /**内部服务地址 */
            internalApis?: Record<string, string>;

            /**服务 ip 地址 */
            ip?: string;

            /**本地是否存在本地开发配置文件 config.lo.json */
            hasLo?: boolean;

            /**不处理业务 api */
            passExtApis?: boolean;

            /**是否是生产环境 */
            isProd?: boolean;

            /**是否允许页端缓存 */
            allowCache?: boolean;

            /**静态文件根目录 */
            root?: string;

            /**监听端口 */
            port?: number;

            /**是否是主进程 */
            isMaster?: boolean;

            /**是否每次都强制清除 LocalStorage */
            clearLocalStorage?: boolean;

            /**处理代理过来多余的地址层级路径替换判断正则 */
            pathReplaceRegExp?: string;

            /**移动端入口文件地址(旧版逻辑) */
            routeMobile?: string;

            /**不同端入口地址设置 */
            launchRouter?: Record<string, string>;

            /**定时任务设置 */
            cron?: {
                def?: number;
            }

            /**注入参数列表 */
            injection?: string[];

            /**首页缓存时间 */
            indexPageCacheTime?: number;

            /**静态资源缓存时间 */
            staticResourceCacheTime?: number;
        }

        interface ICodeItem {
            /**错误码 */
            errorcode: number;

            /**错误信息 */
            msg: string;
        }

        type ICodeDetail = Record<string, ICodeItem>;
    }
}

/**
 * 获取 components 模块路径
 * @param  name 模块名称
 * @param  root 模块存储目录所属路径
 * @return      完整的模块目录地址
 */
function getModulePath(name: string, root?: string) {
    return path.resolve((root || __dirname), "components", name);
}

/**
 * 获取 components 模块
 * @param  name 模块名
 * @return      模块对象
 */
function requireMod<T extends InternalComponents[K], K extends keyof InternalComponents>(name: K) {
    return <T>require(
        getModulePath(name)
    );
};
global.requireMod = requireMod;

/**
 * model 存放路径
 */
const MODEL_PATH = path.resolve(process.cwd(), "@server", "business", "@models");

/**
 * 全局获取 model 的方法
 * @param  name model 名称
 * @return      model 模块
 */
function requireModel<T = any>(name: string) {
    return <T>require(
        path.resolve(MODEL_PATH, name)
    );
};
global.requireModel = requireModel;

/**
 * services 存放目录
 */
const SERVICES_PATH = path.resolve(process.cwd(), "@server", "business", "@services");

/**
 * 全局获取 service 的方法
 * @param  name service 名称
 * @return      service 模块
 */
function requireService<T = any>(name: string) {
    return <T>require(
        path.resolve(SERVICES_PATH, name)
    );
};
global.requireService = requireService;

/**
 * 获取全部系统配置
 */
function getSysConfig(): XLab.IConfig;
/**
 * 获取系统配置
 * @param  key 配置项
 */
function getSysConfig<T extends XLab.IConfig[K], K extends keyof XLab.IConfig>(key?: K): T;
/**
 * 获取系统配置
 * @param  key 配置项
 */
function getSysConfig(key?: any): any {
    const conf = get();
    if (key) {
        return conf[key];
    }
    return conf;
};

global.getSysConfig = getSysConfig;

/**
 * 更新系统配置
 * @param  conf 配置项
 */
function setSysConfig(conf: XLab.IConfig) {
    update(conf);
};
global.setSysConfig = setSysConfig;