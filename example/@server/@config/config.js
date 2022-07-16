"use strict";

/**@type {XLab.IConfig} */
const CONFIG = {
    "304": true,
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
    "port": 5000,
    "apis": {},
    "indexFileMaxage": 180,
    "custom": [
    ],
    "launchRouter": {},
    "root": "static"
};
module.exports = CONFIG;
