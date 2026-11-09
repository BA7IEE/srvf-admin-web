#!/usr/bin/env python3
"""Real Chromium/TCP failure test with an IN-MEMORY synthetic API, never Nest/DB.

Serve this worktree with pnpm dev --host 127.0.0.1; RP_BASE selects that Vite.
No business response is fulfilled by Playwright. A loopback HTTP gateway reuses
the existing fixture, commits its ledger, then physically closes the connection.
"""
import copy
import http.client
import json
import os
import re
import socket
import threading
import time
import traceback
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright
from simple_return_render_pass import ID, LIST, NOTE, ReturnFixture

UPSTREAM = urlsplit(os.environ.get("RP_BASE", "http://127.0.0.1:8848"))
OUT = Path(os.environ.get("RP_NETWORK_EVIDENCE", "/tmp/srvf-return-network"))
REVIEW_PATH = f"/api/admin/v1/activities/{ID}/publish-reviews"
SAVED_NOTES = "网络恢复演练：携带手套，集合位置为东门。"


def stamp():
    return datetime.now(timezone.utc).isoformat()


class HttpRoute:
    """Only adapts existing fixture calls; it has no Playwright Route object."""

    def __init__(self, method, url, raw):
        self.request = SimpleNamespace(
            method=method, url=url, post_data=raw.decode() if raw else None,
            post_data_json=json.loads(raw) if raw else None,
        )
        self.response = None
        self.dropped = False

    def fulfill(self, *, status, content_type, body):
        self.response = (status, content_type, body.encode())

    def abort(self, _reason):
        self.dropped = True


