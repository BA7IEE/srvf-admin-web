# 10 包清单

| 时间                                        | 类型  | 文件名                                                                 | SHA256                                                             | 验证状态                         | 是否最新     | 说明                                                                                                          |
| ------------------------------------------- | ----- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------- |
| 2026-07-05 P1 validation sync               | full  | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`  | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 是           | 完整项目 + P1.1 源码 + 本地验证文档同步；源码等同 `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip` |
| 2026-07-05 P1 validation sync               | delta | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip` | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 是           | 仅本次验证状态文档同步，无源码改动                                                                            |
| 2026-07-05 P1 development                   | full  | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`            | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 源码基准     | P1.1 meta-workbench 源码包；用户本地验证通过                                                                  |
| 2026-07-05 P1 development                   | delta | `srvf-admin-web_v7.1.0-p1.meta-workbench_delta_20260705.zip`           | `da7af2023316445c327ac45370030008102b76ebbb132025078a94c6eed50186` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 源码增量基准 | P1.1 源码与 handoff 增量；用户本地验证通过                                                                    |
| 2026-07-05 user local validation report     | full  | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`          | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_RECORDED | 否           | P0 路由补丁验证文档同步；源码等同 `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip`                         |
| 2026-07-05 07:52 EDT / 2026-07-05 19:52 CST | full  | `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip`                    | `381edec9e2ddf19656b5f24e8a9e9f5946f36ebea3ce45a8281f9ea0803fb439` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 否           | 完整项目 + P0 路由补丁；用户本地 typecheck/build/dev/登录/刷新验证通过                                        |

## 当前结论

- 最新完整包：`srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`。
- 最新增量包：`srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip`。
- 当前已验证代码基准：`srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`。
- 下一轮应基于 validated 完整包继续，以保证 handoff 与验证状态一致。
