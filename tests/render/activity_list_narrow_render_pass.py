#!/usr/bin/env python3
"""Check activity table on narrow and desktop viewports with local fixtures only.

Run against this worktree's dev server:
  uv run --offline --with playwright python tests/render/activity_list_narrow_render_pass.py
All API calls are intercepted; this does not exercise a real backend.
"""
import json
import sys
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

sys.dont_write_bytecode = True
from simple_activity_render_pass import BASE, Fixture, LIST


class ListFixture(Fixture):
    def route(self, route):
        if urlsplit(route.request.url).path == "/api/admin/v1/activities":
            data = {"items": [{"id": "fixture-activity", "title": "测试活动标题",
                    "activityTypeCode": "training", "location": "测试地点",
                    "startAt": "2026-11-12T00:00:00Z", "statusCode": "published",
                    "isPublicRegistration": False}], "total": 1, "page": 1,
                    "pageSize": 10}
            return route.fulfill(status=200, content_type="application/json",
                                 body=json.dumps({"code": 0, "message": "ok", "data": data}))
        return super().route(route)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        context.route("**/*", ListFixture().route)
        page = context.new_page()
        page.goto(BASE + "/#/login")
        page.get_by_placeholder("账号").fill("fixture")
        page.get_by_placeholder("密码").fill("Fixture123456")
        page.get_by_role("button", name="登录", exact=True).click()
        page.wait_for_url(lambda u: "/login" not in u)
        page.goto(BASE + "/#" + LIST)
        row = page.locator(".el-table tbody tr").filter(has_text="测试活动标题")
        expect(row).to_have_count(1)
        expect(page.locator(".el-table .el-loading-mask")).to_be_hidden()
        title = row.get_by_text("测试活动标题", exact=True)
        expect(title).to_be_visible()
        title.scroll_into_view_if_needed()
        assert title.evaluate("e => { const r=e.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('td') === e.closest('td') }")
        action = row.get_by_role("button", name="管理", exact=True)
        action.scroll_into_view_if_needed()
        expect(action).to_be_visible()
        assert action.evaluate("e => { const r=e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)) }")
        page.set_viewport_size({"width": 1440, "height": 900})
        expect(title).to_be_visible()
        expect(action).to_be_visible()
        assert action.evaluate("e => getComputedStyle(e.closest('td')).position") == "sticky"
        assert not page.page_errors()
        browser.close()
    print("PASS: narrow title and action reachable; desktop fixed action retained")


if __name__ == "__main__":
    main()
