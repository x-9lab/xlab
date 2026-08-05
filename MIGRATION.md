v1 → v2 升级指南
========

v2 是一次 breaking 升级,核心变化:**框架 API 不再挂载到 global,改为从包显式导入**;新增显式生命周期与优雅退出;路由定义形态收敛。本文按步骤指引业务完成迁移,预计单个业务的迁移工作量在半天以内。

## 前置要求

- Node.js **>= 20**(koa 3 要求 >= 18,Node 18 已 EOL)
- 部署脚本/容器基础镜像同步检查 Node 版本

## 升级步骤

### 1. 升级依赖

```bash
yarn add @x-9lab/xlab@^2.0.0
```

启动方式不变:`package.json` 里仍然是 `"start-dev": "xlab"`,`xlab.config.js`、`.xlab` 系列文件、`@server` 目录约定均不变。

### 2. 全局 API 改为导入(必做)

v1 挂在 global 上的所有 API 均已移除,对照表:

| v1(global) | v2(从 `@x-9lab/xlab` 导入) |
|---|---|
| `log.getLogger(cat)` | `getLogger(cat)` |
| `masterLog(cat, type?, ...msg)` | `masterLog(cat, type?, ...msg)` |
| `getSysConfig(key?)` | `getSysConfig(key?)` |
| `setSysConfig(conf)` | `setSysConfig(conf)` |
| `requireMod(name)` | `requireMod(name)` |
| `requireModel(name)` | `requireModel(name)` |
| `requireService(name)` | `requireService(name)` |
| `getApp()` | `getApp()` |
| `XLAB`(`.xlab` 数据) | `getXlabEnv()` |

除 `log` 与 `XLAB` 外名称均不变,迁移就是在文件头部加一行导入:

```js
// v1
const { ErrorTypes } = requireMod("return-code");

// v2
const { requireMod } = require("@x-9lab/xlab");
const { ErrorTypes } = requireMod("return-code");
```

```js
// v1
const secret = XLAB.MY_SECRET;
log.getLogger("biz").info("hi");

// v2
const { getXlabEnv, getLogger } = require("@x-9lab/xlab");
const secret = getXlabEnv().MY_SECRET;
getLogger("biz").info("hi");
```

可以用下面的命令快速找出需要迁移的文件:

```bash
grep -rln "requireMod\|requireModel\|requireService\|getSysConfig\|setSysConfig\|masterLog\|getApp\|XLAB\|log\.getLogger" @server/
```

**类型支持不变**:`XLab` 命名空间仍是全局类型,`XLab.IModels` / `XLab.IServices` / `XLab.IConfig` 的 declaration merging 扩展方式与 v1 完全一致,业务的 `.d.ts` 无需修改。纯 JS 项目在 JSDoc 中使用 `XLab.IConfig` 等类型时,若编辑器提示找不到命名空间,在任一被 tsconfig/jsconfig 覆盖的文件中加一行 `/// <reference types="@x-9lab/xlab" />` 即可。

**注意**:业务代码里 `require("@x-9lab/xlab")` 拿到的必须与运行中的服务是同一个包实例(正常通过依赖安装即满足;不要全局安装一份再混用)。

### 3. 数组形式的路由改写(必做,如有)

数组导出(文件名当方法名)已移除,启动时命中会直接报错。改写方式二选一:

```js
// v1: @server/business/user/post.js —— 数组形式
module.exports = [checkAuth, function (ctx) { /* ... */ }];
```

方式一,「文件名即方法」约定(v2 新增):文件名是 `get/post/put/delete/patch/head/options/all` 之一时,自动作为请求方法且不进入 api 路径。无中间件的场景直接导出函数即可:

```js
// v2: @server/business/user/post.js -> POST /api/user
module.exports = function (ctx) { /* ... */ };
```

方式二,对象形式(推荐,配合 `defineApi` 获得类型推导):

```js
// v2: @server/business/user/post.js -> POST /api/user
const { defineApi } = require("@x-9lab/xlab");
module.exports = defineApi({
    "middleware": [checkAuth]
    , handler(ctx) { /* ... */ }
});
```

函数与对象两种导出形态的行为与 v1 一致,无需改动。

### 4. custom 模块与生命周期钩子(可选)

v1 的「导出一个函数」形态仍然兼容(视为 `setup`)。v2 起可以导出钩子对象:

```js
// @server/custom/db.js
module.exports = {
    async setup(conf) { /* 服务装配前, 收到 config.custom 里声明的参数 */ }
    , async ready() { /* listen 成功后 */ }
    , async shutdown() { /* 进程退出前, 用于释放连接等 */ }
};
```

