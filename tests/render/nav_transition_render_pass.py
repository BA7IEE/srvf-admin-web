#!/usr/bin/env python3
"""
站内跳转（router.push）白屏回归 (Playwright render pass)
======================================================

为什么存在：`src/layout/components/lay-content/index.vue` 把 router-view 套在
`<Transition mode="out-in" appear>` 里。Vue 的 CSS 过渡靠 `nextFrame()`（**双
requestAnimationFrame**）补 `*-enter-to` / `*-leave-to` 并收尾，而浏览器在
**页面不可见**（后台标签页 / 自动化浏览器；本仓的 in-app Browser pane 是恒定隐藏）时
挂起 rAF → enter/leave 的 done 永不触发。`mode:"out-in"` 又要等离场结束才挂载新页面，
于是：

  * 站内 `router.push` → **新页面根本不挂载**，DOM 里只剩上一页，且被
    `fade-transform-enter-from / -leave-from / -leave-active` 压成 `opacity:0`；
    一旦卡住，之后每一次跳转都卡住。
  * 整页重载「看着像好了」——重载没有离场元素，组件确实挂上了，但 appear 同样卡住 →
    **DOM 探针全绿而实际 opacity:0**（截图发白的真凶）。

修复：`transitionMain.render()` 在 `document.hidden` 时直接返回 slot，不套
`<Transition>`。注意只把 `css` 关掉不够——`css:false` + `mode:"out-in"` 会让 Vue 在
patch 中途重入 `update()`，抛 `Cannot read properties of null (reading 'nextSibling'
/ 'subTree')`。

这个脚本就是这条修复的回归用例：

  A 可见态点「档案」进队员作战室 → 必须渲染，且过渡 class 收尾干净（动画照旧生效）
  B **隐藏态**点「档案」        → 必须渲染（修复前 = 0 个 tab 头、opacity:0 白屏）
  C 隐藏态整页加载作战室 URL     → 必须渲染且 opacity 不被压成 0

隐藏态必须**同时**伪造 `document.hidden` / `visibilityState` **和**把
`requestAnimationFrame` 打成空实现——只做其中一样都复现不出来。

不是 CI 门禁：依赖本地已起的 dev server + 后端 + seed。不进 package.json：用 uv 跑
临时 Playwright 环境（仓库禁止新增 JS 依赖）。

运行：
    # 需先起 dev server（pnpm dev，默认 :8848）与后端（:3000）
    uv run --with playwright python tests/render/nav_transition_render_pass.py

可用环境变量覆盖：
    RP_BASE  前端地址（默认 http://localhost:8848）
    RP_USER / RP_PWD  登录账号/口令（默认仓库 dev 默认，见后端仓 docs §8）
    RP_HEADED=1  显形跑（排查用）
"""
import json
import os
import sys

BASE = os.environ.get("RP_BASE", "http://localhost:8848")
USER = os.environ.get("RP_USER", "admin")
PWD = os.environ.get("RP_PWD", "ChangeMe123456")
LIST = "/srvf/members-domain/members"

# 忠实模拟后台标签页：document.hidden=true 且 rAF 登记后永不回调
HIDE_TAB = """
Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
Object.defineProperty(document, 'visibilityState',
                      { get: () => 'hidden', configurable: true });
window.requestAnimationFrame = () => 0;
"""


def login(page):
    page.goto(BASE + "/#/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("账号").fill(USER)
    page.get_by_placeholder("密码").fill(PWD)
    page.get_by_role("button", name="登录").click()
    page.wait_for_url(lambda u: "/login" not in u, timeout=15000)
    page.wait_for_load_state("networkidle")


def probe(page):
    """一次取全：tab 头数 / 可见 pane 数 / .main-content 的 class 与实际 opacity。"""
    return page.evaluate("""() => {
      const mc = document.querySelector('.main-content');
      return {
        tabs: document.querySelectorAll('.el-tabs__item').length,
        visible_panes: [...document.querySelectorAll('.el-tabs__content .el-tab-pane')]
            .filter(p => getComputedStyle(p).display !== 'none').length,
        cls: mc ? mc.className : null,
        opacity: mc ? Number(getComputedStyle(mc).opacity) : null,
        hidden: document.hidden,
      };
    }""")


def open_first_member(page):
    """点第一行的「档案」按钮走站内跳转。

    必须锚定 `tbody tr`：el-table 会把每个列插槽以空 scope 预渲染一份到
    `div.hidden-columns` 里，全局找「档案」会抓到那个幽灵按钮。
    """
    page.locator(".el-table tbody tr").first.get_by_role(
        "button", name="档案").click()


def goto_list(page, tag):
    """cache-buster query 强制整页重载；hash 再驱动路由（hash 路由模式）。"""
    page.goto(f"{BASE}/?nav={tag}#{LIST}", wait_until="networkidle")
    page.wait_for_selector(".el-table tbody tr", timeout=15000)
    page.wait_for_timeout(700)


def main():
    from playwright.sync_api import sync_playwright

    headless = os.environ.get("RP_HEADED") != "1"
    errors, rows = [], []
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=headless)
        except Exception:
            # 本机没下过 playwright 自带 chromium 时退回系统 Chrome
            browser = p.chromium.launch(channel="chrome", headless=headless)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})

        page = ctx.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        login(page)

        # ---- A 可见态站内跳转 --------------------------------------------
        goto_list(page, "a")
        open_first_member(page)
        page.wait_for_timeout(2000)
        a = probe(page)
        rows.append((
            "A 可见态站内跳转", a,
            a["tabs"] > 0 and a["visible_panes"] >= 1
            # 过渡 class 必须收干净，否则说明可见态下动画也卡住了
            and "fade-transform" not in (a["cls"] or "")))

        # ---- B/C 隐藏态（新开一页，注入隐藏态后再加载） --------------------
        hidden_page = ctx.new_page()
        hidden_page.on("pageerror", lambda e: errors.append(str(e)))
        hidden_page.add_init_script(HIDE_TAB)

        goto_list(hidden_page, "b")
        open_first_member(hidden_page)
        hidden_page.wait_for_timeout(2500)
        b = probe(hidden_page)
        rows.append((
            "B 隐藏态站内跳转", b,
            b["hidden"] is True and b["tabs"] > 0 and b["visible_panes"] >= 1))

        cockpit_hash = hidden_page.url.split("#")[1]
        hidden_page.goto(f"{BASE}/?nav=c#{cockpit_hash}", wait_until="networkidle")
        hidden_page.wait_for_timeout(2000)
        c = probe(hidden_page)
        rows.append((
            "C 隐藏态整页加载", c,
            c["tabs"] > 0 and c["visible_panes"] >= 1
            and (c["opacity"] or 0) > 0.9))

        browser.close()

    print(json.dumps([{"case": n, **d, "ok": ok} for n, d, ok in rows],
                     ensure_ascii=False, indent=1))
    if errors:
        print("\n--- pageerror ---")
        for e in errors[:8]:
            print("  ❗", e[:200])
    failed = [n for n, _, ok in rows if not ok]
    print("\nRESULT:", "ALL PASS ✅" if not failed else f"{len(failed)} FAILED ❌ {failed}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
