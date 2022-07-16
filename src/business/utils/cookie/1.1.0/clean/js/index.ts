import path from "path";
import fs from "fs";

const JS_TPL = fs.readFileSync(
    path.resolve(__dirname, "./@tpls/js.tpl")
    , "utf8"
);

function onJsClean(ctx) {
    var cookies = ctx.query.c;
    cookies = cookies && cookies.split(",") || null;
    if (!cookies) {
        cookies = [];
        (ctx.headers.cookie || "").split("; ").forEach(item => {
            if (item) {
                cookies.push(
                    item.split("=")[0]
                );
            }
        });
    }
    ctx.body = JS_TPL.replace("{cookies}", JSON.stringify(cookies));
}

export default onJsClean;