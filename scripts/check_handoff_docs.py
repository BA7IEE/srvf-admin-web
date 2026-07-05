#!/usr/bin/env python3
"""
ChatGPT 长期项目开发交接体系自检脚本 V3

用法：
  python scripts/check_handoff_docs.py --root .
  python scripts/check_handoff_docs.py --root . --template
  python scripts/check_handoff_docs.py --root . --strict
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HANDOFF_DOCS = [
    "00_new_chat_start.md",
    "01_current_state.md",
    "02_development_rules.md",
    "03_project_architecture.md",
    "04_business_rules.md",
    "05_testing_and_acceptance.md",
    "06_deployment_and_upgrade.md",
    "07_release_log.md",
    "08_next_steps.md",
    "09_known_issues.md",
    "10_package_manifest.md",
    "11_decision_log.md",
    "12_task_board.md",
    "13_code_map.md",
    "14_database_and_migrations.md",
    "15_api_contracts.md",
    "16_environment_snapshot.md",
    "17_test_evidence.md",
    "18_rollback_and_recovery.md",
    "19_ai_workflow_protocol.md",
    "20_doc_sync_checklist.md",
    "21_security_and_secrets.md",
    "22_dependencies_and_external_services.md",
    "23_package_lineage.md",
    "24_validation_matrix.md",
    "25_operations_runbook.md",
    "26_data_lifecycle_and_delete_policy.md",
    "27_troubleshooting_playbook.md",
    "28_user_feedback_log.md",
    "29_doc_conflict_map.md",
    "30_handoff_self_check.md",
]

REQUIREMENT_DOCS = [
    "feature_scope.md",
    "terminology.md",
    "ui_ux_rules.md",
    "design_system.md",
]

TEMPLATE_DOCS = [
    "chatgpt_long_project_handoff_system_v3.md",
    "new_chat_prompt.md",
    "release_response_template.md",
    "project_init_checklist.md",
]

ROOT_FILES = [
    "README.md",
    "USAGE.md",
    "VERSION",
    "changed_files.txt",
    "project_state.json",
    "project_state.example.json",
]

SECRET_ASSIGNMENT_RE = re.compile(
    r"(?i)\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|db_pass|db_password|jwt_secret|app_key)\b\s*[:=]\s*['\"]?([^'\"\s#]{8,})"
)
PLACEHOLDER_RE = re.compile(r"\{\{[A-Z0-9_\- ]+\}\}")
SHA256_RE = re.compile(r"^[a-fA-F0-9]{64}$")
SENSITIVE_FILE_PATTERNS = [
    re.compile(r"(^|/)\.env($|\.)"),
    re.compile(r".*\.(pem|key|p12|jks)$", re.I),
    re.compile(r"(^|/)keystore\.properties$", re.I),
]
ALLOW_ENV_EXAMPLE = re.compile(r"(^|/)\.env\.example$")


def add_error(errors: list[str], msg: str) -> None:
    errors.append("[ERROR] " + msg)


def add_warning(warnings: list[str], msg: str) -> None:
    warnings.append("[WARN] " + msg)


def is_placeholder(value: object) -> bool:
    return isinstance(value, str) and value.startswith("{{") and value.endswith("}}")


def load_json(path: Path, errors: list[str]) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        add_error(errors, f"JSON 解析失败：{path} -> {exc}")
        return {}


def check_required_files(root: Path, errors: list[str]) -> None:
    for rel in ROOT_FILES:
        if not (root / rel).exists():
            add_error(errors, f"缺少根文件：{rel}")

    for doc in HANDOFF_DOCS:
        rel = f"docs/handoff/{doc}"
        if not (root / rel).exists():
            add_error(errors, f"缺少 handoff 文档：{rel}")

    for doc in REQUIREMENT_DOCS:
        rel = f"docs/requirements/{doc}"
        if not (root / rel).exists():
            add_error(errors, f"缺少 requirements 文档：{rel}")

    for doc in TEMPLATE_DOCS:
        rel = f"docs/templates/{doc}"
        if not (root / rel).exists():
            add_error(errors, f"缺少 templates 文档：{rel}")


def check_project_state(root: Path, template: bool, errors: list[str], warnings: list[str]) -> dict:
    state_path = root / "project_state.json"
    example_path = root / "project_state.example.json"

    if state_path.exists():
        state = load_json(state_path, errors)
    elif template and example_path.exists():
        add_warning(warnings, "模板模式：未找到 project_state.json，改用 project_state.example.json 检查。")
        state = load_json(example_path, errors)
    else:
        add_error(errors, "缺少 project_state.json")
        return {}

    required_keys = [
        "schema_version",
        "project_name",
        "current_version",
        "latest_full_package",
        "latest_delta_package",
        "last_user_confirmed_code_package",
        "change_flags",
        "must_read_docs",
        "next_task",
    ]
    for key in required_keys:
        if key not in state:
            add_error(errors, f"project_state.json 缺少字段：{key}")

    for doc in state.get("must_read_docs", []):
        if not (root / doc).exists():
            add_error(errors, f"project_state.json must_read_docs 指向不存在文件：{doc}")

    for package_key in ["latest_full_package", "latest_delta_package", "last_user_confirmed_code_package"]:
        item = state.get(package_key)
        if not isinstance(item, dict):
            continue
        sha = item.get("sha256")
        if sha and not is_placeholder(sha) and sha not in {"pending", "PENDING", "", "unknown_not_in_current_upload", "pending_external_manifest"} and not SHA256_RE.match(str(sha)):
            add_warning(warnings, f"{package_key}.sha256 不是标准 64 位 SHA256：{sha}")

    return state


def check_changed_files(root: Path, warnings: list[str]) -> None:
    path = root / "changed_files.txt"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8", errors="ignore")
    must_mentions = [
        "docs/handoff/01_current_state.md",
        "docs/handoff/07_release_log.md",
        "docs/handoff/08_next_steps.md",
        "docs/handoff/10_package_manifest.md",
    ]
    for item in must_mentions:
        if item not in text:
            add_warning(warnings, f"changed_files.txt 未包含常规必更文档：{item}")


def is_vite_public_env(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return False
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key = line.split("=", 1)[0].strip()
        if key and not key.startswith("VITE_") and key != "NODE_ENV":
            return False
    return True


def check_sensitive_files(root: Path, errors: list[str], warnings: list[str]) -> None:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if ALLOW_ENV_EXAMPLE.search(rel):
            continue
        if re.match(r"(^|/)\.env($|\.)", rel):
            if is_vite_public_env(path):
                continue
        for pattern in SENSITIVE_FILE_PATTERNS:
            if pattern.match(rel):
                add_error(errors, f"发现疑似敏感文件，禁止打包：{rel}")
                break


def check_text_security(root: Path, template: bool, errors: list[str], warnings: list[str]) -> None:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(root).as_posix()
        if path.suffix.lower() not in {".md", ".txt", ".json", ".env", ".example", ""}:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        if not template and not rel.startswith("docs/templates/"):
            placeholders = PLACEHOLDER_RE.findall(text)
            if placeholders:
                add_warning(warnings, f"存在未替换占位符：{rel}，数量 {len(placeholders)}")

        for idx, line in enumerate(text.splitlines(), start=1):
            if "{{" in line and "}}" in line:
                continue
            stripped = line.strip()
            if stripped.startswith("def ") or stripped.startswith("async def "):
                continue
            match = SECRET_ASSIGNMENT_RE.search(line)
            if not match:
                continue
            value = match.group(2)
            lower_value = value.lower()
            allowed_values = {"changeme", "example", "example_value", "your_value", "pending", "placeholder"}
            if lower_value in allowed_values or lower_value.startswith("xxx") or lower_value.startswith("your_"):
                continue
            add_warning(warnings, f"疑似敏感赋值：{rel}:{idx} -> {match.group(1)}")

        private_key_re = re.compile(r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----")
        if private_key_re.search(text):
            add_error(errors, f"发现疑似私钥内容：{rel}")


def check_package_manifest_consistency(root: Path, state: dict, warnings: list[str]) -> None:
    manifest = root / "docs/handoff/10_package_manifest.md"
    if not manifest.exists() or not state:
        return
    text = manifest.read_text(encoding="utf-8", errors="ignore")
    latest_full = state.get("latest_full_package", {}).get("filename") if isinstance(state.get("latest_full_package"), dict) else None
    if latest_full and not is_placeholder(latest_full) and latest_full not in text:
        add_warning(warnings, f"latest_full_package 未出现在 10_package_manifest.md：{latest_full}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="项目根目录")
    parser.add_argument("--template", action="store_true", help="模板模式：允许占位符存在")
    parser.add_argument("--strict", action="store_true", help="严格模式：警告也视为失败")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors: list[str] = []
    warnings: list[str] = []

    if not root.exists():
        print(f"[ERROR] 根目录不存在：{root}")
        return 1

    check_required_files(root, errors)
    state = check_project_state(root, args.template, errors, warnings)
    check_changed_files(root, warnings)
    check_sensitive_files(root, errors, warnings)
    check_text_security(root, args.template, errors, warnings)
    check_package_manifest_consistency(root, state, warnings)

    print("ChatGPT 长期项目开发交接体系自检 V3")
    print(f"Root: {root}")
    print(f"Mode: {'template' if args.template else 'project'}")
    print()

    for msg in warnings:
        print(msg)
    for msg in errors:
        print(msg)

    print()
    print(f"Summary: {len(errors)} error(s), {len(warnings)} warning(s)")

    if errors:
        return 1
    if warnings and args.strict:
        return 2

    print("[PASS] handoff self-check completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
