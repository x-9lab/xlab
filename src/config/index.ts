import customConfigProcessor from "./process-custom-config-files";
import defConfigProcessor from "./process-def-config-file";
import { extend, isObject } from "@x-drive/utils";
import { globalLog } from "../components/log";
import cluster from "cluster";
import getEnv from "./getEnv";
import path from "path";

// 是否正处于 master 进程
const IS_MASTER = cluster.isPrimary;
const logger = globalLog.getLogger("config");

/**
 * 日志类型存储对象
 */
const LOGERS: Record<string, any> = {
    "config": logger
};

/**
 * 通用日志方法, 只在 master 进程上输出
 * @param  cat  业务类型
 * @param  type 日志等级
 */
function commonLog(cat: string, type: string, ...rest: any[]) {
    var logArr: any[];
    var setp = 0;
    switch (arguments.length) {
        case 0:
            cat = "config";
            type = "info";
            setp = 1;
            break;

        case 1:
            cat = "config";
            type = "info";
            setp = 0;
            break;

        case 2:
            type = "info";
            setp = 1;
            break;

        default:
            setp = 2;
    }

    logArr = [].slice.call(arguments, setp);
    if (IS_MASTER) {
        if (!LOGERS[cat]) {
            LOGERS[cat] = globalLog.getLogger(cat);
        }
        LOGERS[cat][type].apply(LOGERS[cat], logArr);
    }
}
export { commonLog as log }

/**
 * 启动时用于输出启动信息的方法
 */
function theLog(...rest: XLab.JsonValue[]) {
    if (IS_MASTER) {
        logger.info.apply(logger, rest);
    }
}

/**
 * 系统配置存储对象

 * 模块加载即持有稳定引用, 内容在 loadConfig 执行后可用
 */
const CONFIG: XLab.IConfig = {};

/**是否已装载 */
var loaded = false;

/**配置打印时需要打码的字段 */
const NOT_SHOW = ["root", "sessionStore", "mongodb"];

/**
 * 装载系统配置

 * 解析命令行参数与环境, 按「内置默认 -> 业务生产配置 -> 环境配置 -> 本地配置 -> 命令行参数」
 * 顺序合并配置, 重复调用直接返回已装载的配置
 */
function loadConfig() {
    if (loaded) {
        return CONFIG;
    }
    loaded = true;

    const argv: Record<string, string> = {};
    process.argv.forEach(function (item) {
        if (item.indexOf("=") !== -1) {
            const argPart = item.split("=");
            argv[argPart[0]] = argPart[1] || undefined;
        }
    });

    const meta = require(
        path.resolve(
            process.cwd()
            , "package.json"
        )
    );

    const { env, envAddConfPath, isProd } = getEnv(argv);
    const conf = defConfigProcessor(argv);

    theLog(`A [ ${env} ] server starting.`);

    customConfigProcessor(conf, env, envAddConfPath);

    // 默认配置
    extend(CONFIG, {
        "name": meta.name
        , "version": meta.version
        , "env": env
        , "debug": !isProd
        , "port": 5000
        , "ip": argv.IP || null
        , "isProd": isProd
        , "workers": 3
        , "allowCache": true
        , "root": path.resolve(process.cwd(), "public")
        , "isMaster": IS_MASTER
    });

    try {
        extend(CONFIG, conf);
        if (argv.PORT) {
            const port = Number(argv.PORT);
            if (!isNaN(port)) {
                CONFIG.port = port;
            }
        }
    } catch (e) {
        logger.error("ASSIGN CONFIG ERROR.\n", e);
    }

    Object.keys(CONFIG).forEach(function (key) {
        var val = JSON.stringify(CONFIG[key]);
        if (NOT_SHOW.indexOf(key) !== -1 && isProd) {
            val = "*".repeat(20);
        }
        theLog(`${key} : ${val}`);
    });
    console.log("");

    return CONFIG;
}

export default loadConfig;

/**获取系统配置对象 */
function get() {
    return CONFIG;
}

export { get };

/**更新配置 */
function update(conf: XLab.IConfig) {
    if (isObject(conf)) {
        extend(CONFIG, conf);
    }
    return CONFIG;
}

export { update };
