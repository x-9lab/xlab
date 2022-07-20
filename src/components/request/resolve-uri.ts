import { labelReplace } from "@x-drive/utils";

const internalServers = getSysConfig("internalServers");
const Apis = getSysConfig("internalApis");

const ApiMap = new Map<string, string>();

Object.keys(Apis).forEach((key: string) => {
    let url = Apis[key];
    url = labelReplace(url, internalServers, true);
    ApiMap.set(key, url);
});

/**
 * 解析请求别名
 * @param uri 请求地址
 */
function resolve(uri: string) {
    var url = ApiMap.get(uri);
    if (url) {
        return url;
    }
    return uri;
}

export default resolve;