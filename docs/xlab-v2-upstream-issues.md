# xlab v2.0.0 升级反馈 — 转交 xlab 负责团队

Gaia 全仓 12 个服务/前端包已完成 v1.6.1 → v2.0.0 升级（逐包做了 v1/v2 路由清单 diff 与接口回归）。整体迁移顺畅，MIGRATION.md 步骤覆盖面准确。以下是过程中发现的问题与建议，按优先级排列。

- 环境：`@x-9lab/xlab@2.0.0`（registry 正式版）、Node v22.17.0、macOS（darwin 25.5，本地 dev 验证）
- 反馈时间：2026-08-05

## 一、Bug：cluster master 单收 SIGINT 不级联 worker（优先处理）

**现象**（多次复现，moon / tailwind / saga 验证过程中均出现）：

- 对 master 进程（processTitle 为 `XLab`）单独发送 `SIGINT`：master 自身退出，但 **worker 不退出**，ppid 变为 1 成为孤儿进程，继续监听端口对外服务。
- 反向操作（只杀 worker）时 master 的自动拉起机制正常——worker 被 SIGINT 后 master 会重启新 worker。
- worker **单独**收到 SIGINT 时优雅退出流程本身是好的：日志正常输出 `Shutting down (pid ...)`，停任务→等在途→退出。

**期望**：master 收到 SIGINT/SIGTERM 后应先通知全部 worker 走优雅退出流程，等待（或超时强杀）后自身再退出。

**影响**：生产环境 pm2 / k8s / systemd 通常只对主进程发信号。按当前行为，重启或发布时会残留旧 worker 占着端口——新实例起不来，或流量继续打到旧代码。本地终端 Ctrl+C 因信号发给整个前台进程组，恰好掩盖了这个问题，所以日常开发不容易发现。

**本地复现步骤**：

```bash
cd packages/moon && yarn start-dev            # cluster 模式起服务
ps -ax -o pid,command | awk '$2=="XLab"'      # 找到 master PID
kill -INT <master_pid>
sleep 2
lsof -nP -i :5002 -sTCP:LISTEN                # worker 仍在监听, ppid 已变 1
```

## 二、疑似问题：watch 模式下 boot 失败进程不退出并抢占端口

**现象**：dev（watch 开启）下若 boot 失败（例如命中「数组路由已移除」报错），进程不退出而是停留监视；源码重建后它会自动重启并抢占端口。此时若使用者以为进程已死、手动再起一个新实例，两个实例会互踩（后者 EADDRINUSE，或两份日志写花）。

**建议**：若"失败后驻留 watch"是有意设计，请在 boot 失败日志后追加一行明确提示（如"进程保持 watch,修复代码后将自动重启"）；否则建议 boot 失败直接退出。

## 三、部署默认值：需要官方指导写进文档

1. **`shutdownTimeout` 默认 10s**：部署侧 `kill_timeout`（pm2）/ `terminationGracePeriodSeconds`（k8s）必须大于该值，否则优雅退出会被强杀。建议在 MIGRATION / 部署文档中给出推荐搭配值（例如 kill timeout ≥ shutdownTimeout + 5s）。
2. **worker 崩溃退避**（10s 内连崩 5 次不再拉起）：此前依赖"无限重启"兜底的业务失去兜底后需要感知能力。建议提供退避触发时的事件钩子，或在文档中明确该场景的日志关键字，方便业务侧接告警。

## 四、MIGRATION.md 补充建议

- 第 2 步的全局 API grep 与第 3 步的数组路由排查建议补充 **CommonJS 写法**：`module.exports = [`。实战在 saga 抓到一个 CJS 数组路由（`bonbons/cargos/1.0.0/download/:code`），只搜 `export default [` 会漏掉，直到启动报错才暴露。
- 可补一句：混装期（monorepo 部分包 v1、部分包 v2）根 node_modules 的提升版本会随多数派翻转，v1/v2 全局类型声明并存时 tsc 会有 node_modules 内的重复标识符噪音，属预期现象。

## 五、已确认非问题（供参考）

- registry 正式版 2.0.0 的日志时间戳为空格分隔（与 v1 一致）。早期内测 tgz 中出现过的 `T` 分隔符在正式版中已不存在，日志采集无需改动。
- v2 的 `requireMod` / `getLogger` 不依赖框架 boot 状态即可独立使用——这让共享库（如 hives）直迁 v2 显式导入非常顺畅，混装过渡期也能安全加载。这个特性建议在文档里明示，共享库迁移会更有底。

---

## 处理记录（xlab 团队，2026-08-05）

| 条目 | 结论 | 处理 |
|-|-|-|
| 一、SIGINT 不级联 | **已修复**。根因澄清：残留的三个进程是 cluster master + workers 整棵树；被 SIGINT 杀掉的「XLab」进程是 **watch 守护进程**（processTitle 为 XLab 的只有它）。watch 守护此前只监听 SIGTERM 且转发条件 `childProcess.connected` 恒为 false——转发从未生效过（v1 起即如此）。非 watch 部署（生产）下 master 收 SIGTERM/SIGINT 的级联是正常的，有测试覆盖 | watch 守护现同时监听 SIGINT/SIGTERM，转发后等待业务进程退出（30s 兜底强杀）再退出；另新增 worker 孤儿防护：master 被强杀（SIGKILL 等）导致 IPC 断开时 worker 自行优雅退出。两个场景均已固化为测试 |
| 二、watch 下 boot 失败驻留 | 有意设计（与 nodemon 行为一致，改代码即自动重启） | 崩溃后追加明确提示日志「watch 保持运行, 修复代码保存后将自动重启」 |
| 三、部署默认值 | 采纳 | MIGRATION 已补：kill timeout 推荐 ≥ `shutdownTimeout + 5s`；退避触发的告警关键字为 `停止自动拉起` |
| 四、MIGRATION 补充 | 采纳 | 数组路由排查命令改为同时覆盖 CJS/ESM 写法；补充 monorepo 混装期 tsc 噪音说明 |
| 五、共享库特性明示 | 采纳 | README 与 MIGRATION FAQ 已明示，并补充 `getSysConfig` / `getXlabEnv` 数据需 boot 后读取的注意点 |
