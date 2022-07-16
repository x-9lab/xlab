
/**
 * 比较版本
 * @param  v1 样本版本
 * @param  v2 对比版本
 * @returns   对比结果：
 *              - 1 样本大于对比
 *              - 0 两者相等
 *              - -1 对比大于样本
 */
function compareVersion(v1: string, v2: string) {
    if (!v1 || !v2) {
        return 0;
    }
    const v1s = v1.split(".");
    const v2s = v2.split(".");
    const v1l = v1s.length;
    const v2l = v2s.length;
    const len = v1l > v2l ? v1l : v2l;

    for (let i = 0; i < len; i++) {
        var b1 = i < v1l ? Number(v1s[i]) : 0,
            b2 = i < v2l ? Number(v2s[i]) : 0;
        if (b1 > b2) {
            return 1;
        } else if (b2 > b1) {
            return -1;
        }
    }
    return 0;
}
export { compareVersion }

/**
 * 匹配范围
 * @param range 版本范围
 * @param v 对比版本
 */
function matchRange(range: string, v: string) {
    if (!range || !v) {
        return false;
    }
    const ranges = range.split("~");
    const v1 = ranges[0];
    const v2 = ranges[1];
    return (v1 === "" || compareVersion(v1, v) <= 0) &&
        (v2 === "" || compareVersion(v2, v) > 0);
}
export { matchRange }

/**
 * 匹配任意
 * @param range      范围
 * @param v          对比
 * @param ignoreCase 忽略大小写
 */
function matchAny(range: string, v: string, ignoreCase?: boolean) {
    if (!range || !v) {
        return false;
    }
    var ranges = range.split("|");
    const len = ranges.length;

    if (ignoreCase) {
        if (Array.isArray(v)) {
            (v as Array<string>) = v.map(function (v) {
                return v.toLowerCase();
            });
        } else {
            v = v.toLowerCase();
        }
        ranges = ranges.map(function (r) {
            return r.toLowerCase();
        });
    }

    for (var i = 0; i < len; i++) {
        var r = ranges[i];
        if (Array.isArray(v)) {
            var result = false;
            v.forEach(function (v) {
                if (!result && r === v) {
                    result = true;
                }
            });
            if (result) {
                return true;
            }
        } else if (r === v) {
            return true;
        }
    }
    return false;
}
export { matchAny }