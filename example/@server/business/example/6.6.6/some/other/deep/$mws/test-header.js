module.exports = async function testHeadr(ctx, next) {
    let ts = Date.now();
    await next();
    ctx.set("X-API-MID", "2");
    ctx.set("X-Some-deep-Test", `${Date.now() - ts}ms`);
}