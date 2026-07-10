# 14 数据库与 Migration

## 一、当前前端包

本仓库是前端项目，不包含 Prisma schema 或数据库 migration。

## 二、后端权威

数据库、migration、seed、权限码、角色、组织和业务表均以后端 `srvf-nest-api` 为准。当前已知后端 v0.39.0（2026-07-10）记录 migration 数为 40，且 v0.39.0 本身无 schema / migration 变更（队员档案 `documentNumber`/`mobile` 掩码分级是**值变换,非 schema 变更**;新增 `member-profile.read.sensitive` 为 seed 权限码）。

## 三、前端规则

- 前端不得自行定义数据库结构。
- 前端不得从页面字段反推表结构。
- 涉及字段或 DTO 时查 live `/api/docs-json`。
- 涉及权限码时查后端 seed / OpenAPI summary / current-state。
