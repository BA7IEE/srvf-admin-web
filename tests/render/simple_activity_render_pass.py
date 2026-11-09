#!/usr/bin/env python3
"""Local UI/contract fixture test. ALL /api requests are intercepted; no real DB writes.

Run against this worktree's pnpm dev:
  RP_BASE=http://127.0.0.1:8848 uv run --offline --with playwright python tests/render/simple_activity_render_pass.py
This is not a live backend integration test. Fixtures model the verified 15421e9 contract.
"""
import copy
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("RP_BASE", "http://127.0.0.1:8848")
SHOTS = Path(os.environ.get("RP_SHOT_DIR", "/tmp/srvf-simple-render"))
LIST = "/srvf/activities-domain/activities"
ID = "activity-fixture-0001"
ORG = "organization-fixture-0001"
TEMPLATE = "template-version-fixture-0001"
NOW = "2026-12-01T01:00:00.000Z"


def iso_shift(value, minutes):
    return (datetime.fromisoformat(value.replace("Z", "+00:00")) + timedelta(minutes=minutes)).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def snapshot(body):
    return {
        "activityId": ID, "title": body["title"], "organizationId": ORG,
        "activityTypeCode": "training", "allocationModeCode": "first_come",
        "startAt": body["startAt"], "endAt": body["endAt"], "location": body["location"],
        "instance": {"capacity": 12, "registrationDeadline": None, "description": None, "registrationNotes": "带水"},
        "statusCode": "draft", "review": None, "editable": True, "draftHash": "a" * 64,
        "selectedTemplateVersionId": TEMPLATE, "definitionHash": "b" * 64,
        "session": {"id": "session-fixture-0001", "code": "main", "name": "本次活动", "startAt": body["startAt"], "endAt": body["endAt"], "capacity": 12,
                    "checkInOpenAt": iso_shift(body["startAt"], -30), "checkInCloseAt": body["startAt"],
                    "checkOutOpenAt": body["endAt"], "checkOutCloseAt": iso_shift(body["endAt"], 30), "preparationStartAt": None},
        "position": {"id": "position-fixture-0001", "code": "participant", "name": "参与者", "attendanceRoleCode": "participant", "capacity": 12, "startAt": None, "endAt": None},
        "places": [
            {"roleCode": "primary", "visibilityCode": body["defaultPlaceVisibilityCode"], "inline": {"name": body["location"], "addressText": body["location"], "checkInEligible": False}},
            {"roleCode": "meeting", "visibilityCode": "staff", "inline": {"name": "集合点", "addressText": "东门", "instruction": "请保留这段说明", "checkInEligible": True, "radiusMeters": 50, "coordinate": {"longitude": 112.5, "latitude": 23.5, "coordinateSystemCode": "gcj02"}}}
        ], "policies": []
    }


