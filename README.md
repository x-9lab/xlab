X-9lab 通用服务端
=======

## 开发环境配置
1. 安装 [node](https://nodejs.org/) ,需要 10.0.0 以上版本

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
- 配置文件 `xlab.config.js`
    模块会自动检测执行根目录中是否存在 `xlab.config.js` 文件。如存在该文件则会使用该文件为模块的启动配置文件。支持的配置项：
    1. `watch` 是否开启 watch 模式
    1. `business` 业务目录名称。注意当前只支持根目录下的文件夹
- 配置文件 `.xlab`
    该文件用于定义系统中的全局变量，模块会自动检测执行根目录中是否存在 `.xlab` 文件。该类型文件一般用于定义一些不方便在代码中声明的敏感数据，因此 `.xlab` 及附属的环境文件 **不应该** 被提交到仓库中。
    - 使用 `<key>=<value>` 的方式定义数据
    - 文件中的数据会被加载到 `global.XLAB` 对象中
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
        - 支持以下形式定义接口
            - 模块返回的是数组，则使用文件名做为方法名，并在 api 上去掉文件名
            - 非数组则文件当作正常的 api 地址
            - 模块返回为函数的则直接绑定为接口处理函数
            - 返回是对象则取对应的字段
                - `method` 接口类型，如 `get` 或 `post`
                - `middleware` 接口中间件
                - `handler` 接口处理函数
        - 特殊文件夹
            - 以 `@` 开头的文件夹, 该文件夹不会被当成接口文件夹，但可在正常的接口中作为普通模块使用
            - 以 `$` 开头的文件夹, 该文件夹中的文件会成为后续接口的通用中间件，可以用于某类型业务的统一处理，如后台某些接口的额外身份处理。为了防止滥用，该文件夹不会递归查找，也就是说不支持子文件夹的组织形式。
                - 整个 api 地址的每个父层都可以有独立的中间件文件，执行顺序会按照目录层级执行
                - 中间件文件夹内的文件只会按照文件名做简单排序，因此请特别注意执行顺序是否符合自己的预期，或采用带序号的文件名
    - 自定义逻辑，存放于 `custom` 目录，模块需要导出一个函数作为执行入口
    - 中间件，存放于 `middleware` 目录
    - 定时任务，存放于 `cron` 目录
    - 静态资源，默认存放在项目根目录下的 `public` 目录中
### 全局对象与函数

#### 全局对象
- `log` 全局日志对象
- `masterLog` 只在 master 上输出的日志对象

#### 全局函数
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
- `requireModel` 全局获取 model 的方法
    该方法只是为获取 model 提供一个快捷方式，也可以通过正常的方式去 require
    - 存放路径 `business/@models`
    - 使用方式
        ```js
        const { testModel } = requireModel("test");
        ```
    - 类型支持
        由于 `requireModel` 是一个 `xlab` 的内置方法没有业务本身的 model 定义，因此需要业务方自行追加。出于管理方面的考虑，建议将所有的 model 定义放在一个文件中
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
- `requireService` 全局获取 service 的方法
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
|env|`string`|development|环境标识|
|host|`string`| |业务绑定的域名|
|304|`boolean`| true |是否开启 304 协商缓存|
|workers|`number`|0|Worker 数量|
|biServer|`string`||业务服务器地址|
|protocol|`string`|http|业务服务器协议|
|debug|`boolean`|false|是否开启 debug 模式|
|staticMaxage|`number`|1800000|静态文件缓存时间|
|staticHtmlFileMaxage|`number`|0|静态 html 文件缓存时间|
|staticCros|`boolean`|false|是否允许静态资源跨域访问|
|enableComboCache|`boolean`|true|是否开启 Combo 缓存|
|enableCron|`boolean`|false|是否开启定时任务|
|middleware|`Array<string | (string | Record<string, any>)[]>`|[]|开启的中间件列表。因不方便合并替换，v1.1.0 开始建议使用 `middlewares` 来配置 |
|middlewares|`Record<string, MiddlewareConfig>`|{}|开启的中间件列表 |
||MiddlewareConfig||`index` 用于定义中间件位置，不提供将使用配置对象中的默认顺序<br/> `name` 中间件名称，不提供将使用配置对象的键名<br/>`config` 中间件配置|
|custom|`string[]`||自定模块配置|
|strictSSL|`boolean`||是否启用严格 ssl|
|apis|`Record<string, string>`|{}|页端注入的 api 设置|
|hasLo|`boolean`||本地是否存在本地开发配置文件|
|passExtApis|`boolean`||不处理业务 api|
|allowCache|`boolean`||是否允许页端缓存|
|root|`string`|public|静态文件根目录|
|port|`number`|5000|监听端口|
|isMaster|`boolean`||是否是主进程|
|clearLocalStorage|`boolean`||是否每次都强制清除 LocalStorage|
|pathReplaceRegExp|`string`||处理代理过来多余的地址层级路径替换判断正则|
|routeMobile|`string`||移动端入口文件地址(旧版逻辑)|
|launchRouter|`Record<string, string>`||不同端入口地址设置, 由 `@x-drive/launch-detect` 提供支持|
|cron|`{def?: number;}`|{"def": 60}|定时任务设置|
|injection|`string[]`|[]|注入参数列表|
|indexPageCacheTime|`number`||首页缓存时间|
|staticResourceCacheTime|`number`||静态资源缓存时间|

## 文件结构

```
├── README.md
├── business
│   └── @services
│   └── @models
│   │  └── forumUser.js
│   └── ...
├── components
│   ├── cache
│   ├── common.js
│   └── ...
├── @config
│   ├── config.dev.ts
│   └── config.ts
├── middleware
├── cron
├── public
├── test
├── route
├── private
│   └── log
├── package.json
├── config.js
├── router.js
└── server.js
```

### 说明
- ``business目录``：前端业务
- ``@services目录``：业务services
- ``@models目录``：存放model
- ``components目录``： 存放当前项目组件
- ``@config``：存放环境配置，不同环境在名称与文件后缀中间使用不同代号区分
- ``middleware目录``：存放请求特殊处理模块，一般作为中间件
- ``public目录``：存放前端资源文件
- ``cron目录``：存放定时任务文件
- ``test目录``：存放单元测试
- ``route目录``：存放不同平台的路由配置
- ``private目录``：存放业务 log ，或其他服务端相关的内容
- ``package.json``：nodejs后端所需要的依赖描述文件，即npm的 [package.json](https://www.npmjs.org/doc/files/package.json.html) 文件
- ``router.js``：路由模块
- ``server.js``：服务器主模块
- ``config.js``：配置处理模块

## TODO

- [ ] swc 支持 `--out-file-extension` 后转为直接输出 `.mjs` 文件
    1. `packgae.json` 增加 `"type": "module"` 设置
    1. `.swcrc` 中 `module.type` 改为 `es6`
- [x] 配置文件由 `json` 改为 `ts`
- [x] 支持各内置模块的完整类型推导