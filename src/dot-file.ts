import { isArray } from "@x-drive/utils";
import { inspect } from "node:util";
import path from "path";
import fs from "fs";

/**行分割正则 */
const LINE_SPLIT_REGEXP = /[\s]?=[\s]?/;

/**`.xlab` 环境数据存储对象 */
const XLAB: Record<string, XLab.JsonValue> = {};

/**
 * 获取 `.xlab` 系列文件定义的环境数据
 * @return 环境数据对象
 */
function getXlabEnv() {
    return XLAB;
}
export { getXlabEnv }

/**处理根目录下可能存在的配置文件 */
function processDotFile(env: string, logger: any) {
    env = env.toLowerCase();
    if (env === "production") {
        env = "";
    } else {
        env = `.${env}`;
    }
    const dotFile = path.resolve(
        process.cwd()
        , `.xlab${env}`
    );
    var fileStr: string;
    try {
        fileStr = fs.readFileSync(dotFile, "utf8");
    } catch (e) {
        if (e.code !== "ENOENT") {
            logger.error(inspect(e));
        }
        return;
    }
    const lines = fileStr.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const linePart = lines[i].split(LINE_SPLIT_REGEXP);
        if (isArray(linePart) && linePart.length === 2) {
            // 按行解析, 单行数据异常不影响其他行
            try {
                XLAB[linePart[0]] = JSON.parse(linePart[1]);
            } catch (e) {
                logger.error(`.xlab${env} 第 ${i + 1} 行解析失败:`, inspect(e));
            }
        }
    }
}
export { processDotFile }
