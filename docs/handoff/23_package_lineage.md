# 23 包血缘

## 一、当前主线

```text
git checkout: main@1aba0da (origin/main)
└── includes #34~#80 after old handoff baseline c2001c9
    └── old handoff baseline: 7.1.0-p1.meta-workbench / c2001c9 / 2026-07-05
```

当前没有新的 full/delta zip 包。后续如果需要 zip 交付，应从 `main@1aba0da` clean checkout 重新打包。

## 二、当前基准角色

| 角色            | 文件名 / 基准                                                         | SHA256                                                             | 验证状态                        | 说明                                  |
| --------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- | ------------------------------------- |
| 最新开发基准    | `not_packaged_git_checkout_main_1aba0da_20260710`                     | pending_external_manifest                                          | BUILD_PASS                      | 当前工作区，直接 typecheck/build 通过 |
| 历史 handoff 包 | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip` | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE | 已过期，只作历史                      |
| 历史源码包      | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`           | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45` | LOCAL_TEST_PASS_BY_USER_MESSAGE | 已被 #34~#80 超越                     |

## 三、判断规则

- 当前接手以 Git `main@1aba0da` 为准。
- 2026-07-05 zip 包不得作为当前代码事实。
- 任何“下一步”必须先核当前源码，而不是沿用旧 handoff 任务名。
- 未跟踪 `.agents/`、`.codex/` 不属于本次包血缘。
