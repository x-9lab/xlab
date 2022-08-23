import { isString } from "@x-drive/utils";

/**默认业务目录 */
var businessDir = "@server";

class Config {
    get businessDir() {
        return businessDir;
    }

    set businessDir(val: string) {
        if (isString(val)) {
            businessDir = val;
        }
    }
}

export default new Config;