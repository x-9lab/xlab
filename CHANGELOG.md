## v1.5.4

### Feat
- feat: 定时任务现在默认只会在 master 进程上开启, 如 worker 上也想要执行, 需要将 enableWorkerCron 改为 true [d2032f0](https://github.com/x-9lab/xlab/commit/d2032f05163e638d82f482565ca6d68f2552fca6)
- feat: 修改定时任务的 getDelay 与 enable 的判断方法 [21c233d](https://github.com/x-9lab/xlab/commit/21c233d14ec6948a2025df8de5eeffefa84901ec)
- feat: config 支持定时任务配置 [6a33e62](https://github.com/x-9lab/xlab/commit/6a33e6216dad9171362e6ea5ad92ca61756df1f1)
- feat: uncaughtException 与 unhandledRejection 现在会输出 message [0be80c6](https://github.com/x-9lab/xlab/commit/0be80c63b68bb56e972032bd7a8c5940d6d835bf)
- feat: 接口声明增加 ignoreApiNameCheck 字段, 支持不已 /api 开始的接口 [c5538f4](https://github.com/x-9lab/xlab/commit/c5538f4b6d2921c387c94a6d208d2eb043c07bf2)

### Fix
- fix: 修正错误信息没有被正常打印的问题 [0e9b84f](https://github.com/x-9lab/xlab/commit/0e9b84fa09101089cee56fed34e9a70cefdb96ec)
- fix: 修复定时任务的时间间隔及其他方法不可用的问题 [840d694](https://github.com/x-9lab/xlab/commit/840d694200baf4253f1174b40e979bcfe29a9754)

### Chore
- chore: 修改提示格式 [cedfcce](https://github.com/x-9lab/xlab/commit/cedfcced6331af7354d1626a65e719b19a02a597)

## v1.5.2

### Chore
- chore: 删除无用的默认配置 [92f6aca](https://github.com/x-9lab/xlab/commit/92f6aca9d61a343da991d986374bf807905177b5)
- chore: 增加废弃声明，修改log输出方式 [138c52c](https://github.com/x-9lab/xlab/commit/138c52c9f2c493782c783dbe000fab23ea35fa2c)

### Fix
- fix: 修复定时任务加载出错问题 [a439cfe](https://github.com/x-9lab/xlab/commit/a439cfed0477c7be9ad03014b947867e4a3a2eb7)
- fix: 修复 custom 加载不能正确提示异常信息的问题 [ec82504](https://github.com/x-9lab/xlab/commit/ec82504ab0c0b834c8e1fa9ded535be42261b6e5)
- fix: 修复内部 api 目录不存在导致的异常 [c06a5bf](https://github.com/x-9lab/xlab/commit/c06a5bf2bbea8817873553ed001a0cd946e028e6)

### Feat
- feat: 完善定时任务异常捕获机制, 增加任务执行锁 [ad034c3](https://github.com/x-9lab/xlab/commit/ad034c3b10b8a6bca8e67dc107c8d08e79b7252f)
- feat: common 增加 md5 方法 [0daa4d5](https://github.com/x-9lab/xlab/commit/0daa4d5fc9d8b76d195c2ca41c0510bd05ec535f)
- feat: 不再内置 utils/cookie 接口 [7984abb](https://github.com/x-9lab/xlab/commit/7984abb112f07d3aa3b30e73084eeadd1160ba87)
- feat: 支持 timezone 设置 [08e91e0](https://github.com/x-9lab/xlab/commit/08e91e0c53063bb767a09d5fdec9cf4554bd084d)
- feat: 去除与基本功能无关的内部组件, 这些组件将以外部组件的形式存在 [79764c0](https://github.com/x-9lab/xlab/commit/79764c011d258d26673a65ae77cfe529199b03a9)
- feat: 正式去除对老版本中间件声明的支持 [9950f31](https://github.com/x-9lab/xlab/commit/9950f31e0409ea396f45148ad80b6b8800d6c807)
- feat: 修改版本号，删除无用代码 [9ac65bb](https://github.com/x-9lab/xlab/commit/9ac65bbb62aceedac568962485858e0ac030d3fd)

## v1.5.0

### Fix
- fix: 修复内部 api 目录不存在导致的异常 [be5fc0e](https://github.com/x-9lab/xlab/commit/be5fc0e3915486edf44e5cf776255e1d26e09c70)

### Feat
- feat: 不再内置 utils/cookie 接口 [a7df043](https://github.com/x-9lab/xlab/commit/a7df043e07a110e0f83fd44815ebe7391a85c745)
- feat: 支持 timezone 设置 [6d7ac6c](https://github.com/x-9lab/xlab/commit/6d7ac6cc727d4048f62e14a9b9ce820872cca2c3)
- feat: 去除与基本功能无关的内部组件, 这些组件将以外部组件的形式存在 [01d9068](https://github.com/x-9lab/xlab/commit/01d90688841b383af19197ccfd968c7038bbce9d)
- feat: 正式去除对老版本中间件声明的支持 [7211fa4](https://github.com/x-9lab/xlab/commit/7211fa49a12dfc5323d27149400c0c5741959c26)
- feat: 修改版本号，删除无用代码 [9a22319](https://github.com/x-9lab/xlab/commit/9a22319f019388b1f0509af11cf266eafae26791)

### Chore
- chore: 增加废弃声明，修改log输出方式 [62783c0](https://github.com/x-9lab/xlab/commit/62783c0945205987deecc74f99d071281c0ef39c)

## v1.4.1

### Fix
- fix: 修复路由中间件加载异常的问题 [83a26b6](https://github.com/x-9lab/xlab/commit/83a26b608712bc503a97bfba156700221c98ac19)

## v1.4.0

### Fix
- fix: 修复路由模块加载目录中间件逻辑 [be8754e](https://github.com/x-9lab/xlab/commit/be8754e82be55e174bb0adc9bdb65fb53d77ad8d)

## v1.3.1

### Feat
- feat: 增加跨域信息头 [3337605](https://github.com/x-9lab/xlab/commit/3337605fa74c59a738fff426428aa21ce93861e9)
- feat: 静态文件服务支持跨域 [4fc678c](https://github.com/x-9lab/xlab/commit/4fc678ca7fe58da945a966ce82b2768802baef9a)

## v1.2.1

### Fix
- fix: 修复异常信息显示不完整的问题 [c96e03b](https://github.com/x-9lab/xlab/commit/c96e03b5f77f189aa83ca6b8e4b581b2e26d7faf)
- fix: 修复 node-fetch 不可用的问题 [dd32832](https://github.com/x-9lab/xlab/commit/dd32832de528d0f599c1fc20c06544e68c86df70)
- fix: 修复 injection 模块替换逻辑错误 [862f309](https://github.com/x-9lab/xlab/commit/862f3091cb625b80364366296e17a3438fb9a8ed)

### Feat
- feat:业务 api 文件夹支持接口级别通用中间件定义 [3fd2507](https://github.com/x-9lab/xlab/commit/3fd2507cea51bc5578ad6d97ae8abee3f9a41331)

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

