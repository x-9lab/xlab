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

