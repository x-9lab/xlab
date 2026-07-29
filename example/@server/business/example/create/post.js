"use strict";

/**
 * 「文件名即方法」约定示例:
 * 文件名 post.js -> 注册为 POST /api/example/create
 */
const { defineApi, requireMod } = require("@x-9lab/xlab");
const { ErrorTypes } = requireMod("return-code");
const { responseResult } = requireMod("common");

module.exports = defineApi({
    handler(ctx) {
        ctx.body = responseResult(ErrorTypes.SUCCESS, { "created": true });
    }
});
