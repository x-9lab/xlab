## v1.1.0

### Feat
- feat: 新增 middlewares 中间件配置，支持新的配置逻辑，旧配置项将在 1.3.0 弃用 [e424b5b](https://github.com/x-9lab/xlab/commit/e424b5b9e15a44419924593b832c3ca4c064d8c8)

## v1.0.13

### Fix
- fix: 修复 injection 模块错误替换逻辑 [862f309](https://github.com/x-9lab/xlab/commit/862f3091cb625b80364366296e17a3438fb9a8ed)

## v1.0.12

### Feat
- feat: 增加对服务名称显示的支持，用于解决同个服务器上有多个实例运行时的识别问题 [658dd94](https://github.com/x-9lab/xlab/commit/658dd94121fd1bb9923ed874b7a3aee4e7ae8f21)

## v1.0.11

### Fix
- fix: 自动获取并设置正确的 access-control-request-headers [18cf945](https://github.com/x-9lab/xlab/commit/18cf9453dfaba4b9eceee6acbb78d8a8f6605b06)

## v1.0.10

### Fix
- fix: originHost 现在所有请求都会带上 [8e4af8e](https://github.com/x-9lab/xlab/commit/8e4af8e60ae5a255953305e72bc47a01319ebd78)

## v1.0.9

### Feat
- feat: cors 支持 .lo 本地域名 [4797882](https://github.com/x-9lab/xlab/commit/479788226cdbc9b8cc1e3594f9beb055f68c7e8c)
- feat: 增加 ctx.state.parsedUrl 的定义 [1dc8270](https://github.com/x-9lab/xlab/commit/1dc827063e13f9a6e62d86bac5085715b53025b2)
- feat(request-filter): 增加 ctx.state 中的相关定义 [bd472b9](https://github.com/x-9lab/xlab/commit/bd472b96d55fff8dc68353e38e57345ab9d41faf)

## v1.0.8

### Fix
- fix: 升级依赖，解决匹配问题 [a90bfba](https://github.com/x-9lab/xlab/commit/a90bfbabbd3229a469824015f7c93f02eded172a)

## v1.0.7

### Feat
- feat: 去除 launchRouter 的定义，交由 x-drive/launch-detect 提供支持 [830f929](https://github.com/x-9lab/xlab/commit/830f9290322d9c10915959f54c28876a7f25b907)

## v1.0.6

### Feat
- feat: 支持根目录下的点配置文件 [61b5eb5](https://github.com/x-9lab/xlab/commit/61b5eb5919e9d12fec7455688fe27615274220ac)

## v1.0.5

### Fix
- fix: 修复 ICodeDetail 无法扩展的问题 [9eaf1f6](https://github.com/x-9lab/xlab/commit/9eaf1f67c99702bd81b81f43c3b3e803da2ac8b1)
- fix: 修复取值异常导致的错误 [4ca9d66](https://github.com/x-9lab/xlab/commit/4ca9d665e1715cab732dd27811b7edbfc6ba2704)
- fix: 修复配置不正常传递的问题 [eb5d805](https://github.com/x-9lab/xlab/commit/eb5d805ded0b7a7f3e1ec717c868c9fb0266b8ba)
- fix:  bugfix 、upgrade packages  and other (#3) [91ea20a](https://github.com/x-9lab/xlab/commit/91ea20acf7bc8f88de434db54ba000aa014d6a31)

### Feat
- feat: 使用配置文件中的业务目录 [65cd753](https://github.com/x-9lab/xlab/commit/65cd75333440a1d51ec2d81d76a8c0838128715c)
- feat: 修改配置文件名称，主要业务目录支持配置 [25299ff](https://github.com/x-9lab/xlab/commit/25299ffe66b38a4eeacf31fccd56dc64b1c5869c)

## v1.0.2

### Fix
- fix: 修复编译后 components 中的 index.d.ts 丢失导致 global.d.ts 引用失败的问题 [56a1771](https://github.com/x-9lab/xlab/commit/56a17719a8cab89255541935e3d2f781fc7e256b)

## v1.0.1

V1.0.1 新增 request 模块,common 新增 sleep 函数,移除部分内容及升级依赖以及其他小修改
* feat: 新增 request 模块
* feat: common 新增 sleep 函数
* chore: 升级依赖
* feat: 升级相关依赖组件及调整关联模块
* feat: 移除 combo
* fix: 修复内置 api 文件判断问题
* feat(middleware/service-mark): 调整输出信息
* feat: 内置组件定义转由 components 下的文件定义，global 只做引用

## v1.0.0

### Fix
- fix(bin/watch): 修正语法错误 [3988622](https://github.com/x-9lab/xlab/commit/3988622af68193ef9a9376d951d830760f5bcc1e)

### Feat
- feat(global): 支持业务定义 service 与 model [89d6cf4](https://github.com/x-9lab/xlab/commit/89d6cf44d7cf33d87eab53bac8035795d3661ccc)
- feat(components/common): 生成操作结果数据对象函数增加新的参数类型 [62dfb28](https://github.com/x-9lab/xlab/commit/62dfb28a698b4d426c8d739ef3734fab614e8654)
- feat(cache/lru): 新增获取一个缓存实例的方法 [35e6bd1](https://github.com/x-9lab/xlab/commit/35e6bd1cdf86b504eb5f3cd63ffad15a8cab679e)
- feat: namespace ILab 改为 XLab 以与包名保持一致 [5a42e17](https://github.com/x-9lab/xlab/commit/5a42e173436b6b10f74744d481cd382fdee48f24)
- feat: 支持配置项 root [1158516](https://github.com/x-9lab/xlab/commit/1158516af5e86220e86f7e11f0438aa97fb3bdc4)
- feat: getSysConfig 支持自动推导配置项及返回值类型，补充遗漏的配置项 [698d4a3](https://github.com/x-9lab/xlab/commit/698d4a3e758fee6d37ed3e7bea692e3d45a18553)
- feat: 完善 requireMod 定义，内置模块不再使用 export default 语法 [33f0e60](https://github.com/x-9lab/xlab/commit/33f0e60d4128aa6aa8d97f29ca8674650929420e)
- feat: 增加业务代码 [cc2c3ee](https://github.com/x-9lab/xlab/commit/cc2c3ee31c180481f8005ff2a8ed9ebbf2c50221)

### Chore
- chore: 调整例子及说明 [ef98a66](https://github.com/x-9lab/xlab/commit/ef98a66562892d2ccf1cf6a0171cddd190eaba31)
- chore: 增加例子 [87ae6bc](https://github.com/x-9lab/xlab/commit/87ae6bcf1e6dd0851a061f1da203ee1fcbaac11b)
- chore: 新增 package.json [1072f49](https://github.com/x-9lab/xlab/commit/1072f493683f2dfa6849416f934a44f7ebcaec22)

### Build
- build: 基础工程设置 [b5156d5](https://github.com/x-9lab/xlab/commit/b5156d5884fcf972c839d64e9a1d80a655f5c0e8)