### 5. 检查行为变化(必读)

以下变化不需要改代码,但需要确认对业务无影响:

1. **优雅退出**:收到 SIGTERM/SIGINT 后,服务会停止定时任务 → 等待在途请求(默认 10s,可用配置项 `shutdownTimeout` 调整,单位毫秒)→ 执行 `shutdown` 钩子 → 退出。**部署侧注意**:k8s 的 `terminationGracePeriodSeconds`、pm2 的 `kill_timeout` 需要大于 `shutdownTimeout`,否则会被强杀。
2. **worker 崩溃重启退避**:cluster 模式下 worker 10 秒内连续快速崩溃 5 次后不再自动拉起(v1 无条件立即重启,会造成 crash-loop)。依赖「无限重启」兜底的业务需要检查告警。
3. **business 根级 `$` 中间件开始生效**:v1 因 bug 从不生效,v2 按文档约定对全部业务路由生效。如果 business 根下有 `$` 目录,确认其中间件对所有接口执行是否符合预期。
4. **`crons` 按任务配置开始生效**:配置项 `crons: { 任务文件名: { delay, enable } }` v1 只有类型声明没有实现,v2 起真实生效,优先级高于任务模块自身的 `getDelay()` / `enable()`。注意 `delay` 单位是**秒**(与 `cron.def` 一致),模块 `getDelay()` 返回值仍是毫秒。
5. **`middleware` 数组配置移除**:v1.1.0 起已弃用且实际不被读取,配置里如仍保留该字段可直接删除,只认 `middlewares`。同时移除 `enableComboCache` 配置与内置中间件白名单里的 `combo` 项——combo 中间件实现早已不存在,v1 中启用它会直接启动崩溃。
6. **`custom` 的执行时机**:v1 对 async 自定义模块不等待;v2 会 await 完 `setup` 才继续装配中间件与路由,时序更明确。
7. **方法名文件的 api 路径会变化(重要)**:v1 中名为 `get.js` / `post.js` 等的函数或对象形态路由文件,文件名会进入 api 路径(如 `business/foo/post.js` → `POST /api/foo/post`);v2 按「文件名即方法」约定,文件名不再进入路径(→ `POST /api/foo`)。**这是路由地址的静默变更**,升级前用下面命令找出此类文件,逐个确认调用方,必要时用 `defineApi` 的 `api` 字段固定回原地址:

    ```bash
    find @server/business -type f \( -name "get.js" -o -name "post.js" -o -name "put.js" -o -name "delete.js" -o -name "patch.js" -o -name "head.js" -o -name "options.js" -o -name "all.js" \)
    ```

8. **其余路由生成规则不变**:`index` 文件名去除、`@` 目录不参与路由、`:name` 路径参数等均与 v1 一致。

### 6. 验证

```bash
# 开发环境跑起来,观察启动日志中的 API 注册与中间件加载是否与 v1 一致
yarn start-dev

# 逐条核对启动日志里的 "Handling API >>>" 输出与线上路由清单
```

## 完整 API 一览(v2)

```ts
import {
    boot, shutdown          // 生命周期
    , app, getApp           // Koa 应用实例
    , getSysConfig, setSysConfig
    , requireMod, requireModel, requireService
    , getLogger, masterLog, Log, globalLog
    , getXlabEnv            // .xlab 环境数据
    , defineApi             // 路由定义帮助函数
} from "@x-9lab/xlab";
```

## 常见问题

**Q: 迁移时想先跑起来再逐步改,有没有临时兼容方案?**
可以在业务自己的 `@server/@env/index.js`(启动最早执行)里临时把 API 挂回 global,迁移完成后删除:

```js
const xlab = require("@x-9lab/xlab");
["requireMod", "requireModel", "requireService", "getSysConfig", "setSysConfig", "getApp"]
    .forEach(name => { global[name] = xlab[name]; });
global.masterLog = xlab.masterLog;
global.log = xlab.globalLog;
global.XLAB = xlab.getXlabEnv();
```

**Q: `getApp()` 还能用吗?**
能,且不再是弃用状态;也可以直接 `const { app } = require("@x-9lab/xlab")`。

**Q: 日志格式变了吗?**
日志库从 log4js 1.x 升级到 6.x,框架通过默认 layout 保持了 v1 的输出格式(时间戳仍为 `yyyy-MM-dd hh:mm:ss.SSS` 空格分隔),日志采集无需调整;`new Log({ layout })` 自定义 layout 的行为不变。
