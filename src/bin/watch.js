const XConfig = require("../default-x-config");
const { date } = require("@x-drive/utils");
const crossSpawn = require("cross-spawn");
const colors = require("colors/safe");
const path = require("path");
const fs = require("fs");

/**输出内容名称 */
const X_LAB_STR = colors.bold(colors.cyan("🛸 XLab"));

/**
 * 子进程对象
 * @type child_process.ChildProcess
 */
var childProcess = null;

/**
 * 获取 chokidar
 * @return {FSWatcher}
 */
function getChokidar() {
    try {
        return require("chokidar");
    } catch (e) {
        return null;
    }
}

/**构建 Spawn 启动参数 */
function buildSpawnOptions() {
    const argvs = process.argv.slice(2);
    const options = [path.resolve(__dirname, "..", "server.js")].concat(argvs);
    return options;
}

/**停止 */
function stop() {
    if (childProcess) {
        childProcess.kill("SIGTERM");
    }
}

/**启动 */
function start() {
    childProcess = crossSpawn("node", buildSpawnOptions(), { "stdio": "inherit" })
        .on("error", err => {
            console.error(err);
        })
        .on("close", code => {
            if (Number(code) !== 0) {
                const err = new Error(`子进程退出, Code: ${code}`);
                err.code = code;
                // TODO: 自动拉起来？
                console.error(err)
            }
        })
        .once("exit", () => {
            childProcess.removeAllListeners();
            childProcess = null;
        });
}

/**日志 */
function log(...rest) {
    console.log.apply(console, [X_LAB_STR, colors.green(`[${date(new Date(), "Y-m-d H:i:s.M")}]`), ...rest]);
}

/**
 * 初始化状态
 * @type {boolean}
 */
var inited = false;

/**
 * @typedef {object} WatchConfig 
 * @property {string[]=} paths 需要监控的目录 
 * @property {boolean=} enable 监控是否已启用 
 */

/**
 * 启动文件 watch
 * @param {FSWatcher} chokidar 
 * @param {WatchConfig} config 监控配置
 * @param {number} wait 间隔时间
 */
function watch(chokidar, config, wait = 250) {
    let holding = false;
    let initing = true;
    chokidar.watch(config.paths).on("all", () => {
        if (inited) {
            if (!holding) {
                holding = true;
                setTimeout(async () => {
                    holding = false;
                    log("Restarting app...\n");
                    if (childProcess) {
                        childProcess.on("exit", start);
                        stop();
                    } else {
                        start();
                    }
                }, wait);
            }
        } else {
            if (initing) {
                initing = false;
                log("Watch 模式启动\n");
                setTimeout(() => {
                    inited = true;
                }, wait);
            }
        }
    });
}

/**
 * 设置 watch 模式
 * @param {WatchConfig} config 
 * @param {number} wait 
 */
function setup(config, wait = 250) {
    const chokidar = getChokidar();
    if (config && config.enable) {
        if (chokidar) {
            if (!config.paths) {
                // 默认业务自定义服务端业务文件夹
                const customDir = path.resolve(
                    process.cwd()
                    , XConfig.businessDir
                );
                config.paths = [customDir];
            }

            var stats = 0;
            try {
                for (let i = 0; i < config.paths.length; i++) {
                    fs.statSync(config.paths[i]);
                    stats += 1;;
                }
            } catch (e) {
                log(e);
            }

            if (stats > 0) {
                // 传递主进程 SIGTERM
                process.on("SIGTERM", () => {
                    if (childProcess && childProcess.connected) {
                        childProcess.kill("SIGTERM");
                    }
                    process.exit(0);
                });

                watch(chokidar, config, wait);
                start();
            } else {
                log("业务自定义目录不存在, watch 模式启动失败");
            }
            stats = null;
        } else {
            log("请将 chokidar 安装到开发依赖中以启用 watch 模式");
        }
    } else {
        log("配置不存在或 watch.enable 为 false, watch 模式启动失败\n", config);
    }
}

module.exports = setup;