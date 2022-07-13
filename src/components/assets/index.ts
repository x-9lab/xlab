import path from "path";
import fs from "fs";

/**
 * 资源储存对象
 */
const ASSETS: Record<string, string> = {};
const pagePath = path.resolve(__dirname, "./pages");

try {
    fs.readdirSync(pagePath).forEach(name => {
        ASSETS[name.replace(".html", "")] = fs.readFileSync(
            `${pagePath}/${name}`
            , "utf-8"
        );
    });
} catch (_) {

}


/**
 * 获取资源
 * @param   name  资源名称
 * @return        资源
 */
function get(name: string) {
    return ASSETS[name] || null;
}

export default get;
