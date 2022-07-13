"use strict";

/**
 * 消息注册存储对象
 */
const MSG_HANDLERS: Record<string, Function> = {};

/**
 * 获取一个消息处理函数
 * @param  cmd 消息名称
 * @return     消息对应处理函数
 */
function get(cmd: string) {
    return MSG_HANDLERS[cmd];
}
export { get };

/**
 * 添加一个消息处理函数
 * @param  cmd 消息名称
 * @param  cb  消息处理函数
 */
function add(cmd: string, cb: Function) {
    if (!MSG_HANDLERS[cmd] && cb) {
        MSG_HANDLERS[cmd] = cb;
    }
}
export { add }

/**
 * 删除一个消息处理函数
 * @param  {String} cmd 消息名称
 */
function del(cmd: string) {
    delete MSG_HANDLERS[cmd];
}
export { del }
