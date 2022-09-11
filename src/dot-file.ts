import { isArray } from "@x-drive/utils";
import path from "path";
import fs from "fs";

/**行分割正则 */
const LINE_SPLIT_REGEXP = /[\s]?=[\s]?/;

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
    try {
        const fileStr = fs.readFileSync(dotFile, "utf8");
        const lines = fileStr.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const linePart = line.split(LINE_SPLIT_REGEXP);
            if (isArray(linePart) && linePart.length === 2) {
                global.XLAB[linePart[0]] = JSON.parse(linePart[1]);
            }
        }
    } catch (e) {
        if (e.code !== "ENOENT") {
            logger.error(e);
        }
    }
}
export { processDotFile }