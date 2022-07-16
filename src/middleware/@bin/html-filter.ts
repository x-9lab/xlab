"use strict";
import { random } from "@x-drive/utils";

var conf: XLab.IConfig;
const VER_RE = /\d+\.\d+\.\d+/;


var routeMobile: string;
// const MAX_COLLECT = global.Valkyr && Valkyr.getMaxCollect() || 0;
const MAX_COLLECT = 0;
const PRE_MIN_NUM = Math.ceil(MAX_COLLECT / 24);
const PRE_MAX_NUM = Math.ceil(MAX_COLLECT / 6);
const COLLECT_STATUS = {};
var nowDay = new Date().getDate();

/**
 * 数组随机分布
 * @param  arr  原始数组
 * @return      打乱后的数组
 */
function shuffle(arr: string[]) {
    for (var i = arr.length - 1; i >= 0; i--) {
        let rIndex = Math.floor(Math.random() * (i + 1));
        let item = arr[rIndex];
        arr[rIndex] = arr[i];
        arr[i] = item;
    }
    return arr;
}

/**
 * 获取每个钟头里面随机要处理的分钟
 * @param  status 状态
 */
function getM4H(status: boolean) {
    var m4h = [];
    for (let i = 1; i <= 60; i++) {
        m4h.push(i);
    }
    shuffle(m4h);
    var logLen = 0;
    for (let j = 1; j <= 24; j++) {
        let sIndex = random(59, 0);
        let sLen = Math.min(random(PRE_MAX_NUM, PRE_MIN_NUM), 60 - sIndex);
        if (sLen + logLen > MAX_COLLECT) {
            sLen = MAX_COLLECT - logLen;
        }
        let part = m4h.concat([]).splice(sIndex, sLen);
        part.forEach(function (m) {
            COLLECT_STATUS[j][m] = status;
        });
        part = null;
        logLen += sLen;
        if (logLen >= MAX_COLLECT) {
            break;
        }
    }
    m4h = null;
}

/**
 * 设置处理状态
 * @param len    处理的数量
 * @param status 处理状态
 */
function setCollectStatus(len: number, status: boolean) {
    if (!MAX_COLLECT) {
        return;
    }
    while (len > 0) {
        COLLECT_STATUS[len--] = {};
    }
    getM4H(status);
}
setCollectStatus(24, false);


// HTML 过滤器
function filter(url: string) {

    var ver = VER_RE.exec(url) || VER_RE.exec(routeMobile);

    var data: Record<string, string> = {};

    // 从路径提取版本号
    if (ver && ver.length > 0) {
        data.appVer = ver[0] || "";
    }

    // 放回请求数据中
    return data;
}
export { filter }

export default function () {
    conf = getSysConfig()
    routeMobile = conf.routeMobile;
};
