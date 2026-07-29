"use strict";

/**
 * 自定义模块生命周期钩子示例
 * setup: 服务装配前执行; ready: listen 成功后执行; shutdown: 退出前执行
 */
module.exports = {
    setup(conf) {
        console.log("[lifecycle-demo] setup", JSON.stringify(conf));
    }
    , ready() {
        console.log("[lifecycle-demo] ready");
    }
    , shutdown() {
        console.log("[lifecycle-demo] shutdown");
    }
};
