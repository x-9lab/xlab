const { requireMod } = require("@x-9lab/xlab");
const { ErrorTypes } = requireMod("return-code");
const { responseResult } = requireMod("common");

function getProject(ctx) {
    const { name } = ctx.params;
    ctx.body = responseResult(ErrorTypes.SUCCESS, { name });
}

module.exports = getProject;