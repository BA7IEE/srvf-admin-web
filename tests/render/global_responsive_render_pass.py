#!/usr/bin/env python3
"""Global responsive/layout render pass (local fixtures only).

Checks the global stylesheet and header fixes at two viewports:
  * 1070x800: table-bar header on a multi-filter list does not overflow; the header icons stay on screen
  * 390x844: an open addDialog fits the viewport width
  * double layout: the sidebar logo image is constrained to 48px or less

Screenshots go to RP_SHOT_DIR (default /tmp/srvf-ux-layout-shots) as <RP_LABEL>-*.png so
before/after runs (origin/main vs branch) can be compared.

Run against this worktree's dev server:
  RP_BASE=http://127.0.0.1:8848 RP_LABEL=after uv run --offline --with playwright python tests/render/global_responsive_render_pass.py
All /api requests are intercepted; this does not exercise a real backend.
"""
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

sys.dont_write_bytecode = True
from simple_activity_render_pass import BASE, Fixture

SHOTS = Path(os.environ.get("RP_SHOT_DIR", "/tmp/srvf-ux-layout-shots"))
LABEL = os.environ.get("RP_LABEL", "after")
MEMBERS = "#/srvf/members-domain/members"
TEAM = "#/srvf/members-domain/team-insurance"
PERMISSIONS = [
    "member.read.record",
    "team-insurance-policy.read.record",
    "team-insurance-policy.create.record",
]


class LayoutFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.permissions = PERMISSIONS

    def route(self, route):
        if urlsplit(route.request.url).path == "/api/admin/v1/me":
            body = {"code": 0, "message": "ok", "data": {
                "userId": self.user, "username": "fixture", "email": None, "nickname": "测试组织者",
                "avatarKey": None, "role": "ADMIN", "status": "ACTIVE", "lastLoginAt": None,
                "memberId": "member-fixture-0001"}}
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(body))
        return super().route(route)


def login(page):
    page.goto(BASE + "/#/login")
    page.get_by_placeholder("账号").fill("fixture")
    page.get_by_placeholder("密码").fill("Fixture123456")
    page.get_by_role("button", name="登录", exact=True).click()
    page.wait_for_url(lambda u: "/login" not in u)


def new_page(browser, width, height):
    fixture = LayoutFixture()
    context = browser.new_context(viewport={"width": width, "height": height})
    context.route("**/*", fixture.route)
    page = context.new_page()
    login(page)
    return context, page


def main():
    SHOTS.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)

        context, page = new_page(browser, 1070, 800)
        page.goto(BASE + "/" + MEMBERS)
        header = page.locator(".main-content .h-15.justify-between").first
        expect(header).to_be_visible()
        page.wait_for_timeout(500)
        overflow = header.evaluate("e => [e.scrollWidth, e.clientWidth]")
        assert overflow[0] <= overflow[1] + 1, f"table bar overflows: scrollWidth={overflow[0]} clientWidth={overflow[1]}"
        icons_right = header.evaluate(
            "e => Math.max(...[...e.querySelectorAll(':scope > .flex-ac svg')].map(s => s.getBoundingClientRect().right))"
        )
        assert icons_right <= 1070 + 1, f"header icon off-screen: right={icons_right}"
        icon_span = header.evaluate(
            "e => { const xs = [...e.querySelectorAll(':scope > .flex-ac > svg, :scope > .flex-ac > .el-dropdown svg')].map(s => s.getBoundingClientRect().x); return xs.length > 1 ? Math.max(...xs) - Math.min(...xs) : 0 }"
        )
        assert icon_span < 200, f"header icons spread across the bar (space-around leak): span={icon_span}"
        print(f"PASS 1070: table bar fits (scrollWidth {overflow[0]} <= {overflow[1]}), icons right={round(icons_right)}, icon span={round(icon_span)}")

        logo = page.locator(".double-logo img")
        if logo.count():
            logo_height = logo.first.evaluate("e => e.getBoundingClientRect().height")
            assert logo_height <= 48, f"double-logo img height={logo_height}"
            print(f"PASS double-layout logo: img height {round(logo_height)}px <= 48")
            page.locator(".double-logo").first.screenshot(path=str(SHOTS / f"{LABEL}-logo-double.png"))
        else:
            print("SKIP double-layout logo: .double-logo not rendered at this layout")
        page.screenshot(path=str(SHOTS / f"{LABEL}-members-1070.png"))
        context.close()

        context, page = new_page(browser, 390, 844)
        page.goto(BASE + "/" + TEAM)
        page.get_by_role("button", name="新建保单", exact=True).click()
        dialog = page.locator(".el-dialog:visible").first
        expect(dialog).to_be_visible()
        page.wait_for_timeout(500)
        box = dialog.bounding_box()
        assert box["x"] >= -1 and box["x"] + box["width"] <= 390 + 1, f"dialog out of viewport: {box}"
        print(f"PASS 390: addDialog fits viewport (x={round(box['x'])}, width={round(box['width'])})")
        page.screenshot(path=str(SHOTS / f"{LABEL}-dialog-390.png"))
        page.goto(BASE + "/" + MEMBERS)
        expect(page.locator(".h-15.justify-between").first).to_be_visible()
        page.screenshot(path=str(SHOTS / f"{LABEL}-members-390.png"))
        context.close()

        browser.close()
    print(f"PASS: global responsive checks ({LABEL}); screenshots in {SHOTS}")


if __name__ == "__main__":
    main()
