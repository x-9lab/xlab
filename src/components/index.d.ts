/**内置组件 */
interface InternalComponents {
    /**资产 */
    assets: typeof import("./assets");
    /**缓存 */
    cache: typeof import("./cache");
    /**cluster */
    cluster: typeof import("./cluster");
    /**Http header 相关 */
    header: typeof import("./header");
    /**Html 内容处理器 */
    "html-processor": typeof import("./html-processor");
    /**JS 内容处理器 */
    "js-processor": typeof import("./js-processor");
    /**数据注入 */
    injection: typeof import("./injection");
    /**MD5 */
    md5: typeof import("./md5");
    /**MIME */
    mime: typeof import("./mime");
    /**客户端判断 */
    platform: typeof import("./platform");
    /**请求参数处理 */
    querystring: typeof import("./querystring");
    /**各种重定向方法 */
    redirect: typeof import("./redirect");
    /**简单的 uuid */
    uuid: typeof import("./uuid");
    /**版本比对 */
    version: typeof import("./version");
    /**定时任务 */
    cron: typeof import("./cron");
    /**日志 */
    log: typeof import("./log");
    /**业务返回码 */
    "return-code": typeof import("./return-code");
    /**通用工具函数集 */
    common: typeof import("./common");
    /**内部请求模块 */
    request: typeof import("./request");
}
export type { InternalComponents }