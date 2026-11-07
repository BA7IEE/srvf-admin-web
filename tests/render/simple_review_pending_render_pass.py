"""Sent-operation retention regression. All API synthetic; no real integration."""
import copy
import json
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect
from simple_review_version_render_pass import VersionFixture
from simple_review_render_pass import BASE, LIST, ID


class PendingFixture(VersionFixture):
    def reset(self):
        super().reset()
        self.status = None
        self.refreshes = 0
        self.mismatch_receipt = False

    def route(self, route):
        path = urlsplit(route.request.url).path
        if path == '/api/auth/v1/refresh':
            self.refreshes += 1
            return route.fulfill(status=401, content_type='application/json', body=json.dumps({
                'code':40100,'message':'合成登录已失效','data':None}))
        if path == '/api/auth/v1/logout':
            assert route.request.method == 'POST'
            return route.fulfill(status=200, content_type='application/json', body=json.dumps({
                'code':0,'message':'ok','data':None}))
        if path == f'/api/admin/v1/activities/{ID}/publish-reviews':
            if self.status:
                self.posts.append(copy.deepcopy(route.request.post_data_json))
                return route.fulfill(status=self.status, content_type='application/json', body=json.dumps({
                    'code':self.status*100,'message':f'合成提审拒绝 {self.status}','data':None}))
            if self.mismatch_receipt:
                self.posts.append(copy.deepcopy(route.request.post_data_json))
                return route.fulfill(status=200, content_type='application/json', body=json.dumps({
                    'code':0,'message':'ok','data':{'activityId':'another-activity','requestType':'initial','directPublish':False}}))
        return super().route(route)


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(service_workers='block')
        f = PendingFixture(); f.reset()
        context.route('**/api/**', f.route)
        page = context.new_page(); page.set_default_timeout(10000)
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        card=page.get_by_test_id('simple-review')
        def login():
            # A different query forces a document load, not a hash-only navigation
            # that the existing busy route guard can reject after refresh failure.
            page.goto(BASE+'/?pending-relogin#/login')
            page.get_by_placeholder('账号').fill('fixture')
            page.get_by_placeholder('密码').fill('L'*35+'7!')
            page.get_by_role('button',name='登录',exact=True).click()
            page.wait_for_url(lambda url:'/login' not in url)
            page.goto(BASE+'/#'+LIST+'/'+ID+'/simple-draft')
        def records(prefix='srvf:simple-review:'):
            return page.evaluate('(prefix)=>Object.keys(sessionStorage).filter(k=>k.startsWith(prefix)).map(k=>JSON.parse(sessionStorage.getItem(k)))',prefix)
        def ready():
            expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_be_enabled()
        def start(recovery=False):
            card.get_by_role('button',name='继续核对上次提审' if recovery else '核对并提交审核',exact=True).click()
            expect(card.get_by_role('checkbox')).to_be_enabled()
        def settle():
            expect(card.locator('.el-button.is-loading')).to_have_count(0)
        def submit(recovery=False, wait=True):
            card.locator('.el-checkbox').click()
            card.get_by_role('button',name='确认核对上次提审' if recovery else '确认提交发布审核',exact=True).click()
            if wait: settle()
        def retained(body):
            assert records()[0]['body']==body, 'sent intent must remain byte-for-byte recoverable'
            expect(card.get_by_role('button',name='核对并提交审核',exact=True)).to_have_count(0)
            expect(page.get_by_role('button',name='配置本次场次',exact=True)).to_be_disabled()
        def poll_and_reload(body):
            page.reload()
            card.get_by_role('button',name='刷新审核状态',exact=True).click(); settle()
            retained(body)
        def reset():
            assert not f.unexpected,f.unexpected
            f.reset(); page.evaluate('sessionStorage.clear()'); page.reload(); ready()
        def archived(body):
            assert not records()
            saved=records('srvf:simple-review-receipt:')
            assert len(saved)==1 and saved[0]['body']==body
            assert saved[0]['receipt']['id']==f.reviews[body['operationKey']]['id']
            assert 'snapshot' not in saved[0]

        login(); ready()
        # First response is definite, but it never proves all cloned/late sends ended.
        for mode in ['race','professional-rules']:
            reset(); f.post_mode=mode; start(); submit()
            body=copy.deepcopy(f.posts[0])
            assert records()==[{'body':body}], f'UNSAFE first {mode} response cleared the sent operation'
            retained(body); poll_and_reload(body)
            assert len(f.posts)==1, 'GET and reload must not retry automatically'
            page.set_viewport_size({'width':390,'height':844})
            start(True); submit(True); retained(body)
            assert f.posts==[body,body] and not f.reviews
            for name in ['暂时关闭，稍后核对','确认核对上次提审']:
                button=card.get_by_role('button',name=name,exact=True)
                button.scroll_into_view_if_needed(); box=button.bounding_box()
                assert box and box['x']>=0 and box['x']+box['width']<=390,box
            page.set_viewport_size({'width':1280,'height':720})
            if mode=='professional-rules':
                f.post_mode='ok'; submit(True)
                assert len(f.reviews)==1 and f.posts==[body,body,body]
                archived(body)
            print(f'PASS first {mode} rejection survives polling/reload; no replacement intent or rebound hash')

        for status in [401,403,404]:
            reset(); f.status=status; start(); submit(wait=status!=401)
            if status==401:
                # Existing auth refresh failure may leave its queued POST unresolved;
                # a full page reopen/relogin must still preserve the sent operation.
                expect(page.get_by_text('登录已过期，请重新登录',exact=True)).to_be_visible()
                assert f.refreshes==1
                body=copy.deepcopy(f.posts[0]); assert records()==[{'body':body}]
                f.status=None; login()
            else:
                body=copy.deepcopy(f.posts[0]); retained(body)
            poll_and_reload(body)
            assert len(f.posts)==1
            f.status=None; start(True); submit(True)
            assert f.posts==[body,body] and len(f.reviews)==1
            archived(body)
            print(f'PASS first HTTP {status} retains operation through reload/relogin; only explicit same-body receipt ends it')

        reset(); f.post_mode='key-conflict'; start(); submit()
        body=copy.deepcopy(f.posts[0]); assert records()[0]['keyConflict'] is True
        poll_and_reload(body)
        expect(card.get_by_role('button',name='继续核对上次提审',exact=True)).to_have_count(0)
        assert len(f.posts)==1 and records()[0]['keyConflict'] is True
        print('PASS 20143 remains read-only and retained across reload; no retry or fresh key')

        reset(); f.mismatch_receipt=True; start(); submit()
        body=copy.deepcopy(f.posts[0]); retained(body); poll_and_reload(body)
        assert not records('srvf:simple-review-receipt:')
        f.mismatch_receipt=False; start(True); submit(True); archived(body)
        assert f.posts==[body,body] and len(f.reviews)==1
        print('PASS unrelated 200 receipt cannot archive the operation; linked receipt can')

        reset(); start()
        f.draft['instance']['registrationDeadline']='2000-01-01T00:00:00Z'
        submit()
        expect(card.get_by_text('报名截止时间已过，请修改并保存草稿。',exact=True)).to_be_visible()
        assert not f.posts and not records()
        page.reload(); ready(); assert not records()
        reset(); start(); f.get_fail=True; submit()
        assert not f.posts and not records()
        f.get_fail=False; page.reload(); ready()
        print('PASS pre-send saved-state validation/read failures create no pending intent')

        reset(); start()
        page.evaluate("""()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('srvf:simple-review:'))throw new DOMException('fixture denied','QuotaExceededError');return original.call(this,k,v)}}""")
        submit()
        expect(card.get_by_text('浏览器未能保存提审恢复记录，未发送提审请求。请检查存储设置后重新核对。',exact=True)).to_be_visible()
        assert not f.posts and not records()
        page.reload(); ready(); assert not records()
        start(); submit(); body=copy.deepcopy(f.posts[0]); archived(body)
        assert len(f.reviews)==1 and f.draft['statusCode']=='draft'
        print('PASS storage failure before POST leaves no false unknown; normal confirmed submission archives its exact receipt')

        assert not errors,errors
        assert not f.unexpected,f.unexpected
        print('PASS all sent-retention tests synthetic; real integration NOT RUN')
        browser.close()


if __name__=='__main__': main()
