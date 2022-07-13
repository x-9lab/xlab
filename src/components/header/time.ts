/**一年的秒数 */
const YEAR_SEC = 365 * 24 * 60 * 60;
/**一月的秒数 */
const MONTH_SEC = 30 * 24 * 60 * 60;
/**一天的秒数 */
const DAY_SEC = 24 * 60 * 60;
/**一小时的秒数 */
const HOUR_SEC = 60 * 60;
/**一分钟的秒数 */
const MINUTE_SEC = 60;

/**字符串转为秒数 */
function string2seconds(string: string) {
    const rBlock = /(\d{1,4})([YMdhms])/;
    var r: string[];
    var sec: number = 0;

    while ((r = rBlock.exec(string)) !== null) {
        let value = Number(r[1]);
        let unit = r[2];

        if (unit === "Y") {
            sec += YEAR_SEC * value;
        } else if (unit === "M") {
            sec += MONTH_SEC * value;
        } else if (unit === "d") {
            sec += DAY_SEC * value;
        } else if (unit === "h") {
            sec += HOUR_SEC * value;
        } else if (unit === "m") {
            sec += MINUTE_SEC * value;
        } else {
            sec += value;
        }
        string = string.replace(r[0], "");
    }

    return sec;
}
export { string2seconds }
