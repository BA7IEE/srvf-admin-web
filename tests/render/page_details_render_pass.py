#!/usr/bin/env python3
"""Page detail fixes render pass (local fixtures only).

  * activities list: 状态 column sits directly after 标题 (not hidden under the 操作 column at 1070px)
  * system settings: 凭证状态 tag shows 已配置 for credentialStatus "configured"
  * settings center: first card is reachable with Tab and Enter navigates to it

Screenshots go to RP_SHOT_DIR (default /tmp/srvf-ux-pages-shots) as <RP_LABEL>-*.png.
Screenshots are taken before the asserts so a before-run still produces images.

Run against this worktree's dev server:
  RP_BASE=http://127.0.0.1:8848 RP_LABEL=after uv run --offline --with playwright python tests/render/page_details_render_pass.py
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

SHOTS = Path(os.environ.get("RP_SHOT_DIR", "/tmp/srvf-ux-pages-shots"))
LABEL = os.environ.get("RP_LABEL", "after")
LIST = "#/srvf/activities-domain/activities"
SETTINGS = "#/srvf/system/settings"
CENTER = "#/srvf/settings-center"
PERMISSIONS = ["storage-setting.read.singleton", "activity.create.record"]
STORAGE = {
    "provider": "local",
    "credentialStatus": "configured",
    "credentialConfigured": True,
    "remarks": None,
}


class DetailsFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.permissions = PERMISSIONS

    def route(self, route):
        request = route.request
        path = urlsplit(request.url).path
        if path == "/api/admin/v1/me":
            body = {"code": 0, "message": "ok", "data": {
                "userId": self.user, "username": "fixture", "email": None, "nickname": "测试组织者",
                "avatarKey": None, "role": "ADMIN", "status": "ACTIVE", "lastLoginAt": None,
                "memberId": "member-fixture-0001"}}
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(body))
        if path == "/api/system/v1/storage-settings" and request.method == "GET":
            return route.fulfill(status=200, content_type="application/json",
                                 body=json.dumps({"code": 0, "message": "ok", "data": STORAGE}))
        return super().route(route)


def login(page):
    page.goto(BASE + "/#/login")
    page.get_by_placeholder("账号").fill("fixture")
    page.get_by_placeholder("密码").fill("Fixture123456")
    page.get_by_role("button", name="登录", exact=True).click()
    page.wait_for_url(lambda u: "/login" not in u)


def main():
    SHOTS.mkdir(parents=True, exist_ok=True)
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1070, "height": 800})
        context.route("**/*", DetailsFixture().route)
        page = context.new_page()
        login(page)

        page.goto(BASE + "/" + LIST)
        expect(page.get_by_text("筹备单场次活动").first).to_be_visible(timeout=20000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOTS / f"{LABEL}-activities-1070.png"), full_page=True)
        headers = page.locator(".el-table th").all_inner_texts()
        headers = [h.strip() for h in headers if h.strip()]
        try:
            assert headers[:2] == ["标题", "状态"], f"first headers {headers[:3]}"
            print("PASS activities: 标题 then 状态 are the first two columns")
        except AssertionError as err:
            failures.append(f"activities header order: {err}")
            print(f"FAIL activities header order: {err}")

        page.goto(BASE + "/" + SETTINGS)
        expect(page.get_by_text("凭证状态").first).to_be_visible(timeout=20000)
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOTS / f"{LABEL}-system-settings-1070.png"), full_page=True)
        tags = page.locator(".el-tag").all_inner_texts()
        if "已配置" in [t.strip() for t in tags] and "configured" not in [t.strip() for t in tags]:
            print("PASS settings: 凭证状态 shows 已配置")
        else:
            failures.append(f"settings tags {tags}")
            print(f"FAIL settings tags {tags}")
        context.close()

        context = browser.new_context(viewport={"width": 1440, "height": 900})
        context.route("**/*", DetailsFixture().route)
        page = context.new_page()
        login(page)
        page.goto(BASE + "/" + CENTER)
        expect(page.locator(".setting-card").first).to_be_visible(timeout=20000)
        page.locator("body").click(position={"x": 2, "y": 2})
        focused = False
        for _ in range(60):
            page.keyboard.press("Tab")
            if page.evaluate("() => document.activeElement?.classList.contains('setting-card')"):
                focused = True
                break
        try:
            assert focused, "no .setting-card reached by Tab"
            page.keyboard.press("Enter")
            page.wait_for_url(lambda u: "/srvf/system/users" in u, timeout=8000)
            print("PASS settings-center: first card reached by Tab, Enter navigates to 系统账号")
        except Exception as err:
            failures.append(f"settings-center keyboard: {str(err).splitlines()[0]}")
            print(f"FAIL settings-center keyboard: {str(err).splitlines()[0]}")
        context.close()
        browser.close()

    if failures:
        print("FAILED:\n  " + "\n  ".join(failures))
        sys.exit(1)
    print(f"PASS: page detail checks ({LABEL}); screenshots in {SHOTS}")


if __name__ == "__main__":
    main()
