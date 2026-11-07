"""Real opener/sessionStorage regression; every API is synthetic, never live."""
import copy
import json
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

from simple_review_render_pass import ReviewFixture, BASE, LIST, ID

class HeldFixture(ReviewFixture):
    def reset(self):
        super().reset()
        self.held = []
        self.requests = []
        self.events = []
        self.qualifications_present = True

    def route(self, route):
        if urlsplit(route.request.url).path == f'/api/admin/v1/activities/{ID}/publish-reviews':
            assert route.request.method == 'POST'
            body = copy.deepcopy(route.request.post_data_json)
            assert set(body) == {'operationKey', 'confirmation', 'expectedDraftHash'}
            self.requests.append(body)
            self.held.append(route)
            self.events.append({'event': 'POST held before transaction', 'request': len(self.requests), 'body': body})
            return
        return super().route(route)

    def reject_first(self):
        assert self.qualifications_present and not self.reviews
        self.events.append({'event': 'A first POST returns 409/20256; B POST still unfinished'})
        self.held[0].fulfill(status=409, content_type='application/json', body=json.dumps({
            'code': 20256, 'message': '活动包含简单界面未展示的专业配置，请使用专业流程确认后提审', 'data': None}))

    def finish(self, index):
        assert not self.qualifications_present
        self.events.append({'event': 'release held POST through candidate-contract fixture', 'request': index+1})
        super().route(self.held[index])

def records(page):
    return page.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('srvf:simple-review:')).map(k=>JSON.parse(sessionStorage.getItem(k)))")

def await_count(page, fixture, count):
    for _ in range(200):
        if len(fixture.held) >= count: return
        page.wait_for_timeout(10)
    raise AssertionError(f'expected {count} held requests, got {len(fixture.held)}')

def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        context = browser.new_context(service_workers='block')
        f=HeldFixture(); f.reset()
        context.route('**/api/**', f.route)
        errors=[]
        a=context.new_page(); a.set_default_timeout(10000)
        a.on('pageerror', lambda e: errors.append(str(e)))
        a.goto(BASE+'/#/login')
        a.get_by_placeholder('账号').fill('fixture')
        a.get_by_placeholder('密码').fill('L'*35+'7!')
        a.get_by_role('button',name='登录',exact=True).click()
        a.wait_for_url(lambda url:'/login' not in url)
        a.goto(BASE+'/#'+LIST+'/'+ID+'/simple-draft')
        ca=a.get_by_test_id('simple-review')
        ca.get_by_role('button',name='核对并提交审核',exact=True).click()
        ca.locator('.el-checkbox').click()
        ca.get_by_role('button',name='确认提交发布审核',exact=True).click()
        await_count(a,f,1)
        original=copy.deepcopy(f.requests[0])
        assert records(a)==[{'body':original}]
        expect(ca.get_by_role('button',name='确认核对上次提审',exact=True)).to_be_disabled()

        # Browser performs the copy. No sessionStorage writes or artificial record seeding.
        with context.expect_page() as opened:
            a.evaluate("window.open(location.href, '_blank')")
        b=opened.value; b.set_default_timeout(10000)
        b.on('pageerror', lambda e: errors.append(str(e)))
        cb=b.get_by_test_id('simple-review')
        expect(cb.get_by_role('button',name='继续核对上次提审',exact=True)).to_be_enabled()
        assert b.evaluate('window.opener !== null') is True
        assert records(b)==records(a)==[{'body':original}]
        f.events.append({'event':'B actual opener page copied A sessionStorage while A POST pending'})
        cb.get_by_role('button',name='继续核对上次提审',exact=True).click()
        cb.locator('.el-checkbox').click()
        cb.get_by_role('button',name='确认核对上次提审',exact=True).click()
        await_count(b,f,2)
        assert f.requests[1]==original
        f.reject_first()
        expect(ca.locator('.el-button.is-loading')).to_have_count(0)
        expect(ca.get_by_text('需要专业流程核对',exact=True)).to_be_visible()
        assert records(a)==[{'body':original}], 'UNSAFE: A cleared the logical operation while cloned B still has the same POST in flight'
        a.reload()
        expect(ca.get_by_role('button',name='核对并提交审核',exact=True)).to_have_count(0)
        assert records(a)==[{'body':original}]
        f.qualifications_present=False; f.finish(1)
        expect(cb.locator('.el-button.is-loading')).to_have_count(0)
        ca.get_by_role('button',name='继续核对上次提审',exact=True).click()
        ca.locator('.el-checkbox').click()
        ca.get_by_role('button',name='确认核对上次提审',exact=True).click()
        await_count(a,f,3); assert f.requests[2]==original
        f.finish(2); expect(ca.locator('.el-button.is-loading')).to_have_count(0)
        assert len(f.reviews)==1 and all(body==original for body in f.requests)
        assert not records(a) and not records(b)
        for page in [a,b]:
            archived=page.evaluate("Object.keys(sessionStorage).filter(k=>k.startsWith('srvf:simple-review-receipt:')).map(k=>JSON.parse(sessionStorage.getItem(k)))")
            assert len(archived)==1 and archived[0]['body']==original
            assert archived[0]['receipt']['id']==f.reviews[original['operationKey']]['id']
        assert not errors, errors
        assert not f.unexpected, f.unexpected
        print('PASS safe invariant: A retains the operation across reload and only recovers the same body after B succeeds')
        browser.close()
        return

if __name__=='__main__': main()
