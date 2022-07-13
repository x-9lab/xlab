import { checkFileStat, getRealDefaultMod } from "../components/common";
import { merge } from "@x-drive/utils"
import path from "path";
import fs from "fs";

function customConfigProcessor(conf: ILab.IConfig, env: string, envAddConfPath: string) {
    // 业务自定义服务端业务文件夹
    const customDir = path.resolve(
        process.cwd()
        , "@server"
    );
    // 是否存在业务自定义服务端业务文件夹
    const hasCustom = checkFileStat(customDir);

    if (hasCustom) {
        /**业务生产环境配置文件地址 */
        let customConfPath = path.resolve(
            customDir
            , "@config"
            , "config.js"
        );

        /**是否有业务自定义配置 */
        let hasCustomConf = checkFileStat(customConfPath);
        if (hasCustomConf) {
            merge(
                conf
                , getRealDefaultMod(
                    require(customConfPath)
                )
            );
        }
    }

    if (envAddConfPath) {
        const devConf = getRealDefaultMod(
            require(
                path.join("..", envAddConfPath)
            )
        );
        let extConf: ILab.IConfig = {};
        let customDevConf = {};
        if (hasCustom) {
            /**对应环境配置文件地址 */
            let customConfPath = path.resolve(
                customDir, `${envAddConfPath}.js`
            );

            if (checkFileStat(customConfPath)) {
                customDevConf = getRealDefaultMod(
                    require(customConfPath)
                );
            }
            if (env === "DEVELOPMENT") {
                let localConfPath = path.resolve(
                    customDir, "@config", "config.lo.js"
                );
                if (checkFileStat(localConfPath)) {
                    extConf = getRealDefaultMod(
                        require(localConfPath)
                    );
                    extConf.hasLo = true;
                }
            }
        }

        // 合并
        merge(conf, devConf, customDevConf, extConf);
    }

    // apis文件夹配置处理
    if (hasCustom) {
        const APIS_PATH = path.resolve(
            process.cwd()
            , "@server"
            , "@config"
            , "@apis"
        );

        if (checkFileStat(APIS_PATH) && conf.passExtApis !== true) {
            let apis = []
            fs.readdirSync(APIS_PATH).forEach(file => {
                if (path.extname(file) === ".js") {
                    apis.push(
                        getRealDefaultMod(
                            require(`${APIS_PATH}/${file}`)
                        )
                    );
                }
            })
            if (apis.length) {
                conf.apis = Object.assign(
                    conf.apis || {}
                    , ...apis
                );
            }
            apis = null
        }
    }
}

export default customConfigProcessor;