
interface IPlat {
    /**平台类型，mobile 或 desktop */
    is: string;

    /**是否是微信 */
    wechat?: boolean;

    /**是否是支付宝 */
    alipay?: boolean;

    /**是否是微博 */
    weibo?: boolean;

    /**是否是 Windows 系统 */
    win?: boolean;

    /**是否是 Mac 系统 */
    mac?: boolean;

    /**是否是 Linux 系统 */
    linux?: string;

    /**操作系统信息 */
    os?: string;
}
export type { IPlat };

const REGEXP = {
    "wechat": /MicroMessenger\/([\d\.]+)/
    , "alipay": /AlipayClient\/([\d\.]+)/
    // Weibo/5884 CFNetwork/808.3 Darwin/16.3.0
    // Mozilla/5.0 (iPhone; CPU iPhone OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Mobile/14D27 Weibo (iPhone8,1__weibo__7.6.0__iphone__os10.2.1)
    , "weibo": /(__weibo__|weibo\/)([\d\.]+)/i
    , "android": /Android[\s]?([\d+\.]+)/i
    , "ios": /iPad|iPhone/i
}

const COMMON_OS_REGEXP = /\([^\)]*\)/;

// window 平台内部版本与发行版的映射关系
const windowVersionMap = {
    "5.0": "Windows 2000"
    , "5.1": "Windows XP"
    , "6.0": "Windows Vista"
    , "6.1": "Windows 7"
    , "6.2": "Windows 8"
    , "6.3": "Windows 8.1"
    , "10": "Windows 10"
    , "10.0": "Windows 10"
};

const unknownStr = "Unknown";

/**
 * 根据 ua 检测客户端信息
 * @param ua 请求 ua
 * @deprecated `v1.7.0` 后弃用，请直接使用 `@x-drive/which-platform`
 */
function check(ua: string) {
    ua = String(ua);

    const plat: IPlat = {
        "is": ""
    };

    for (var n in REGEXP) {
        plat[n] = ua.match(REGEXP[n]);
        if (plat[n]) {
            switch (true) {
                case n === "ios":
                    plat.is = "mobile";
                    const iosVer = ua.match(/Version\/([\d+\.]+)/i);
                    plat[n] = iosVer ? iosVer[1] || "Unknonw" : "Unknonw";
                    break;

                case n === "android":
                    if (!plat.wechat && !plat.alipay && !plat.weibo) {
                        plat.is = "mobile";
                    }
                    plat[n] = plat[n][1];
                    break;

                default:
                    plat[n] = plat[n][1];
                    plat.is = n;
            }
        } else {
            plat[n] = false;
        }
    }

    if (plat.is === "") {
        let deviceArr = ua.match(COMMON_OS_REGEXP);
        let device = deviceArr && deviceArr[0];
        deviceArr = null;
        let osInfo;
        let osVInfo;

        if (device) {
            osInfo = device.replace(/[\(|\)]+/, "").split(/;[\s]?/);
            if (osInfo[1] === "U") {
                osInfo.splice(1, 1);
            }
            switch (true) {
                case device.indexOf("Win") !== -1:
                    plat.os = "Windows";
                    var winOs = "";
                    while (osInfo.length) {
                        winOs = osInfo.shift();
                        if (winOs.indexOf("Win") !== -1) {
                            break;
                        }
                    }
                    if (winOs) {
                        osVInfo = winOs.match(/[\d\.]+/);
                        osVInfo = osVInfo && osVInfo[0] ? windowVersionMap[osVInfo[0]] || unknownStr : unknownStr;
                    } else {
                        osVInfo = unknownStr;
                    }
                    plat.win = osVInfo;
                    plat.is = "desktop";
                    break;

                case device.indexOf("Mac OS") !== -1:
                    osVInfo = device.match(/[\d_]+/);
                    osVInfo = osVInfo && osVInfo[0] || unknownStr;
                    osVInfo = osVInfo.replace(/_/g, ".");
                    plat.mac = osVInfo;
                    plat.is = "desktop";
                    break;

                case device.indexOf("Linux") !== -1:
                    plat.os = "Linux";
                    plat.linux = unknownStr;
                    plat.is = "desktop";
                    break;
            }
        }
    }

    return plat;
}

export { check };

