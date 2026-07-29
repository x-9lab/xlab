import { checkFileStat } from "./components/common";
import XConfig from "./default-x-config";
import { resolve } from "path";

/**执行业务的 @env 环境预处理模块 */
function initEnv() {
    const envPath = resolve(
        process.cwd()
        , XConfig.businessDir
        , "@env"
        , "index.js"
    );

    var hasInitModule = checkFileStat(envPath, true);
    if (hasInitModule) {
        require(envPath);
    }
}

export default initEnv;
