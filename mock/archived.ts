/**
 * mock/ 曾是起始模板自带的 vite-plugin-fake-server demo 数据（登录 / 刷新令牌 /
 * 字典树 / 租户列表 / 异步路由菜单，全部 admin/common 角色 + *:*:* 式权限码，
 * demo-only，从未对应真实后端）。real 登录已直连 `/api/auth/v1/login`（PR-4），
 * `build/plugins.ts` 里 `vitePluginFakeServer` 也仅 `enableProd: false`（生产环境
 * 本就不启用）——Phase 0-b 清理已将 demo 内容归档，此处只留一个零路由的空定义。
 *
 * 本文件是有意保留的占位：package.json 的 lint:eslint 脚本硬编码 "mock" 目录
 * 参数、tsconfig.json 的 include 硬编码 "mock/*.ts"、`build/plugins.ts` 的
 * `vitePluginFakeServer({ include: "mock" })` 会扫描并加载本目录下每个文件——
 * 三者均在 .claude/settings.json deny 列表中不可编辑，若把目录删空或留空导出会
 * 分别导致 `pnpm lint` 报错 / dev server 打印 "failed to load module"。原始 4 个
 * demo 文件内容见本次清理提交之前的 git 历史。
 */
import { defineFakeRoute } from "vite-plugin-fake-server/client";

export default defineFakeRoute([]);
