import { checkFileStat, getRealDefaultMod } from "../components/common";
import conf from "../@config/config";
import { resolve } from "path";

function defConfigProcessor(argv: Record<string, string>) {
    if (argv.IP) {
        // 绑定 IP
        (conf as XLab.IConfig).ip = argv.IP;
    }

    const apiPath = resolve(
        ".."
        , "@config"
        , "@apis"
        , "index.js"
    );

    // api 配置文件处理
    var hasDefApiConf = checkFileStat(apiPath, true);
    if (hasDefApiConf) {
        (conf as XLab.IConfig).apis = Object.assign(
            (conf as XLab.IConfig).apis || {}
            , getRealDefaultMod(
                require(apiPath)
            )
        );
    }
    hasDefApiConf = null;

    return conf as XLab.IConfig;
}

export default defConfigProcessor;