"use strict";
import { isArray, isString, isObject, isExecutable } from "@x-drive/utils";
import { checkFileStat, getRealDefaultMod } from "./components/common";
import XConfig from "./default-x-config";
import { get, log as masterLog } from "./config";
import { inspect } from "util";
import path from "path";

/**自定义模块生命周期钩子 */
interface ICustomHooks {
    /**服务装配前执行, 接收 custom 配置中声明的参数 */
    setup?: (conf?: XLab.CompositeValue) => void | Promise<void>;

    /**服务启动完成(listen 成功)后执行 */
    ready?: () => void | Promise<void>;

    /**服务退出前执行 */
    shutdown?: () => void | Promise<void>;
}
export type { ICustomHooks }

/**已装载的自定义模块钩子 */
const HOOKS: ICustomHooks[] = [];

/**
 * 装载自定义业务模块并执行 setup 阶段

 * 模块支持两种导出形态:
 * 1. 导出函数, 视为 setup 钩子
 * 2. 导出 `{ setup?, ready?, shutdown? }` 钩子对象
 */
async function loadCustom() {
    const config = get();

    const CustomPath = path.resolve(
        process.cwd()
        , XConfig.businessDir
        , "custom"
    );

    if (!checkFileStat(CustomPath)) {
        return;
    }

    if (!isArray(config.custom) || !config.custom.length) {
        return;
    }

    for (const item of config.custom) {
        const isStrItem = isString(item);
        const name = isStrItem ? item : item[0];
        try {
            const conf = isStrItem ? null : item[1];
            const mod = getRealDefaultMod(
                require(
                    path.resolve(
                        CustomPath
                        , String(name)
                    )
                )
            );

            var hooks: ICustomHooks = null;
            if (isExecutable(mod)) {
                hooks = { "setup": mod };
            } else if (isObject(mod)) {
                hooks = mod;
            }

            if (hooks) {
                HOOKS.push(hooks);
                if (isExecutable(hooks.setup)) {
                    await hooks.setup(conf);
                }
                masterLog("custom", `[${name}] loaded`);
            }
        } catch (e) {
            masterLog("custom", "error", `[${name}]`, inspect(e));
        }
    }

    console.log("");
}
export { loadCustom }

/**执行全部 ready 钩子 */
async function runReady() {
    for (const hooks of HOOKS) {
        if (isExecutable(hooks.ready)) {
            try {
                await hooks.ready();
            } catch (e) {
                masterLog("custom", "error", inspect(e));
            }
        }
    }
}
export { runReady }

/**执行全部 shutdown 钩子 */
async function runShutdown() {
    for (const hooks of HOOKS) {
        if (isExecutable(hooks.shutdown)) {
            try {
                await hooks.shutdown();
            } catch (e) {
                masterLog("custom", "error", inspect(e));
            }
        }
    }
}
export { runShutdown }