class Fixture:
    def __init__(self):
        self.user = "organizer-fixture"
        self.permissions = ["activity.create.record", "activity.update.record"]
        self.org_mode = "ok"
        self.template_mode = "ok"
        self.create_mode = "ok"
        self.save_mode = "ok"
        self.draft = None
        self.creates = []
        self.saves = []
        self.reads = []
        self.unexpected = []
        self.get_fail = False
        self.before_save_response = None

    def route(self, route):
        request = route.request
        path = urlsplit(request.url).path
        if not path.startswith("/api/"):
            return route.continue_()
        method = request.method
        self.reads.append((method, path))
        def ok(data, status=200):
            route.fulfill(status=status, content_type="application/json", body=json.dumps({"code": 0, "message": "ok", "data": data}))
        def fail(code, message, status=403):
            route.fulfill(status=status, content_type="application/json", body=json.dumps({"code": code, "message": message}))
        if path == "/api/auth/v1/login":
            return ok({"accessToken": "fixture-only-token", "tokenType": "Bearer", "expiresIn": "2h", "refreshToken": "fixture-refresh", "refreshExpiresAt": "2099-01-01T00:00:00.000Z"})
        if path == "/api/admin/v1/me":
            return ok({"userId": self.user, "username": "fixture", "email": None, "nickname": "测试组织者", "avatarKey": None, "role": "USER", "status": "ACTIVE", "lastLoginAt": None, "memberId": "member-fixture-0001"})
        if path == "/api/system/v1/authz/me/effective-permissions":
            return ok({"permissions": self.permissions})
        if path.endswith("/organization-options"):
            if self.org_mode == "denied": return fail(20019, "当前身份不是有效正式成员")
            return ok([] if self.org_mode == "empty" else [{"organizationId": ORG, "name": "测试组织", "pathLabel": "测试队 / 测试组织", "source": "membership", "membershipType": "PRIMARY"}])
        if path.endswith("/template-version-options"):
            if self.template_mode == "error": return fail(50300, "模板服务暂不可用", 503)
            query = parse_qs(urlsplit(request.url).query)
            assert query["organizationId"] == [ORG]
            page = int(query.get("page", [1])[0])
            template = {"id": TEMPLATE if page == 1 else "template-version-fixture-0002", "code": "basic", "name": "常规培训", "version": page,
                        "schemaVersion": 5, "definitionHash": "b" * 64, "statusCode": "active", "activityTypeCode": "training",
                        "family": {"id": "family-fixture-0001", "code": "training", "name": "培训活动", "categoryCode": "routine"},
                        "effectiveFrom": NOW, "effectiveTo": None, "createdAt": NOW, "updatedAt": NOW}
            return ok({"items": [] if self.template_mode == "empty" else [template], "total": 0 if self.template_mode == "empty" else 21, "page": page, "pageSize": 20})
        if path.endswith("/from-template") and method == "POST":
            body = request.post_data_json
            assert set(body) == {"title", "organizationId", "startAt", "endAt", "location", "templateVersionId", "operationKey", "defaultPlaceVisibilityCode"}
            self.creates.append(body)
            if self.draft is None: self.draft = snapshot(body)
            if self.create_mode == "lost":
                self.create_mode = "ok"
                return route.abort("failed")
            return ok({"activityId": ID, "createdAt": NOW, "createdStatusCode": "draft", "replayed": len(self.creates) > 1}, 201)
        if path == f"/api/admin/v1/activities/{ID}/simple-draft":
            if method == "GET":
                if self.user != "organizer-fixture": return fail(40400, "暂时无法读取", 404)
                if self.get_fail: return fail(40400, "暂时无法读取", 404)
                return ok(copy.deepcopy(self.draft))
            if method == "PUT":
                body = request.post_data_json
                self.saves.append(body)
                assert set(body) == {"title", "organizationId", "startAt", "endAt", "location", "expectedDraftHash", "instance", "places"}
                assert set(body["instance"]) == {"capacity", "registrationDeadline", "description", "registrationNotes"}
                assert body["places"][1:] == self.draft["places"][1:]
                if self.save_mode == "stale":
                    self.draft["title"] = "其他人修改后的标题"
                    self.draft["draftHash"] = "c" * 64
                    return fail(20255, "草稿指纹已过期", 409)
                if self.save_mode == "denied": return fail(30100, "没有对应组织的修改权限")
                assert body["expectedDraftHash"] == self.draft["draftHash"]
                for key in ("title", "organizationId", "startAt", "endAt", "location", "instance", "places"):
                    self.draft[key] = copy.deepcopy(body[key])
                self.draft["draftHash"] = "d" * 64
                self.draft["session"].update(startAt=body["startAt"], endAt=body["endAt"], capacity=body["instance"]["capacity"])
                self.draft["position"]["capacity"] = body["instance"]["capacity"]
                if self.save_mode == "lost":
                    self.save_mode = "ok"
                    return route.abort("failed")
                if self.save_mode == "lost-other":
                    self.draft["title"] = "读回时已有其他修改"
                    self.save_mode = "ok"
                    return route.abort("failed")
                if self.before_save_response:
                    self.before_save_response()
                return ok(copy.deepcopy(self.draft))
        if path == "/api/admin/v1/activities" and method == "GET":
            # Ordinary USER cannot see a draft in the legacy list.
            return ok({"items": [], "total": 0, "page": 1, "pageSize": 10})
        if method == "GET" and ("dictionar" in path or "options" in path): return ok([])
        if method == "GET": return ok({"items": [], "total": 0, "page": 1, "pageSize": 10})
        self.unexpected.append((method, path))
        return route.abort("blockedbyclient")


