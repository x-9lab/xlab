"use strict";

import log4js from "log4js";
import path from "path";
import fs from "fs";

/**
 * 按照文件夹目录地址创建文件夹
 * @param  pathStr 文件夹目录地址
 */
function mkdir(pathStr: string) {
    var level = pathStr.split(path.sep);

    if (level) {
        let dirIndex = 1;
        let last = level.length;
        while (dirIndex <= last) {
            let dirPath = level.slice(0, dirIndex++).join(path.sep);
            let status;
            try {
                status = fs.statSync(dirPath);
            } catch (e) {
                if (e.errno === -2) {
                    status = null;
                }
            }
            if (status) {
                if (!status.isDirectory()) {
                    console.error(`Target [${pathStr}] exists and is not a directory.`);
                    break;
                }
            } else if (status === null) {
                fs.mkdirSync(dirPath);
            }
        }
        level = null;
    }
}

// 日志类型对象
const LOGERS = {};

function Log(config: Record<string, any>) {
    this.config = {
        "name": "app"
        , "level": "warn"
        , "dir": "private/log"
        , "fileLog": false
        // ,"layout":{
        //     "type": "pattern"
        //     ,"pattern": "%r %p %c - %m%n"
        // }
    };

    if (Object.prototype.toString.call(config) === "[object Object]") {
        this.config = Object.assign(this.config, config);
    }
    if (this.config.fileLog) {
        let tmp = path.join(this.config.dir);
        mkdir(tmp);
        tmp = null;
    }
    log4js.clearAppenders();
}

var LP = Log.prototype;

/**
 * 获取统计实例
 * @param  {String} cat 实例分类名称
 * @return {Object}     统计实例对象
 */
LP.getLogger = function (cat) {
    var conf = this.config;
    cat = "[" + cat + "]";
    var logger = LOGERS[cat];
    if (logger) {
        return logger;
    }

    var dateFileConf: Record<string, any> = {
        "filename": conf.name
        , "pattern": ".yyyyMMddhh.log"
        , "alwaysIncludePattern": true
    };
    var stdoutConf: Record<string, any> = {};
    if (conf.layout) {
        dateFileConf.layout = conf.layout;
        stdoutConf.layout = conf.layout;
    }

    if (this.config.fileLog) {
        log4js.loadAppender("dateFile");
        log4js.addAppender(
            log4js.appenderMakers.dateFile(
                dateFileConf
                , {
                    "cwd": conf.dir
                }
            )
            , cat
        );
    }

    log4js.addAppender(
        log4js.appenderMakers.stdout(stdoutConf)
        , cat
    );

    logger = log4js.getLogger(cat);
    logger.setLevel(conf.level);
    LOGERS[cat] = logger;
    return logger;
}

export { Log };

var meta: Record<string, any> = require(
    path.resolve(
        process.cwd()
        , "package.json"
    )
);

const globalLog = new Log({
    "name": meta.name
    , "level": "all"
});

// 日志
global.log = globalLog;

export { globalLog }
