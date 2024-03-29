"use strict";
import { isArray, isString, isFunction, isAsyncFunction } from "@x-drive/utils";
import { checkFileStat, getRealDefaultMod } from "./components/common";
import XConfig from "./default-x-config";
import { get } from "./config";
import { inspect } from "util";
import path from "path";

/**处理自定义业务 */
async function processCustom() {
    const config = get();

    const CustomPath = path.resolve(
        process.cwd()
        , XConfig.businessDir
        , "custom"
    );

    const hasCustom = checkFileStat(CustomPath);

    if (!hasCustom) {
        return;
    }

    if (!isArray(config.custom) || !config.custom.length) {
        return;
    }

    if (hasCustom) {
        try {
            for (const item of config.custom) {
                const isStrItem = isString(item);
                const name = isStrItem ? item : item[0];
                const conf = isStrItem ? null : item[1];
                const mod = getRealDefaultMod(
                    require(
                        path.resolve(
                            CustomPath
                            , name
                        )
                    )
                );

                if (isFunction(mod)) {
                    mod(conf);
                } else if (isAsyncFunction(mod)) {
                    await mod(conf);
                }

                masterLog("custom", `[${name}] loaded`);
            }
        } catch (e) {
            masterLog("custom", "error", inspect(e));
        }
    }

    console.log("");
}

export default processCustom;