import { random } from "@x-drive/utils";
import { networkInterfaces } from "os";
import { md5 } from "../md5";

var netInterfaces = networkInterfaces();
const MAC = ((netInterfaces && netInterfaces.en0 || []).find(en => en.mac !== "00:00:00:00:00:00") || { "mac": "99:00:99:00:99:00" }).mac;
netInterfaces = null;

/**
 * 生成一个 uuid
 * @param one 第一节数据
 * @param tow 第二节数据
 */
function uuid(one: string, tow: string) {
    var r = random(2333333, 23333).toString(16);
    r = r.length < 6 ? r += "0" : r;
    return [
        md5([one, MAC, tow].join("&"))
        , Date.now().toString(16)
        , r
    ].join("-");
}
export { uuid };