import { random } from "@x-drive/utils";
import { networkInterfaces } from "os";
import { getMD5 } from "../common";

var netInterfaces = networkInterfaces();
/**当前机器的 mac */
export const X_MAC = Object
    .keys(netInterfaces)
    .sort()
    .map(key => netInterfaces[key])
    .flat(1)
    .find(en => {
        return en && en.family && en.family.toLowerCase() === "ipv4" && en.mac !== "00:00:00:00:00:00" ? true : false;
    })?.mac || null;
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
        getMD5([one, X_MAC, tow].join("&"))
        , Date.now().toString(16)
        , r
    ].join("-");
}
export { uuid };