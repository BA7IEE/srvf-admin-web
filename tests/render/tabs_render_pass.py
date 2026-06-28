#!/usr/bin/env python3
"""
el-tabs 默认 tab 内容区渲染回归 (Playwright render pass)
=======================================================

为什么存在：Element Plus 的 <el-tabs> 在 **没有 v-model / default-value** 时，内部
currentName 默认取 "0"（见 element-plus tabs.mjs）。我们所有 tab-pane 都带具名
`name`（"storage"/"type"/"certificates"…），"0" 与任何具名 pane 都不匹配 →
每个 pane 被 `v-show` 置 display:none → 首屏只剩 tab 头、内容区空白，必须手点一下
tab 才显示。修复方式：每个 <el-tabs> 显式 `v-model="activeTab"` 且把 activeTab
初始化为第一个「可见/有权限」的 pane。

这个脚本就是这条修复的回归用例。它在 **不点任何 tab** 的前提下逐页断言：
  1) `.el-tabs__content` 里至少有 1 个「可见」的 .el-tab-pane   —— 反 bug 核心
     （bug 态 visible_panes=0；修复态 >=1）
  2) 该可见 pane 内部有「可见的表格 / 表单」                    —— 内容区/表格 真渲染
  3) 能取到干净文本标记时，断言关键文本可见                      —— 关键文本
只看 tab 头不会触发 (2)(3)，所以本用例对该 bug 有「牙齿」。

不是 CI 门禁：依赖本地已起的 dev server + 后端 + seed。它是本地冒烟回归工具。
不进 package.json：用 uv 跑临时 Playwright 环境（仓库禁止新增 JS 依赖）。

运行：
    # 需先起 dev server（pnpm dev，默认 :8848）与后端（:3000）
    uv run --with playwright python tests/render/tabs_render_pass.py

可用环境变量覆盖：
    RP_BASE  前端地址（默认 http://localhost:8848）
    RP_API   后端地址（默认 http://localhost:3000）
    RP_USER / RP_PWD  登录账号/口令（默认仓库 dev 默认，见 docs/srvf-api-integration-guide.md §8）
"""
import json
import os
import sys
import urllib.request

BASE = os.environ.get("RP_BASE", "http://localhost:8848")  # 前端 dev server
API = os.environ.get("RP_API", "http://localhost:3000")    # 后端
USER = os.environ.get("RP_USER", "admin")                  # 仓库 dev 默认（integration-guide §8）
PWD = os.environ.get("RP_PWD", "ChangeMe123456")


# ----------------------------- 后端：登录 + 取实体 id -----------------------------
def api_login():
    body = json.dumps({"username": USER, "password": PWD}).encode()
    req = urllib.request.Request(
        API + "/api/auth/v1/login", data=body,
        headers={"Content-Type": "application/json"}, method="POST")
    d = json.load(urllib.request.urlopen(req, timeout=10))
    tok = (d.get("data") or d).get("accessToken")
    if not tok:
        raise RuntimeError(f"登录失败：{d}")
    return tok


def api_first_id(token, path):
    """取列表第一条的 id；列表空 / 出错 → None（对应用例 SKIP）。"""
    try:
        req = urllib.request.Request(
            API + path, headers={"Authorization": "Bearer " + token}, method="GET")
        d = json.load(urllib.request.urlopen(req, timeout=10))
        dd = d.get("data", d)
        items = dd.get("items") if isinstance(dd, dict) else (dd if isinstance(dd, list) else None)
        return items[0]["id"] if items else None
    except Exception:
        return None