def field(page, label):
    return page.locator(".el-form-item").filter(has=page.locator("label", has_text=label)).locator("input").first


def date_field(page, label, value):
    target = field(page, label)
    target.fill(value)
    target.press("Tab")


def choose(page, label, option):
    page.locator(".el-form-item").filter(has=page.locator("label", has_text=label)).locator(".el-select").click()
    page.get_by_role("option", name=option, exact=True).click()


def shot(page, name):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=True)


def main():
    SHOTS.mkdir(parents=True, exist_ok=True)
    f = Fixture()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium", headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 1000}, timezone_id="America/Los_Angeles")
        context.route("**/*", f.route)
        page = context.new_page()
        page_errors = []
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on("dialog", lambda dialog: dialog.accept())
        page.goto(BASE + "/#/login")
        page.get_by_placeholder("账号").fill("fixture")
        page.get_by_placeholder("密码").fill("Fixture123456")
        page.get_by_role("button", name="登录", exact=True).click()
        page.wait_for_url(lambda u: "/login" not in u)
        page.goto(BASE + "/#" + LIST)
        entry = page.get_by_test_id("simple-entry")
        expect(entry.get_by_role("button", name="筹备单场次活动", exact=True)).to_be_enabled()
        f.org_mode = "empty"
        entry.get_by_role("button", name="筹备单场次活动", exact=True).evaluate("b => { b.click(); b.click(); }")
        expect(page.get_by_test_id("simple-create")).to_have_count(1)
        expect(page.get_by_text("当前没有可发起的组织。", exact=False)).to_be_visible()
        page.get_by_role("button", name="取消", exact=True).click()
        f.org_mode = "denied"
        expect(entry.get_by_role("button", name="筹备单场次活动", exact=True)).to_be_enabled()
        entry.get_by_role("button", name="筹备单场次活动", exact=True).click()
        expect(page.get_by_text("当前身份不是有效正式成员", exact=False)).to_be_visible()
        f.org_mode = "ok"
        page.get_by_role("button", name="重试组织加载").click()
        expect(page.get_by_text("当前身份不是有效正式成员", exact=False)).not_to_be_visible()
        f.template_mode = "error"
        choose(page, "承办组织", "测试队 / 测试组织")
        expect(page.get_by_text("模板服务暂不可用", exact=False)).to_be_visible()
        f.template_mode = "empty"
        page.get_by_role("button", name="重试模板加载").click()
        expect(page.get_by_text("该组织当前没有可用的常规单场次模板", exact=False)).to_be_visible()
        page.get_by_role("button", name="取消", exact=True).click()
        f.template_mode = "ok"
        expect(entry.get_by_role("button", name="筹备单场次活动", exact=True)).to_be_enabled()
        entry.get_by_role("button", name="筹备单场次活动", exact=True).click()
        submit = page.get_by_role("button", name="创建草稿并核对场次")
        submit.click()
        expect(page.get_by_text("请选择承办组织", exact=True)).to_be_visible()
        assert not f.creates
        choose(page, "承办组织", "测试队 / 测试组织")
        page.get_by_test_id("simple-create").locator(".el-pagination .btn-next").click()
        choose(page, "活动模板版本", "培训活动 · 常规培训（第 2 版）")
        page.get_by_test_id("simple-create").locator(".el-pagination .btn-prev").click()
        choose(page, "活动模板版本", "培训活动 · 常规培训（第 1 版）")
        field(page, "活动标题").fill("周末急救培训")
        date_field(page, "开始时间", "2026-12-01 09:00")
        date_field(page, "结束时间", "2026-12-02 11:00")
        field(page, "活动地点").fill("社区活动中心")
        choose(page, "地点对谁可见", "录取后可见")
        submit.click()
        expect(page.get_by_text("常规单场次活动须在北京时间同一天开始和结束", exact=True)).to_be_visible()
        assert not f.creates
        date_field(page, "结束时间", "2026-12-01 11:00")
        shot(page, "01-create")
        f.create_mode = "lost"
        submit.evaluate("b => { b.click(); b.click(); }")
        expect(page.get_by_text("有一笔创建需要继续确认", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="继续确认创建结果")).to_be_enabled()
        assert len(f.creates) == 1
        assert f.creates[0]["startAt"] == NOW
        page.get_by_role("button", name="暂时关闭，稍后确认").click()
        page.reload()
        entry.get_by_role("button", name="继续上次创建", exact=True).click()
        expect(field(page, "活动标题")).to_be_disabled()
        # A creation receipt remains historical even if the current activity is published.
        f.draft.update(statusCode="published", editable=False, review={"id": "review-fixture-0001", "status": "approved", "requestType": "initial"})
        page.get_by_role("button", name="继续确认创建结果").click()
        page.wait_for_url("**/simple-draft")
        expect(page.get_by_role("heading", name="周末急救培训", exact=True)).to_be_visible()
        assert len(f.creates) == 2 and f.creates[0] == f.creates[1]
        expect(page.get_by_test_id("simple-next-step")).to_contain_text("活动已发布")
        expect(page.get_by_role("button", name="配置本次场次")).to_have_count(0)
        # Independent editable-draft fixture for the remaining save scenarios.
        f.draft.update(statusCode="draft", editable=True, review=None)
        page.reload()
        expect(page.get_by_text("测试队 / 测试组织 · 尚未提交审核", exact=True)).to_be_visible()
        expect(page.get_by_test_id("simple-next-step")).to_contain_text("下方提交发布审核")
        assert not any(path == f"/api/admin/v1/activities/{ID}" for _, path in f.reads)
        shot(page, "02-draft")
        print("PASS create: validation, options recovery, pagination, double-click guard, same-key replay after refresh, current GET overrides historical receipt, own draft route")

        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("修改后取消")
        page.get_by_role("button", name="取消编辑并重新读取").click()
        page.get_by_role("button", name="放弃本次编辑", exact=True).click()
        expect(page.get_by_role("heading", name="周末急救培训", exact=True)).to_be_visible()
        assert not f.saves
        page.get_by_role("button", name="配置本次场次").click()
        expect(field(page, "活动标题")).to_have_value("周末急救培训")
        page.get_by_role("spinbutton", name="本次人数上限").fill("8")
        page.get_by_role("button", name="保存草稿", exact=True).evaluate("b => { b.click(); b.click(); }")
        expect(page.get_by_text("草稿已保存，请核对下方场次和下一步。", exact=True)).to_be_visible()
        assert len(f.saves) == 1 and f.draft["session"]["capacity"] == 8
        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("本次尚未覆盖的修改")
        f.save_mode = "stale"
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_text("草稿已被其他操作修改", exact=False)).to_be_visible()
        expect(field(page, "活动标题")).to_have_value("本次尚未覆盖的修改")
        expect(page.get_by_role("button", name="保存草稿", exact=True)).to_be_disabled()
        page.get_by_role("button", name="读取当前版本并核对").click()
        expect(page.get_by_text("其他人修改后的标题", exact=True)).to_be_visible()
        shot(page, "03-conflict")
        page.get_by_role("button", name="放弃本次编辑，采用当前版本").click()
        page.get_by_role("button", name="放弃本次编辑", exact=True).click()
        expect(page.get_by_role("heading", name="其他人修改后的标题", exact=True)).to_be_visible()
        print("PASS save: cancel/reopen, full place preservation, capacity sync, duplicate prevention, stale conflict retains edits")

        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("保存响应丢失后读回")
        f.save_mode = "lost"
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_text("已读回当前草稿，完整内容与本次保存目标一致。", exact=True)).to_be_visible()
        assert len(f.saves) == 3
        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("不确定结果时保留输入")
        f.save_mode = "lost-other"
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_text("读回时已有其他修改", exact=True)).to_be_visible()
        expect(field(page, "活动标题")).to_have_value("不确定结果时保留输入")
        expect(page.get_by_role("button", name="保存草稿", exact=True)).to_be_disabled()
        assert len(f.saves) == 4
        page.get_by_role("button", name="放弃本次编辑，采用当前版本").click()
        page.get_by_role("button", name="放弃本次编辑", exact=True).click()
        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("没有权限时保留输入")
        f.save_mode = "denied"
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_text("您没有执行此操作的权限", exact=False)).to_be_visible()
        expect(field(page, "活动标题")).to_have_value("没有权限时保留输入")
        page.get_by_role("button", name="取消编辑并重新读取").click()
        page.get_by_role("button", name="放弃本次编辑", exact=True).click()
        f.draft["review"] = {"id": "review-fixture-0001", "status": "pending", "requestType": "initial"}
        f.draft["editable"] = False
        page.reload()
        expect(page.get_by_test_id("simple-next-step")).to_contain_text("审核中不代表活动已发布")
        expect(page.get_by_role("button", name="配置本次场次")).to_have_count(0)
        expect(page.locator(".el-tag").filter(has_text="草稿")).to_be_visible()
        shot(page, "04-pending")
        print("PASS recovery: matching/mismatching lost PUT readback without retry; denied save retains input; pending review remains draft and readonly")

        page.get_by_role("button", name="返回活动与本机草稿入口").click()
        expect(entry.get_by_role("button", name="读回时已有其他修改", exact=True)).to_be_visible()
        f.get_fail = True
        entry.get_by_role("button", name="刷新本人草稿入口").click()
        expect(entry.get_by_text("暂时无法读取", exact=True)).to_be_visible()
        assert page.evaluate("Object.keys(localStorage).some(k => k.includes('activity-fixture-0001'))")
        f.get_fail = False
        entry.get_by_role("button", name="读取草稿", exact=True).click()
        expect(entry.get_by_role("button", name="读回时已有其他修改", exact=True)).to_be_visible()
        # Switch actual /me identity; previous account's local IDs must not be read/displayed.
        f.user = "different-user"
        page.reload()
        expect(entry.get_by_text("还没有本设备记录", exact=False)).to_be_visible()
        expect(entry.get_by_role("button", name="读回时已有其他修改", exact=True)).to_have_count(0)
        f.user = "organizer-fixture"
        page.reload()
        expect(entry.get_by_role("button", name="读回时已有其他修改", exact=True)).to_be_visible()
        entry.get_by_role("button", name="移除本机引用").click()
        page.get_by_role("button", name="确定", exact=True).click()
        expect(entry.get_by_text("还没有本设备记录", exact=False)).to_be_visible()
        assert f.draft is not None
        # A cross-tab identity change while PUT is in flight must hide its late response.
        f.draft.update(editable=True, review=None)
        f.save_mode = "ok"
        page.goto(BASE + "/#" + LIST + f"/{ID}/simple-draft")
        page.get_by_role("button", name="配置本次场次").click()
        field(page, "活动标题").fill("原账号请求的迟到结果")
        def switch_during_save():
            f.user = "different-user"
            page.evaluate("window.dispatchEvent(new StorageEvent('storage', {key:'user-info'}))")
        f.before_save_response = switch_during_save
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_text("登录信息已改变，请重新加载草稿", exact=True)).to_be_visible()
        expect(page.get_by_role("heading", name="原账号请求的迟到结果", exact=True)).to_have_count(0)
        assert not f.unexpected, f.unexpected
        assert not page_errors, page_errors
        print("PASS entry: legacy list empty, refresh/account isolation, 404 keeps recovery link, removal only local, late response hidden after account switch")
        print(f"PASS all fixture render scenarios; screenshots: {SHOTS}; real backend integration: NOT RUN")
        browser.close()


if __name__ == "__main__":
    main()
