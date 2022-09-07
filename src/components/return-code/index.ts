import { isBoolean, isNumber, isString } from "@x-drive/utils";
/**
 * 状态详细信息
 */
const CODE_DETAIL: XLab.ICodeDetail = {
    "FAIL": {
        "errorcode": -1
        , "msg": "系统繁忙，请稍候再试"
    }
    , "SUCCESS": {
        "errorcode": 0
        , "msg": "请求成功"
    }
    , "BUSY": {
        "errorcode": 1001
        , "msg": "系统繁忙，请稍候再试"
    }
    , "WRONG_PARAMETER": {
        "errorcode": 400
        , "msg": "参数错误"
    }
    , "NOT_FOUND": {
        "errorcode": 404
        , "msg": "数据不存在"
    }
    , "PERMISSION_DENIED": {
        "errorcode": 403
        , "msg": "没有权限"
    }
    , "SERVER_BUSY": {
        "errorcode": 503
        , "msg": "系统繁忙，请稍候再试"
    }
    , "SERVER_TIMEOUT": {
        "errorcode": 504
        , "msg": "系统繁忙，请稍候再试"
    }
    , "UNCHECK_ERROR": {
        "errorcode": 9999999
        , "msg": "系统进入了异次元..."
    }
};

/**
 * 状态码 - 状态名称 映射对象
 */
const CODE_MAP: Record<number, string> = {};
function buildCodeMap() {
    Object.keys(CODE_DETAIL).forEach(function (key) {
        CODE_MAP[CODE_DETAIL[key].errorcode] = key;
    });
}

buildCodeMap();

/**
 * 根据状态码获取错误定义信息
 * @param  code 状态码
 * @param  msg  返回信息<可选>
 * @return      状态对象
 */
function getReturnCode(code: number, msg?: string): XLab.ICodeItem

/**
 * 根据状态名称获取错误定义信息
 * @param  code 状态名称
 * @param  msg  返回信息<可选>
 * @return      状态对象
 */
function getReturnCode(code: keyof typeof CODE_DETAIL, msg?: string): XLab.ICodeItem

/**
 * 根据状态名称获取错误定义信息
 * @param  code 状态名称
 * @param  msg  返回信息<可选>
 * @return      状态对象
 */
function getReturnCode(code: string, msg?: string): XLab.ICodeItem

/**
 * 根据状态获取错误定义信息
 * @param  code 状态
 * @param  msg  返回信息<可选>
 * @return      状态对象
 */
function getReturnCode(code: boolean, msg?: string): XLab.ICodeItem

/**
 * 根据状态码或状态名称获取错误定义信息
 * @param  code 状态码(Int) 或 状态名称(String)
 * @param  msg  返回信息<可选>
 * @return      状态对象
 */
function getReturnCode(code: any, msg?: string): XLab.ICodeItem {

    if (isBoolean(code)) {
        code = code ? 0 : -1;
    }
    var re: XLab.ICodeItem;

    switch (true) {
        case isString(code):
            re = CODE_DETAIL[code];
            break;

        case isNumber(code):
            re = CODE_DETAIL[CODE_MAP[code]] || CODE_DETAIL.UNCHECK_ERROR;
            break;

        default:
            re = CODE_DETAIL.UNCHECK_ERROR;
    }

    if (msg) {
        re.msg = msg;
    }

    return re;
};

export { getReturnCode };

/**
 * 获取错误代码
 * @return 错误代码
 */
function getCodeDetail() {
    return CODE_DETAIL;
};

export { getCodeDetail }

/**
 * 设置新的错误代码
 * @param data 新的错误代码数据
 */
function set(data: Record<string, XLab.ICodeItem>) {
    if (data && typeof (data) === "object") {
        Object.keys(data).forEach(function (key) {
            CODE_DETAIL[key] = data[key];
        });
        buildCodeMap();
    }
}
export { set };

/**错误类型对象 */
const ErrorTypes = new Proxy(
    CODE_DETAIL
    , {
        get(_, prop: string) {
            const code = CODE_DETAIL[prop];
            if (code) {
                return code.errorcode;
            }
            return code;
        }
    }
);

export { ErrorTypes }