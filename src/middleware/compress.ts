import compress from "koa-compress";
import zlib from "zlib";

function handler(config: Record<string, any>) {
    const gzipOpts: Record<string, any> = {
        "flush": zlib.Z_SYNC_FLUSH
    };

    if (config) {
        if (config.threshold) {
            gzipOpts.threshold = config.threshold;
        }

        if (config.filter) {
            let filter = new RegExp(config.filter, "i");
            gzipOpts.filter = function (type) {
                return filter.test(type);
            }
        }

        if (config.flush && zlib[config.gzip.flush]) {
            gzipOpts.flush = zlib[config.gzip.flush];
        }
    }

    return compress(gzipOpts);
}
export default handler;
