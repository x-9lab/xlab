import { checkFileStat, getRealDefaultMod } from "../components/common";
import conf from "../@config/config";

function defConfigProcessor(argv: Record<string, string>) {
    if (argv.IP) {
        // 绑定 IP
        (conf as ILab.IConfig).ip = argv.IP;
    }

    // api 配置文件处理
    var hasCustomApiConf = checkFileStat("../@config/@apis/index.js", true);
    if (hasCustomApiConf) {
        (conf as ILab.IConfig).apis = Object.assign(
            (conf as ILab.IConfig).apis || {}
            , getRealDefaultMod(
                require("../conf/@conf/index.js")
            )
        );
    }
    hasCustomApiConf = null;

    return conf as ILab.IConfig;
}

export default defConfigProcessor;