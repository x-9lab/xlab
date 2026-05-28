import { checkFileStat } from "./components/common";
import XConfig from "./default-x-config";
import { resolve } from "path";

function tryToSetEnv() {
    const envPath = resolve(
        process.cwd()
        , XConfig.businessDir
        , "@env"
        , "index.js"
    );

    var hasInitModule = checkFileStat(envPath, true);
    if (hasInitModule) {
        // globalLog("InitEnv", "Try to init env");
        require(envPath);
    }
}

tryToSetEnv();