/**内置组件 */
interface InternalComponents {
    /**资产 */
    assets: typeof import("./assets");
    /**cluster */
    cluster: typeof import("./cluster");
    /**Http header 相关 */
    header: typeof import("./header");
    /**MIME */
    mime: typeof import("./mime");
    /**简单的 uuid */
    uuid: typeof import("./uuid");
    /**定时任务 */
    cron: typeof import("./cron");
    /**日志 */
    log: typeof import("./log");
    /**业务返回码 */
    "return-code": typeof import("./return-code");
    /**通用工具函数集 */
    common: typeof import("./common");
}
export type { InternalComponents }