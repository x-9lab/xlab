X-9lab 通用服务端
=======

> 当前为 v2 版本(breaking change),从 v1 升级请先阅读 [MIGRATION.md](./MIGRATION.md)。

## 开发环境配置
1. 安装 [node](https://nodejs.org/) ,需要 20.0.0 以上版本

## 使用
- 将 `@x-9lab/xlab` 加入到依赖中
- `package.json` 中调用 `xlab`
    ```json
    {
        "scripts": {
            "start-dev": "xlab"
        }
    }
    ```
    - 支持传入 `APP_NAME` 参数，可用于解决诸如同个服务器上有多个实例运行时的识别问题
        ```bash
        xlab --APP_NAME=nice
        ```
    - 其他命令行参数
        - `-w` / `--watch` 开启 watch 模式
        - `-r` / `--root` 指定执行根目录
        - `-f` / `--file` 指定启动配置文件地址
        - `PORT=3001` 覆盖监听端口，`IP=127.0.0.1` 指定绑定地址，`ENV=<环境>` 指定运行环境
- 运行环境
    由 `ENV=` 参数或 `NODE_ENV` 决定，支持 `development`(开发) / `sandbox`(沙箱) / `production`(生产)，也可使用数字别名 `0` / `2` / `1`；未指定时默认 development。环境决定加载哪份 `@config` 环境配置与 `.xlab` 环境文件
- 配置文件 `xlab.config.js`
    模块会自动检测执行根目录中是否存在 `xlab.config.js` 文件。如存在该文件则会使用该文件为模块的启动配置文件。支持的配置项：
    1. `watch` 是否开启 watch 模式
    1. `businessDir` 服务端业务目录名称，默认 `@server`。注意当前只支持根目录下的文件夹
- 配置文件 `.xlab`
    该文件用于定义系统级的环境数据，模块会自动检测执行根目录中是否存在 `.xlab` 文件。该类型文件一般用于定义一些不方便在代码中声明的敏感数据，因此 `.xlab` 及附属的环境文件 **不应该** 被提交到仓库中。
    - 使用 `<key>=<value>` 的方式定义数据，value 按 JSON 解析
    - 文件中的数据通过 `getXlabEnv()` 获取
    - `.xlab` 为生产环境定义，`.xlab.development` 为开发环境定义，`.xlab.sandbox` 为沙箱环境定义
- `watch` 模式
    `xlab` 支持自动重启业务，开发中使用该功能可以减少大量手动重启业务的操作。
    启用方式：
    - 启动命令使用 `w` 参数
    - 在配置文件中开启
        ```js
        const { NODE_ENV } = process.env;
        module.exports = {
            "watch": {
                "enable": NODE_ENV === "development"
            }
        }
        ```
- 除了静态资源，服务端业务需要放在项目根目录下的 `@server` 目录中
- 支持业务自定义以下内容 (无特殊说明的都是存放在 @server 目录中)
    - 环境预处理，存放于 `@env` 目录(可选)，`@env/index.js` 会在启动最早阶段(配置装载前)被执行，可用于设置 `process.env` 等
    - 配置项，存放于 `@config` 目录
        - 支持不同环境配置文件
            - 无中间词缀的 config 文件为生产环境配置文件
            - 中间词缀为 `dev` 的 config 文件为开发环境配置文件
            - 中间词缀为`sand` 的 config 文件为沙箱环境配置文件
            - 中间词缀为`lo` 的 config 文件为本地环境配置文件，该文件不应被提交到仓库
        - 配置文件按照中间词缀，合并优先级为 `lo > dev = sand > 无`
            - 开发环境与沙箱环境同时只会根据当前环境取其中一个，因此优先级一样
    - 服务接口，存放于 `business` 目录
        - 接口地址
            - 默认服务接口均以 `api` 开始
            - 按照目录结构生成 api
                - 文件名是 `index` 的会被从 api 上先强行去掉
                - 默认都是 `get` 请求
        - 文件名即方法：文件名是 `get/post/put/delete/patch/head/options/all` 之一时，从 api 路径上去掉并作为该接口的请求方法
        - 支持以下形式定义接口
            - 模块返回为函数的则直接绑定为接口处理函数
            - 返回是对象则取对应的字段（推荐配合 `defineApi` 获得类型推导）
                - `method` 接口类型，如 `get` 或 `post`，不指定时由文件名约定决定
                - `api` 自定义接口地址
                - `middleware` 接口中间件
                - `handler` 接口处理函数
                - `ignoreApiNameCheck` 是否忽略 `/api` 前缀检测
        - 特殊文件夹
            - 以 `@` 开头的文件夹, 该文件夹不会被当成接口文件夹，但可在正常的接口中作为普通模块使用
            - 以 `$` 开头的文件夹, 该文件夹中的文件会成为后续接口的通用中间件，可以用于某类型业务的统一处理，如后台某些接口的额外身份处理。为了防止滥用，该文件夹不会递归查找，也就是说不支持子文件夹的组织形式。
                - 整个 api 地址的每个父层都可以有独立的中间件文件，执行顺序会按照目录层级执行
                - 中间件文件夹内的文件只会按照文件名做简单排序，因此请特别注意执行顺序是否符合自己的预期，或采用带序号的文件名
    - 自定义逻辑，存放于 `custom` 目录，需在配置项 `custom` 数组中声明才会执行（`"模块名"` 或 `["模块名", 参数]`）。模块导出一个函数作为执行入口（视为 `setup`），或导出 `{ setup, ready, shutdown }` 生命周期钩子对象
        - `setup` 服务装配前执行，接收 `custom` 配置中声明的参数
        - `ready` 服务启动完成（listen 成功）后执行
        - `shutdown` 服务退出前执行，可用于释放连接等资源
    - 中间件，存放于 `middleware` 目录，通过配置项 `middlewares` 启用与排序
        - 名称命中内置中间件时加载内置实现，否则加载业务 `middleware` 目录下的同名模块；模块需导出工厂函数 `(config) => koaMiddleware`
        - 内置中间件：`bad-request`(异常返回兜底，总是启用)、`fresh-filter`(304 协商缓存)、`handle-pre-dir`(代理路径层级处理)、`request-filter`(请求过滤)、`service-mark`(X-Mark 服务标识)、`compress`(压缩)、`cors`(跨域)
        ```js
        "middlewares": {
            "service-mark": true
            , "cors": { "config": { "type": "sameroot" } }
        }
        ```
    - 定时任务，存放于 `cron` 目录，由配置项 `enableCron` 开启，默认只在 master 进程执行（`enableWorkerCron` 可放开到 worker）
        - 任务模块导出一个函数作为任务体，可另外导出 `getDelay()`(间隔，毫秒) 与 `enable()`(开关)
        - 配置项 `crons` 可按文件名覆盖任务的间隔与开关，优先级高于模块自身导出
    - 静态资源，默认存放在项目根目录下的 `public` 目录中（配置项 `root` 可改）
### 模块 API

v2 起框架 API 不再挂载到 global，统一从包导入（v1 升级请看 [MIGRATION.md](./MIGRATION.md)）：

```js
const {
    boot, shutdown          // 生命周期
    , app, getApp           // Koa 应用实例
    , getSysConfig, setSysConfig
    , requireMod, requireModel, requireService
    , getLogger, masterLog
    , getXlabEnv            // .xlab 环境数据
    , defineApi             // 路由定义帮助函数
} = require("@x-9lab/xlab");
```

- `getLogger(cat)` 获取分类日志实例
- `masterLog(cat, type?, ...msg)` 只在 master 进程上输出的日志方法
- `getApp` 获取应用实例对象
    ```ts
    /**
    * 获取应用实例对象
    */
    function getApp(): Koa;
    ```
- `requireMod` 获取内置组件
    ```ts
    /**
    * 获取内置组件
    * @param  name 模块名
    * @return      模块对象
    */
    function requireMod<T extends InternalComponents[K], K extends keyof InternalComponents>(name: K): T;
    ```
- `getSysConfig` 获取系统配置
    - 获取全部配置
    ```js
    const config = getSysConfig();
    ```
    - 获取指定配置
    ```js
    const allowCache = getSysConfig("allowCache");
    ```
- `setSysConfig` 更新系统配置
    ```ts
    /**
    * 更新系统配置
    * @param  conf 配置项
    */
    function setSysConfig(conf: XLab.IConfig): void;
    ```
- `getXlabEnv` 获取 `.xlab` 系列文件定义的环境数据
- `boot` 启动服务，按固定阶段装配并监听；正常业务由 `xlab` 命令调用，无需手动执行
- `shutdown` 优雅退出：停止定时任务 → 等待在途请求 → 执行 `shutdown` 钩子 → 退出进程；收到 `SIGTERM` / `SIGINT` 时自动触发
- `requireModel` 获取 model 的方法
    该方法只是为获取 model 提供一个快捷方式，也可以通过正常的方式去 require
    - 存放路径 `business/@models`
    - 使用方式
        ```js
        const { testModel } = requireModel("test");
        ```
    - 类型支持
        由于 `requireModel` 是一个 `xlab` 的内置方法没有业务本身的 model 定义，因此需要业务方自行追加（`XLab` 类型命名空间仍为全局，declaration merging 方式与 v1 一致）。出于管理方面的考虑，建议将所有的 model 定义放在一个文件中
        ```ts
        declare global {
            namespace XLab {
                interface IModels {
                    /**测试 model */
                    test: typeof import("./business/@models/test");
                }
            }
        }
        export { }
        ```
- `requireService` 获取 service 的方法
    该方法只是为获取 service 提供一个快捷方式，也可以通过正常的方式去 require
    - 存放路径 `business/@services`
    - 使用方式
        ```js
        const { testFn } = requireService("test");
        ```
    - 类型支持
        由于 `requireService` 是一个 `xlab` 的内置方法没有业务本身的 service 定义，因此需要业务方自行追加。出于管理方面的考虑，建议将所有的 service 定义放在一个文件中
        ```ts
        declare global {
            namespace XLab {
                interface IServices {
                    /**测试 model */
                    test: typeof import("./business/@services/test");
                }
            }
        }
        export { }
        ```

#### Namespace `XLab`
`XLab` 提供了一些标准化的定义及系统配置
- `IStdRes` 标准返回数据
- `IConfig` 系统配置对象
    - 外部模块追加配置项
- `ICodeItem` 错误信息对象
- `ICodeDetail` 错误定义
- `IServices` 业务 services 定义
- `IModels` 业务 model 定义

### 配置项
|名称|类型|默认值|说明|
|-|-|-|-|
|name|`string`| package.json 中的 name 字段 |服务(应用)名称|
|version|`string`|package.json 中的 version 字段|版本|
|env|`string`|DEVELOPMENT|环境标识(大写)，由启动环境决定，业务不应配置|
|host|`string`| |业务绑定的域名，cors 中间件 `sameroot` 模式使用|
|304|`boolean`| true |是否开启 304 协商缓存|
|workers|`number`|0|Worker 数量，大于 0 时以 cluster 模式启动|
|ip|`string`||服务绑定地址，也可通过 `IP=` 命令行参数指定|
|timezone|`string`|Asia/Shanghai|时区|
|debug|`boolean`|非生产环境为 true|是否开启 debug 模式|
|staticMaxage|`number`|1800000|静态文件缓存时间(仅生产环境启用)|
|staticHtmlFileMaxage|`number`|0|静态 html 文件缓存时间|
|staticCros|`boolean`|false|是否允许静态资源跨域访问|
|enableCron|`boolean`|false|是否开启定时任务|
|enableWorkerCron|`boolean`|false|是否允许 worker 上也执行定时任务|
|middlewares|`Record<string, MiddlewareConfig>`|{}|开启的中间件列表 |
||MiddlewareConfig||`index` 用于定义中间件位置，不提供将使用配置对象中的默认顺序<br/> `name` 中间件名称，不提供将使用配置对象的键名<br/>`config` 中间件配置|
|custom|`(string | [string, any])[]`||自定模块配置，元组形式可传入参数|
|mark|`string`|name 配置|服务标识，用于 service-mark 中间件|
|apis|`Record<string, string>`|{}|页端注入的 api 设置，自动合并 `@config/@apis` 目录内容|
|hasLo|`boolean`||本地是否存在本地开发配置文件，由框架自动设置|
|passExtApis|`boolean`||不合并 `@config/@apis` 目录的 api 配置|
|allowCache|`boolean`|true|是否允许页端缓存|
|root|`string`|public|静态文件根目录|
|port|`number`|5000|监听端口，也可通过 `PORT=` 命令行参数指定|
|isMaster|`boolean`||是否是主进程，由框架自动设置|
|pathReplaceRegExp|`string`||handle-pre-dir 中间件处理代理多余地址层级的判断正则|
|routeMobile|`string`||移动端入口文件地址(旧版逻辑)|
|cron|`{def?: number;}`|{"def": 60}|定时任务设置，`def` 为默认间隔(秒)|
|crons|`Record<string, {delay?: number; enable?: boolean;}>`||按任务(文件名)的定时任务配置，`delay` 单位秒，优先级高于任务模块自身的 `getDelay()` / `enable()`|
|shutdownTimeout|`number`|10000|优雅退出时等待在途请求/worker 结束的超时时间(毫秒)|
|indexPageCacheTime|`number`||fresh-filter 中间件的首页缓存时间(毫秒)|
|staticResourceCacheTime|`number`||fresh-filter 中间件的静态资源缓存时间(毫秒)|
|biServer / protocol / strictSSL / internalServers / internalApis|||框架不读取的业务约定字段，供业务通过 `getSysConfig` 自取|

> v2 起移除:`middleware`(数组形式，v1.1.0 已弃用)、`enableComboCache` 与 `launchRouter`(对应实现已不存在)。

## 业务项目文件结构

```
业务项目根目录
├── package.json            # scripts 中调用 xlab 启动
├── xlab.config.js          # 启动配置(watch / businessDir)，可选
├── .xlab                   # 环境数据文件(.xlab.development / .xlab.sandbox)，不入库
├── public                  # 静态资源(root 配置可改)
└── @server                 # 服务端业务目录(businessDir 配置可改)
    ├── @env                # 环境预处理，启动最早执行，可选
    │   └── index.js
    ├── @config             # 配置: config.js / config.dev.js / config.sand.js / config.lo.js
    │   └── @apis           # 页端注入的 api 配置，可选
    ├── business            # 约定路由目录，按目录结构生成 /api/...
    │   ├── @models         # model，requireModel 读取
    │   ├── @services       # service，requireService 读取
    │   ├── $mws            # $ 前缀目录级中间件
    │   └── ...
    ├── middleware          # 业务中间件，middlewares 配置启用
    ├── custom              # 自定义逻辑与生命周期钩子，custom 配置声明
    └── cron                # 定时任务，enableCron 开启
```

完整可运行的示例见仓库中的 [example](./example) 目录。

## TODO

- [ ] swc 支持 `--out-file-extension` 后转为直接输出 `.mjs` 文件
    1. `packgae.json` 增加 `"type": "module"` 设置
    1. `.swcrc` 中 `module.type` 改为 `es6`
- [x] 配置文件由 `json` 改为 `ts`
- [x] 支持各内置模块的完整类型推导