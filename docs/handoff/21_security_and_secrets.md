# 21 安全与密钥

## 一、当前检查结论

本轮未发现真实 API Key、数据库密码、私钥、证书、token 写入新增文档。

## 二、`.env*` 说明

当前前端包已有 `.env`、`.env.development`、`.env.production`、`.env.staging`，内容为 Vite 公共配置，例如端口、public path、router history、CDN、compression。当前未包含密钥。

## 三、禁止事项

- 不要把后端 `.env` 写入前端文档。
- 不要把 JWT secret、数据库 URL、微信密钥、短信密钥写入仓库。
- 不要把用户隐私数据写入测试截图或日志。
- 交付包不得包含 `.git`、`node_modules`、真实证书、缓存文件。

## 四、自检建议

```bash
python scripts/check_handoff_docs.py --root .
rg -n "(password|secret|token|api[_-]?key|private[_-]?key|DATABASE_URL|JWT_SECRET)" docs README.md AGENTS.md CLAUDE.md project_state.json
```

命中后人工确认是否为示例占位符或真实敏感值。