class Gateway:
    def __init__(self):
        self.fixture = ReturnFixture()
        self.fixture.reset()
        self.lock = threading.RLock()
        self.events = []
        self.failures = []
        self.loss_armed = False
        self.replay_armed = False
        self.accepted = threading.Event()
        self.release_loss = threading.Event()
        self.replay_arrived = threading.Event()
        self.release_replay = threading.Event()
        owner = self

        class Handler(BaseHTTPRequestHandler):
            # Each response closes its connection: no pooled POST retry ambiguity.
            protocol_version = "HTTP/1.0"

            def log_message(self, *_args):
                pass

            def respond(self, status, content_type, body, headers=()):
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Connection", "close")
                for key, value in headers:
                    self.send_header(key, value)
                self.end_headers()
                try:
                    self.wfile.write(body)
                except (BrokenPipeError, ConnectionResetError):
                    pass

            def handle_request(self):
                path = urlsplit(self.path).path
                if not path.startswith("/api/"):
                    # Assets only. API traffic can never fall through to Vite's
                    # configured backend, or to an existing backend process.
                    connection = http.client.HTTPConnection(UPSTREAM.hostname, UPSTREAM.port, timeout=15)
                    try:
                        connection.request("GET", self.path, headers={"Accept-Encoding": "identity"})
                        response = connection.getresponse()
                        data = response.read()
                        headers = [(k, v) for k, v in response.getheaders() if k.lower() in
                                   {"cache-control", "etag", "last-modified", "content-encoding"}]
                        self.respond(response.status, response.getheader("Content-Type", "application/octet-stream"), data, headers)
                    finally:
                        connection.close()
                    return

                length = int(self.headers.get("Content-Length", "0"))
                if length > 1024 * 1024:
                    self.respond(413, "text/plain", b"fixture request too large")
                    return
                raw = self.rfile.read(length)
                adapter = HttpRoute(self.command, owner.origin + self.path, raw)
                hold_loss = hold_replay = False
                with owner.lock:
                    f = owner.fixture
                    is_post = path == REVIEW_PATH and self.command == "POST"
                    body = adapter.request.post_data_json
                    replay = is_post and body["operationKey"] in f.reviews
                    if is_post and owner.loss_armed:
                        owner.loss_armed = False
                        f.post_mode = "lost-after"
                        hold_loss = True
                    if replay and owner.replay_armed:
                        owner.replay_armed = False
                        hold_replay = True
                    f.route(adapter)
                    event = {"at": stamp(), "method": self.command, "path": path,
                             "reviewRecords": len(f.reviews)}
                    # Never retain login bodies, tokens, cookies, or headers.
                    if is_post:
                        event.update(body=copy.deepcopy(body), replay=replay)
                    if adapter.response:
                        event["status"] = adapter.response[0]
                    if adapter.dropped:
                        event["transport"] = "accepted_then_connection_closed_without_headers"
                    owner.events.append(event)
                    if hold_loss:
                        assert len(f.reviews) == 2 and adapter.dropped
                        owner.accepted.set()
                    if hold_replay:
                        owner.replay_arrived.set()
                if hold_loss and not owner.release_loss.wait(30):
                    owner.failures.append("loss barrier timed out")
                if hold_replay and not owner.release_replay.wait(30):
                    owner.failures.append("replay barrier timed out")
                if adapter.dropped:
                    self.close_connection = True
                    try:
                        self.connection.shutdown(socket.SHUT_RDWR)
                    except OSError:
                        pass
                    self.connection.close()
                    return
                assert adapter.response is not None, f"fixture did not answer {path}"
                self.respond(*adapter.response)

            def do_GET(self):
                try:
                    self.handle_request()
                except Exception:
                    owner.failures.append(traceback.format_exc())
                    self.respond(500, "text/plain", b"synthetic gateway failure")

            do_POST = do_GET
            do_PUT = do_GET

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.origin = f"http://127.0.0.1:{self.server.server_port}"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def start(self):
        self.thread.start()

    def stop(self):
        self.release_loss.set()
        self.release_replay.set()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        assert not self.thread.is_alive()

    def state(self):
        with self.lock:
            f = self.fixture
            return copy.deepcopy({"posts": f.posts, "reviews": list(f.reviews.values()),
                                  "draft": f.draft, "saves": f.saves, "events": self.events,
                                  "failures": self.failures, "permissions": f.permissions,
                                  "unexpected": f.unexpected})

    def return_first(self):
        with self.lock:
            f = self.fixture
            assert len(f.reviews) == 1
            review = next(iter(f.reviews.values()))
            review.update(status="returned", reviewNote=NOTE, reviewedByUserId="synthetic-reviewer")
            f.draft.update(review={"id": review["id"], "status": "returned", "requestType": "initial"}, editable=True)
            f.bump()
            self.events.append({"at": stamp(), "control": "synthetic reviewer return", "reviewId": review["id"]})


def records(page, prefix="srvf:simple-review:"):
    return page.evaluate("prefix => Object.keys(sessionStorage).filter(k => k.startsWith(prefix)).map(k => JSON.parse(sessionStorage.getItem(k)))", prefix)


def wait_barrier(page, event, message):
    # Keep pumping Playwright's route guard while waiting for the HTTP thread.
    deadline = time.monotonic() + 10
    while not event.is_set() and time.monotonic() < deadline:
        page.wait_for_timeout(25)
    assert event.is_set(), message


