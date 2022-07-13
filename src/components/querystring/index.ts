import qs from "querystring";

/**
 * 将 URL 参数转换为字符串
 * @example
 * ```ts
 * query2string({"pf":"145","ss":"320x240"});
 * query2string({"pf":"145","ss":"320x240"},["pf"]);
 * query2string({"pf":"145","ss":"320x240"},{"fr":"android"});
 * query2string({"pf":"145","ss":"320x240"},{"fr":"android"},["fr"]);
 * ```
 */
function query2string(...args: Array<ILab.JsonObject | string[]>) {
    var withouts: string[];
    const lastIndex = args.length - 1;

    // 检测是否有排除参数
    if (Array.isArray(args[lastIndex])) {
        withouts = args[lastIndex] as string[];
        args.pop();
    }

    // 需要生成的参数对象
    var qsObj = {};
    args.forEach(function (item) {
        Object.keys(item).forEach(function (key) {
            // 原有的逻辑不是相同的key替换，而是后面的key跟现有的有冲突时会被忽略掉
            if (!qsObj[key] && (!withouts || withouts.indexOf(key) === -1)) {
                qsObj[key] = encodeURIComponent(item[key]);
            }
        });
    });

    return qs.stringify(qsObj);
}

export { query2string }

/**
 * 字符串转成参数对象
 * @param  qString  参数字符串
 * @return          处理完的对象
 * @example
 * ```ts
 * string2query("pf=145&ss=320x240");
 * ```
 */
function string2query(qString: string) {
    return qs.parse(qString);
}
export { string2query }