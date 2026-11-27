#!/usr/bin/env python3
"""Fragment-root page navigation render pass (local fixtures only).

Guards against the lay-content <Transition mode="out-in"> blank-page bug: a route page
whose template has several root nodes never finishes its out-in leave, so the next page
never mounts. Each case opens a multi-root page, router-navigates away to the activities
list, and asserts the target renders and is visible. The page stays visible
(document.hidden is false), so the real Transition path is exercised.

Run against this worktree's dev server:
  RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/fragment_root_nav_render_pass.py
All /api requests are intercepted; this does not exercise a real backend.
"""
import json
import sys
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

sys.dont_write_bytecode = True
from simple_activity_render_pass import BASE, Fixture

TARGET_HASH = "#/srvf/activities-domain/activities"
TARGET_TITLE = "活动列表"
PERMISSIONS = [
    "team-insurance-policy.read.record",
    "user.read.account",
    "attachment.view.member.other",
]
CASES = [
    ("team-insurance", "#/srvf/members-domain/team-insurance", "队保单"),
    ("users", "#/srvf/system/users", "系统账号"),
    ("attachments", "#/srvf/content-domain/attachments", "附件库"),
]


class NavFixture(Fixture):
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


def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for name, start_hash, start_title in CASES:
            fixture = NavFixture()
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            context.route("**/*", fixture.route)
            page = context.new_page()
            login(page)
            page.goto(BASE + "/" + start_hash)
            expect(page.locator(".main-content").get_by_text(start_title, exact=True).first).to_be_visible()

            visible_before = page.evaluate("() => !document.hidden")
            page.evaluate(f"() => {{ location.hash = '{TARGET_HASH}'; }}")
            target = page.locator(".main-content").get_by_text(TARGET_TITLE, exact=True).first
            try:
                expect(target).to_be_visible(timeout=5000)
                page.wait_for_function(
                    "() => getComputedStyle(document.querySelector('.main-content')).opacity === '1'",
                    timeout=5000,
                )
                assert visible_before, "page reported hidden; transition path not exercised"
                print(f"PASS {name}: navigated to {TARGET_TITLE}")
            except AssertionError as err:
                failures.append(f"{name}: {err}")
                print(f"FAIL {name}: {err}")
            except Exception as err:
                failures.append(f"{name}: {type(err).__name__}: {str(err).splitlines()[0]}")
                print(f"FAIL {name}: {type(err).__name__}: {str(err).splitlines()[0]}")
            context.close()
        browser.close()

    if failures:
        print("FAILED:\n  " + "\n  ".join(failures))
        sys.exit(1)
    print("PASS: multi-root pages navigate away without blanking")


if __name__ == "__main__":
    main()
