const { ErrorTypes } = requireMod("return-code");
const { responseResult } = requireMod("common");

function getSome(ctx) {
    const { name } = ctx.params;
    ctx.body = responseResult(ErrorTypes.SUCCESS, { name });
}

module.exports = getSome;