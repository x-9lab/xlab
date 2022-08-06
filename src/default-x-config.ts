import { isString } from "@x-drive/utils";

/**默认业务目录 */
var businessDir = "@server";

const XConfig = Object.defineProperties(null, {
    "business": {
        get() {
            return businessDir;
        }
        , set(val: string) {
            if (isString(val)) {
                businessDir = val;
            }
        }
    }
});

export default XConfig;