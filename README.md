X-9lab 通用服务端
=======

## 开发环境配置
1. 安装 [node](https://nodejs.org/) ,需要 10.0.0 以上版本

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
- ``components目录``： 存放当前项目组件，不要求使用component规范，无需 ``component.json`` 描述文件
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
- [ ] 支持各内置模块的完整类型推导