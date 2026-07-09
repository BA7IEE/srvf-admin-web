# 10 包清单

| 时间       | 类型         | 文件名 / 基准                                                          | SHA256                                                             | 验证状态                        | 是否最新 | 说明                                                           |
| ---------- | ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------- | -------- | -------------------------------------------------------------- |
| 2026-07-10 | git-checkout | `not_packaged_git_checkout_main_1aba0da_20260710`                      | pending_external_manifest                                          | BUILD_PASS                      | 是       | 当前真实工作基准；未重新打包，使用 Git checkout `main@1aba0da` |
| 2026-07-05 | full         | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`  | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE | 否       | 历史 handoff 基准，已被 #34~#80 超越                           |
| 2026-07-05 | delta        | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip` | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE | 否       | 历史验证文档同步包                                             |
| 2026-07-05 | full         | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`            | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45` | LOCAL_TEST_PASS_BY_USER_MESSAGE | 否       | P1.1 meta-workbench 源码包                                     |

## 当前结论

- 当前最新基准不是 zip 包，而是 Git `main@1aba0da`。
- 本次未创建 full/delta 包；如要交付 zip，应由后续任务基于 clean checkout 重新打包并生成外部 SHA256。
- 2026-07-05 的 validated 包只作历史血缘，不可作为当前下一步开发入口。
