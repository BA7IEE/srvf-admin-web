# 23 包血缘

## 一、当前主线

```text
srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip (validation_docs full, LOCAL_TEST_PASS, 最新交接基准)
└── source_code_same_as: srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip (code_patch full, 用户本地验证通过, sha256 67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45)
    └── based_on: srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip (validation_docs full; 代码等同已验证 P0 包, sha256 3a65602b83c056ac419a4f091d05b53760ba23d2dd6f61db8bf0ed8020796613)
        └── based_on: srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip (code_patch full, 用户本地验证通过)
```

```text
srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip (validation_docs delta, LOCAL_TEST_PASS, 仅验证文档同步)
└── based_on: srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip
```

## 二、当前包角色

| 角色                  | 文件名                                                                 | SHA256                                                             | 验证状态                         | 说明                                                                                                     |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 最新 validated 完整包 | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_full_20260705.zip`  | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 下一轮开发建议基准；源码等同 `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`，文档状态已同步 |
| 最新 validated 增量包 | `srvf-admin-web_v7.1.0-p1.meta-workbench_validated_delta_20260705.zip` | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_MESSAGE  | 仅验证状态文档同步，无源码改动                                                                           |
| 已验证代码完整包      | `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip`            | `67a4ba7c3d18b283aa3381acf627b7dd037c5199230076a8335abfc9bbdd8b45` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | P1.1 meta-workbench 源码包，用户本地验证通过                                                             |
| 已验证代码增量包      | `srvf-admin-web_v7.1.0-p1.meta-workbench_delta_20260705.zip`           | `da7af2023316445c327ac45370030008102b76ebbb132025078a94c6eed50186` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | P1.1 源码增量包，用户本地验证通过                                                                        |
| 上一验证完整包        | `srvf-admin-web_v7.0.1-p0.routes_validated_full_20260705.zip`          | pending_external_manifest                                          | LOCAL_TEST_PASS_BY_USER_RECORDED | P0 验证文档同步包                                                                                        |
| P0 代码完整包         | `srvf-admin-web_v7.0.1-p0.routes_full_20260705.zip`                    | `381edec9e2ddf19656b5f24e8a9e9f5946f36ebea3ce45a8281f9ea0803fb439` | LOCAL_TEST_PASS_BY_USER_MESSAGE  | P0 路由补丁源码包                                                                                        |

## 三、判断规则

- “最新 validated 完整包”是下一轮最推荐基准，因为源码和 handoff 状态一致。
- “已验证代码完整包”是用户实际运行验证的源码包。
- 本次 validated 包只同步验证文档；如果后续发现源码差异，应先与 `srvf-admin-web_v7.1.0-p1.meta-workbench_full_20260705.zip` 比对。
- 不得把历史 `v7.8.0_scoped-authz-browser-smoke` 自动并入当前主线，除非完成文件/commit 血缘核对。
