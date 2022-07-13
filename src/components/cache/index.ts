
import LRU from "./lru";

// var MC = require("./mc");

// var REDIS = require("./redis");

/*var redis = require("./redis");
var REDIS_CLIENT;
exports.redis = function(config) {
    if (!REDIS_CLIENT) {
        REDIS_CLIENT = redis(config);
    }
    exports.redis = REDIS_CLIENT;
};*/

// exports.mc = MC;
export { LRU as local }