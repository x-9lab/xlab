"use strict";

/**@type {XLab.IConfig} */
const CONFIG = {
    "304": true,
    // 旧写法，不推荐
    "middleware": [
        "service-mark",
        "request-filter",
        "fresh-filter",
        [
            "cors",
            {
                "type": "sameroot"
            }
        ]
    ],
    // 新写法
    "middlewares": {
        "service-mark": true
        , "request-filter": true
        , "fresh-filter": true
        , "cors": {
            "config": {
                "type": "sameroot"
            }
        }
    },
    "port": 5000,
    "apis": {},
    "indexFileMaxage": 180,
    "custom": [
    ],
    "launchRouter": {},
    "root": "static"
};
module.exports = CONFIG;
