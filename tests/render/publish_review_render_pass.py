#!/usr/bin/env python3
"""Reviewer task regression. Every API request is synthetic, never live integration."""
import copy
import json
import os
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright, expect
from simple_activity_render_pass import Fixture, BASE

HERE = Path(__file__).resolve().parent
RAW = json.loads((HERE.parent / 'fixtures/publish-review.synthetic.json').read_text())
LIST = '/srvf/workbench/approvals'
DETAIL = '/srvf/workbench/publish-reviews/' + RAW['id']
READ = 'activity-review.read.request'
APPROVE = 'activity.publish.record'
RETURN = 'activity-review.return.request'


def review_fixture():
    data = copy.deepcopy(RAW)
    data['snapshot']['base'] = {k: copy.deepcopy(v) for k, v in data['snapshot'].items()
                              if k not in ('schemaVersion', 'baseWorkflowRevision', 'baseSnapshotHash', 'snapshotHash', 'metricSelectionExplicit', 'base')}
    return data


class ReviewerFixture(Fixture):
    def __init__(self):
        super().__init__()
        self.user = 'reviewer-synthetic-0001'
        self.permissions = [READ, APPROVE, RETURN]
        self.review = review_fixture()
        self.posts, self.commands = [], {}
        self.mode = 'ok'
        self.get_mode = 'ok'
        self.held = []
        self.gets = 0
        self.mutate_on_next_get = None

    def accept(self, route, action, body):
        def ok(data):
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'code': 0, 'message': 'ok', 'data': data}))
        key = body['operationKey']
        if key in self.commands:
            command, result = self.commands[key]
            assert command == (action, body), 'replay must preserve exact original body'
            return ok(copy.deepcopy(result))
        if self.review['status'] != 'pending':
            return route.fulfill(status=409, content_type='application/json', body=json.dumps({'code': 20033, 'message': '非待审', 'data': None}))
        self.review.update(status='approved' if action == 'approve' else 'returned', reviewedByUserId=self.user,
                           reviewedAt='2099-01-02T00:00:00.000Z', reviewNote=body.get('reviewNote', '').strip() or None)
        self.commands[key] = ((action, body), copy.deepcopy(self.review))
        if self.mode == 'lost':
            self.mode = 'ok'; return route.abort('failed')
        if self.mode == 'wrong-receipt':
            wrong = copy.deepcopy(self.review); wrong['id'] = 'unrelated-review-0001'; return ok(wrong)
        return ok(copy.deepcopy(self.review))

    def route(self, route):
        path = urlsplit(route.request.url).path
        root = '/api/admin/v1/activity-publish-reviews'
        def ok(data):
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({'code': 0, 'message': 'ok', 'data': data}))
        def fail(code, status=409):
            return route.fulfill(status=status, content_type='application/json', body=json.dumps({'code': code, 'message': '合成审核拒绝', 'data': None}))
        if path == '/api/auth/v1/refresh': return fail(40100, 401)
        if path == '/api/auth/v1/logout': return ok(None)
        if path == root:
            query = parse_qs(urlsplit(route.request.url).query)
            assert query.get('status') == ['pending']
            return ok({'items': [self.review] if self.review['status'] == 'pending' else [], 'total': int(self.review['status'] == 'pending'), 'page': 1, 'pageSize': 20})
        if path == root + '/' + self.review['id']:
            self.gets += 1
            if self.mutate_on_next_get:
                mutate = self.mutate_on_next_get; self.mutate_on_next_get = None; mutate(self.review)
            if self.get_mode != 'ok': return fail(int(self.get_mode), 403 if self.get_mode == '30100' else 404)
            return ok(copy.deepcopy(self.review))
        if path == root + '/' + self.review['id'] + '/referenced-policies':
            assert route.request.method == 'GET' and not urlsplit(route.request.url).query
            # The inherited professional-shape negative fixture is deliberately unparseable.
            # The new read contract rejects it atomically, rather than yielding partial definitions.
            return fail(20022)
        if path.startswith(root + '/' + self.review['id'] + '/'):
            action = path.rsplit('/', 1)[-1]
            assert action in ('approve', 'return') and route.request.method == 'POST'
            body = copy.deepcopy(route.request.post_data_json)
            assert set(body) <= ({'operationKey', 'reviewNote', 'requiresInsuranceConfirmed'} if action == 'approve' else {'operationKey', 'reviewNote'})
            assert 8 <= len(body['operationKey']) <= 128
            if action == 'approve': assert body['requiresInsuranceConfirmed'] is True
            else: assert body['reviewNote'].strip() and len(body['reviewNote']) <= 500
            self.posts.append((action, body))
            if self.mode == 'hold':
                self.held.append((route, action, body)); return
            if self.mode.startswith('error:'):
                _, status, code = self.mode.split(':'); return fail(int(code), int(status))
            return self.accept(route, action, body)
        return super().route(route)


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(service_workers='block')
        f = ReviewerFixture()
        context.route('**/api/**', f.route)
        page = context.new_page(); page.set_default_timeout(12000)
        page.goto(BASE + '/#/login')
        page.get_by_placeholder('账号').fill('fixture')
        page.get_by_placeholder('密码').fill('L' * 35 + '7!')
        page.get_by_role('button', name='登录', exact=True).click()
        page.wait_for_url(lambda url: '/login' not in url)
        page.goto(BASE + '/#' + LIST)
        page.get_by_role('tab', name='活动发布审核', exact=True).click()
        page.get_by_role('button', name='核对申请', exact=True).click()
        expect(page.get_by_role('heading', name='冻结的合成培训', exact=True)).to_be_visible()
        if os.environ.get('RP_RED_ONLY'):
            print('PASS reviewer task entry')
            return
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        case=0
        def records(prefix='srvf:publish-decision:'):
            return page.evaluate('(prefix)=>Object.keys(sessionStorage).filter(k=>k.startsWith(prefix)&&!k.includes(":receipt:")).map(k=>JSON.parse(sessionStorage.getItem(k)))',prefix)
        def archived():
            return page.evaluate('()=>Object.keys(sessionStorage).filter(k=>k.startsWith("srvf:publish-decision:receipt:")).map(k=>JSON.parse(sessionStorage.getItem(k)))')
        def reset(change=None, wait=True):
            nonlocal case
            assert not f.unexpected, f.unexpected
            page.evaluate('sessionStorage.clear()')
            f.__init__(); case+=1
            if change: change(f)
            page.goto(BASE+f'/?review-case={case}#'+DETAIL)
            if wait: expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()
        def start(action='approve'):
            page.get_by_role('button',name='通过并发布' if action=='approve' else '退回修改',exact=True).click()
            expect(page.get_by_role('dialog')).to_be_visible()
        def confirm(action='approve', note=None, double=False):
            modal=page.get_by_role('dialog')
            if note is not None: modal.get_by_role('textbox').fill(note)
            modal.locator('.el-checkbox').click()
            button=modal.get_by_role('button',name='确认通过并发布' if action=='approve' else '确认退回修改',exact=True)
            if double: button.evaluate('(el)=>{el.click();el.click()}')
            else: button.click()
        def settled(): expect(page.locator('.el-button.is-loading')).to_have_count(0)
        def retained(body):
            assert records()[0]['body']==body
            expect(page.get_by_test_id('decision-pending')).to_be_visible()
            expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
            expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_disabled()

        # Actual frozen content is expanded, and the current title remains explicitly separate.
        expect(page.get_by_text('带水',exact=True).first).to_be_visible()
        expect(page.get_by_text('先到先得（first_come）',exact=True).first).to_be_visible()
        start(); expect(page.get_by_role('button',name='确认通过并发布',exact=True)).to_be_disabled()
        page.get_by_role('dialog').get_by_role('button',name='取消',exact=True).click()
        assert not f.posts and not records()
        start(); page.get_by_role('dialog').get_by_role('textbox').fill('未提交的说明')
        page.get_by_role('dialog').locator('.el-dialog__headerbtn').click()
        start(); expect(page.get_by_role('dialog').get_by_role('textbox')).to_have_value('')
        page.get_by_role('dialog').get_by_role('button',name='取消',exact=True).click()
        print('PASS frozen facts, explicit confirmation, cancel and reopen')

        start(); confirm(note='合成审核通过'); settled()
        expect(page.get_by_text('已取得本次处理的成功回执',exact=True)).to_be_visible()
        assert len(f.posts)==len(f.commands)==1 and not records()
        assert archived()[0]['body']==f.posts[0][1]
        expect(page.get_by_text('审核已通过',exact=True)).to_be_visible()
        expect(page.get_by_text('活动已发布',exact=True)).to_have_count(0)
        page.reload(); expect(page.get_by_text('审核已通过',exact=True)).to_be_visible()
        assert len(f.posts)==1
        page.get_by_role('button',name='返回发布审核工作台',exact=True).click()
        expect(page.get_by_role('tab',name='活动发布审核',exact=True)).to_have_attribute('aria-selected','true')
        expect(page.get_by_text('当前可见组织范围内没有待审申请',exact=True)).to_be_visible()
        print('PASS approve publishes in one command, history is not current activity status, return to queue')

        reset(); start('return'); confirm('return',note='   '); settled()
        assert not f.posts and not records()
        page.get_by_role('dialog').get_by_role('textbox').fill('  请修正活动时间  ')
        page.get_by_role('button',name='确认退回修改',exact=True).click(); settled()
        assert f.posts[0][1]['reviewNote']=='  请修正活动时间  '
        assert archived()[0]['body']==f.posts[0][1]
        expect(page.get_by_text('已退回修改',exact=True)).to_be_visible()
        assert f.review['reviewNote']=='请修正活动时间'
        print('PASS required reason, exact input fingerprint and returned record')

        reset(lambda f:setattr(f,'user',f.review['submittedByUserId']))
        expect(page.get_by_test_id('self-review')).to_be_visible()
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_disabled()
        assert not f.posts
        reset(lambda f:setattr(f,'permissions',[READ]))
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_disabled()
        reset(lambda f:setattr(f,'permissions',[READ,RETURN]))
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_enabled()
        reset(lambda f:setattr(f,'permissions',[]),wait=False)
        expect(page.get_by_text('您没有查看活动发布审核的权限',exact=True)).to_be_visible()
        assert f.gets==0 and not f.posts
        print('PASS independent permissions and submittedBy self-review restriction')

        reset(lambda f:f.review['snapshot'].update(timePolicyPointers={'unexpanded':'policy'}))
        expect(page.get_by_text('本页尚未完整支持这份申请，不能通过',exact=True)).to_be_visible()
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_be_disabled()
        expect(page.get_by_role('button',name='退回修改',exact=True)).to_be_enabled()
        reset(lambda f:f.review.update(requestType='change'))
        expect(page.get_by_role('button',name='通过并发布',exact=True)).to_have_count(0)
        print('PASS unexpanded policies/change reviews do not masquerade as simple approval')

        reset();start();f.permissions=[READ];confirm();settled()
        assert not f.posts and not records()
        reset();start();f.mutate_on_next_get=lambda r:r['snapshot']['activity'].update(title='冻结内容意外变化')
        confirm();settled();assert not f.posts and not records()
        expect(page.get_by_role('heading',name='冻结内容意外变化',exact=True)).to_be_visible()
        print('PASS pre-send permission/version change forces reconfirmation without an unknown record')

        reset(); start()
        page.evaluate('''()=>{const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('srvf:publish-decision:'))throw new DOMException('synthetic quota','QuotaExceededError');return orig.call(this,k,v)}}''')
        confirm();settled();assert not f.posts and not records()
        expect(page.get_by_text('浏览器未能保存恢复记录，未发送处理请求。请检查存储后重新核对。',exact=True).first).to_be_visible()
        print('PASS storage failure prevents sending')

        reset(lambda f:setattr(f,'mode','hold'));start();confirm(double=True)
        page.wait_for_function('()=>document.querySelectorAll(".el-button.is-loading").length>0')
        while not f.held: page.wait_for_timeout(20)
        assert len(f.posts)==1
        old_url=page.url
        page.evaluate("location.hash='#/srvf/workbench/publish-reviews/another-review-0001'")
        page.wait_for_timeout(100);assert page.url==old_url
        assert len(f.posts)==1
        held=f.held.pop();f.mode='ok';f.accept(*held);settled()
        assert len(f.commands)==1 and not records()
        print('PASS double click and in-flight route-param navigation lock')

        for status,code in [(409,20144),(409,20033),(403,20146),(403,30100),(404,20004),(409,20143)]:
            reset(lambda f:setattr(f,'mode',f'error:{status}:{code}'));start();confirm();settled()
            body=copy.deepcopy(f.posts[0][1]);retained(body)
            page.reload();expect(page.get_by_test_id('decision-pending')).to_be_visible()
            page.get_by_role('button',name='刷新申请记录',exact=True).click();settled();retained(body)
            if code==20143:
                expect(page.get_by_role('button',name='原样核对上次处理',exact=True)).to_be_disabled()
            assert len(f.posts)==1
        print('PASS 20144/20033/self-review/403/404/20143 retain original intent across refresh')

        reset(lambda f:setattr(f,'mode','lost'));start('return');confirm('return',note='  原样恢复说明  ');settled()
        body=copy.deepcopy(f.posts[0][1]);assert records()[0]['body']==body
        page.reload();expect(page.get_by_test_id('decision-pending')).to_be_visible()
        # GET reports returned, but cannot associate it with this operation key.
        assert records()[0]['body']==body
        page.get_by_role('button',name='原样核对上次处理',exact=True).click();settled()
        assert len(f.posts)==2 and f.posts[1][1]==body and len(f.commands)==1 and not records()
        print('PASS lost response + returned GET cannot unlock; exact original replay archives receipt')

        reset(lambda f:setattr(f,'get_mode','30100'),wait=False)
        expect(page.get_by_text('当前权限或组织范围不允许此操作。',exact=True).first).to_be_visible()
        f.get_mode='ok';page.get_by_role('button',name='重新读取申请',exact=True).click()
        expect(page.get_by_role('heading',name='冻结的合成培训',exact=True)).to_be_visible()
        page.set_viewport_size({'width':390,'height':844})
        start();expect(page.get_by_role('dialog')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.get_by_role('dialog').get_by_role('button',name='取消',exact=True).click()
        assert not f.posts and not records()
        print('PASS read failure recovery and 390px confirmation')
        assert not errors,errors
        assert not f.unexpected, f.unexpected
        browser.close()


if __name__ == '__main__':
    main()