def run_case(browser, mode):
    gateway = Gateway()
    gateway.start()
    case_dir = OUT / mode
    case_dir.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(service_workers="block", viewport={"width": 1280, "height": 900})
    page = context.new_page()
    page.set_default_timeout(15000)
    page_errors, request_failures, blocked = [], [], []
    page.on("pageerror", lambda e: page_errors.append(str(e)))
    page.on("requestfailed", lambda req: request_failures.append({"method": req.method, "path": urlsplit(req.url).path, "failure": req.failure}))
    allowed = {gateway.server.server_port, UPSTREAM.port}

    def local_only(route):
        u = urlsplit(route.request.url)
        if u.scheme in ("http", "https") and u.hostname in ("127.0.0.1", "localhost") and u.port in allowed:
            route.continue_()
        else:
            blocked.append({"scheme": u.scheme, "host": u.hostname})
            route.abort("blockedbyclient")

    # This guard never fabricates API responses or injects the transport fault.
    context.route("**/*", local_only)
    result = {"mode": mode, "scope": "real Chromium + TCP; synthetic in-memory API; no Nest or DB",
              "status": "RUNNING", "gateway": gateway.origin, "pageErrors": page_errors,
              "requestFailures": request_failures, "blockedExternalRequests": blocked}

    def screenshot(name):
        # Exclude the repository's static personal footer and profile image.
        # Mask at browser capture time; do not edit or export earlier raw shots.
        page.screenshot(path=str(case_dir / name), full_page=True,
                        mask=[page.locator("footer.layout-footer"),
                              page.get_by_role("button", name="测试组织者", exact=True)])

    try:
        page.goto(gateway.origin + "/#/login")
        page.get_by_placeholder("账号").fill("fixture")
        page.get_by_placeholder("密码").fill("L" * 35 + "7!")
        page.get_by_role("button", name="登录", exact=True).click()
        page.wait_for_url(lambda u: "/login" not in u)
        page.goto(gateway.origin + "/#" + LIST + "/" + ID + "/simple-draft")
        card = page.get_by_test_id("simple-review")
        note = page.get_by_test_id("returned-review")

        def start(recovery=False):
            card.get_by_role("button", name="继续核对上次提审" if recovery else "核对并提交审核", exact=True).click()
            expect(card.get_by_role("checkbox")).to_be_enabled()

        def click_confirm(recovery=False):
            card.locator(".el-checkbox").click()
            button = card.get_by_role("button", name="确认核对上次提审" if recovery else "确认提交发布审核", exact=True)
            button.evaluate("button => { button.click(); button.click(); }")
            # Persisting the sent intent immediately changes this action's name
            # to recovery, even while the original HTTP request is in flight.
            return card.get_by_role("button", name=re.compile(r"^确认(?:核对上次提审|提交发布审核)$"))

        def settled():
            expect(card.locator(".el-button.is-loading")).to_have_count(0)

        start()
        click_confirm()
        expect(card).to_contain_text("当前审核：审核中")
        settled()
        first = gateway.state()["posts"][0]
        assert not records(page) and len(gateway.state()["reviews"]) == 1
        gateway.return_first()
        card.get_by_role("button", name="刷新审核状态", exact=True).click()
        expect(note).to_contain_text(NOTE)
        screenshot("01-returned.png")
        note.get_by_role("button", name="按意见修改草稿", exact=True).click()
        preparation = page.locator(".el-form-item").filter(has=page.locator("label", has_text="参与准备")).locator("textarea")
        preparation.fill(SAVED_NOTES)
        page.get_by_role("button", name="保存草稿", exact=True).click()
        expect(page.get_by_role("button", name="保存草稿", exact=True)).to_have_count(0)
        assert gateway.state()["draft"]["instance"]["registrationNotes"] == SAVED_NOTES

        gateway.loss_armed = True
        start()
        button = click_confirm()
        wait_barrier(page, gateway.accepted, "the real HTTP handler never accepted resubmission")
        accepted = gateway.state()
        assert len(accepted["posts"]) == len(accepted["reviews"]) == 2
        second = accepted["posts"][1]
        assert second["operationKey"] != first["operationKey"]
        assert second["expectedDraftHash"] != first["expectedDraftHash"]
        assert accepted["draft"]["draftHash"] != second["expectedDraftHash"]
        assert records(page) == [{"body": second}]
        expect(button).to_be_disabled()
        button.evaluate("button => { button.click(); button.click(); }")
        assert len(gateway.state()["posts"]) == 2
        screenshot("02-accepted-in-flight.png")

        if mode == "drop-after-accept":
            with page.expect_event("requestfailed", predicate=lambda req: req.method == "POST" and urlsplit(req.url).path == REVIEW_PATH):
                gateway.release_loss.set()
            settled()
            expect(card).to_contain_text("本标签页还有一笔提审需要核对")
            screenshot("03-response-lost.png")
            page.reload()
        else:
            # Reload cancels only the client: the accepted server record survives.
            page.reload()
            gateway.release_loss.set()

        expect(card).to_contain_text("本标签页还有一笔提审需要核对")
        assert records(page) == [{"body": second}], "GET/reload must not clear or rebind the sent intent"
        assert len(gateway.state()["posts"]) == 2, "reload must not POST automatically"
        expect(card.get_by_role("button", name="核对并提交审核", exact=True)).to_have_count(0)
        # The accepted review is now pending: editing is absent, rather than
        # the disabled action used while the page still showed returned facts.
        expect(page.get_by_role("button", name="配置本次场次", exact=True)).to_have_count(0)
        expect(page.get_by_role("button", name="保存草稿", exact=True)).to_have_count(0)
        card.get_by_role("button", name="刷新审核状态", exact=True).click()
        settled()
        assert records(page) == [{"body": second}] and len(gateway.state()["posts"]) == 2
        screenshot("04-reload-retains-original-intent.png")

        gateway.replay_armed = True
        start(True)
        replay_button = click_confirm(True)
        wait_barrier(page, gateway.replay_arrived, "explicit same-body HTTP recovery never arrived")
        expect(replay_button).to_be_disabled()
        replay_button.evaluate("button => { button.click(); button.click(); }")
        before_receipt = gateway.state()
        assert before_receipt["posts"] == [first, second, second]
        assert len(before_receipt["reviews"]) == 2
        gateway.release_replay.set()
        expect(card).to_contain_text("当前审核：审核中")
        settled()
        assert not records(page)
        archived = records(page, "srvf:simple-review-receipt:")
        assert len(archived) == 2 and any(x["body"] == second and x["receipt"]["id"] == before_receipt["reviews"][1]["id"] for x in archived)
        page.reload()
        expect(card).to_contain_text("当前审核：审核中")
        assert not records(page)
        final = gateway.state()
        assert final["posts"] == [first, second, second]
        assert [r["status"] for r in final["reviews"]] == ["returned", "pending"]
        assert final["reviews"][0]["reviewNote"] == NOTE
        assert final["draft"]["statusCode"] == "draft"
        assert final["permissions"] == ["activity.create.record", "activity.update.record"]
        assert not final["failures"] and not final["unexpected"] and not page_errors and not blocked
        screenshot("05-recovered-two-reviews.png")
        result.update(status="PASS", httpPostAttempts=3, distinctOperationKeys=2, reviewRecordCount=2,
                      sameBodyReplay=True, noAutomaticPostOnReload=True, receiptArchived=True,
                      currentActivityStatus="draft", reviewStatuses=["returned", "pending"], state=final)
        print(f"PASS {mode}: real TCP after-accept failure; reload/poll retain exact body; double-click safe; 3 HTTP attempts / 2 review records", flush=True)
    except Exception:
        result.update(status="FAIL", error=traceback.format_exc(), state=gateway.state())
        try:
            screenshot("failure.png")
        except Exception:
            pass
        raise
    finally:
        context.close()
        gateway.stop()
        result["cleanup"] = {"gatewayThreadStopped": not gateway.thread.is_alive(), "listeningSocketClosed": gateway.server.fileno() == -1}
        (case_dir / "result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")


def main():
    assert UPSTREAM.scheme == "http" and UPSTREAM.hostname in ("127.0.0.1", "localhost") and UPSTREAM.port
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path="/usr/bin/chromium", headless=True, args=["--no-sandbox"])
        try:
            modes = os.environ.get("RP_NETWORK_CASES", "drop-after-accept,reload-after-accept").split(",")
            assert modes and all(mode in ("drop-after-accept", "reload-after-accept") for mode in modes)
            for mode in modes:
                run_case(browser, mode)
        finally:
            browser.close()
    print("PASS selected controlled-network cases; ALL business API data synthetic; new real backend/DB integration NOT RUN", flush=True)


if __name__ == "__main__":
    main()
