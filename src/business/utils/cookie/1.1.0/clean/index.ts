import type Koa from "koa";

function onClean(ctx: Koa.Context) {
    var cookies = ctx.query.c && (ctx.query.c as string).split(",") || null;
    if (!cookies) {
        cookies = [];
        (ctx.headers.cookie || "").split("; ").forEach(item => {
            cookies.push(
                item.split("=")[0]
            );
        });
    }
    let len = 0;
    if (cookies && cookies.length) {
        let cookiePath = "/";
        let expires = new Date(-1);
        let httpOnly = false;
        cookies.forEach(cookie => {
            if (cookie) {
                ctx.cookies.set(
                    cookie
                    , ""
                    , {
                        "path": cookiePath
                        , expires
                        , httpOnly
                    }
                );
                len += 1;
            }
        });
    }
    ctx.body = `Clean ${len}`;
}

export default onClean;