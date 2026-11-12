#!/usr/bin/env python3
"""Exercise organization drawer and membership table with intercepted fixtures only.

Run against this worktree's dev server:
    uv run --offline --with playwright python tests/render/membership_label_render_pass.py
All network destinations except the local dev server are blocked. Every /api/
request is intercepted; this test does not contact a real backend.
"""
import json
import sys
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright

sys.dont_write_bytecode = True
from simple_activity_render_pass import BASE, Fixture

ORG = "fixture-org"
MEMBER_LABEL = "QA-1 · 测试队员(小队员)"
MEMBERSHIPS = [
    {"id": "fixture-membership-1", "memberId": "fixture-member-1",
     "organizationId": ORG, "membershipType": "PRIMARY", "status": "ACTIVE",
     "startedAt": "2026-11-01T00:00:00.000Z", "endedAt": None,
     "member": {"id": "fixture-member-1", "memberNo": "QA-1",
                "realName": "测试队员", "nickname": "小队员", "label": MEMBER_LABEL},
     "organization": {"id": ORG, "name": "测试组织", "code": "QA", "nodeTypeCode": "team"}},
    {"id": "fixture-membership-2", "memberId": "fixture-member-2",
     "organizationId": ORG, "membershipType": "PRIMARY", "status": "ACTIVE",
     "startedAt": "2026-11-01T00:00:00.000Z", "endedAt": None,
     "organization": {"id": ORG, "name": "测试组织", "code": "QA", "nodeTypeCode": "team"}}
]


class MembershipFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.permissions = ["org.read.node", "membership.list.record"]
        self.requests = []
        self.blocked = []

    def route(self, route):
        request = route.request
        url = urlsplit(request.url)
        if url.netloc != urlsplit(BASE).netloc:
            self.blocked.append(request.url)
            return route.abort("blockedbyclient")
        if not url.path.startswith("/api/"):
            return route.continue_()
        self.requests.append((request.method, url.path, parse_qs(url.query)))
        def ok(data):
            return route.fulfill(status=200, content_type="application/json",
                                 body=json.dumps({"code": 0, "message": "ok", "data": data}))
        if url.path in ("/api/admin/v1/organizations/tree", "/api/admin/v1/organizations/tree-with-summary"):
            return ok([{"id": ORG, "name": "测试组织", "code": "QA", "nodeTypeCode": "team",
                        "status": "ACTIVE", "parentId": None, "sortOrder": 0,
                        "directMembershipCount": 2, "subtreeMembershipCount": 2, "children": []}])
        if url.path in (f"/api/admin/v1/organizations/{ORG}/memberships", "/api/admin/v1/memberships"):
            return ok({"items": MEMBERSHIPS, "total": 2, "page": 1, "pageSize": 10})
        return super().route(route)


def main():
    fixture = MembershipFixture()
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, service_workers="block")
        context.route("**/*", fixture.route)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE + "/#/login")
        page.get_by_placeholder("账号").fill("fixture")
        page.get_by_placeholder("密码").fill("Fixture123456")
        page.get_by_role("button", name="登录", exact=True).click()
        page.wait_for_url(lambda url: "/login" not in url)
        page.goto(BASE + "/#/srvf/base-data/organizations")
        row = page.locator(".el-table tbody tr").filter(has_text="测试组织")
        expect(row).to_have_count(1)
        row.get_by_role("button", name="成员", exact=True).click()
        drawer = page.locator(".el-drawer:visible")
        expect(drawer.get_by_text(MEMBER_LABEL, exact=True)).to_be_visible()
        expect(drawer.get_by_text("fixture-member-2", exact=True)).to_be_visible()
        assert "undefined" not in drawer.inner_text()
        matching = [q for method, path, q in fixture.requests
                    if method == "GET" and path == f"/api/admin/v1/organizations/{ORG}/memberships"]
        assert matching and matching[-1].get("expand") == ["member"] and matching[-1].get("status") == ["ACTIVE"]
        page.goto(BASE + "/#/srvf/org-hr/memberships")
        expect(page.get_by_text(MEMBER_LABEL, exact=True)).to_be_visible()
        expect(page.get_by_text("fixture-member-2", exact=True)).to_be_visible()
        assert "undefined" not in page.locator(".el-table:visible").first.inner_text()
        assert not fixture.blocked, fixture.blocked
        assert not fixture.unexpected, fixture.unexpected
        assert not errors, errors
        browser.close()
    print("PASS: member label and missing-expansion fallback in drawer and membership table; fixture-only")


if __name__ == "__main__":
    main()
