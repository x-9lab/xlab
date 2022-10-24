module.exports = async function testHeadr(ctx, next) {
    let ts = Date.now();
    var mid = ["1"];
    await next();
    var otherMid = ctx.response.header["x-api-mid"];
    if (otherMid) {
        if (typeof otherMid === "string") {
            mid.push(otherMid);
        } else {
            mid = mid.concat(otherMid);
        }
    }
    ctx.set("X-API-MID", mid);
    ctx.set("X-Test", `${Date.now() - ts}ms`);
}