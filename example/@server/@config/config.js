"use strict";

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
        "load-contracts",
        "return-code"
    ],
    "launchRouter": {}
};
module.exports = CONFIG;
