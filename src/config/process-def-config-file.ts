import { checkFileStat, getRealDefaultMod } from "../components/common";
import conf from "../@config/config";

function defConfigProcessor(argv: Record<string, string>) {
    if (argv.IP) {
        // 绑定 IP
        (conf as XLab.IConfig).ip = argv.IP;
    }

    // api 配置文件处理
    var hasCustomApiConf = checkFileStat("../@config/@apis/index.js", true);
    if (hasCustomApiConf) {
        (conf as XLab.IConfig).apis = Object.assign(
            (conf as XLab.IConfig).apis || {}
            , getRealDefaultMod(
                require("../conf/@conf/index.js")
            )
        );
    }
    hasCustomApiConf = null;

    return conf as XLab.IConfig;
}

export default defConfigProcessor;