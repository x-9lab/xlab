import customConfigProcessor from "./process-custom-config-files";
import defConfigProcessor from "./process-def-config-file";
import { extend, isObject } from "@x-drive/utils";
import { globalLog } from "../components/log";
import cluster from "cluster";
import getEnv from "./getEnv";
import path from "path";

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

// 是否正处于 master 进程
const IS_MASTER = parseInt(process.versions.node) >= 16 ? cluster.isPrimary : cluster.isMaster;
const logger = globalLog.getLogger("config");

/**
 * 日志类型存储对象
 */
const LOGERS: Record<string, any> = {
    "config": logger
};

/**
 * 通用日志方法
 * @param  cat  业务类型
 * @param  type 日志等级
 */
function commonLog(cat: string, type: string) {
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
            LOGERS[cat] = log.getLogger(cat);
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
const { env, envAddConfPath, isProd } = getEnv(argv);
const conf = defConfigProcessor(argv);

theLog(`A [ ${env} ] server starting.`);

customConfigProcessor(conf, env, envAddConfPath);

/**
 * 默认配置
 */
const CONFIG: XLab.IConfig = {
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
};

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

const NOT_SHOW = ["root", "sessionStore", "mongodb"];

Object.keys(CONFIG).forEach(function (key) {
    var val = JSON.stringify(CONFIG[key]);
    if (NOT_SHOW.indexOf(key) !== -1 && isProd) {
        val = "*".repeat(20);
    }
    theLog(`${key} : ${val}`);
});
console.log("");

export default CONFIG;

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