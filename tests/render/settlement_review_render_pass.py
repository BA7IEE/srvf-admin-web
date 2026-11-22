"""Browser wiring check against a synthetic #1431 contract; no live API calls."""

import json
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright
from simple_activity_render_pass import BASE, Fixture

ROOT = "/api/admin/v1/attendance-settlements"
ID = "settlement-synthetic-0001"
ACTIVITY = "activity-synthetic-0001"
READ = "attendance.read.sheet"
FIRST = "activity.settlement-first-review.record"
FINAL = "activity.settlement-final-review.record"
EVIDENCE = dict(
    evidenceSealId="seal-synthetic-0001",
    evidenceRevision=2,
    populationRevision=3,
    workflowRevision=4,
    contentHash="a" * 64,
)


class SettlementFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.permissions = [READ, FIRST]
        self.stage = "first"
        self.status = "submitted"
        self.posts = []
        self.searches = []
        self.lost = True
        self.denied = False
        self.old_contract = False

    def route(self, route):
        url = urlsplit(route.request.url)
        query = parse_qs(url.query)

        def respond(data, status=200, code=0, message="ok"):
            return route.fulfill(
                status=status,
                json=dict(code=code, message=message, data=data),
            )

        if url.path == ROOT:
            self.searches.append(query)
            return respond(
                dict(
                    items=[
                        dict(
                            settlementVersionId=ID,
                            activityId=ACTIVITY,
                            activityTitle="合成救援培训",
                            version=2,
                            statusCode=self.status,
                            reviewStage=self.stage,
                            submittedAt="2026-11-17T01:00:00Z",
                            postingBatchStatusCode=None,
                            submittedBy=None,
                        )
                    ],
                    total=1,
                    page=1,
                    pageSize=int(query["pageSize"][0]),
                )
            )
        if url.path == f"{ROOT}/{ID}/review-detail":
            if self.denied:
                return respond(None, 403, 30100, "没有资源读权")
            version = dict(id=ID, version=2, statusCode=self.status, **EVIDENCE)
            if self.old_contract:
                return respond(dict(version=version))
            number = int(query["page"][0])
            item = dict(
                id=f"result-{number}",
                member=dict(label=f"队员样本 {number}"),
                session=dict(name="训练场次"),
                resultCode="attended",
                timeResultState="pending",
                contributionResultState="pending",
            )
            return respond(
                dict(
                    version=version,
                    gaps=[],
                    diff=dict(addedItemCount=0, removedItemCount=0, changedItemCount=0),
                    sealRevisions=[],
                    results=dict(items=[item], total=21, page=number, pageSize=20),
                )
            )
        if url.path.startswith(f"{ROOT}/{ID}/"):
            operation = url.path.rsplit("/", 1)[-1]
            assert route.request.method == "POST"
            body = route.request.post_data_json
            assert all(body[key] == value for key, value in EVIDENCE.items())
            assert body["operationKey"]
            self.posts.append((operation, body))
            if self.lost:
                self.lost = False
                self.stage = "final"
                return route.abort("failed")
            if operation == "first-approve":
                assert self.posts[0] == self.posts[-1]
            elif operation == "final-return":
                assert body["note"] == "需复核样本"
                self.status = "returned"
                self.stage = None
            else:
                raise AssertionError(operation)
            stage, action = operation.split("-")
            return respond(dict(settlementVersionId=ID, stageCode=stage, actionCode=action))
        return super().route(route)


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        fixture = SettlementFixture()
        context = browser.new_context(service_workers="block")
        context.route("**/api/**", fixture.route)
        page = context.new_page()
        page.set_default_timeout(15000)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE + "/#/login")
        page.get_by_placeholder("账号").fill("fixture")
        page.get_by_placeholder("密码").fill("fixture-only")
        page.get_by_role("button", name="登录", exact=True).click()
        page.wait_for_url(lambda url: "/login" not in url)
        page.goto(BASE + "/#/srvf/workbench/approvals?task=settlement")
        page.get_by_placeholder("活动标题或提交人").fill("合成")
        page.get_by_role("button", name="查询", exact=True).last.click()
        page.get_by_text("合成救援培训", exact=True).wait_for()
        assert any(query.get("q") == ["合成"] for query in fixture.searches)
        page.get_by_role("button", name="查看本版").click()
        expect(page.get_by_role("heading", name="合成救援培训 · 第 2 版")).to_be_visible()
        expect(page.get_by_text("未正式入账", exact=True)).to_be_visible()
        expect(page.get_by_text("来源尚不可用", exact=True)).to_have_count(2)
        page.locator(".el-pagination .btn-next").click()
        expect(page.get_by_text("队员样本 2 / 训练场次")).to_be_visible()
        expect(page.get_by_text("队员样本 1 / 训练场次")).to_have_count(0)
        page.get_by_role("button", name="一审通过", exact=True).click()
        page.get_by_role("button", name="确认通过第 2 版").click()
        expect(page.get_by_role("button", name="复用原请求")).to_be_enabled()
        expect(page.get_by_role("button", name="一审通过", exact=True)).to_have_count(0)
        page.get_by_role("button", name="复用原请求").click()
        expect(page.get_by_text("待终审", exact=True)).to_be_visible()
        assert fixture.posts[0] == fixture.posts[1]
        expect(page.get_by_role("button", name="终审退回")).to_have_count(0)
        # The independent final reviewer uses a separate signed-in browser context.
        fixture.permissions = [READ, FINAL]
        final = browser.new_context(service_workers="block", viewport=dict(width=390, height=844))
        final.route("**/api/**", fixture.route)
        reviewer = final.new_page()
        reviewer.set_default_timeout(15000)
        reviewer.on("pageerror", lambda error: errors.append(str(error)))
        reviewer.goto(BASE + "/#/login")
        reviewer.get_by_placeholder("账号").fill("fixture-final")
        reviewer.get_by_placeholder("密码").fill("fixture-only")
        reviewer.get_by_role("button", name="登录", exact=True).click()
        reviewer.wait_for_url(lambda url: "/login" not in url)
        reviewer.goto(page.url)
        reviewer.get_by_role("button", name="终审退回").click()
        confirm = reviewer.get_by_role("button", name="确认退回第 2 版")
        expect(confirm).to_be_disabled()
        reviewer.get_by_role("textbox").last.fill("需复核样本")
        confirm.click()
        expect(reviewer.get_by_text("已退回", exact=True)).to_be_visible()
        fixture.denied = True
        reviewer.get_by_role("button", name="刷新读面").click()
        expect(reviewer.get_by_text("本版本逐人冻结结果")).to_have_count(0)
        fixture.denied = False
        fixture.old_contract = True
        reviewer.get_by_role("button", name="刷新读面").click()
        expect(reviewer.get_by_text("未取得指定版本的新版冻结结果契约，不可审核。")).to_be_visible()
        assert len(fixture.posts) == 3 and not errors, errors
        browser.close()
    print("PASS settlement review synthetic browser contract")


if __name__ == "__main__":
    main()