# ----------------------------- 前端：渲染断言 -----------------------------
def login(page):
    page.goto(BASE + "/#/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("账号").fill(USER)
    page.get_by_placeholder("密码").fill(PWD)
    page.get_by_role("button", name="登录").click()
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
    page.wait_for_load_state("networkidle")


def check(page, net, idx, label, hashpath, marker, shot_dir):
    net.clear()
    # cache-buster query 强制整页重载；hash 再驱动路由（hash 路由模式）
    page.goto(f"{BASE}/?rp={idx}#/{hashpath}", wait_until="networkidle")
    safe = label.split("·")[0]
    try:
        # state=attached：无论可见与否都先找到 pane（bug 态全是 display:none），
        # 这样能用数字 visible_panes 区分 bug(0) / 修复(>=1)。
        page.wait_for_selector(".el-tabs__content .el-tab-pane", state="attached", timeout=15000)
        page.wait_for_timeout(800)  # 等 v-show + 数据稳定
    except Exception:
        if shot_dir:
            page.screenshot(path=f"{shot_dir}/render_{safe}.png", full_page=True)
        return False, "el-tab-pane 未挂载（疑似权限门/加载失败/路由未命中）"

    if shot_dir:
        page.screenshot(path=f"{shot_dir}/render_{safe}.png", full_page=True)

    visible_panes = page.locator(".el-tabs__content .el-tab-pane:visible").count()
    content = page.locator(
        ".el-tabs__content .el-tab-pane:visible .el-table, "
        ".el-tabs__content .el-tab-pane:visible .el-form")
    content_visible = content.count() > 0 and content.first.is_visible()

    marker_visible = None
    if marker:
        m = page.get_by_text(marker, exact=False)
        marker_visible = m.count() > 0 and m.first.is_visible()

    fourxx = [(s, u) for s, u in net if 400 <= s < 600 and "/api/" in u]
    ok = visible_panes >= 1 and content_visible and (marker is None or marker_visible)
    detail = f"visible_panes={visible_panes} content(表格/表单)visible={content_visible}"
    if marker:
        detail += f" 文本『{marker}』visible={marker_visible}"
    if fourxx:
        detail += f"  ⚠️api4xx/5xx={len(fourxx)}:" + ",".join(
            f"{s}/{u.split('/api/')[-1][:24]}" for s, u in fourxx[:3])
    return ok, detail


def main():
    from playwright.sync_api import sync_playwright

    token = api_login()
    member_id = api_first_id(token, "/api/admin/v1/members?page=1&pageSize=1")
    recruit_id = api_first_id(token, "/api/admin/v1/recruitment/cycles?page=1&pageSize=1")
    teamjoin_id = api_first_id(token, "/api/admin/v1/team-join/cycles?page=1&pageSize=1")

    # (label, hashpath | None=skip, content-only 文本标记 | None=与 tab 头冲突，仅靠表格断言)
    cases = [
        ("系统设置·存储",       "srvf/system/settings",                              "Bucket"),
        ("附件配置·类型配置",   "srvf/system/attachment-config",                     "附件类型配置"),
        ("队员作战室·证书",     f"srvf/members-domain/members/{member_id}" if member_id else None, "队员证书"),
        ("招新作战室·报名审核", f"srvf/recruitment-domain/cycles/{recruit_id}" if recruit_id else None, None),
        ("入队作战室·入队申请", f"srvf/recruitment-domain/team-join/{teamjoin_id}" if teamjoin_id else None, None),
    ]

    shot_dir = os.environ.get("RP_SHOT_DIR")  # 设置则落截图，便于排查
    page_errors, rows = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        net = []
        page.on("response", lambda r: net.append((r.status, r.url)))
        login(page)
        landed = page.url
        for i, (label, hp, marker) in enumerate(cases):
            if hp is None:
                rows.append((label, None, "SKIP（本地无该实体数据，先建一条再跑）"))
                continue
            try:
                ok, detail = check(page, net, i, label, hp, marker, shot_dir)
            except Exception as e:
                ok, detail = False, f"EXCEPTION {type(e).__name__}: {e}"
            rows.append((label, ok, detail))
        browser.close()

    print(f"\nlogin landed: {landed}")
    for e in page_errors[:6]:
        print(f"  ❗ pageerror: {e[:130]}")
    print("=" * 80)
    failed = 0
    for label, ok, detail in rows:
        tag = "SKIP" if ok is None else ("PASS" if ok else "FAIL")
        if ok is False:
            failed += 1
        print(f"  [{tag}] {label:20} {detail}")
    print("=" * 80)
    print("RESULT:", "ALL PASS ✅" if failed == 0 else f"{failed} FAILED ❌")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
