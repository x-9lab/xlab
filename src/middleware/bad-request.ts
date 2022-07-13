"use strict";

import { responseResult } from "../components/common";
import assets from "../components/assets";
import type Koa from "koa";

const s5xx = assets("5xx");

const code_map = {
    "404": assets("404")
    , "503": s5xx
    , "504": s5xx
};

var page_tpl = '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html;charset=utf-8" /><style>body{margin:0;padding:0;color:#444;background:#f0f0f0;font:14px/1.4em Arial "Hiragino Sans GB", "Microsoft YaHei",tahoma,arial,sans-serif normal;}</style></head><body>{dat}</body></html>';

function handler(ctx: Koa.Context) {
    var re = code_map[ctx.status] || "";
    var dat;
    if (ctx.url.indexOf("api/") === -1) {
        switch (ctx.status) {
            case 404:
            case 503:
            case 504:
                dat = re;
                break;
            default:
                dat = page_tpl.replace("{dat}", re);
        }
    } else {
        dat = responseResult(
            false
            , re
        );
    }

    ctx.body = dat;
}

export default handler;