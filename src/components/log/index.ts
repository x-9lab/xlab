"use strict";

import log4js from "log4js";
import path from "path";
import fs from "fs";

/**日志配置 */
interface ILogConfig {
    /**日志名称,文件日志的文件名 */
    name?: string;

    /**日志输出等级 */
    level?: string;

    /**文件日志存放目录 */
    dir?: string;

    /**是否输出文件日志 */
    fileLog?: boolean;

    /**自定义 layout 配置 */
    layout?: Record<string, any>;
}

/**默认配置 */
const DEF_CONFIG: ILogConfig = {
    "name": "app"
    , "level": "warn"
    , "dir": path.join("private", "log")
    , "fileLog": false
};

/**日志模块 */
class Log {

    /**当前实例配置 */
    private config: ILogConfig;

    /**日志实例缓存 */
    private loggers: Record<string, log4js.Logger> = {};

    constructor(config?: ILogConfig) {
        this.config = Object.assign({}, DEF_CONFIG, config);

        const appenders: Record<string, log4js.Appender> = {
            "stdout": {
                "type": "stdout"
                , ...(this.config.layout ? { "layout": this.config.layout } : {})
            } as log4js.Appender
        };

        if (this.config.fileLog) {
            fs.mkdirSync(this.config.dir, { "recursive": true });
            appenders.file = {
                "type": "dateFile"
                , "filename": path.join(this.config.dir, this.config.name)
                , "pattern": ".yyyyMMddhh.log"
                , "alwaysIncludePattern": true
                , ...(this.config.layout ? { "layout": this.config.layout } : {})
            } as log4js.Appender;
        }

        // log4js 的配置是进程级的,多次实例化以最后一次为准(与 v1 共享 appender 的行为一致)
        log4js.configure({
            "appenders": appenders
            , "categories": {
                "default": {
                    "appenders": Object.keys(appenders)
                    , "level": this.config.level
                }
            }
        });
    }

    /**
     * 获取分类日志实例
     * @param  cat 实例分类名称
     * @return     日志实例对象
     */
    getLogger(cat: string) {
        cat = `[${cat}]`;
        if (!this.loggers[cat]) {
            const logger = log4js.getLogger(cat);
            logger.level = this.config.level;
            this.loggers[cat] = logger;
        }
        return this.loggers[cat];
    }
}

export { Log };

var meta: Record<string, any> = require(
    path.resolve(
        process.cwd()
        , "package.json"
    )
);

/**框架全局日志实例 */
const globalLog = new Log({
    "name": meta.name
    , "level": "all"
});

// 日志
global.log = globalLog;

export { globalLog }
